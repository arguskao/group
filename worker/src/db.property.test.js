import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { insertResponse, getAllResponses, checkDuplicate } from './db.js';
import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';

/**
 * Property-Based Tests for Database Operations
 * 
 * These tests verify database operations maintain data integrity.
 */

describe('Property-Based Tests: Database Operations', () => {
    // Arbitraries for generating valid test data
    const validNameArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => /^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(s) && s.trim().length > 0);

    const validPhoneArb = fc.string({ minLength: 8, maxLength: 15 })
        .filter(s => /^[\d\s-]+$/.test(s) && s.replace(/[\s-]/g, '').length >= 8);

    const validRegionArb = fc.constantFrom(...TAIWAN_REGIONS);

    const validOccupationArb = fc.constantFrom(...OCCUPATION_TYPES);

    const validTimestampArb = fc.date().map(d => d.toISOString());

    const validResponseRecordArb = fc.record({
        name: validNameArb,
        phone: validPhoneArb,
        region: validRegionArb,
        occupation: validOccupationArb,
        timestamp: validTimestampArb
    });

    let mockDb;

    beforeEach(() => {
        mockDb = {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn(),
            all: vi.fn(),
            first: vi.fn(),
        };
    });

    // Feature: d1-database-migration, Property 1: 回應記錄插入完整性
    describe('Property 1: Response Record Insertion Integrity', () => {
        test('property: inserted records should be retrievable with all fields intact', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validResponseRecordArb,
                    async (record) => {
                        // Mock successful insertion
                        const mockId = Math.floor(Math.random() * 10000);
                        mockDb.run.mockResolvedValue({
                            success: true,
                            meta: { last_row_id: mockId }
                        });

                        // Insert the record
                        const insertResult = await insertResponse(mockDb, record);

                        // Verify insertion was successful
                        expect(insertResult.success).toBe(true);
                        expect(insertResult.id).toBe(mockId);

                        // Verify the correct SQL was called
                        expect(mockDb.prepare).toHaveBeenCalledWith(
                            'INSERT INTO responses (name, phone, region, occupation, timestamp) VALUES (?, ?, ?, ?, ?)'
                        );

                        // Verify all fields were bound correctly
                        expect(mockDb.bind).toHaveBeenCalledWith(
                            record.name,
                            record.phone,
                            record.region,
                            record.occupation,
                            record.timestamp
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('property: insertion should preserve field values exactly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validResponseRecordArb,
                    async (record) => {
                        const mockId = 1;
                        mockDb.run.mockResolvedValue({
                            success: true,
                            meta: { last_row_id: mockId }
                        });

                        // Mock retrieval to return the same record
                        mockDb.all.mockResolvedValue({
                            results: [{
                                id: mockId,
                                ...record
                            }]
                        });

                        // Insert
                        await insertResponse(mockDb, record);

                        // Retrieve
                        const retrieveResult = await getAllResponses(mockDb);

                        // Verify the retrieved record matches the inserted record
                        expect(retrieveResult.success).toBe(true);
                        expect(retrieveResult.data.length).toBeGreaterThan(0);

                        const retrieved = retrieveResult.data[0];
                        expect(retrieved.name).toBe(record.name);
                        expect(retrieved.phone).toBe(record.phone);
                        expect(retrieved.region).toBe(record.region);
                        expect(retrieved.occupation).toBe(record.occupation);
                        expect(retrieved.timestamp).toBe(record.timestamp);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('property: insertion should handle special characters correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        name: fc.constantFrom('張三', '李四', 'John Doe', '王 小明'),
                        phone: fc.constantFrom('0912-345-678', '02 1234 5678', '0987654321'),
                        region: validRegionArb,
                        occupation: validOccupationArb,
                        timestamp: validTimestampArb
                    }),
                    async (record) => {
                        mockDb.run.mockResolvedValue({
                            success: true,
                            meta: { last_row_id: 1 }
                        });

                        const result = await insertResponse(mockDb, record);

                        expect(result.success).toBe(true);
                        expect(mockDb.bind).toHaveBeenCalledWith(
                            record.name,
                            record.phone,
                            record.region,
                            record.occupation,
                            record.timestamp
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('property: failed insertions should return error information', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validResponseRecordArb,
                    async (record) => {
                        // Mock database error
                        mockDb.run.mockRejectedValue(new Error('Database error'));

                        const result = await insertResponse(mockDb, record);

                        expect(result.success).toBe(false);
                        expect(result.error).toBeDefined();
                        expect(typeof result.error).toBe('string');
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // Feature: d1-database-migration, Property 2: 回應記錄檢索完整性
    describe('Property 2: Response Record Retrieval Integrity', () => {
        test('property: retrieving records should return all inserted records', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(validResponseRecordArb, { minLength: 1, maxLength: 10 }),
                    async (records) => {
                        // Mock database to return all records
                        const mockRecords = records.map((record, index) => ({
                            id: index + 1,
                            ...record,
                            created_at: new Date().toISOString()
                        }));

                        mockDb.all.mockResolvedValue({
                            results: mockRecords
                        });

                        const result = await getAllResponses(mockDb);

                        expect(result.success).toBe(true);
                        expect(result.data).toEqual(mockRecords);
                        expect(result.count).toBe(records.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('property: retrieval should preserve record count', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 0, max: 100 }),
                    async (count) => {
                        // Generate mock records
                        const mockRecords = Array.from({ length: count }, (_, i) => ({
                            id: i + 1,
                            name: '測試',
                            phone: '0912345678',
                            region: '台北市',
                            occupation: '藥師',
                            timestamp: new Date().toISOString()
                        }));

                        mockDb.all.mockResolvedValue({
                            results: mockRecords
                        });

                        const result = await getAllResponses(mockDb);

                        expect(result.success).toBe(true);
                        expect(result.count).toBe(count);
                        expect(result.data.length).toBe(count);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('property: empty database should return empty array', async () => {
            mockDb.all.mockResolvedValue({
                results: []
            });

            const result = await getAllResponses(mockDb);

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.count).toBe(0);
        });

        test('property: retrieval errors should be handled gracefully', async () => {
            mockDb.all.mockRejectedValue(new Error('Database connection failed'));

            const result = await getAllResponses(mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Duplicate Detection', () => {
        test('property: duplicate detection should identify matching phone and timestamp', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validPhoneArb,
                    validTimestampArb,
                    async (phone, timestamp) => {
                        // Mock duplicate exists
                        mockDb.first.mockResolvedValue({ count: 1 });

                        const result = await checkDuplicate(mockDb, phone, timestamp);

                        expect(result.exists).toBe(true);
                        expect(mockDb.bind).toHaveBeenCalledWith(phone, timestamp);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('property: non-duplicate records should return false', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validPhoneArb,
                    validTimestampArb,
                    async (phone, timestamp) => {
                        // Mock no duplicate
                        mockDb.first.mockResolvedValue({ count: 0 });

                        const result = await checkDuplicate(mockDb, phone, timestamp);

                        expect(result.exists).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

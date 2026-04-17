import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { MigrationTool } from './MigrationTool.js';
import { TAIWAN_REGIONS, OCCUPATION_TYPES, STORAGE_KEY } from './constants.js';

/**
 * Unit and Property-Based Tests for MigrationTool
 */
describe('MigrationTool', () => {
    let mockApiClient;
    let migrationTool;
    let localStorageMock;

    beforeEach(() => {
        // Mock API client
        mockApiClient = {
            createResponse: vi.fn(),
            getAllResponses: vi.fn(),
        };

        // Mock localStorage
        localStorageMock = {};
        global.localStorage = {
            getItem: vi.fn((key) => localStorageMock[key] || null),
            setItem: vi.fn((key, value) => { localStorageMock[key] = value; }),
            removeItem: vi.fn((key) => { delete localStorageMock[key]; }),
        };

        migrationTool = new MigrationTool(mockApiClient);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Arbitraries for generating test data
    const validNameArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => /^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(s) && s.trim().length > 0);

    const validPhoneArb = fc.string({ minLength: 8, maxLength: 15 })
        .filter(s => /^[\d\s-]+$/.test(s) && s.replace(/[\s-]/g, '').length >= 8);

    const validRegionArb = fc.constantFrom(...TAIWAN_REGIONS);

    const validOccupationArb = fc.constantFrom(...OCCUPATION_TYPES);

    const validTimestampArb = fc.date().map(d => d.toISOString());

    const validRecordArb = fc.record({
        name: validNameArb,
        phone: validPhoneArb,
        region: validRegionArb,
        occupation: validOccupationArb,
        timestamp: validTimestampArb
    });

    describe('Constructor', () => {
        test('should initialize with default options', () => {
            expect(migrationTool.apiClient).toBe(mockApiClient);
            expect(migrationTool.storageKey).toBe(STORAGE_KEY);
            expect(migrationTool.batchSize).toBe(10);
        });

        test('should accept custom options', () => {
            const customTool = new MigrationTool(mockApiClient, {
                storageKey: 'custom_key',
                batchSize: 20,
                onProgress: vi.fn()
            });

            expect(customTool.storageKey).toBe('custom_key');
            expect(customTool.batchSize).toBe(20);
        });
    });

    describe('readFromLocalStorage', () => {
        test('should read records from localStorage', () => {
            const testData = [
                {
                    name: '測試用戶',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            localStorageMock[STORAGE_KEY] = JSON.stringify(testData);

            const result = migrationTool.readFromLocalStorage();

            expect(result).toEqual(testData);
            expect(global.localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
        });

        test('should return empty array if localStorage is empty', () => {
            const result = migrationTool.readFromLocalStorage();
            expect(result).toEqual([]);
        });

        test('should return empty array if localStorage contains invalid JSON', () => {
            localStorageMock[STORAGE_KEY] = 'invalid json';
            const result = migrationTool.readFromLocalStorage();
            expect(result).toEqual([]);
        });

        test('should return empty array if localStorage contains non-array data', () => {
            localStorageMock[STORAGE_KEY] = JSON.stringify({ not: 'an array' });
            const result = migrationTool.readFromLocalStorage();
            expect(result).toEqual([]);
        });
    });

    describe('validateRecord', () => {
        test('should validate a valid record', () => {
            const validRecord = {
                name: '張三',
                phone: '0912345678',
                region: '台北市',
                occupation: '藥師',
                timestamp: '2024-01-01T00:00:00.000Z'
            };

            const result = migrationTool.validateRecord(validRecord);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject record with missing fields', () => {
            const invalidRecord = {
                name: '張三',
                // missing phone
                region: '台北市',
                occupation: '藥師'
            };

            const result = migrationTool.validateRecord(invalidRecord);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should reject null or undefined record', () => {
            const result1 = migrationTool.validateRecord(null);
            expect(result1.isValid).toBe(false);

            const result2 = migrationTool.validateRecord(undefined);
            expect(result2.isValid).toBe(false);
        });
    });

    describe('categorizeRecords', () => {
        test('should categorize valid and invalid records', () => {
            const records = [
                {
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                },
                {
                    name: '', // invalid
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                },
                {
                    name: '李四',
                    phone: '0923456789',
                    region: '新北市',
                    occupation: '藥助',
                    timestamp: '2024-01-02T00:00:00.000Z'
                }
            ];

            const result = migrationTool.categorizeRecords(records);

            expect(result.valid).toHaveLength(2);
            expect(result.invalid).toHaveLength(1);
            expect(result.invalid[0].index).toBe(1);
        });
    });

    describe('isDuplicate', () => {
        test('should detect duplicate records', () => {
            const record = {
                name: '張三',
                phone: '0912345678',
                region: '台北市',
                occupation: '藥師',
                timestamp: '2024-01-01T00:00:00.000Z'
            };

            const existingRecords = [
                {
                    phone: '0912345678',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            const result = migrationTool.isDuplicate(record, existingRecords);
            expect(result).toBe(true);
        });

        test('should not detect non-duplicate records', () => {
            const record = {
                name: '張三',
                phone: '0912345678',
                region: '台北市',
                occupation: '藥師',
                timestamp: '2024-01-01T00:00:00.000Z'
            };

            const existingRecords = [
                {
                    phone: '0923456789', // different phone
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            const result = migrationTool.isDuplicate(record, existingRecords);
            expect(result).toBe(false);
        });
    });

    describe('uploadRecords', () => {
        test('should upload valid records successfully', async () => {
            const records = [
                {
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            mockApiClient.createResponse.mockResolvedValue({
                success: true,
                id: 1
            });

            const result = await migrationTool.uploadRecords(records, []);

            expect(result.success).toHaveLength(1);
            expect(result.failed).toHaveLength(0);
            expect(result.skipped).toHaveLength(0);
            expect(mockApiClient.createResponse).toHaveBeenCalledTimes(1);
        });

        test('should skip duplicate records', async () => {
            const records = [
                {
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            const existingRecords = [
                {
                    phone: '0912345678',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            const result = await migrationTool.uploadRecords(records, existingRecords);

            expect(result.success).toHaveLength(0);
            expect(result.failed).toHaveLength(0);
            expect(result.skipped).toHaveLength(1);
            expect(mockApiClient.createResponse).not.toHaveBeenCalled();
        });

        test('should handle upload failures', async () => {
            const records = [
                {
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            mockApiClient.createResponse.mockResolvedValue({
                success: false,
                error: 'Database error'
            });

            const result = await migrationTool.uploadRecords(records, []);

            expect(result.success).toHaveLength(0);
            expect(result.failed).toHaveLength(1);
            expect(result.failed[0].error).toBe('Database error');
        });
    });

    describe('generateSummary', () => {
        test('should generate correct summary', () => {
            const result = {
                totalRecords: 10,
                validRecords: 8,
                invalidRecords: 2,
                successCount: 6,
                failedCount: 1,
                skippedCount: 1,
                invalid: [],
                failed: [],
                skipped: []
            };

            const summary = migrationTool.generateSummary(result);

            expect(summary.totalRecords).toBe(10);
            expect(summary.validRecords).toBe(8);
            expect(summary.invalidRecords).toBe(2);
            expect(summary.successCount).toBe(6);
            expect(summary.failedCount).toBe(1);
            expect(summary.skippedCount).toBe(1);
            expect(summary.successRate).toBe('75.00');
        });

        test('should handle zero valid records', () => {
            const result = {
                totalRecords: 2,
                validRecords: 0,
                invalidRecords: 2,
                successCount: 0,
                failedCount: 0,
                skippedCount: 0,
                invalid: [],
                failed: [],
                skipped: []
            };

            const summary = migrationTool.generateSummary(result);
            expect(summary.successRate).toBe(0);
        });
    });

    describe('migrate', () => {
        test('should handle empty localStorage', async () => {
            const result = await migrationTool.migrate();

            expect(result.success).toBe(true);
            expect(result.message).toContain('沒有資料');
            expect(result.summary.totalRecords).toBe(0);
        });

        test('should perform complete migration', async () => {
            const testData = [
                {
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            localStorageMock[STORAGE_KEY] = JSON.stringify(testData);

            mockApiClient.getAllResponses.mockResolvedValue({
                success: true,
                data: []
            });

            mockApiClient.createResponse.mockResolvedValue({
                success: true,
                id: 1
            });

            const result = await migrationTool.migrate();

            expect(result.success).toBe(true);
            expect(result.summary.totalRecords).toBe(1);
            expect(result.summary.successCount).toBe(1);
        });

        test('should handle API errors', async () => {
            const testData = [
                {
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            ];

            localStorageMock[STORAGE_KEY] = JSON.stringify(testData);

            mockApiClient.getAllResponses.mockResolvedValue({
                success: false,
                error: 'Network error'
            });

            const result = await migrationTool.migrate();

            expect(result.success).toBe(false);
            expect(result.message).toContain('遷移失敗');
        });
    });

    describe('clearLocalStorage', () => {
        test('should clear localStorage with confirmation', () => {
            localStorageMock[STORAGE_KEY] = 'some data';

            migrationTool.clearLocalStorage(true);

            expect(global.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        });

        test('should throw error without confirmation', () => {
            expect(() => migrationTool.clearLocalStorage(false)).toThrow();
            expect(() => migrationTool.clearLocalStorage()).toThrow();
        });
    });

    // Feature: d1-database-migration, Property 4: 遷移資料驗證
    describe.skip('Property 4: Migration Data Validation', () => {
        test('property: only valid records should be uploaded', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(validRecordArb, { minLength: 1, maxLength: 5 }),
                    fc.array(fc.record({
                        name: fc.constant(''), // invalid name
                        phone: validPhoneArb,
                        region: validRegionArb,
                        occupation: validOccupationArb,
                        timestamp: validTimestampArb
                    }), { minLength: 1, maxLength: 3 }),
                    async (validRecords, invalidRecords) => {
                        const allRecords = [...validRecords, ...invalidRecords];
                        localStorageMock[STORAGE_KEY] = JSON.stringify(allRecords);

                        mockApiClient.getAllResponses.mockResolvedValue({
                            success: true,
                            data: []
                        });

                        mockApiClient.createResponse.mockResolvedValue({
                            success: true,
                            id: 1
                        });

                        const result = await migrationTool.migrate();

                        expect(result.success).toBe(true);
                        expect(result.summary.validRecords).toBe(validRecords.length);
                        expect(result.summary.invalidRecords).toBe(invalidRecords.length);
                        expect(mockApiClient.createResponse).toHaveBeenCalledTimes(validRecords.length);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    // Feature: d1-database-migration, Property 5: 重複記錄檢測
    describe.skip('Property 5: Duplicate Record Detection', () => {
        test('property: duplicate records should be skipped', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validRecordArb,
                    async (record) => {
                        const duplicateRecord = { ...record };
                        const records = [record, duplicateRecord];

                        localStorageMock[STORAGE_KEY] = JSON.stringify(records);

                        mockApiClient.getAllResponses.mockResolvedValue({
                            success: true,
                            data: []
                        });

                        let callCount = 0;
                        mockApiClient.createResponse.mockImplementation(async () => {
                            callCount++;
                            return { success: true, id: callCount };
                        });

                        const result = await migrationTool.migrate();

                        expect(result.success).toBe(true);
                        // First record should be uploaded, second should be skipped as duplicate
                        expect(result.summary.successCount).toBe(1);
                        expect(result.summary.skippedCount).toBe(1);
                        expect(mockApiClient.createResponse).toHaveBeenCalledTimes(1);
                    }
                ),
                { numRuns: 5, timeout: 10000 }
            );
        });

        test('property: records with same phone but different timestamp should not be duplicates', async () => {
            await fc.assert(
                fc.asyncProperty(
                    validRecordArb,
                    validTimestampArb,
                    async (record, differentTimestamp) => {
                        // Ensure timestamps are different
                        if (record.timestamp === differentTimestamp) {
                            return;
                        }

                        const record2 = { ...record, timestamp: differentTimestamp };
                        const records = [record, record2];

                        localStorageMock[STORAGE_KEY] = JSON.stringify(records);

                        mockApiClient.getAllResponses.mockResolvedValue({
                            success: true,
                            data: []
                        });

                        let callCount = 0;
                        mockApiClient.createResponse.mockImplementation(async () => {
                            callCount++;
                            return { success: true, id: callCount };
                        });

                        const result = await migrationTool.migrate();

                        expect(result.success).toBe(true);
                        // Both records should be uploaded (not duplicates)
                        expect(result.summary.successCount).toBe(2);
                        expect(result.summary.skippedCount).toBe(0);
                        expect(mockApiClient.createResponse).toHaveBeenCalledTimes(2);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });
});

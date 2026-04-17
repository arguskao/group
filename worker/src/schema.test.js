import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Schema Validation Tests
 * 
 * These tests verify that the database schema is correctly defined:
 * - Table structure (responses table exists with correct columns)
 * - Indexes (timestamp, phone+timestamp, region, occupation)
 * - Constraints (NOT NULL constraints on required fields)
 */

describe('Database Schema Validation', () => {
    let schemaSQL;

    beforeAll(() => {
        // Read the schema.sql file
        schemaSQL = readFileSync(join(process.cwd(), 'schema.sql'), 'utf-8');
    });

    describe('Table Structure', () => {
        test('should define responses table', () => {
            expect(schemaSQL).toContain('CREATE TABLE');
            expect(schemaSQL).toContain('responses');
        });

        test('should have id column as primary key with autoincrement', () => {
            expect(schemaSQL).toMatch(/id\s+INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/i);
        });

        test('should have name column with NOT NULL constraint', () => {
            expect(schemaSQL).toMatch(/name\s+TEXT\s+NOT\s+NULL/i);
        });

        test('should have phone column with NOT NULL constraint', () => {
            expect(schemaSQL).toMatch(/phone\s+TEXT\s+NOT\s+NULL/i);
        });

        test('should have region column with NOT NULL constraint', () => {
            expect(schemaSQL).toMatch(/region\s+TEXT\s+NOT\s+NULL/i);
        });

        test('should have occupation column with NOT NULL constraint', () => {
            expect(schemaSQL).toMatch(/occupation\s+TEXT\s+NOT\s+NULL/i);
        });

        test('should have timestamp column with NOT NULL constraint', () => {
            expect(schemaSQL).toMatch(/timestamp\s+TEXT\s+NOT\s+NULL/i);
        });

        test('should have created_at column with default value', () => {
            expect(schemaSQL).toMatch(/created_at\s+DATETIME\s+DEFAULT\s+CURRENT_TIMESTAMP/i);
        });
    });

    describe('Indexes', () => {
        test('should create index on timestamp column', () => {
            expect(schemaSQL).toMatch(/CREATE\s+INDEX.*idx_timestamp.*ON\s+responses\s*\(\s*timestamp\s*\)/i);
        });

        test('should create composite index on phone and timestamp columns', () => {
            expect(schemaSQL).toMatch(/CREATE\s+INDEX.*idx_phone_timestamp.*ON\s+responses\s*\(\s*phone\s*,\s*timestamp\s*\)/i);
        });

        test('should create index on region column', () => {
            expect(schemaSQL).toMatch(/CREATE\s+INDEX.*idx_region.*ON\s+responses\s*\(\s*region\s*\)/i);
        });

        test('should create index on occupation column', () => {
            expect(schemaSQL).toMatch(/CREATE\s+INDEX.*idx_occupation.*ON\s+responses\s*\(\s*occupation\s*\)/i);
        });

        test('should use IF NOT EXISTS for all indexes', () => {
            const indexMatches = schemaSQL.match(/CREATE\s+INDEX/gi) || [];
            const ifNotExistsMatches = schemaSQL.match(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/gi) || [];

            // All CREATE INDEX statements should have IF NOT EXISTS
            expect(ifNotExistsMatches.length).toBe(indexMatches.length);
        });
    });

    describe('Constraints', () => {
        test('should enforce NOT NULL on all required fields', () => {
            const requiredFields = ['name', 'phone', 'region', 'occupation', 'timestamp'];

            requiredFields.forEach(field => {
                const regex = new RegExp(`${field}\\s+TEXT\\s+NOT\\s+NULL`, 'i');
                expect(schemaSQL).toMatch(regex);
            });
        });

        test('should use IF NOT EXISTS for table creation', () => {
            expect(schemaSQL).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i);
        });
    });

    describe('Schema Completeness', () => {
        test('should have exactly 4 indexes defined', () => {
            const indexMatches = schemaSQL.match(/CREATE\s+INDEX/gi) || [];
            expect(indexMatches.length).toBe(4);
        });

        test('should have exactly 1 table defined', () => {
            const tableMatches = schemaSQL.match(/CREATE\s+TABLE/gi) || [];
            expect(tableMatches.length).toBe(1);
        });

        test('should have all 8 columns defined', () => {
            const expectedColumns = [
                'id',
                'name',
                'phone',
                'region',
                'occupation',
                'timestamp',
                'created_at'
            ];

            expectedColumns.forEach(column => {
                expect(schemaSQL.toLowerCase()).toContain(column.toLowerCase());
            });
        });
    });
});

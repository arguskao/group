import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Validator } from './validator.js';
import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';

/**
 * Property-Based Tests for Validator
 * Feature: d1-database-migration, Property 3: 無效資料拒絕
 * 
 * These tests verify that the validator correctly rejects invalid data
 * across a wide range of inputs.
 */

describe('Property-Based Tests: Invalid Data Rejection', () => {
    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: empty or whitespace-only names should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.constant('   '),
                    fc.constant('\t'),
                    fc.constant('\n'),
                    fc.stringMatching(/^\s+$/)
                ),
                (invalidName) => {
                    const result = Validator.validateName(invalidName);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(result.errors[0].field).toBe('name');
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: names with invalid characters should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s.length > 0 && /[^\\u4e00-\u9fa5a-zA-Z\s]/.test(s)),
                (invalidName) => {
                    const result = Validator.validateName(invalidName);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: names longer than 50 characters should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 51, maxLength: 100 }).map(s => 'a'.repeat(51)),
                (longName) => {
                    const result = Validator.validateName(longName);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.some(e => e.message.includes('50'))).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: empty or whitespace-only phones should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.constant('   '),
                    fc.constant('\t\n')
                ),
                (invalidPhone) => {
                    const result = Validator.validatePhone(invalidPhone);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(result.errors[0].field).toBe('phone');
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: phones with invalid characters should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s.length > 0 && /[^0-9\s-]/.test(s)),
                (invalidPhone) => {
                    const result = Validator.validatePhone(invalidPhone);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: phones with too few or too many digits should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.integer({ min: 1, max: 7 }).map(n => '1'.repeat(n)),
                    fc.integer({ min: 16, max: 30 }).map(n => '1'.repeat(n))
                ),
                (invalidPhone) => {
                    const result = Validator.validatePhone(invalidPhone);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: empty regions should be rejected', () => {
        fc.assert(
            fc.property(
                fc.constant(''),
                (emptyRegion) => {
                    const result = Validator.validateRegion(emptyRegion);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(result.errors[0].field).toBe('region');
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: regions not in TAIWAN_REGIONS list should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }).filter(s => !TAIWAN_REGIONS.includes(s)),
                (invalidRegion) => {
                    const result = Validator.validateRegion(invalidRegion);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: empty occupations should be rejected', () => {
        fc.assert(
            fc.property(
                fc.constant(''),
                (emptyOccupation) => {
                    const result = Validator.validateOccupation(emptyOccupation);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(result.errors[0].field).toBe('occupation');
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: occupations not in OCCUPATION_TYPES list should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }).filter(s => !OCCUPATION_TYPES.includes(s)),
                (invalidOccupation) => {
                    const result = Validator.validateOccupation(invalidOccupation);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: invalid timestamp formats should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.constant('not-a-date'),
                    fc.constant('2024-13-01'),  // Invalid month
                    fc.constant('2024-01-32'),  // Invalid day
                    fc.string().filter(s => s.length > 0 && isNaN(new Date(s).getTime()))
                ),
                (invalidTimestamp) => {
                    const result = Validator.validateTimestamp(invalidTimestamp);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 3: 無效資料拒絕
    test('property: response records with any invalid field should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    // Invalid name (empty)
                    fc.constant({
                        name: '',
                        phone: '0912345678',
                        region: '台北市',
                        occupation: '藥師',
                        timestamp: new Date().toISOString()
                    }),
                    // Invalid phone (non-numeric)
                    fc.constant({
                        name: '張三',
                        phone: 'abc',
                        region: '台北市',
                        occupation: '藥師',
                        timestamp: new Date().toISOString()
                    }),
                    // Invalid region
                    fc.constant({
                        name: '張三',
                        phone: '0912345678',
                        region: 'Invalid Region',
                        occupation: '藥師',
                        timestamp: new Date().toISOString()
                    }),
                    // Invalid occupation
                    fc.constant({
                        name: '張三',
                        phone: '0912345678',
                        region: '台北市',
                        occupation: 'Invalid Job',
                        timestamp: new Date().toISOString()
                    }),
                    // Invalid timestamp
                    fc.constant({
                        name: '張三',
                        phone: '0912345678',
                        region: '台北市',
                        occupation: '藥師',
                        timestamp: 'not-a-date'
                    })
                ),
                (invalidRecord) => {
                    const result = Validator.validateResponseRecord(invalidRecord);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});

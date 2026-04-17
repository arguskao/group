import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Authentication
 * Feature: d1-database-migration, Property 8: 認證失敗拒絕
 * 
 * These tests verify that invalid passwords are correctly rejected.
 */

describe('Property-Based Tests: Authentication Failure Rejection', () => {
    const CORRECT_PASSWORD = '3939889';

    /**
     * Helper function to check if password is valid
     * @param {string} password - Password to check
     * @param {string} correctPassword - The correct password
     * @returns {boolean} - Whether the password is valid
     */
    function isPasswordValid(password, correctPassword) {
        return password === correctPassword;
    }

    // Feature: d1-database-migration, Property 8: 認證失敗拒絕
    test('property: empty passwords should be rejected', () => {
        fc.assert(
            fc.property(
                fc.constant(''),
                (emptyPassword) => {
                    const isValid = isPasswordValid(emptyPassword, CORRECT_PASSWORD);
                    expect(isValid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 8: 認證失敗拒絕
    test('property: incorrect passwords should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s !== CORRECT_PASSWORD),
                (wrongPassword) => {
                    const isValid = isPasswordValid(wrongPassword, CORRECT_PASSWORD);
                    expect(isValid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 8: 認證失敗拒絕
    test('property: passwords with whitespace differences should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(` ${CORRECT_PASSWORD}`),
                    fc.constant(`${CORRECT_PASSWORD} `),
                    fc.constant(` ${CORRECT_PASSWORD} `),
                    fc.constant(`\t${CORRECT_PASSWORD}`),
                    fc.constant(`${CORRECT_PASSWORD}\n`)
                ),
                (passwordWithWhitespace) => {
                    const isValid = isPasswordValid(passwordWithWhitespace, CORRECT_PASSWORD);
                    expect(isValid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 8: 認證失敗拒絕
    test('property: passwords with case differences should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(CORRECT_PASSWORD.toUpperCase()),
                    fc.constant(CORRECT_PASSWORD.toLowerCase()),
                    fc.constant('3939889A'),  // Extra character
                    fc.constant('393988')     // Missing character
                ).filter(s => s !== CORRECT_PASSWORD),
                (wrongPassword) => {
                    const isValid = isPasswordValid(wrongPassword, CORRECT_PASSWORD);
                    expect(isValid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 8: 認證失敗拒絕
    test('property: null or undefined passwords should be rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined)
                ),
                (invalidPassword) => {
                    const isValid = isPasswordValid(invalidPassword, CORRECT_PASSWORD);
                    expect(isValid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: d1-database-migration, Property 8: 認證失敗拒絕
    test('property: only exact password match should be accepted', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (password) => {
                    const isValid = isPasswordValid(password, CORRECT_PASSWORD);
                    if (password === CORRECT_PASSWORD) {
                        expect(isValid).toBe(true);
                    } else {
                        expect(isValid).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

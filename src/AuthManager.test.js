import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { AuthManager } from './AuthManager.js';
import { ADMIN_PASSWORD } from './constants.js';

describe('AuthManager', () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthManager();
  });

  describe('Property-Based Tests', () => {
    // Feature: survey-form, Property 18: 錯誤密碼拒絕
    // Validates: Requirements 9.4
    test('Property 18: rejects all incorrect passwords', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s !== ADMIN_PASSWORD),
          (wrongPassword) => {
            const result = authManager.authenticate(wrongPassword);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('authenticate', () => {
      test('should accept correct password', () => {
        const result = authManager.authenticate(ADMIN_PASSWORD);
        expect(result).toBe(true);
      });

      test('should accept correct password "3939889"', () => {
        const result = authManager.authenticate('3939889');
        expect(result).toBe(true);
      });

      test('should reject incorrect password', () => {
        const result = authManager.authenticate('wrong_password');
        expect(result).toBe(false);
      });

      test('should reject empty password', () => {
        const result = authManager.authenticate('');
        expect(result).toBe(false);
      });

      test('should reject similar but incorrect password', () => {
        const result = authManager.authenticate('3939888');
        expect(result).toBe(false);
      });

      test('should reject password with extra spaces', () => {
        const result = authManager.authenticate(' 3939889 ');
        expect(result).toBe(false);
      });

      test('should be case sensitive', () => {
        const result = authManager.authenticate('ADMIN');
        expect(result).toBe(false);
      });
    });

    describe('custom password', () => {
      test('should work with custom password', () => {
        const customAuth = new AuthManager('custom123');
        expect(customAuth.authenticate('custom123')).toBe(true);
        expect(customAuth.authenticate('wrong')).toBe(false);
      });
    });
  });
});

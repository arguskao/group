import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Validator } from './Validator.js';
import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';

describe('Validator', () => {
  describe('Property-Based Tests', () => {
    // Feature: survey-form, Property 1: 表單輸入接受
    // Validates: Requirements 2.4
    test('Property 1: accepts names with Chinese characters, English letters, and spaces', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[\u4e00-\u9fa5a-zA-Z\s]+$/),
          (name) => {
            // Skip empty strings as they should fail validation
            if (name.trim() === '') return true;
            
            const result = Validator.validateName(name);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 3: 電話格式驗證
    // Validates: Requirements 3.4, 3.5
    test('Property 3: accepts phone numbers with valid format and length', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 15 }).chain(length => {
            // Generate a phone number with the specified number of digits
            return fc.array(fc.integer({ min: 0, max: 9 }), { 
              minLength: length, 
              maxLength: length 
            }).map(digits => {
              // Randomly add spaces or hyphens between digits
              const phoneStr = digits.join('');
              // Randomly insert spaces or hyphens
              return fc.sample(
                fc.constantFrom(
                  phoneStr,
                  phoneStr.replace(/(\d{4})(\d{4})/, '$1-$2'),
                  phoneStr.replace(/(\d{4})(\d{4})/, '$1 $2'),
                  phoneStr.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3'),
                  phoneStr.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')
                ),
                1
              )[0];
            });
          }),
          (phone) => {
            const result = Validator.validatePhone(phone);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 9: 不完整表單驗證
    // Validates: Requirements 6.5
    test('Property 9: rejects incomplete forms and shows all missing field errors', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(fc.stringMatching(/^[\u4e00-\u9fa5a-zA-Z\s]+$/), { nil: '' }),
            phone: fc.option(fc.string(), { nil: '' }),
            region: fc.option(fc.constantFrom(...TAIWAN_REGIONS), { nil: '' }),
            occupation: fc.option(fc.constantFrom(...OCCUPATION_TYPES), { nil: '' })
          }),
          (formData) => {
            // Count how many fields are empty
            const emptyFields = [
              !formData.name || formData.name.trim() === '',
              !formData.phone || formData.phone.trim() === '',
              !formData.region,
              !formData.occupation
            ].filter(Boolean).length;

            // If at least one field is empty, validation should fail
            if (emptyFields > 0) {
              const result = Validator.validateForm({
                name: formData.name || '',
                phone: formData.phone || '',
                region: formData.region || '',
                occupation: formData.occupation || '',
                timestamp: new Date().toISOString()
              });
              
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('validateName', () => {
      test('should accept valid Chinese name', () => {
        const result = Validator.validateName('王小明');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept valid English name', () => {
        const result = Validator.validateName('John Doe');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept mixed Chinese and English name', () => {
        const result = Validator.validateName('王 John');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject empty name', () => {
        const result = Validator.validateName('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('name');
      });

      test('should reject name with numbers', () => {
        const result = Validator.validateName('王123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });

      test('should reject name with special characters', () => {
        const result = Validator.validateName('王@明');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('validatePhone', () => {
      test('should accept valid phone number with 10 digits', () => {
        const result = Validator.validatePhone('0912345678');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept phone number with hyphens', () => {
        const result = Validator.validatePhone('02-1234-5678');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept phone number with spaces', () => {
        const result = Validator.validatePhone('0912 345 678');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept 8 digit phone number', () => {
        const result = Validator.validatePhone('12345678');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should accept 15 digit phone number', () => {
        const result = Validator.validatePhone('123456789012345');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject empty phone', () => {
        const result = Validator.validatePhone('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('phone');
      });

      test('should reject phone with less than 8 digits', () => {
        const result = Validator.validatePhone('1234567');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });

      test('should reject phone with more than 15 digits', () => {
        const result = Validator.validatePhone('1234567890123456');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });

      test('should reject phone with letters', () => {
        const result = Validator.validatePhone('091234567a');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });

      test('should reject phone with special characters', () => {
        const result = Validator.validatePhone('0912@34567');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('validateRegion', () => {
      test('should accept valid Taiwan region', () => {
        const result = Validator.validateRegion('台北市');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject empty region', () => {
        const result = Validator.validateRegion('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('region');
      });

      test('should reject invalid region', () => {
        const result = Validator.validateRegion('無效地區');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('validateOccupation', () => {
      test('should accept valid occupation', () => {
        const result = Validator.validateOccupation('藥師');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject empty occupation', () => {
        const result = Validator.validateOccupation('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('occupation');
      });

      test('should reject invalid occupation', () => {
        const result = Validator.validateOccupation('無效職業');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('validateForm', () => {
      test('should accept complete valid form', () => {
        const result = Validator.validateForm({
          name: '王小明',
          phone: '0912345678',
          region: '台北市',
          occupation: '藥師'
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject form with all empty fields', () => {
        const result = Validator.validateForm({
          name: '',
          phone: '',
          region: '',
          occupation: ''
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(4);
      });

      test('should collect all validation errors', () => {
        const result = Validator.validateForm({
          name: '',
          phone: '123',
          region: '',
          occupation: ''
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Check that errors include all problematic fields
        const errorFields = result.errors.map(e => e.field);
        expect(errorFields).toContain('name');
        expect(errorFields).toContain('phone');
        expect(errorFields).toContain('region');
        expect(errorFields).toContain('occupation');
      });
    });
  });
});

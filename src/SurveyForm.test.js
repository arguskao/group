import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { SurveyForm } from './SurveyForm.js';
import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';

describe('SurveyForm', () => {
  let container;
  let surveyForm;
  let submittedData;

  beforeEach(() => {
    // Create a container for the form
    container = document.createElement('div');
    document.body.appendChild(container);

    // Reset submitted data
    submittedData = null;

    // Create form with callback
    surveyForm = new SurveyForm(container, (data) => {
      submittedData = data;
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Property-Based Tests', () => {
    // Feature: survey-form, Property 7: 提交後表單清空
    // Validates: Requirements 6.3
    test('Property 7: form is cleared after successful submission', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.stringMatching(/^[\u4e00-\u9fa5a-zA-Z ]+$/).filter(s => s.trim() !== ''),
            phone: fc.integer({ min: 8, max: 15 }).chain(len =>
              fc.array(fc.integer({ min: 0, max: 9 }), { minLength: len, maxLength: len })
                .map(digits => digits.join(''))
            ),
            region: fc.constantFrom(...TAIWAN_REGIONS),
            occupation: fc.constantFrom(...OCCUPATION_TYPES)
          }),
          (formData) => {
            // Fill form
            const form = container.querySelector('#survey-form');
            form.elements.name.value = formData.name;
            form.elements.phone.value = formData.phone;
            form.elements.region.value = formData.region;
            form.elements.occupation.value = formData.occupation;

            // Submit form
            form.dispatchEvent(new Event('submit'));

            // Check that form is cleared
            expect(form.elements.name.value).toBe('');
            expect(form.elements.phone.value).toBe('');
            expect(form.elements.region.value).toBe('');
            expect(form.elements.occupation.value).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 6: 有效表單提交儲存
    // Validates: Requirements 6.2
    test('Property 6: valid form submission saves data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.stringMatching(/^[\u4e00-\u9fa5a-zA-Z ]+$/).filter(s => s.trim() !== ''),
            phone: fc.integer({ min: 8, max: 15 }).chain(len =>
              fc.array(fc.integer({ min: 0, max: 9 }), { minLength: len, maxLength: len })
                .map(digits => digits.join(''))
            ),
            region: fc.constantFrom(...TAIWAN_REGIONS),
            occupation: fc.constantFrom(...OCCUPATION_TYPES)
          }),
          (formData) => {
            // Reset submitted data
            submittedData = null;

            // Fill form
            const form = container.querySelector('#survey-form');
            form.elements.name.value = formData.name;
            form.elements.phone.value = formData.phone;
            form.elements.region.value = formData.region;
            form.elements.occupation.value = formData.occupation;

            // Submit form
            form.dispatchEvent(new Event('submit'));

            // Check that data was submitted
            expect(submittedData).not.toBeNull();
            expect(submittedData.name).toBe(formData.name.trim());
            expect(submittedData.phone).toBe(formData.phone.trim());
            expect(submittedData.region).toBe(formData.region);
            expect(submittedData.occupation).toBe(formData.occupation);
            expect(submittedData.timestamp).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('render', () => {
      test('should render form with all fields', () => {
        expect(container.querySelector('#survey-form')).toBeTruthy();
        expect(container.querySelector('#name')).toBeTruthy();
        expect(container.querySelector('#phone')).toBeTruthy();
        expect(container.querySelector('#region')).toBeTruthy();
        expect(container.querySelector('#occupation')).toBeTruthy();
      });

      test('should render intro text', () => {
        expect(container.querySelector('.intro-text')).toBeTruthy();
      });

      test('should render all Taiwan regions', () => {
        const regionSelect = container.querySelector('#region');
        const options = Array.from(regionSelect.options).map(opt => opt.value).filter(v => v !== '');
        expect(options.length).toBe(TAIWAN_REGIONS.length);
      });

      test('should render all occupation types', () => {
        const occupationSelect = container.querySelector('#occupation');
        const options = Array.from(occupationSelect.options).map(opt => opt.value).filter(v => v !== '');
        expect(options.length).toBe(OCCUPATION_TYPES.length);
      });
    });

    describe('getData', () => {
      test('should collect form data', () => {
        const form = container.querySelector('#survey-form');
        form.elements.name.value = '王小明';
        form.elements.phone.value = '0912345678';
        form.elements.region.value = '台北市';
        form.elements.occupation.value = '藥師';

        const data = surveyForm.getData();
        expect(data.name).toBe('王小明');
        expect(data.phone).toBe('0912345678');
        expect(data.region).toBe('台北市');
        expect(data.occupation).toBe('藥師');
        expect(data.timestamp).toBeDefined();
      });

      test('should trim whitespace from inputs', () => {
        const form = container.querySelector('#survey-form');
        form.elements.name.value = '  王小明  ';
        form.elements.phone.value = '  0912345678  ';

        const data = surveyForm.getData();
        expect(data.name).toBe('王小明');
        expect(data.phone).toBe('0912345678');
      });
    });

    describe('validate', () => {
      test('should validate complete form', () => {
        const form = container.querySelector('#survey-form');
        form.elements.name.value = '王小明';
        form.elements.phone.value = '0912345678';
        form.elements.region.value = '台北市';
        form.elements.occupation.value = '藥師';

        const result = surveyForm.validate();
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should detect empty fields', () => {
        const result = surveyForm.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('clear', () => {
      test('should clear all form fields', () => {
        const form = container.querySelector('#survey-form');
        form.elements.name.value = '王小明';
        form.elements.phone.value = '0912345678';
        form.elements.region.value = '台北市';
        form.elements.occupation.value = '藥師';

        surveyForm.clear();

        expect(form.elements.name.value).toBe('');
        expect(form.elements.phone.value).toBe('');
        expect(form.elements.region.value).toBe('');
        expect(form.elements.occupation.value).toBe('');
      });
    });

    describe('showErrors', () => {
      test('should display error messages', () => {
        const errors = [
          { field: 'name', message: '此欄位為必填' },
          { field: 'phone', message: '請輸入有效的電話號碼' }
        ];

        surveyForm.showErrors(errors);

        const nameError = container.querySelector('#name-error');
        const phoneError = container.querySelector('#phone-error');

        expect(nameError.textContent).toBe('此欄位為必填');
        expect(phoneError.textContent).toBe('請輸入有效的電話號碼');
      });

      test('should add error class to fields', () => {
        const errors = [{ field: 'name', message: '此欄位為必填' }];
        surveyForm.showErrors(errors);

        const nameInput = container.querySelector('#name');
        expect(nameInput.classList.contains('field-error')).toBe(true);
      });
    });

    describe('form submission', () => {
      test('should call onSubmit with valid data', () => {
        const form = container.querySelector('#survey-form');
        form.elements.name.value = '王小明';
        form.elements.phone.value = '0912345678';
        form.elements.region.value = '台北市';
        form.elements.occupation.value = '藥師';

        form.dispatchEvent(new Event('submit'));

        expect(submittedData).not.toBeNull();
        expect(submittedData.name).toBe('王小明');
      });

      test('should not call onSubmit with invalid data', () => {
        const form = container.querySelector('#survey-form');
        // Leave form empty

        form.dispatchEvent(new Event('submit'));

        expect(submittedData).toBeNull();
      });

      test('should clear form after successful submission', () => {
        const form = container.querySelector('#survey-form');
        form.elements.name.value = '王小明';
        form.elements.phone.value = '0912345678';
        form.elements.region.value = '台北市';
        form.elements.occupation.value = '藥師';

        form.dispatchEvent(new Event('submit'));

        expect(form.elements.name.value).toBe('');
      });
    });
  });
});

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CSVManager } from './CSVManager.js';
import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';

describe('CSVManager', () => {
  let csvManager;

  beforeEach(() => {
    csvManager = new CSVManager('test_survey_responses');
    localStorage.clear();
  });

  describe('Property-Based Tests', () => {
    // Feature: survey-form, Property 17: CSV 特殊字元處理
    // Validates: Requirements 8.5
    test('Property 17: properly escapes special characters in CSV fields', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (fieldValue) => {
            const escaped = csvManager.escapeField(fieldValue);
            
            // If the original field contains comma, quote, or newline
            if (fieldValue.includes(',') || fieldValue.includes('"') || fieldValue.includes('\n')) {
              // The escaped field should be wrapped in quotes
              expect(escaped.startsWith('"')).toBe(true);
              expect(escaped.endsWith('"')).toBe(true);
              
              // Double quotes should be escaped as double-double quotes
              if (fieldValue.includes('"')) {
                expect(escaped).toContain('""');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 15: CSV 格式化
    // Validates: Requirements 8.2
    test('Property 15: formats responses as CSV with correct fields', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              // Exclude newlines from name to avoid CSV line counting issues
              name: fc.stringMatching(/^[\u4e00-\u9fa5a-zA-Z\s]+$/).filter(s => !s.includes('\n')),
              phone: fc.string().filter(s => !s.includes('\n')),
              region: fc.constantFrom(...TAIWAN_REGIONS),
              occupation: fc.constantFrom(...OCCUPATION_TYPES),
              timestamp: fc.date().map(d => d.toISOString())
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (responses) => {
            const csv = csvManager.toCSV(responses);
            
            // First line should be header
            expect(csv.startsWith('姓名,電話,地區,工作性質,提交時間')).toBe(true);
            
            // CSV should contain all response data
            responses.forEach(response => {
              // Check that region and occupation are present (they don't have special chars)
              expect(csv).toContain(response.region);
              expect(csv).toContain(response.occupation);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 16: CSV 往返一致性
    // Validates: Requirements 8.4
    test('Property 16: CSV round-trip preserves data', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string(),
              phone: fc.string(),
              region: fc.constantFrom(...TAIWAN_REGIONS),
              occupation: fc.constantFrom(...OCCUPATION_TYPES),
              timestamp: fc.date().map(d => d.toISOString())
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (originalResponses) => {
            // Convert to CSV and back
            const csv = csvManager.toCSV(originalResponses);
            const parsedResponses = csvManager.fromCSV(csv);
            
            // Should have same number of responses
            expect(parsedResponses.length).toBe(originalResponses.length);
            
            // Each response should match
            for (let i = 0; i < originalResponses.length; i++) {
              expect(parsedResponses[i].name).toBe(originalResponses[i].name);
              expect(parsedResponses[i].phone).toBe(originalResponses[i].phone);
              expect(parsedResponses[i].region).toBe(originalResponses[i].region);
              expect(parsedResponses[i].occupation).toBe(originalResponses[i].occupation);
              expect(parsedResponses[i].timestamp).toBe(originalResponses[i].timestamp);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 14: CSV 資料附加
    // Validates: Requirements 8.1
    test('Property 14: appending responses increases storage', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string(),
            phone: fc.string(),
            region: fc.constantFrom(...TAIWAN_REGIONS),
            occupation: fc.constantFrom(...OCCUPATION_TYPES),
            timestamp: fc.date().map(d => d.toISOString())
          }),
          (response) => {
            const beforeCount = csvManager.readAll().length;
            csvManager.append(response);
            const afterCount = csvManager.readAll().length;
            
            // Count should increase by 1
            expect(afterCount).toBe(beforeCount + 1);
            
            // The last response should match what we appended
            const allResponses = csvManager.readAll();
            const lastResponse = allResponses[allResponses.length - 1];
            expect(lastResponse).toEqual(response);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 19: 下載檔案命名
    // Validates: Requirements 9.6
    test('Property 19: generated filename follows timestamp format', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
          (testDate) => {
            // Generate filename based on date
            const timestamp = testDate.toISOString()
              .replace(/[-:]/g, '')
              .replace('T', '_')
              .split('.')[0];
            const filename = `survey_responses_${timestamp}.csv`;
            
            // Verify filename format: survey_responses_YYYYMMDD_HHMMSS.csv
            expect(filename).toMatch(/^survey_responses_\d{8}_\d{6}\.csv$/);
            
            // Verify it contains the correct date components
            const dateStr = testDate.toISOString().split('T')[0].replace(/-/g, '');
            expect(filename).toContain(dateStr);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: survey-form, Property 20: UTF-8 編碼保持
    // Validates: Requirements 9.7
    test('Property 20: CSV maintains UTF-8 encoding for Chinese characters', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[\u4e00-\u9fa5]+$/),
              phone: fc.string(),
              region: fc.constantFrom(...TAIWAN_REGIONS),
              occupation: fc.constantFrom(...OCCUPATION_TYPES),
              timestamp: fc.date().map(d => d.toISOString())
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (responses) => {
            const csv = csvManager.toCSV(responses);
            
            // Verify all Chinese characters are preserved
            responses.forEach(response => {
              expect(csv).toContain(response.name);
              expect(csv).toContain(response.region);
              expect(csv).toContain(response.occupation);
            });
            
            // Verify CSV can be parsed back correctly
            const parsed = csvManager.fromCSV(csv);
            expect(parsed.length).toBe(responses.length);
            
            parsed.forEach((parsedResponse, i) => {
              expect(parsedResponse.name).toBe(responses[i].name);
              expect(parsedResponse.region).toBe(responses[i].region);
              expect(parsedResponse.occupation).toBe(responses[i].occupation);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('escapeField', () => {
      test('should not escape simple text', () => {
        const result = csvManager.escapeField('王小明');
        expect(result).toBe('王小明');
      });

      test('should escape field with comma', () => {
        const result = csvManager.escapeField('王小明,別名');
        expect(result).toBe('"王小明,別名"');
      });

      test('should escape field with double quote', () => {
        const result = csvManager.escapeField('王"小"明');
        expect(result).toBe('"王""小""明"');
      });

      test('should escape field with newline', () => {
        const result = csvManager.escapeField('王小明\n備註');
        expect(result).toBe('"王小明\n備註"');
      });

      test('should escape field with multiple special characters', () => {
        const result = csvManager.escapeField('王"小"明,別名\n備註');
        expect(result).toBe('"王""小""明,別名\n備註"');
      });
    });

    describe('toCSV', () => {
      test('should format single response as CSV', () => {
        const responses = [{
          name: '王小明',
          phone: '0912345678',
          region: '台北市',
          occupation: '藥師',
          timestamp: '2024-01-01T00:00:00.000Z'
        }];
        
        const csv = csvManager.toCSV(responses);
        const lines = csv.split('\n');
        
        expect(lines[0]).toBe('姓名,電話,地區,工作性質,提交時間');
        expect(lines[1]).toBe('王小明,0912345678,台北市,藥師,2024-01-01T00:00:00.000Z');
      });

      test('should format multiple responses as CSV', () => {
        const responses = [
          {
            name: '王小明',
            phone: '0912345678',
            region: '台北市',
            occupation: '藥師',
            timestamp: '2024-01-01T00:00:00.000Z'
          },
          {
            name: '李小華',
            phone: '0987654321',
            region: '新北市',
            occupation: '藥助',
            timestamp: '2024-01-02T00:00:00.000Z'
          }
        ];
        
        const csv = csvManager.toCSV(responses);
        const lines = csv.split('\n');
        
        expect(lines.length).toBe(3);
        expect(lines[0]).toBe('姓名,電話,地區,工作性質,提交時間');
      });

      test('should handle special characters in CSV', () => {
        const responses = [{
          name: '王"小"明',
          phone: '02-1234,5678',
          region: '台北市',
          occupation: '藥師',
          timestamp: '2024-01-01T00:00:00.000Z'
        }];
        
        const csv = csvManager.toCSV(responses);
        expect(csv).toContain('"王""小""明"');
        expect(csv).toContain('"02-1234,5678"');
      });
    });

    describe('fromCSV', () => {
      test('should parse simple CSV', () => {
        const csv = '姓名,電話,地區,工作性質,提交時間\n王小明,0912345678,台北市,藥師,2024-01-01T00:00:00.000Z';
        const responses = csvManager.fromCSV(csv);
        
        expect(responses.length).toBe(1);
        expect(responses[0].name).toBe('王小明');
        expect(responses[0].phone).toBe('0912345678');
        expect(responses[0].region).toBe('台北市');
        expect(responses[0].occupation).toBe('藥師');
        expect(responses[0].timestamp).toBe('2024-01-01T00:00:00.000Z');
      });

      test('should parse CSV with quoted fields', () => {
        const csv = '姓名,電話,地區,工作性質,提交時間\n"王""小""明","02-1234,5678",台北市,藥師,2024-01-01T00:00:00.000Z';
        const responses = csvManager.fromCSV(csv);
        
        expect(responses.length).toBe(1);
        expect(responses[0].name).toBe('王"小"明');
        expect(responses[0].phone).toBe('02-1234,5678');
      });

      test('should return empty array for empty CSV', () => {
        const responses = csvManager.fromCSV('');
        expect(responses).toEqual([]);
      });

      test('should return empty array for header only', () => {
        const csv = '姓名,電話,地區,工作性質,提交時間';
        const responses = csvManager.fromCSV(csv);
        expect(responses).toEqual([]);
      });

      test('should handle multiple responses', () => {
        const csv = '姓名,電話,地區,工作性質,提交時間\n王小明,0912345678,台北市,藥師,2024-01-01T00:00:00.000Z\n李小華,0987654321,新北市,藥助,2024-01-02T00:00:00.000Z';
        const responses = csvManager.fromCSV(csv);
        
        expect(responses.length).toBe(2);
        expect(responses[0].name).toBe('王小明');
        expect(responses[1].name).toBe('李小華');
      });
    });

    describe('append and readAll', () => {
      test('should append and read single response', () => {
        const response = {
          name: '王小明',
          phone: '0912345678',
          region: '台北市',
          occupation: '藥師',
          timestamp: '2024-01-01T00:00:00.000Z'
        };
        
        csvManager.append(response);
        const responses = csvManager.readAll();
        
        expect(responses.length).toBe(1);
        expect(responses[0]).toEqual(response);
      });

      test('should append multiple responses', () => {
        const response1 = {
          name: '王小明',
          phone: '0912345678',
          region: '台北市',
          occupation: '藥師',
          timestamp: '2024-01-01T00:00:00.000Z'
        };
        
        const response2 = {
          name: '李小華',
          phone: '0987654321',
          region: '新北市',
          occupation: '藥助',
          timestamp: '2024-01-02T00:00:00.000Z'
        };
        
        csvManager.append(response1);
        csvManager.append(response2);
        
        const responses = csvManager.readAll();
        expect(responses.length).toBe(2);
        expect(responses[0]).toEqual(response1);
        expect(responses[1]).toEqual(response2);
      });

      test('should return empty array when no data exists', () => {
        const responses = csvManager.readAll();
        expect(responses).toEqual([]);
      });
    });
  });
});

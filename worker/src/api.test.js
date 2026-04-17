import { describe, test, expect, beforeEach, vi } from 'vitest';
import worker from './index.js';

/**
 * Unit Tests for API Endpoints
 * 
 * These tests verify the API endpoints work correctly with mocked D1 database.
 */

describe('API Endpoints Unit Tests', () => {
    let mockEnv;
    let mockCtx;

    beforeEach(() => {
        // Mock D1 database
        mockEnv = {
            DB: {
                prepare: vi.fn().mockReturnThis(),
                bind: vi.fn().mockReturnThis(),
                run: vi.fn(),
                all: vi.fn(),
                first: vi.fn(),
            },
            ADMIN_PASSWORD: '3939889',
            ALLOWED_ORIGINS: '*',
        };

        mockCtx = {
            waitUntil: vi.fn(),
            passThroughOnException: vi.fn(),
        };
    });

    describe('CORS Handling', () => {
        test('should handle OPTIONS preflight request', async () => {
            const request = new Request('https://example.com/api/responses', {
                method: 'OPTIONS',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);

            expect(response.status).toBe(200);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
        });

        test('should include CORS headers in all responses', async () => {
            const request = new Request('https://example.com/api/responses', {
                method: 'GET',
            });

            mockEnv.DB.all.mockResolvedValue({ results: [] });

            const response = await worker.fetch(request, mockEnv, mockCtx);

            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        });
    });

    describe('POST /api/responses', () => {
        test('should create response record with valid data', async () => {
            const validData = {
                name: '張三',
                phone: '0912345678',
                region: '台北市',
                occupation: '藥師',
                timestamp: new Date().toISOString(),
            };

            mockEnv.DB.run.mockResolvedValue({
                success: true,
                meta: { last_row_id: 123 },
            });

            const request = new Request('https://example.com/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validData),
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.id).toBe(123);
        });

        test('should reject invalid data with 400 status', async () => {
            const invalidData = {
                name: '',  // Empty name
                phone: '0912345678',
                region: '台北市',
                occupation: '藥師',
                timestamp: new Date().toISOString(),
            };

            const request = new Request('https://example.com/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidData),
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Validation failed');
            expect(data.details).toBeDefined();
            expect(data.details.length).toBeGreaterThan(0);
        });

        test('should handle database errors with 500 status', async () => {
            const validData = {
                name: '張三',
                phone: '0912345678',
                region: '台北市',
                occupation: '藥師',
                timestamp: new Date().toISOString(),
            };

            mockEnv.DB.run.mockRejectedValue(new Error('Database connection failed'));

            const request = new Request('https://example.com/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validData),
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
        });
    });

    describe('GET /api/responses', () => {
        test('should return all response records', async () => {
            const mockRecords = [
                {
                    id: 1,
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T12:00:00.000Z',
                },
                {
                    id: 2,
                    name: '李四',
                    phone: '0923456789',
                    region: '新北市',
                    occupation: '藥助',
                    timestamp: '2024-01-02T12:00:00.000Z',
                },
            ];

            mockEnv.DB.all.mockResolvedValue({ results: mockRecords });

            const request = new Request('https://example.com/api/responses', {
                method: 'GET',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockRecords);
            expect(data.count).toBe(2);
        });

        test('should handle empty database', async () => {
            mockEnv.DB.all.mockResolvedValue({ results: [] });

            const request = new Request('https://example.com/api/responses', {
                method: 'GET',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual([]);
            expect(data.count).toBe(0);
        });
    });

    describe('GET /api/export', () => {
        test('should export CSV with valid password', async () => {
            const mockRecords = [
                {
                    id: 1,
                    name: '張三',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T12:00:00.000Z',
                },
            ];

            mockEnv.DB.all.mockResolvedValue({ results: mockRecords });

            const request = new Request('https://example.com/api/export?password=3939889', {
                method: 'GET',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);

            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toContain('text/csv');
            expect(response.headers.get('Content-Disposition')).toContain('attachment');
            expect(response.headers.get('Content-Disposition')).toContain('survey_responses_');
        });

        test('should reject export with invalid password', async () => {
            const request = new Request('https://example.com/api/export?password=wrong', {
                method: 'GET',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });

        test('should reject export without password', async () => {
            const request = new Request('https://example.com/api/export', {
                method: 'GET',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });
    });

    describe('Error Handling', () => {
        test('should return 404 for unknown routes', async () => {
            const request = new Request('https://example.com/api/unknown', {
                method: 'GET',
            });

            const response = await worker.fetch(request, mockEnv, mockCtx);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Not found');
        });
    });
});

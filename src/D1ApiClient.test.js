import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { D1ApiClient } from './D1ApiClient.js';

/**
 * Unit Tests for D1ApiClient
 */
describe('D1ApiClient', () => {
    let client;
    let fetchMock;

    beforeEach(() => {
        client = new D1ApiClient('https://api.example.com', {
            maxRetries: 2,
            retryDelay: 100,
            timeout: 5000,
        });

        // Mock global fetch
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with correct default options', () => {
            const defaultClient = new D1ApiClient('https://api.example.com');
            expect(defaultClient.baseUrl).toBe('https://api.example.com');
            expect(defaultClient.maxRetries).toBe(3);
            expect(defaultClient.retryDelay).toBe(1000);
            expect(defaultClient.timeout).toBe(10000);
        });

        test('should remove trailing slash from baseUrl', () => {
            const clientWithSlash = new D1ApiClient('https://api.example.com/');
            expect(clientWithSlash.baseUrl).toBe('https://api.example.com');
        });

        test('should accept custom options', () => {
            expect(client.maxRetries).toBe(2);
            expect(client.retryDelay).toBe(100);
            expect(client.timeout).toBe(5000);
        });
    });

    describe('createResponse', () => {
        const testData = {
            name: '測試用戶',
            phone: '0912345678',
            region: '台北市',
            occupation: '藥師',
            timestamp: '2024-01-01T00:00:00.000Z',
        };

        test('should successfully create a response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 201,
                json: async () => ({ success: true, id: 123 }),
            });

            const result = await client.createResponse(testData);

            expect(result.success).toBe(true);
            expect(result.id).toBe(123);
            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/responses',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData),
                })
            );
        });

        test('should handle validation errors', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'Validation failed',
                    details: [{ field: 'name', message: '姓名為必填' }],
                }),
            });

            const result = await client.createResponse(testData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Validation failed');
            expect(result.details).toHaveLength(1);
        });

        test('should handle network errors', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const result = await client.createResponse(testData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('網路錯誤');
        });

        test('should retry on server errors', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 201,
                    json: async () => ({ success: true, id: 456 }),
                });

            const result = await client.createResponse(testData);

            expect(result.success).toBe(true);
            expect(result.id).toBe(456);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    describe('getAllResponses', () => {
        test('should successfully retrieve all responses', async () => {
            const mockData = [
                {
                    id: 1,
                    name: '用戶1',
                    phone: '0912345678',
                    region: '台北市',
                    occupation: '藥師',
                    timestamp: '2024-01-01T00:00:00.000Z',
                },
                {
                    id: 2,
                    name: '用戶2',
                    phone: '0923456789',
                    region: '新北市',
                    occupation: '藥劑生',
                    timestamp: '2024-01-02T00:00:00.000Z',
                },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: mockData,
                    count: 2,
                }),
            });

            const result = await client.getAllResponses();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
            expect(result.count).toBe(2);
            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/responses',
                expect.objectContaining({
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        test('should handle empty response list', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: [],
                    count: 0,
                }),
            });

            const result = await client.getAllResponses();

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.count).toBe(0);
        });

        test('should handle database errors', async () => {
            // Mock server error that will be retried
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    success: false,
                    error: 'Database error',
                }),
            });

            const result = await client.getAllResponses();

            expect(result.success).toBe(false);
            expect(result.error).toContain('網路錯誤');
            expect(fetchMock).toHaveBeenCalledTimes(2); // Should retry
        });
    });

    describe('exportCSV', () => {
        test('should successfully export CSV with correct password', async () => {
            const mockBlob = new Blob(['CSV data'], { type: 'text/csv' });

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map([
                    ['Content-Disposition', 'attachment; filename="survey-2024-01-01.csv"'],
                ]),
                blob: async () => mockBlob,
            });

            const result = await client.exportCSV('correct-password');

            expect(result.success).toBe(true);
            expect(result.blob).toBe(mockBlob);
            expect(result.filename).toBe('survey-2024-01-01.csv');
            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/export?password=correct-password',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });

        test('should handle incorrect password (401)', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Invalid password',
                }),
            });

            const result = await client.exportCSV('wrong-password');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid password');
        });

        test('should URL encode password parameter', async () => {
            const mockBlob = new Blob(['CSV data'], { type: 'text/csv' });

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map(),
                blob: async () => mockBlob,
            });

            await client.exportCSV('pass word!@#');

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('password=pass%20word!%40%23'),
                expect.any(Object)
            );
        });

        test('should use default filename if Content-Disposition header is missing', async () => {
            const mockBlob = new Blob(['CSV data'], { type: 'text/csv' });

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map(),
                blob: async () => mockBlob,
            });

            const result = await client.exportCSV('password');

            expect(result.success).toBe(true);
            expect(result.filename).toBe('survey-responses.csv');
        });
    });

    // Note: downloadCSV tests are skipped because they require a browser DOM environment
    // These should be tested in integration tests or E2E tests
    describe.skip('downloadCSV', () => {
        test('should be tested in browser environment', () => {
            // This test requires document object which is not available in Node.js
            // Use integration tests or E2E tests with a real browser environment
        });
    });

    describe('Retry Logic', () => {
        test('should retry on network errors', async () => {
            fetchMock
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({ success: true, data: [], count: 0 }),
                });

            const result = await client.getAllResponses();

            expect(result.success).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        test('should not retry on client errors (4xx)', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ success: false, error: 'Bad request' }),
            });

            const result = await client.createResponse({});

            expect(result.success).toBe(false);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        test('should fail after max retries', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const result = await client.getAllResponses();

            expect(result.success).toBe(false);
            expect(result.error).toContain('已重試 2 次');
            expect(fetchMock).toHaveBeenCalledTimes(2); // maxRetries = 2
        });
    });

    describe('Timeout Handling', () => {
        test('should timeout long requests', async () => {
            // Mock AbortController to simulate timeout
            const mockAbortController = {
                signal: {},
                abort: vi.fn(),
            };

            global.AbortController = vi.fn(() => mockAbortController);

            // Mock fetch to throw AbortError
            fetchMock.mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

            const result = await client.getAllResponses();

            expect(result.success).toBe(false);
            expect(result.error).toContain('請求超時');
        }, 1000);
    });
});

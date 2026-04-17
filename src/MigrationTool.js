import { STORAGE_KEY } from './constants.js';
import { Validator } from './Validator.js';

/**
 * MigrationTool - Tool for migrating data from localStorage to D1 database
 * Handles data validation, duplicate detection, and batch upload
 */
export class MigrationTool {
    /**
     * Create a new MigrationTool instance
     * @param {D1ApiClient} apiClient - The API client for D1 operations
     * @param {Object} options - Configuration options
     * @param {string} options.storageKey - localStorage key (default: STORAGE_KEY)
     * @param {number} options.batchSize - Number of records to upload per batch (default: 10)
     * @param {Function} options.onProgress - Progress callback (current, total, status)
     */
    constructor(apiClient, options = {}) {
        this.apiClient = apiClient;
        this.storageKey = options.storageKey || STORAGE_KEY;
        this.batchSize = options.batchSize || 10;
        this.onProgress = options.onProgress || (() => { });
    }

    /**
     * Read all records from localStorage
     * @returns {Array<{name: string, phone: string, region: string, occupation: string, timestamp: string}>}
     */
    readFromLocalStorage() {
        try {
            const jsonString = localStorage.getItem(this.storageKey);

            if (!jsonString) {
                return [];
            }

            const data = JSON.parse(jsonString);

            if (!Array.isArray(data)) {
                console.error('localStorage data is not an array');
                return [];
            }

            return data;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    /**
     * Validate a single record
     * @param {Object} record - The record to validate
     * @returns {{isValid: boolean, errors: Array}}
     */
    validateRecord(record) {
        // Check if record has all required fields
        if (!record || typeof record !== 'object') {
            return {
                isValid: false,
                errors: [{ field: 'record', message: '記錄格式無效' }]
            };
        }

        // Use Validator to validate the record
        return Validator.validateForm(record);
    }

    /**
     * Filter and categorize records
     * @param {Array} records - Array of records to process
     * @returns {{valid: Array, invalid: Array}}
     */
    categorizeRecords(records) {
        const valid = [];
        const invalid = [];

        records.forEach((record, index) => {
            const validation = this.validateRecord(record);

            if (validation.isValid) {
                valid.push(record);
            } else {
                invalid.push({
                    index,
                    record,
                    errors: validation.errors
                });
            }
        });

        return { valid, invalid };
    }

    /**
     * Check if a record is a duplicate in the remote database
     * @param {Object} record - The record to check
     * @param {Array} existingRecords - Array of existing records from D1
     * @returns {boolean}
     */
    isDuplicate(record, existingRecords) {
        return existingRecords.some(existing =>
            existing.phone === record.phone &&
            existing.timestamp === record.timestamp
        );
    }

    /**
     * Upload records in batches
     * @param {Array} records - Array of valid records to upload
     * @param {Array} existingRecords - Array of existing records from D1
     * @returns {Promise<{success: Array, failed: Array, skipped: Array}>}
     */
    async uploadRecords(records, existingRecords) {
        const success = [];
        const failed = [];
        const skipped = [];

        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            // Update progress
            this.onProgress(i + 1, records.length, `處理第 ${i + 1}/${records.length} 筆記錄...`);

            // Check for duplicates
            if (this.isDuplicate(record, existingRecords)) {
                skipped.push({
                    record,
                    reason: '重複記錄（相同電話和時間戳記）'
                });
                continue;
            }

            // Upload record
            try {
                const result = await this.apiClient.createResponse(record);

                if (result.success) {
                    success.push({
                        record,
                        id: result.id
                    });
                    // Add to existing records to detect duplicates within the batch
                    existingRecords.push(record);
                } else {
                    failed.push({
                        record,
                        error: result.error,
                        details: result.details
                    });
                }
            } catch (error) {
                failed.push({
                    record,
                    error: error.message
                });
            }

            // Add small delay between requests to avoid overwhelming the server
            if (i < records.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return { success, failed, skipped };
    }

    /**
     * Generate migration summary
     * @param {Object} result - Migration result object
     * @returns {Object} - Summary object
     */
    generateSummary(result) {
        const {
            totalRecords,
            validRecords,
            invalidRecords,
            successCount,
            failedCount,
            skippedCount,
            invalid,
            failed,
            skipped
        } = result;

        return {
            totalRecords,
            validRecords,
            invalidRecords,
            successCount,
            failedCount,
            skippedCount,
            successRate: validRecords > 0 ? (successCount / validRecords * 100).toFixed(2) : 0,
            details: {
                invalid: invalid.map(item => ({
                    index: item.index,
                    record: item.record,
                    errors: item.errors.map(e => e.message).join(', ')
                })),
                failed: failed.map(item => ({
                    record: item.record,
                    error: item.error,
                    details: item.details
                })),
                skipped: skipped.map(item => ({
                    record: item.record,
                    reason: item.reason
                }))
            }
        };
    }

    /**
     * Perform the migration
     * @returns {Promise<Object>} - Migration result and summary
     */
    async migrate() {
        try {
            // Step 1: Read from localStorage
            this.onProgress(0, 100, '讀取 localStorage 資料...');
            const localRecords = this.readFromLocalStorage();

            if (localRecords.length === 0) {
                return {
                    success: true,
                    message: 'localStorage 中沒有資料需要遷移',
                    summary: this.generateSummary({
                        totalRecords: 0,
                        validRecords: 0,
                        invalidRecords: 0,
                        successCount: 0,
                        failedCount: 0,
                        skippedCount: 0,
                        invalid: [],
                        failed: [],
                        skipped: []
                    })
                };
            }

            // Step 2: Validate records
            this.onProgress(10, 100, '驗證資料...');
            const { valid, invalid } = this.categorizeRecords(localRecords);

            // Step 3: Get existing records from D1
            this.onProgress(20, 100, '檢查遠端資料庫...');
            const existingResult = await this.apiClient.getAllResponses();

            if (!existingResult.success) {
                throw new Error(`無法取得遠端資料: ${existingResult.error}`);
            }

            const existingRecords = existingResult.data || [];

            // Step 4: Upload valid records
            this.onProgress(30, 100, '開始上傳資料...');
            const uploadResult = await this.uploadRecords(valid, existingRecords);

            // Step 5: Generate summary
            this.onProgress(100, 100, '完成！');

            const summary = this.generateSummary({
                totalRecords: localRecords.length,
                validRecords: valid.length,
                invalidRecords: invalid.length,
                successCount: uploadResult.success.length,
                failedCount: uploadResult.failed.length,
                skippedCount: uploadResult.skipped.length,
                invalid,
                failed: uploadResult.failed,
                skipped: uploadResult.skipped
            });

            return {
                success: true,
                message: '遷移完成',
                summary
            };
        } catch (error) {
            console.error('Migration error:', error);
            return {
                success: false,
                message: `遷移失敗: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Clear localStorage after successful migration
     * @param {boolean} confirm - Confirmation flag
     */
    clearLocalStorage(confirm = false) {
        if (!confirm) {
            throw new Error('必須明確確認才能清除 localStorage');
        }

        localStorage.removeItem(this.storageKey);
    }
}

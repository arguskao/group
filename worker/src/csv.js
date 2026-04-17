/**
 * CSV export utilities
 */

/**
 * Escape CSV field value
 * @param {string} value - The value to escape
 * @returns {string} - The escaped value
 */
function escapeCSVField(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If the value contains comma, quote, or newline, wrap it in quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Escape quotes by doubling them
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Convert response records to CSV format
 * @param {Array<{id: number, name: string, phone: string, region: string, occupation: string, timestamp: string}>} records
 * @returns {string} - CSV formatted string with UTF-8 BOM
 */
export function toCSV(records) {
    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';

    // CSV header
    const header = '編號,姓名,電話,地區,工作性質,提交時間';

    // Convert records to CSV rows
    const rows = records.map(record => {
        return [
            record.id,
            escapeCSVField(record.name),
            escapeCSVField(record.phone),
            escapeCSVField(record.region),
            escapeCSVField(record.occupation),
            escapeCSVField(record.timestamp)
        ].join(',');
    });

    // Combine header and rows
    return BOM + [header, ...rows].join('\n');
}

/**
 * Generate CSV filename with timestamp
 * @returns {string} - Filename in format: survey_responses_YYYYMMDD_HHMMSS.csv
 */
export function generateFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `survey_responses_${year}${month}${day}_${hours}${minutes}${seconds}.csv`;
}

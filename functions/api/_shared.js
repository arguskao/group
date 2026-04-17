/**
 * Shared utilities for API functions
 */

// Taiwan regions (22 counties and cities)
export const TAIWAN_REGIONS = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
    '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣'
];

// Occupation types
export const OCCUPATION_TYPES = ['藥師', '藥助', '其他'];

/**
 * Validator for API request data
 */
export class Validator {
    static validateName(name) {
        const errors = [];
        if (!name || name.trim() === '') {
            errors.push({ field: 'name', message: '此欄位為必填' });
        } else if (name.length > 50) {
            errors.push({ field: 'name', message: '姓名不能超過 50 個字元' });
        } else if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(name)) {
            errors.push({ field: 'name', message: '姓名只能包含中文、英文字母和空格' });
        }
        return { isValid: errors.length === 0, errors };
    }

    static validatePhone(phone) {
        const errors = [];
        if (!phone || phone.trim() === '') {
            errors.push({ field: 'phone', message: '此欄位為必填' });
        } else {
            const digitsOnly = phone.replace(/[\s-]/g, '');
            if (!/^[\d\s-]+$/.test(phone)) {
                errors.push({ field: 'phone', message: '電話號碼只能包含數字、空格和連字號' });
            } else if (digitsOnly.length < 8 || digitsOnly.length > 15) {
                errors.push({ field: 'phone', message: '請輸入有效的電話號碼（8-15 位數字）' });
            }
        }
        return { isValid: errors.length === 0, errors };
    }

    static validateRegion(region) {
        const errors = [];
        if (!region || region === '') {
            errors.push({ field: 'region', message: '請選擇一個選項' });
        } else if (!TAIWAN_REGIONS.includes(region)) {
            errors.push({ field: 'region', message: '請選擇有效的地區' });
        }
        return { isValid: errors.length === 0, errors };
    }

    static validateOccupation(occupation) {
        const errors = [];
        if (!occupation || occupation === '') {
            errors.push({ field: 'occupation', message: '請選擇一個選項' });
        } else if (!OCCUPATION_TYPES.includes(occupation)) {
            errors.push({ field: 'occupation', message: '請選擇有效的職業類型' });
        }
        return { isValid: errors.length === 0, errors };
    }

    static validateTimestamp(timestamp) {
        const errors = [];
        if (!timestamp || timestamp.trim() === '') {
            errors.push({ field: 'timestamp', message: '時間戳記為必填' });
        } else {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                errors.push({ field: 'timestamp', message: '無效的時間戳記格式' });
            }
        }
        return { isValid: errors.length === 0, errors };
    }

    static validateResponseRecord(data) {
        const allErrors = [];
        allErrors.push(...this.validateName(data.name).errors);
        allErrors.push(...this.validatePhone(data.phone).errors);
        allErrors.push(...this.validateRegion(data.region).errors);
        allErrors.push(...this.validateOccupation(data.occupation).errors);
        allErrors.push(...this.validateTimestamp(data.timestamp).errors);
        return { isValid: allErrors.length === 0, errors: allErrors };
    }
}

/**
 * Database operations
 */
export async function insertResponse(db, data) {
    try {
        const result = await db.prepare(
            'INSERT INTO responses (name, phone, region, occupation, timestamp) VALUES (?, ?, ?, ?, ?)'
        )
            .bind(data.name, data.phone, data.region, data.occupation, data.timestamp)
            .run();

        if (result.success) {
            return { success: true, id: result.meta.last_row_id };
        } else {
            return { success: false, error: 'Failed to insert record' };
        }
    } catch (error) {
        console.error('Database insert error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllResponses(db) {
    try {
        const result = await db.prepare(
            'SELECT id, name, phone, region, occupation, timestamp, created_at FROM responses ORDER BY timestamp DESC'
        ).all();

        return { success: true, data: result.results, count: result.results.length };
    } catch (error) {
        console.error('Database query error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * CSV utilities
 */
function escapeCSVField(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

export function toCSV(records) {
    const BOM = '\uFEFF';
    const header = '編號,姓名,電話,地區,工作性質,提交時間';
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
    return BOM + [header, ...rows].join('\n');
}

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

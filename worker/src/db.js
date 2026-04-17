/**
 * Database operations for D1
 */

/**
 * Insert a response record into the database
 * @param {D1Database} db - The D1 database instance
 * @param {{name: string, phone: string, region: string, occupation: string, timestamp: string}} data
 * @returns {Promise<{success: boolean, id?: number, error?: string}>}
 */
export async function insertResponse(db, data) {
    try {
        const result = await db.prepare(
            'INSERT INTO responses (name, phone, region, occupation, timestamp) VALUES (?, ?, ?, ?, ?)'
        )
            .bind(data.name, data.phone, data.region, data.occupation, data.timestamp)
            .run();

        if (result.success) {
            return {
                success: true,
                id: result.meta.last_row_id
            };
        } else {
            return {
                success: false,
                error: 'Failed to insert record'
            };
        }
    } catch (error) {
        console.error('Database insert error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get all response records from the database
 * @param {D1Database} db - The D1 database instance
 * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
 */
export async function getAllResponses(db) {
    try {
        const result = await db.prepare(
            'SELECT id, name, phone, region, occupation, timestamp, created_at FROM responses ORDER BY timestamp DESC'
        ).all();

        return {
            success: true,
            data: result.results,
            count: result.results.length
        };
    } catch (error) {
        console.error('Database query error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if a duplicate record exists (same phone and timestamp)
 * @param {D1Database} db - The D1 database instance
 * @param {string} phone - The phone number
 * @param {string} timestamp - The timestamp
 * @returns {Promise<{exists: boolean, error?: string}>}
 */
export async function checkDuplicate(db, phone, timestamp) {
    try {
        const result = await db.prepare(
            'SELECT COUNT(*) as count FROM responses WHERE phone = ? AND timestamp = ?'
        )
            .bind(phone, timestamp)
            .first();

        return {
            exists: result.count > 0
        };
    } catch (error) {
        console.error('Database duplicate check error:', error);
        return {
            exists: false,
            error: error.message
        };
    }
}

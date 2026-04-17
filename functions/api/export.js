/**
 * API endpoint: /api/export
 * Handles CSV export with password authentication
 */

import { getAllResponses, toCSV, generateFilename } from './_shared.js';

export async function onRequestGet(context) {
    try {
        // Check authentication
        const url = new URL(context.request.url);
        const password = url.searchParams.get('password');
        const adminPassword = context.env.ADMIN_PASSWORD || '3939889';

        if (!password || password !== adminPassword) {
            console.warn('Unauthorized CSV export attempt');
            return Response.json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid password'
            }, { status: 401 });
        }

        console.log('Authorized CSV export');

        // Get all records
        const result = await getAllResponses(context.env.DB);

        if (!result.success) {
            return Response.json({
                success: false,
                error: 'Database error',
                message: result.error
            }, { status: 500 });
        }

        // Convert to CSV
        const csv = toCSV(result.data);
        const filename = generateFilename();

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('GET /api/export error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}

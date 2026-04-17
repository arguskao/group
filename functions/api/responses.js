/**
 * API endpoint: /api/responses
 * Handles GET (list all) and POST (create new) requests
 */

import { Validator, insertResponse, getAllResponses } from './_shared.js';

export async function onRequestGet(context) {
    try {
        const result = await getAllResponses(context.env.DB);

        if (result.success) {
            return Response.json({
                success: true,
                data: result.data,
                count: result.count
            });
        } else {
            return Response.json({
                success: false,
                error: 'Database error',
                message: result.error
            }, { status: 500 });
        }
    } catch (error) {
        console.error('GET /api/responses error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    try {
        const data = await context.request.json();

        // Validate input
        const validation = Validator.validateResponseRecord(data);
        if (!validation.isValid) {
            return Response.json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            }, { status: 400 });
        }

        // Insert into database
        const result = await insertResponse(context.env.DB, data);

        if (result.success) {
            return Response.json({
                success: true,
                id: result.id
            }, { status: 201 });
        } else {
            return Response.json({
                success: false,
                error: 'Database error',
                message: result.error
            }, { status: 500 });
        }
    } catch (error) {
        console.error('POST /api/responses error:', error);
        return Response.json({
            success: false,
            error: 'Invalid request body'
        }, { status: 400 });
    }
}

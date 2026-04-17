/**
 * Cloudflare Worker API for Survey System
 * Provides RESTful endpoints for D1 database operations
 */

import { Validator } from './validator.js';
import { insertResponse, getAllResponses } from './db.js';
import { toCSV, generateFilename } from './csv.js';

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env?.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Route: POST /api/responses - Create new response record
      if (path === '/api/responses' && request.method === 'POST') {
        try {
          const data = await request.json();

          // Validate input
          const validation = Validator.validateResponseRecord(data);
          if (!validation.isValid) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Validation failed',
              details: validation.errors
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Insert into database
          const result = await insertResponse(env?.DB, data);

          if (result.success) {
            return new Response(JSON.stringify({
              success: true,
              id: result.id
            }), {
              status: 201,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: 'Database error',
              message: result.error
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (error) {
          console.error('POST /api/responses error:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid request body'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Route: GET /api/responses - Get all response records
      if (path === '/api/responses' && request.method === 'GET') {
        const result = await getAllResponses(env.DB);

        if (result.success) {
          return new Response(JSON.stringify({
            success: true,
            data: result.data,
            count: result.count
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Database error',
            message: result.error
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Route: GET /api/export - Export CSV with password authentication
      if (path === '/api/export' && request.method === 'GET') {
        // Check authentication
        const password = url.searchParams.get('password');
        const adminPassword = env?.ADMIN_PASSWORD;

        if (!password || password !== adminPassword) {
          // Log unauthorized access attempt
          console.warn('Unauthorized CSV export attempt');

          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid password'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log authorized access
        console.log('Authorized CSV export');

        // Get all records
        const result = await getAllResponses(env.DB);

        if (!result.success) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Database error',
            message: result.error
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Convert to CSV
        const csv = toCSV(result.data);
        const filename = generateFilename();

        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

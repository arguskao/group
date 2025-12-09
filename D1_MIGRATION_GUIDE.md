# D1 Database Migration Guide

This guide explains the migration from localStorage to Cloudflare D1 database for the Survey System.

## Architecture Overview

```
┌─────────────────┐
│  Browser Client │
│   (Vite App)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│ Cloudflare Pages│
│   (Static Host) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Cloudflare Worker│
│   (API Layer)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  D1 Database    │
│   (SQLite)      │
└─────────────────┘
```

## Project Structure

```
.
├── src/                    # Frontend source code
│   ├── main.js            # Application entry point
│   ├── SurveyForm.js      # Survey form component
│   ├── StatisticsPanel.js # Statistics display
│   ├── CSVManager.js      # CSV export functionality
│   ├── Validator.js       # Input validation
│   └── D1ApiClient.js     # API client (to be created)
│
├── worker/                 # Cloudflare Worker API
│   ├── src/
│   │   └── index.js       # Worker entry point
│   ├── wrangler.toml      # Worker configuration
│   ├── schema.sql         # Database schema
│   ├── package.json       # Worker dependencies
│   └── README.md          # Worker documentation
│
└── .kiro/specs/d1-database-migration/
    ├── requirements.md    # Feature requirements
    ├── design.md          # Technical design
    └── tasks.md           # Implementation tasks
```

## Setup Instructions

### 1. Worker Setup

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set ADMIN_PASSWORD
```

### 2. Local Development

Initialize local database:
```bash
cd worker
npm run db:init:local
npm run dev
```

The API will be available at `http://localhost:8787`

### 3. Frontend Development

In a separate terminal:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Production Deployment

#### Create D1 Database

```bash
cd worker
npm run db:create
```

Copy the `database_id` from the output and update `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "survey-db"
database_id = "your-database-id-here"  # Replace this
```

#### Initialize Production Database

```bash
npm run db:init
```

#### Deploy Worker

```bash
npm run deploy
```

#### Deploy Frontend

The frontend can be deployed to Cloudflare Pages:

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-worker.workers.dev`

## Database Schema

The D1 database uses the following schema:

```sql
CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  region TEXT NOT NULL,
  occupation TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_timestamp ON responses(timestamp);
CREATE INDEX idx_phone_timestamp ON responses(phone, timestamp);
CREATE INDEX idx_region ON responses(region);
CREATE INDEX idx_occupation ON responses(occupation);
```

## API Endpoints

### POST /api/responses
Create a new survey response.

### GET /api/responses
Retrieve all survey responses.

### GET /api/export?password=xxx
Export responses as CSV (requires authentication).

See `worker/README.md` for detailed API documentation.

## Migration Process

Once the API is deployed, you can migrate existing localStorage data:

1. The migration tool will be implemented in `src/MigrationTool.js`
2. A UI button will be added for administrators
3. The tool will:
   - Read data from localStorage
   - Validate each record
   - Upload to D1 via API
   - Skip duplicates
   - Provide a summary

## Testing

### Unit Tests
```bash
npm run test:vitest
```

### Property-Based Tests
Property tests use fast-check to verify correctness properties across many random inputs.

### Local API Testing

Test the API locally:
```bash
# POST a response
curl -X POST http://localhost:8787/api/responses \
  -H "Content-Type: application/json" \
  -d '{"name":"測試","phone":"0912345678","region":"台北市","occupation":"藥師","timestamp":"2024-01-01T12:00:00.000Z"}'

# GET all responses
curl http://localhost:8787/api/responses

# Export CSV
curl "http://localhost:8787/api/export?password=your-password"
```

## Security Considerations

1. **Authentication**: CSV export requires password authentication
2. **CORS**: Configure `ALLOWED_ORIGINS` in production
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Secrets**: Use Wrangler secrets for sensitive data:
   ```bash
   wrangler secret put ADMIN_PASSWORD
   ```

## Troubleshooting

### Worker not starting
- Check that wrangler is installed: `npm install -g wrangler`
- Verify wrangler.toml configuration
- Check for syntax errors in worker/src/index.js

### Database errors
- Ensure database is initialized: `npm run db:init:local`
- Check database_id in wrangler.toml
- Verify schema.sql syntax

### CORS errors
- Update ALLOWED_ORIGINS in wrangler.toml
- Check that frontend is making requests to correct API URL

### Frontend not connecting to API
- Verify API URL configuration
- Check browser console for errors
- Ensure worker is running (local) or deployed (production)

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

# Setup Checklist

Use this checklist to verify your Cloudflare Worker and D1 database setup.

## Prerequisites

- [ ] Node.js 18+ or Bun installed
- [ ] Cloudflare account created
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Logged into Wrangler (`wrangler login`)

## Local Development Setup

- [ ] Navigated to worker directory (`cd worker`)
- [ ] Installed dependencies (`npm install`)
- [ ] Copied `.dev.vars.example` to `.dev.vars`
- [ ] Set `ADMIN_PASSWORD` in `.dev.vars`
- [ ] Initialized local database (`npm run db:init:local`)
- [ ] Started dev server (`npm run dev`)
- [ ] Verified API responds at `http://localhost:8787`

## File Structure Verification

- [ ] `worker/wrangler.toml` exists and is configured
- [ ] `worker/schema.sql` contains database schema
- [ ] `worker/src/index.js` contains worker code
- [ ] `worker/package.json` contains scripts
- [ ] `worker/.dev.vars` exists (not committed to git)
- [ ] `worker/.gitignore` excludes sensitive files

## Database Schema Verification

Run this command to verify schema:
```bash
wrangler d1 execute survey-db --local --command="SELECT sql FROM sqlite_master WHERE type='table'"
```

Expected output should show:
- [ ] `responses` table with columns: id, name, phone, region, occupation, timestamp, created_at
- [ ] Indexes: idx_timestamp, idx_phone_timestamp, idx_region, idx_occupation

## API Endpoint Testing

Test each endpoint locally:

### POST /api/responses
```bash
curl -X POST http://localhost:8787/api/responses \
  -H "Content-Type: application/json" \
  -d '{"name":"測試","phone":"0912345678","region":"台北市","occupation":"藥師","timestamp":"2024-01-01T12:00:00.000Z"}'
```
- [ ] Returns 501 (Not implemented yet) - this is expected for now

### GET /api/responses
```bash
curl http://localhost:8787/api/responses
```
- [ ] Returns 501 (Not implemented yet) - this is expected for now

### GET /api/export
```bash
curl "http://localhost:8787/api/export?password=test"
```
- [ ] Returns 501 (Not implemented yet) - this is expected for now

### OPTIONS (CORS Preflight)
```bash
curl -X OPTIONS http://localhost:8787/api/responses -v
```
- [ ] Returns 200 with CORS headers

## Production Setup (Optional)

Only complete if deploying to production:

- [ ] Created production database (`npm run db:create`)
- [ ] Copied database_id to `wrangler.toml`
- [ ] Updated `database_id` in `[[d1_databases]]` section
- [ ] Initialized production database (`npm run db:init`)
- [ ] Set production secrets (`wrangler secret put ADMIN_PASSWORD`)
- [ ] Updated `ALLOWED_ORIGINS` in `wrangler.toml` for production
- [ ] Deployed worker (`npm run deploy`)
- [ ] Verified worker URL is accessible
- [ ] Tested production API endpoints

## Configuration Verification

### wrangler.toml
- [ ] `name` is set to "survey-api"
- [ ] `main` points to "src/index.js"
- [ ] `compatibility_date` is set
- [ ] `[[d1_databases]]` binding is configured
- [ ] `database_name` is "survey-db"
- [ ] `database_id` is set (for production)

### .dev.vars
- [ ] `ADMIN_PASSWORD` is set
- [ ] `ALLOWED_ORIGINS` includes frontend URL

## Documentation Review

- [ ] Read `worker/README.md`
- [ ] Read `worker/DEVELOPMENT.md`
- [ ] Read `D1_MIGRATION_GUIDE.md` (in project root)

## Next Steps

After completing this checklist:

1. Proceed to Task 2: Implement D1 database schema and initialization
2. Proceed to Task 3: Implement Cloudflare Worker API endpoints
3. Continue with remaining implementation tasks

## Troubleshooting

If any checklist item fails, refer to:
- `worker/README.md` - General setup and usage
- `worker/DEVELOPMENT.md` - Development workflow and debugging
- `D1_MIGRATION_GUIDE.md` - Architecture and migration guide

Common issues:
- **Wrangler not found**: Install globally with `npm install -g wrangler`
- **Database not found**: Run `npm run db:init:local`
- **Port already in use**: Stop other processes on port 8787
- **CORS errors**: Check `ALLOWED_ORIGINS` configuration

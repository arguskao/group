# Development Guide

## Quick Start

### First Time Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set ADMIN_PASSWORD
```

3. Initialize local database:
```bash
npm run db:init:local
```

4. Start development server:
```bash
npm run dev
```

## Development Workflow

### Local Development

The worker runs locally using Miniflare (included with Wrangler), which provides:
- Local D1 database (SQLite)
- Hot reloading
- Local environment variables from `.dev.vars`

```bash
npm run dev
```

Access the API at: `http://localhost:8787`

### Testing API Endpoints

#### Create Response
```bash
curl -X POST http://localhost:8787/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試用戶",
    "phone": "0912345678",
    "region": "台北市",
    "occupation": "藥師",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }'
```

#### Get All Responses
```bash
curl http://localhost:8787/api/responses
```

#### Export CSV
```bash
curl "http://localhost:8787/api/export?password=your-password" -o export.csv
```

### Database Management

#### Execute SQL Queries (Local)
```bash
wrangler d1 execute survey-db --local --command="SELECT * FROM responses"
```

#### View Database Schema (Local)
```bash
wrangler d1 execute survey-db --local --command="SELECT sql FROM sqlite_master WHERE type='table'"
```

#### Reset Local Database
```bash
wrangler d1 execute survey-db --local --command="DROP TABLE IF EXISTS responses"
npm run db:init:local
```

## Production Deployment

### First Time Production Setup

1. Create production database:
```bash
npm run db:create
```

2. Update `wrangler.toml` with the database ID from step 1

3. Initialize production database:
```bash
npm run db:init
```

4. Set production secrets:
```bash
wrangler secret put ADMIN_PASSWORD
# Enter your secure password when prompted
```

5. Deploy:
```bash
npm run deploy
```

### Subsequent Deployments

```bash
npm run deploy
```

### Production Database Management

#### Execute SQL Queries (Production)
```bash
wrangler d1 execute survey-db --command="SELECT COUNT(*) FROM responses"
```

#### Backup Production Database
```bash
wrangler d1 export survey-db --output=backup.sql
```

## Environment Configuration

### Local (.dev.vars)
```
ADMIN_PASSWORD=your-local-password
ALLOWED_ORIGINS=http://localhost:3000
```

### Production (Secrets)
```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put ALLOWED_ORIGINS
```

## Debugging

### View Worker Logs (Local)
Logs appear in the terminal where `npm run dev` is running.

### View Worker Logs (Production)
```bash
wrangler tail
```

### Common Issues

#### "Database not found"
- Ensure database is initialized: `npm run db:init:local`
- Check database_id in wrangler.toml

#### "CORS error"
- Verify ALLOWED_ORIGINS includes your frontend URL
- Check CORS headers in worker response

#### "Authentication failed"
- Verify ADMIN_PASSWORD is set in .dev.vars (local)
- Verify secret is set: `wrangler secret list` (production)

## Testing

### Manual Testing Checklist

- [ ] POST /api/responses with valid data
- [ ] POST /api/responses with invalid data
- [ ] GET /api/responses returns all records
- [ ] GET /api/export with correct password
- [ ] GET /api/export with wrong password
- [ ] CORS headers present in responses
- [ ] Error handling for database errors

### Automated Testing

Unit and property-based tests will be added in subsequent tasks.

## Performance Monitoring

### Check Worker Performance
```bash
wrangler tail --format=pretty
```

### Database Query Performance

Add timing to queries:
```javascript
const start = Date.now();
const result = await env.DB.prepare("SELECT * FROM responses").all();
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

## Best Practices

1. **Always test locally first** before deploying to production
2. **Use meaningful commit messages** when deploying
3. **Monitor logs** after deployment for errors
4. **Keep secrets secure** - never commit .dev.vars
5. **Test CORS** with actual frontend during development
6. **Backup database** before schema changes

## Resources

- [Wrangler Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [D1 Client API](https://developers.cloudflare.com/d1/platform/client-api/)
- [Workers Runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)

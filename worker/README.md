# Survey API Worker

Cloudflare Worker API for the Survey System, providing RESTful endpoints for D1 database operations.

## Setup

### Prerequisites

- Node.js 18+ or Bun
- Cloudflare account
- Wrangler CLI

### Installation

1. Install dependencies:
```bash
cd worker
npm install
# or
bun install
```

2. Create environment variables:
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set your ADMIN_PASSWORD
```

### Database Setup

#### Local Development

1. Initialize local D1 database:
```bash
npm run db:init:local
```

2. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

#### Production

1. Create D1 database:
```bash
npm run db:create
```

2. Copy the database ID from the output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "survey-db"
database_id = "your-database-id-here"
```

3. Initialize production database:
```bash
npm run db:init
```

4. Deploy worker:
```bash
npm run deploy
```

## API Endpoints

### POST /api/responses
Create a new survey response.

**Request Body:**
```json
{
  "name": "張三",
  "phone": "0912345678",
  "region": "台北市",
  "occupation": "藥師",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "id": 123
}
```

### GET /api/responses
Retrieve all survey responses.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 100
}
```

### GET /api/export?password=xxx
Export responses as CSV (requires authentication).

**Query Parameters:**
- `password`: Admin password

**Response:**
- CSV file download

## Development

### Testing Locally

Use Miniflare (included with Wrangler) for local testing:

```bash
npm run dev
```

This will:
- Start a local server on port 8787
- Use a local SQLite database
- Enable hot reloading

### Database Queries

Execute SQL queries locally:
```bash
wrangler d1 execute survey-db --local --command="SELECT * FROM responses LIMIT 10"
```

Execute SQL queries in production:
```bash
wrangler d1 execute survey-db --command="SELECT * FROM responses LIMIT 10"
```

## Configuration

### wrangler.toml

The main configuration file for the Worker. Key settings:

- `name`: Worker name
- `main`: Entry point file
- `compatibility_date`: Cloudflare Workers compatibility date
- `d1_databases`: D1 database bindings
- `vars`: Environment variables

### Environment Variables

- `ADMIN_PASSWORD`: Password for CSV export authentication
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)

## Deployment

Deploy to Cloudflare:

```bash
npm run deploy
```

The worker will be deployed to `https://survey-api.your-subdomain.workers.dev`

## Troubleshooting

### Database not found
Make sure you've created the database and updated the `database_id` in `wrangler.toml`.

### CORS errors
Check that `ALLOWED_ORIGINS` includes your frontend domain.

### Authentication errors
Verify that `ADMIN_PASSWORD` is set in `.dev.vars` (local) or as a secret (production):
```bash
wrangler secret put ADMIN_PASSWORD
```

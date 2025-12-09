#!/bin/bash

# Survey API Worker Setup Script
# This script helps set up the Cloudflare Worker and D1 database

set -e

echo "🚀 Survey API Worker Setup"
echo "=========================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if in worker directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: Please run this script from the worker directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .dev.vars if it doesn't exist
if [ ! -f ".dev.vars" ]; then
    echo "📝 Creating .dev.vars file..."
    cp .dev.vars.example .dev.vars
    echo "⚠️  Please edit .dev.vars and set your ADMIN_PASSWORD"
fi

# Ask if user wants to set up local database
echo ""
read -p "Do you want to initialize the local D1 database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Initializing local D1 database..."
    npm run db:init:local
    echo "✅ Local database initialized"
fi

# Ask if user wants to create production database
echo ""
read -p "Do you want to create a production D1 database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Creating production D1 database..."
    npm run db:create
    echo ""
    echo "⚠️  IMPORTANT: Copy the database_id from above and update wrangler.toml"
    echo ""
    read -p "Press enter after updating wrangler.toml..."
    
    echo "🗄️  Initializing production database..."
    npm run db:init
    echo "✅ Production database initialized"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .dev.vars and set your ADMIN_PASSWORD"
echo "2. Run 'npm run dev' to start local development"
echo "3. Run 'npm run deploy' to deploy to production"
echo ""

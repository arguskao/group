#!/bin/bash

# D1 Database Deployment Script
# This script helps deploy the D1 database schema to production

set -e

echo "🚀 D1 Database Deployment Script"
echo "================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler is not installed"
    echo "Please install wrangler: npm install -g wrangler"
    exit 1
fi

# Function to create database
create_database() {
    local env=$1
    local db_name=$2
    
    echo "📦 Creating database: $db_name"
    wrangler d1 create "$db_name"
    echo ""
}

# Function to execute schema
execute_schema() {
    local db_name=$1
    local remote_flag=$2
    
    echo "📝 Executing schema on $db_name..."
    if [ "$remote_flag" = "remote" ]; then
        wrangler d1 execute "$db_name" --remote --file=./schema.sql --yes
    else
        wrangler d1 execute "$db_name" --file=./schema.sql
    fi
    echo "✅ Schema executed successfully"
    echo ""
}

# Function to verify database
verify_database() {
    local db_name=$1
    local remote_flag=$2
    
    echo "🔍 Verifying database: $db_name"
    if [ "$remote_flag" = "remote" ]; then
        wrangler d1 execute "$db_name" --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
    else
        wrangler d1 execute "$db_name" --command="SELECT name FROM sqlite_master WHERE type='table';"
    fi
    echo ""
}

# Main deployment flow
echo "Select deployment target:"
echo "1) Development (local)"
echo "2) Production (remote)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "🔧 Deploying to DEVELOPMENT"
        echo "============================"
        execute_schema "survey-db" "local"
        verify_database "survey-db" "local"
        echo "✅ Development database ready!"
        ;;
    2)
        echo ""
        echo "🌐 Deploying to PRODUCTION"
        echo "==========================="
        read -p "⚠️  This will modify the production database. Continue? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            execute_schema "survey-db" "remote"
            verify_database "survey-db" "remote"
            echo "✅ Production database ready!"
        else
            echo "❌ Deployment cancelled"
            exit 0
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with the database ID if needed"
echo "2. Set environment variables (ADMIN_PASSWORD, ALLOWED_ORIGINS)"
echo "3. Deploy worker: wrangler deploy"

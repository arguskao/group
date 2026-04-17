#!/bin/bash

# Cloudflare Pages 前端部署腳本

set -e

echo "🚀 開始部署前端到 Cloudflare Pages"
echo ""

# 檢查是否有 .env 檔案
if [ ! -f .env ]; then
    echo "⚠️  找不到 .env 檔案"
    echo "📝 從 .env.example 建立 .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  請編輯 .env 檔案，設定正確的 VITE_API_URL"
    echo "   例如: VITE_API_URL=https://survey-api.your-account.workers.dev"
    echo ""
    read -p "按 Enter 繼續（確認已設定好 .env）..."
fi

# 顯示當前設定
echo "📋 當前設定："
cat .env
echo ""

# 安裝依賴
echo "📦 安裝依賴..."
bun install

# 建置專案
echo "🔨 建置專案..."
bun run build

echo ""
echo "✅ 建置完成！dist 資料夾已準備好"
echo ""
echo "📤 接下來的部署選項："
echo ""
echo "選項 1: 使用 Wrangler CLI 直接部署"
echo "----------------------------------------"
echo "wrangler pages deploy dist --project-name=survey-form"
echo ""
echo "選項 2: 使用 Git + Cloudflare Dashboard"
echo "----------------------------------------"
echo "1. git add ."
echo "2. git commit -m 'Ready for deployment'"
echo "3. git push"
echo "4. 前往 Cloudflare Dashboard → Pages → Connect to Git"
echo ""
echo "選項 3: 手動上傳"
echo "----------------------------------------"
echo "1. 前往 Cloudflare Dashboard → Pages → Upload assets"
echo "2. 上傳 dist 資料夾"
echo ""

read -p "要使用 Wrangler CLI 直接部署嗎？(y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 檢查是否已安裝 wrangler
    if ! command -v wrangler &> /dev/null; then
        echo "❌ 找不到 wrangler CLI"
        echo "📦 安裝 wrangler..."
        npm install -g wrangler
    fi
    
    # 檢查是否已登入
    echo "🔐 檢查 Cloudflare 登入狀態..."
    if ! wrangler whoami &> /dev/null; then
        echo "📝 請登入 Cloudflare..."
        wrangler login
    fi
    
    # 詢問專案名稱
    read -p "輸入 Pages 專案名稱 (預設: survey-form): " PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-survey-form}
    
    echo ""
    echo "🚀 部署到 Cloudflare Pages..."
    wrangler pages deploy dist --project-name="$PROJECT_NAME"
    
    echo ""
    echo "✅ 部署完成！"
    echo ""
    echo "⚠️  記得更新 Worker 的 CORS 設定："
    echo "   1. cd worker"
    echo "   2. 編輯 wrangler.toml 的 ALLOWED_ORIGINS"
    echo "   3. wrangler deploy --env production"
else
    echo ""
    echo "👍 好的，請手動選擇上述其他部署方式"
fi

echo ""
echo "📚 詳細說明請參考 DEPLOYMENT.md"

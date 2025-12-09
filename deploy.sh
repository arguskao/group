#!/bin/bash

# 問卷調查系統 - 部署腳本

echo "🚀 開始部署流程..."

# 1. 執行測試
echo ""
echo "📋 步驟 1/4: 執行測試..."
bun test:vitest
if [ $? -ne 0 ]; then
    echo "❌ 測試失敗！請修復錯誤後再部署。"
    exit 1
fi
echo "✅ 所有測試通過"

# 2. 建置專案
echo ""
echo "🔨 步驟 2/4: 建置專案..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 建置失敗！"
    exit 1
fi
echo "✅ 建置完成"

# 3. 初始化 Git（如果尚未初始化）
echo ""
echo "📦 步驟 3/4: 準備 Git 儲存庫..."
if [ ! -d .git ]; then
    git init
    echo "✅ Git 儲存庫已初始化"
else
    echo "✅ Git 儲存庫已存在"
fi

# 4. 提交變更
echo ""
echo "💾 步驟 4/4: 提交變更..."
git add .
git commit -m "準備部署: $(date '+%Y-%m-%d %H:%M:%S')"
echo "✅ 變更已提交"

echo ""
echo "🎉 部署準備完成！"
echo ""
echo "📝 接下來的步驟："
echo "1. 如果尚未設定遠端儲存庫，請執行："
echo "   git remote add origin <your-repo-url>"
echo "   git push -u origin main"
echo ""
echo "2. 前往 Cloudflare Pages Dashboard："
echo "   https://dash.cloudflare.com/"
echo ""
echo "3. 建立新專案並連接您的 Git 儲存庫"
echo ""
echo "4. 設定建置配置："
echo "   - 建置指令: npm run build"
echo "   - 輸出目錄: dist"
echo ""
echo "5. 點擊部署並等待完成"
echo ""
echo "📌 管理員密碼: 3939889"

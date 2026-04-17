# 部署指南 - D1 資料庫版本

本文件說明如何將問卷調查系統（D1 資料庫版本）部署到 Cloudflare。

## 📋 前置需求

- Node.js 18+ 和 npm/bun
- Cloudflare 帳號
- Wrangler CLI: `npm install -g wrangler`
- Git（用於版本控制）

## 🚀 完整部署流程

### 步驟 1: 部署 Cloudflare Worker 和 D1 資料庫

#### 1.1 登入 Cloudflare

```bash
cd worker
wrangler login
```

#### 1.2 建立 D1 資料庫

```bash
# 建立生產環境資料庫
wrangler d1 create survey-db-prod

# 記下輸出的 database_id
```

#### 1.3 更新 wrangler.toml

將生產環境的 database_id 更新到 `worker/wrangler.toml`:

```toml
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "survey-db-prod"
database_id = "your-production-database-id-here"  # 替換為實際 ID

[env.production.vars]
ALLOWED_ORIGINS = "https://your-domain.pages.dev"  # 替換為實際域名
```

#### 1.4 初始化資料庫 Schema

```bash
# 使用部署腳本（推薦）
chmod +x deploy-db.sh
./deploy-db.sh
# 選擇選項 2 (Production)

# 或手動執行
wrangler d1 execute survey-db-prod --remote --file=./schema.sql --yes
```

#### 1.5 設定管理員密碼

```bash
# 設定 ADMIN_PASSWORD（用於 CSV 下載）
wrangler secret put ADMIN_PASSWORD --env production
# 輸入密碼（例如：3939889）
```

#### 1.6 部署 Worker

```bash
# 部署到生產環境
wrangler deploy --env production

# 記下 Worker URL，例如：
# https://survey-api.your-account.workers.dev
```

### 步驟 2: 部署前端到 Cloudflare Pages

#### 2.1 建立 .env 檔案

```bash
cd ..  # 回到專案根目錄
cp .env.example .env
```

編輯 `.env` 設定 Worker URL:

```env
VITE_API_URL=https://survey-api.your-account.workers.dev
```

#### 2.2 建置前端

```bash
npm install
npm run build
```

#### 2.3 部署到 Cloudflare Pages

**選項 A: 使用 Git（推薦）**

1. 初始化 Git 儲存庫（如果還沒有）:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. 推送到 GitHub/GitLab:
   ```bash
   git remote add origin https://github.com/your-username/your-repo.git
   git branch -M main
   git push -u origin main
   ```

3. 在 Cloudflare Dashboard:
   - 前往 **Workers & Pages** → **Create application** → **Pages**
   - 選擇 **Connect to Git**
   - 選擇你的儲存庫
   - 建置設定:
     - Build command: `npm run build`
     - Build output directory: `dist`
   - 環境變數:
     - `VITE_API_URL`: `https://survey-api.your-account.workers.dev`
   - 點擊 **Save and Deploy**

**選項 B: 直接上傳**

1. 在 Cloudflare Dashboard:
   - 前往 **Workers & Pages** → **Create application** → **Pages**
   - 選擇 **Upload assets**
   - 上傳 `dist` 資料夾
   - 點擊 **Deploy site**

2. 部署後設定環境變數:
   - 前往 Pages 專案設定
   - **Settings** → **Environment variables**
   - 添加 `VITE_API_URL`

#### 2.4 更新 CORS 設定

部署完成後，更新 Worker 的 ALLOWED_ORIGINS:

```bash
cd worker

# 編輯 wrangler.toml
[env.production.vars]
ALLOWED_ORIGINS = "https://your-actual-pages-domain.pages.dev"

# 重新部署 Worker
wrangler deploy --env production
```

### 步驟 3: 驗證部署

1. ✅ 訪問前端 URL
2. ✅ 提交測試表單
3. ✅ 檢查統計資料是否正確顯示
4. ✅ 測試 CSV 下載功能（密碼：3939889 或你設定的密碼）
5. ✅ 檢查瀏覽器控制台無錯誤

## 🔧 本地開發

### Worker 開發

```bash
cd worker

# 啟動本地開發伺服器
wrangler dev

# Worker 在 http://localhost:8787
```

### 前端開發

```bash
# 在專案根目錄

# 設定 .env
echo "VITE_API_URL=http://localhost:8787" > .env

# 啟動開發伺服器
npm run dev

# 前端在 http://localhost:5173
```

## 📊 環境配置總覽

| 環境 | Worker URL | Frontend URL | Database |
|------|-----------|--------------|----------|
| 開發 | http://localhost:8787 | http://localhost:5173 | 本地 D1 |
| 生產 | https://survey-api.*.workers.dev | https://*.pages.dev | 遠端 D1 |

## 🔐 安全建議

1. **CORS 設定**
   - 開發環境可使用 `*`
   - 生產環境必須設定具體域名

2. **密碼管理**
   - 使用 `wrangler secret` 設定密碼
   - 不要在程式碼中硬編碼密碼
   - 定期更換管理員密碼

3. **資料備份**
   - 定期使用 CSV 匯出功能備份資料
   - 考慮設定自動備份腳本

## 🐛 故障排除

### Worker 無法連接資料庫

```bash
# 檢查 database_id 是否正確
wrangler d1 list

# 檢查 Worker logs
wrangler tail --env production
```

### CORS 錯誤

1. 確認 `ALLOWED_ORIGINS` 包含前端域名
2. 確認前端的 `VITE_API_URL` 正確
3. 檢查瀏覽器控制台的具體錯誤訊息

### 前端無法載入資料

1. 檢查 Worker 是否正常運行
2. 確認環境變數 `VITE_API_URL` 正確
3. 檢查網路請求（開發者工具 → Network）

### CSV 下載失敗

1. 確認已設定 `ADMIN_PASSWORD`
2. 確認密碼正確
3. 檢查 Worker logs 查看錯誤

## 💰 成本估算

Cloudflare 免費方案限制：

- **Workers**: 100,000 requests/day
- **D1**: 5 GB storage, 5 million reads/day, 100,000 writes/day
- **Pages**: Unlimited requests

對於小型問卷系統，免費方案通常足夠使用。

## 📚 相關資源

- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [D1 資料庫文件](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文件](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文件](https://developers.cloudflare.com/workers/wrangler/)

## 🔄 從 localStorage 版本遷移

如果你有舊的 localStorage 資料需要遷移：

1. 在瀏覽器開發者工具中匯出 localStorage 資料
2. 使用 MigrationTool 進行遷移（詳見 README.md）

## ✅ 部署檢查清單

- [ ] D1 資料庫已建立
- [ ] 資料庫 Schema 已初始化
- [ ] ADMIN_PASSWORD 已設定
- [ ] Worker 已部署
- [ ] 前端環境變數已設定
- [ ] 前端已建置並部署
- [ ] CORS 設定正確
- [ ] 測試表單提交功能
- [ ] 測試統計顯示功能
- [ ] 測試 CSV 下載功能

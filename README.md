# 問卷調查系統 - D1 資料庫版本

一個使用 Cloudflare D1 資料庫的問卷調查應用程式，用於收集受訪者的基本資訊並統計參與人數。

## ✨ 功能特色

- 📝 友善的表單介面供使用者填寫
- 📊 即時顯示統計結果
- 💾 使用 Cloudflare D1 資料庫儲存資料
- 📥 CSV 格式匯出功能
- 🔒 密碼保護的下載功能
- 📱 響應式設計，支援行動裝置
- ♿ 無障礙設計
- 🔄 自動重試和錯誤處理
- 💪 完整的測試覆蓋

## 🏗️ 架構

### 前端
- 純 JavaScript (ES6+)
- CSS3
- Vite (開發伺服器和建置工具)
- D1ApiClient (API 客戶端)

### 後端
- Cloudflare Workers
- Cloudflare D1 (SQLite 資料庫)
- RESTful API

### 測試
- Vitest (單元測試)
- fast-check (屬性基礎測試)
- Bun (JavaScript 運行時)

## 📋 前置需求

- Node.js 18+
- Bun 或 npm
- Cloudflare 帳號
- Wrangler CLI: `npm install -g wrangler`

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 使用 Bun（推薦）
bun install

# 或使用 npm
npm install
```

### 2. 設定環境變數

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 設定 API URL
# VITE_API_URL=http://localhost:8787
```

### 3. 啟動 Worker（後端）

```bash
cd worker

# 登入 Cloudflare
wrangler login

# 初始化本地資料庫
wrangler d1 execute survey-db --file=./schema.sql

# 啟動開發伺服器
wrangler dev
```

### 4. 啟動前端

```bash
# 在另一個終端，回到專案根目錄
npm run dev
```

訪問 http://localhost:5173

## 📚 文件

- [部署指南](./DEPLOYMENT.md) - 完整的部署步驟
- [API 文件](./API_DOCS.md) - API 端點說明
- [環境變數設定](./ENV_SETUP.md) - 環境變數配置
- [故障排除](./TROUBLESHOOTING.md) - 常見問題解決

## 🧪 測試

```bash
# 執行所有測試
bun test

# 使用 Vitest
npm run test:vitest

# 監視模式
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

### 測試覆蓋

- ✅ D1ApiClient 單元測試
- ✅ MigrationTool 單元測試和屬性測試
- ✅ CSVManager 單元測試和屬性測試
- ✅ Validator 單元測試和屬性測試
- ✅ 資料庫操作屬性測試

## 🏗️ 建置

```bash
# 建置前端
npm run build

# 預覽建置結果
npm run preview

# 部署 Worker
cd worker
wrangler deploy --env production
```

## 📁 專案結構

```
.
├── src/                      # 前端原始碼
│   ├── main.js              # 應用程式入口
│   ├── D1ApiClient.js       # API 客戶端
│   ├── MigrationTool.js     # 資料遷移工具
│   ├── CSVManager.js        # CSV 管理
│   ├── Validator.js         # 表單驗證
│   ├── SurveyForm.js        # 表單元件
│   ├── StatisticsPanel.js   # 統計面板
│   └── AuthManager.js       # 認證管理
│
├── worker/                   # Cloudflare Worker
│   ├── src/
│   │   ├── index.js         # Worker 入口
│   │   ├── db.js            # 資料庫操作
│   │   └── csv.js           # CSV 匯出
│   ├── schema.sql           # 資料庫 Schema
│   ├── wrangler.toml        # Worker 配置
│   └── deploy-db.sh         # 資料庫部署腳本
│
├── index.html               # 主 HTML
├── styles.css               # 樣式表
├── DEPLOYMENT.md            # 部署指南
├── API_DOCS.md              # API 文件
├── ENV_SETUP.md             # 環境變數指南
├── TROUBLESHOOTING.md       # 故障排除
└── README.md                # 本文件
```

## 🔐 安全性

### 管理員密碼

CSV 下載需要管理員密碼。設定方式：

```bash
cd worker
wrangler secret put ADMIN_PASSWORD --env production
# 輸入密碼（預設：3939889）
```

### CORS 設定

生產環境必須設定允許的來源：

```toml
# worker/wrangler.toml
[env.production.vars]
ALLOWED_ORIGINS = "https://your-domain.pages.dev"
```

## 🚀 部署

### 部署 Worker 和資料庫

```bash
cd worker

# 建立生產資料庫
wrangler d1 create survey-db-prod

# 更新 wrangler.toml 中的 database_id

# 初始化 Schema
./deploy-db.sh
# 選擇選項 2 (Production)

# 設定密碼
wrangler secret put ADMIN_PASSWORD --env production

# 部署 Worker
wrangler deploy --env production
```

### 部署前端到 Cloudflare Pages

1. 推送到 Git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. 在 Cloudflare Dashboard:
   - Workers & Pages → Create application → Pages
   - Connect to Git
   - 建置設定:
     - Build command: `npm run build`
     - Build output directory: `dist`
   - 環境變數:
     - `VITE_API_URL`: Worker URL

詳細步驟請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔄 從 localStorage 遷移

如果你有舊的 localStorage 資料：

```javascript
import { MigrationTool } from './src/MigrationTool.js';
import { D1ApiClient } from './src/D1ApiClient.js';

const apiClient = new D1ApiClient('your-worker-url');
const migrationTool = new MigrationTool(apiClient);

const result = await migrationTool.migrate();
console.log(result.summary);
```

## 🐛 故障排除

常見問題請參考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 快速檢查

```bash
# 檢查 Worker 狀態
curl https://your-worker-url/api/responses

# 查看 Worker logs
cd worker
wrangler tail --env production

# 測試資料庫
wrangler d1 execute survey-db --remote --command="SELECT COUNT(*) FROM responses;"
```

## 📊 API 端點

- `POST /api/responses` - 建立新回應
- `GET /api/responses` - 取得所有回應
- `GET /api/export?password={password}` - 匯出 CSV

詳細說明請參考 [API_DOCS.md](./API_DOCS.md)

## 💰 成本

Cloudflare 免費方案限制：
- Workers: 100,000 requests/day
- D1: 5 GB storage, 5 million reads/day
- Pages: Unlimited requests

對於小型問卷系統，免費方案通常足夠。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT

## 🔗 相關資源

- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [D1 資料庫文件](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文件](https://developers.cloudflare.com/pages/)
- [Vite 文件](https://vitejs.dev/)
- [Vitest 文件](https://vitest.dev/)

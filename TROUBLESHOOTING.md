# 故障排除指南

本文件提供常見問題的解決方案。

## 目錄

- [部署問題](#部署問題)
- [API 問題](#api-問題)
- [前端問題](#前端問題)
- [資料庫問題](#資料庫問題)
- [測試問題](#測試問題)

## 部署問題

### Worker 部署失敗

**症狀**: `wrangler deploy` 失敗

**可能原因**:
1. 未登入 Cloudflare
2. wrangler.toml 配置錯誤
3. 資料庫 ID 不正確

**解決方案**:

```bash
# 1. 確認登入狀態
wrangler whoami

# 2. 重新登入
wrangler login

# 3. 檢查配置
cat wrangler.toml

# 4. 驗證資料庫
wrangler d1 list
```

### Pages 建置失敗

**症狀**: Cloudflare Pages 建置錯誤

**可能原因**:
1. 建置命令錯誤
2. 環境變數未設定
3. 依賴安裝失敗

**解決方案**:

1. 檢查建置設定:
   - Build command: `npm run build`
   - Build output directory: `dist`

2. 設定環境變數:
   - `VITE_API_URL`: Worker URL

3. 檢查 package.json:
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```

### 資料庫初始化失敗

**症狀**: Schema 執行失敗

**解決方案**:

```bash
# 檢查資料庫是否存在
wrangler d1 list

# 重新執行 schema
wrangler d1 execute survey-db --remote --file=./schema.sql --yes

# 驗證表格
wrangler d1 execute survey-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## API 問題

### CORS 錯誤

**症狀**: 瀏覽器控制台顯示 CORS 錯誤

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**解決方案**:

1. 檢查 `ALLOWED_ORIGINS` 設定:
   ```bash
   cd worker
   cat wrangler.toml
   ```

2. 更新 ALLOWED_ORIGINS:
   ```toml
   [env.production.vars]
   ALLOWED_ORIGINS = "https://your-actual-domain.pages.dev"
   ```

3. 重新部署 Worker:
   ```bash
   wrangler deploy --env production
   ```

### 401 未授權錯誤

**症狀**: CSV 下載失敗，返回 401

**可能原因**:
1. 密碼錯誤
2. ADMIN_PASSWORD 未設定

**解決方案**:

```bash
# 設定或更新密碼
cd worker
wrangler secret put ADMIN_PASSWORD --env production

# 驗證設定
wrangler tail --env production
# 嘗試下載 CSV，查看 logs
```

### 500 伺服器錯誤

**症狀**: API 返回 500 錯誤

**解決方案**:

```bash
# 查看 Worker logs
cd worker
wrangler tail --env production

# 檢查資料庫連接
wrangler d1 execute survey-db --remote --command="SELECT 1;"
```

## 前端問題

### API 無法連接

**症狀**: 前端無法連接到 Worker

**檢查步驟**:

1. 確認環境變數:
   ```javascript
   // 在瀏覽器控制台
   console.log(import.meta.env.VITE_API_URL);
   ```

2. 檢查 Worker 狀態:
   ```bash
   curl https://survey-api.your-account.workers.dev/api/responses
   ```

3. 檢查網路請求:
   - 開啟開發者工具 → Network
   - 查看請求 URL 是否正確
   - 查看回應狀態碼和內容

### 資料不顯示

**症狀**: 統計面板沒有資料

**可能原因**:
1. API 返回空資料
2. 前端解析錯誤
3. localStorage 和 API 資料不同步

**解決方案**:

1. 檢查 API 回應:
   ```javascript
   // 在瀏覽器控制台
   fetch('https://your-worker-url/api/responses')
     .then(r => r.json())
     .then(console.log);
   ```

2. 檢查控制台錯誤:
   - F12 → Console
   - 查看是否有 JavaScript 錯誤

3. 清除 localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### 表單提交失敗

**症狀**: 提交表單後沒有反應或顯示錯誤

**檢查步驟**:

1. 查看瀏覽器控制台錯誤
2. 檢查網路請求狀態
3. 驗證表單資料格式:
   ```javascript
   // 在 SurveyForm.js 中添加 console.log
   console.log('Submitting data:', data);
   ```

## 資料庫問題

### 資料庫連接失敗

**症狀**: Worker 無法連接 D1

**解決方案**:

1. 驗證 database_id:
   ```bash
   wrangler d1 list
   # 確認 ID 與 wrangler.toml 中的一致
   ```

2. 檢查綁定設定:
   ```toml
   [[d1_databases]]
   binding = "DB"  # 必須是 "DB"
   database_name = "survey-db"
   database_id = "your-id"
   ```

3. 重新部署:
   ```bash
   wrangler deploy
   ```

### 重複記錄問題

**症狀**: 相同資料被多次插入

**可能原因**: 重複檢測邏輯失敗

**解決方案**:

1. 檢查索引:
   ```bash
   wrangler d1 execute survey-db --remote --command="SELECT name FROM sqlite_master WHERE type='index';"
   ```

2. 確認 `idx_phone_timestamp` 索引存在

3. 檢查 Worker 程式碼中的 `checkDuplicate` 函數

### 資料遺失

**症狀**: 資料突然消失

**可能原因**:
1. 使用本地資料庫而非遠端
2. 資料庫被重置

**解決方案**:

1. 確認使用遠端資料庫:
   ```bash
   wrangler d1 execute survey-db --remote --command="SELECT COUNT(*) FROM responses;"
   ```

2. 檢查備份:
   - 使用 CSV 匯出功能定期備份
   - 檢查是否有舊的 CSV 備份

## 測試問題

### 測試失敗

**症狀**: `bun test` 或 `npm test` 失敗

**解決方案**:

1. 檢查依賴:
   ```bash
   npm install
   # 或
   bun install
   ```

2. 清除快取:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. 檢查特定測試:
   ```bash
   bun test D1ApiClient.test.js
   ```

### 屬性測試超時

**症狀**: Property-based tests 執行時間過長

**解決方案**:

1. 減少測試次數:
   ```javascript
   // 在測試檔案中
   { numRuns: 10 }  // 從 100 減少到 10
   ```

2. 跳過慢速測試:
   ```javascript
   describe.skip('Property tests', () => {
     // ...
   });
   ```

## 環境問題

### 環境變數未生效

**症狀**: 環境變數值不正確

**解決方案**:

1. 前端環境變數:
   ```bash
   # 重新建置
   npm run build
   ```

2. Worker 環境變數:
   ```bash
   # 重新部署
   cd worker
   wrangler deploy --env production
   ```

3. 驗證環境變數:
   ```javascript
   // 前端
   console.log(import.meta.env.VITE_API_URL);
   ```

### 本地開發環境問題

**症狀**: 本地開發無法正常運作

**解決方案**:

1. 啟動 Worker:
   ```bash
   cd worker
   wrangler dev
   ```

2. 啟動前端:
   ```bash
   # 在另一個終端
   npm run dev
   ```

3. 確認 `.env` 檔案:
   ```env
   VITE_API_URL=http://localhost:8787
   ```

## 效能問題

### API 回應緩慢

**可能原因**:
1. D1 資料庫查詢慢
2. 資料量過大
3. 網路延遲

**解決方案**:

1. 檢查索引是否存在
2. 考慮添加分頁功能
3. 使用 Cloudflare Analytics 分析

### 前端載入慢

**解決方案**:

1. 檢查建置大小:
   ```bash
   npm run build
   # 查看 dist 目錄大小
   ```

2. 啟用壓縮
3. 使用 CDN

## 取得協助

如果以上方案都無法解決問題：

1. **查看 Logs**:
   ```bash
   # Worker logs
   wrangler tail --env production
   
   # 瀏覽器控制台
   F12 → Console
   ```

2. **檢查文件**:
   - [API_DOCS.md](./API_DOCS.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
   - [ENV_SETUP.md](./ENV_SETUP.md)

3. **Cloudflare 文件**:
   - [Workers 文件](https://developers.cloudflare.com/workers/)
   - [D1 文件](https://developers.cloudflare.com/d1/)
   - [Pages 文件](https://developers.cloudflare.com/pages/)

4. **社群支援**:
   - [Cloudflare Community](https://community.cloudflare.com/)
   - [Discord](https://discord.gg/cloudflaredev)

## 常用除錯命令

```bash
# 查看 Worker logs
wrangler tail

# 執行 SQL 查詢
wrangler d1 execute survey-db --remote --command="SELECT * FROM responses LIMIT 5;"

# 測試 API
curl https://your-worker-url/api/responses

# 檢查環境變數
wrangler whoami

# 查看資料庫列表
wrangler d1 list

# 本地測試
wrangler dev
```

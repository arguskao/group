# 環境變數設定指南

本文件說明專案中使用的環境變數及其設定方式。

## 前端環境變數

### `.env` 檔案

在專案根目錄建立 `.env` 檔案：

```env
# API URL - Cloudflare Worker 的 URL
VITE_API_URL=http://localhost:8787
```

### 環境說明

#### 開發環境

```env
VITE_API_URL=http://localhost:8787
```

#### 生產環境

```env
VITE_API_URL=https://survey-api.your-account.workers.dev
```

### Cloudflare Pages 設定

在 Cloudflare Pages Dashboard 中設定環境變數：

1. 前往你的 Pages 專案
2. **Settings** → **Environment variables**
3. 添加以下變數：

| 變數名稱 | 值 | 環境 |
|---------|-----|------|
| `VITE_API_URL` | `https://survey-api.your-account.workers.dev` | Production |
| `VITE_API_URL` | `http://localhost:8787` | Preview (optional) |

## Worker 環境變數

### `wrangler.toml` 設定

在 `worker/wrangler.toml` 中設定：

```toml
# 開發環境
[vars]
ALLOWED_ORIGINS = "*"  # 允許所有來源（僅開發環境）

# 生產環境
[env.production.vars]
ALLOWED_ORIGINS = "https://your-domain.pages.dev"  # 替換為實際域名
```

### Secret 變數（敏感資訊）

使用 Wrangler CLI 設定 secret：

```bash
cd worker

# 設定管理員密碼
wrangler secret put ADMIN_PASSWORD

# 為特定環境設定
wrangler secret put ADMIN_PASSWORD --env production
```

## 環境變數說明

### 前端變數

#### `VITE_API_URL`

- **用途**: Cloudflare Worker API 的 URL
- **類型**: String
- **必填**: 是
- **範例**: 
  - 開發: `http://localhost:8787`
  - 生產: `https://survey-api.your-account.workers.dev`

### Worker 變數

#### `ALLOWED_ORIGINS`

- **用途**: CORS 允許的來源
- **類型**: String
- **必填**: 是
- **範例**:
  - 開發: `*`
  - 生產: `https://your-domain.pages.dev`
- **注意**: 生產環境不要使用 `*`，應設定具體域名

#### `ADMIN_PASSWORD` (Secret)

- **用途**: CSV 下載的管理員密碼
- **類型**: String (Secret)
- **必填**: 是
- **設定方式**: 使用 `wrangler secret put`
- **預設值**: `3939889`（可自訂）
- **注意**: 不要在程式碼或 wrangler.toml 中明文儲存

## 設定步驟

### 1. 本地開發設定

```bash
# 1. 複製環境變數範例檔案
cp .env.example .env

# 2. 編輯 .env
nano .env

# 3. 設定 Worker secret（如果需要測試 CSV 下載）
cd worker
wrangler secret put ADMIN_PASSWORD
# 輸入: 3939889
```

### 2. 生產環境設定

```bash
# 1. 設定 Worker 環境變數
cd worker

# 編輯 wrangler.toml
nano wrangler.toml

# 2. 設定 Worker secrets
wrangler secret put ADMIN_PASSWORD --env production

# 3. 在 Cloudflare Pages 設定前端環境變數
# （透過 Dashboard 操作，見上方說明）
```

## 驗證設定

### 檢查前端環境變數

```javascript
// 在瀏覽器控制台執行
console.log(import.meta.env.VITE_API_URL);
```

### 檢查 Worker 環境變數

```bash
# 查看 Worker 配置
cd worker
wrangler whoami
wrangler tail --env production
```

## 常見問題

### Q: 為什麼前端環境變數要加 `VITE_` 前綴？

A: Vite 要求所有暴露給客戶端的環境變數必須以 `VITE_` 開頭，這是安全機制。

### Q: 如何更改管理員密碼？

A: 使用 wrangler secret 更新：

```bash
cd worker
wrangler secret put ADMIN_PASSWORD --env production
# 輸入新密碼
```

### Q: CORS 錯誤怎麼辦？

A: 確認 `ALLOWED_ORIGINS` 設定正確：

1. 檢查 wrangler.toml 中的設定
2. 確認前端域名與設定相符
3. 重新部署 Worker

### Q: 環境變數更新後需要重新部署嗎？

A: 
- **前端變數** (`VITE_*`): 需要重新建置和部署
- **Worker vars**: 需要重新部署 Worker
- **Worker secrets**: 立即生效，不需重新部署

## 安全建議

1. **不要提交 `.env` 到 Git**
   - `.env` 已在 `.gitignore` 中
   - 只提交 `.env.example`

2. **使用 Secret 儲存敏感資訊**
   - 密碼、API keys 等使用 `wrangler secret`
   - 不要在 wrangler.toml 中明文儲存

3. **生產環境限制 CORS**
   - 不要使用 `*`
   - 設定具體的域名列表

4. **定期更換密碼**
   - 定期更新 ADMIN_PASSWORD
   - 使用強密碼

## 參考資料

- [Vite 環境變數文件](https://vitejs.dev/guide/env-and-mode.html)
- [Wrangler 環境變數文件](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare Pages 環境變數](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)

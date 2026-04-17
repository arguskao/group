# API 使用文件

本文件說明 Cloudflare Worker API 的端點和使用方式。

## 基本資訊

- **Base URL**: `https://survey-api.your-account.workers.dev`
- **Content-Type**: `application/json`
- **CORS**: 支援（需設定 ALLOWED_ORIGINS）

## API 端點

### 1. 建立回應記錄

建立新的問卷回應記錄。

**端點**: `POST /api/responses`

**請求 Body**:

```json
{
  "name": "王小明",
  "phone": "0912345678",
  "region": "台北市",
  "occupation": "藥師",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**欄位說明**:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `name` | string | 是 | 姓名（中文、英文、空格） |
| `phone` | string | 是 | 電話號碼（8-15位數字） |
| `region` | string | 是 | 地區（台灣22縣市之一） |
| `occupation` | string | 是 | 職業（藥師/藥助/其他） |
| `timestamp` | string | 是 | ISO 8601 格式時間戳記 |

**成功回應** (201 Created):

```json
{
  "success": true,
  "id": 1,
  "message": "回應已成功建立"
}
```

**錯誤回應** (400 Bad Request):

```json
{
  "success": false,
  "error": "驗證失敗",
  "details": [
    {
      "field": "name",
      "message": "此欄位為必填"
    }
  ]
}
```

**範例**:

```javascript
const response = await fetch('https://survey-api.your-account.workers.dev/api/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '王小明',
    phone: '0912345678',
    region: '台北市',
    occupation: '藥師',
    timestamp: new Date().toISOString()
  })
});

const data = await response.json();
console.log(data);
```

### 2. 取得所有回應記錄

取得所有問卷回應記錄。

**端點**: `GET /api/responses`

**成功回應** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "王小明",
      "phone": "0912345678",
      "region": "台北市",
      "occupation": "藥師",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**錯誤回應** (500 Internal Server Error):

```json
{
  "success": false,
  "error": "資料庫錯誤"
}
```

**範例**:

```javascript
const response = await fetch('https://survey-api.your-account.workers.dev/api/responses');
const data = await response.json();

if (data.success) {
  console.log(`共有 ${data.count} 筆記錄`);
  data.data.forEach(record => {
    console.log(record.name, record.region);
  });
}
```

### 3. 匯出 CSV

匯出所有回應記錄為 CSV 檔案（需要管理員密碼）。

**端點**: `GET /api/export?password={password}`

**查詢參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `password` | string | 是 | 管理員密碼 |

**成功回應** (200 OK):

- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="survey_responses_YYYYMMDD_HHMMSS.csv"`
- 包含 UTF-8 BOM 的 CSV 檔案

**錯誤回應** (401 Unauthorized):

```json
{
  "success": false,
  "error": "密碼錯誤"
}
```

**範例**:

```javascript
const password = '3939889';
const response = await fetch(
  `https://survey-api.your-account.workers.dev/api/export?password=${encodeURIComponent(password)}`
);

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'survey_responses.csv';
  a.click();
}
```

## 錯誤代碼

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | 成功 |
| 201 | 已建立 |
| 400 | 請求錯誤（驗證失敗） |
| 401 | 未授權（密碼錯誤） |
| 405 | 方法不允許 |
| 500 | 伺服器錯誤 |

## CORS 設定

API 支援 CORS，允許的來源由環境變數 `ALLOWED_ORIGINS` 控制。

**回應標頭**:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## 速率限制

目前沒有實施速率限制，但 Cloudflare Workers 免費方案有以下限制：

- 每天 100,000 次請求
- 每次請求最多 50ms CPU 時間

## 資料驗證規則

### 姓名 (name)

- 必填
- 只能包含中文、英文字母和空格
- 正則表達式: `/^[\u4e00-\u9fa5a-zA-Z\s]+$/`

### 電話 (phone)

- 必填
- 只能包含數字、空格和連字號
- 去除空格和連字號後，長度必須在 8-15 位之間
- 正則表達式: `/^[\d\s-]+$/`

### 地區 (region)

- 必填
- 必須是以下之一：
  - 台北市、新北市、桃園市、台中市、台南市、高雄市
  - 基隆市、新竹市、新竹縣、苗栗縣、彰化縣、南投縣
  - 雲林縣、嘉義市、嘉義縣、屏東縣、宜蘭縣、花蓮縣
  - 台東縣、澎湖縣、金門縣、連江縣

### 職業 (occupation)

- 必填
- 必須是以下之一：藥師、藥助、其他

### 時間戳記 (timestamp)

- 必填
- ISO 8601 格式
- 範例: `2024-01-01T00:00:00.000Z`

## 使用 D1ApiClient

前端提供了 `D1ApiClient` 類別來簡化 API 呼叫：

```javascript
import { D1ApiClient } from './D1ApiClient.js';

// 初始化客戶端
const apiClient = new D1ApiClient('https://survey-api.your-account.workers.dev');

// 建立回應
const result = await apiClient.createResponse({
  name: '王小明',
  phone: '0912345678',
  region: '台北市',
  occupation: '藥師',
  timestamp: new Date().toISOString()
});

// 取得所有回應
const responses = await apiClient.getAllResponses();

// 下載 CSV
await apiClient.downloadCSV('3939889');
```

## 測試 API

### 使用 curl

```bash
# 建立回應
curl -X POST https://survey-api.your-account.workers.dev/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試用戶",
    "phone": "0912345678",
    "region": "台北市",
    "occupation": "藥師",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }'

# 取得所有回應
curl https://survey-api.your-account.workers.dev/api/responses

# 匯出 CSV
curl "https://survey-api.your-account.workers.dev/api/export?password=3939889" \
  -o survey_responses.csv
```

### 使用 Postman

1. 建立新的 Collection
2. 添加請求：
   - POST `/api/responses`
   - GET `/api/responses`
   - GET `/api/export?password=3939889`
3. 設定 Base URL
4. 執行測試

## 安全建議

1. **使用 HTTPS**: 生產環境必須使用 HTTPS
2. **保護密碼**: 不要在客戶端程式碼中硬編碼密碼
3. **限制 CORS**: 生產環境設定具體的允許來源
4. **輸入驗證**: 始終驗證用戶輸入
5. **錯誤處理**: 不要在錯誤訊息中暴露敏感資訊

## 相關資源

- [D1ApiClient 原始碼](./src/D1ApiClient.js)
- [Worker 原始碼](./worker/src/index.js)
- [資料庫 Schema](./worker/schema.sql)

# 設計文件

## 概述

本設計文件描述如何將問卷調查系統從使用 localStorage 遷移到 Cloudflare D1 資料庫。這個遷移將使系統能夠支援雲端儲存、多裝置存取和更好的資料管理能力。

系統將採用前後端分離架構：
- **前端**：現有的 Vite + JavaScript 應用程式，部署在 Cloudflare Pages
- **後端**：Cloudflare Workers 提供 RESTful API
- **資料庫**：Cloudflare D1（基於 SQLite）

## 架構

### 整體架構

```
┌─────────────────┐
│  Browser Client │
│   (Vite App)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│ Cloudflare Pages│
│   (Static Host) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Cloudflare Worker│
│   (API Layer)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  D1 Database    │
│   (SQLite)      │
└─────────────────┘
```

### 資料流

1. **提交問卷**：Browser → Worker API (POST /api/responses) → D1 Database
2. **查詢統計**：Browser → Worker API (GET /api/responses) → D1 Database → Browser
3. **下載 CSV**：Browser → Worker API (GET /api/export?password=xxx) → D1 Database → CSV File

## 元件和介面

### 1. D1 資料庫 Schema

**資料表：responses**

```sql
CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  region TEXT NOT NULL,
  occupation TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON responses(timestamp);
CREATE INDEX idx_phone_timestamp ON responses(phone, timestamp);
CREATE INDEX idx_region ON responses(region);
CREATE INDEX idx_occupation ON responses(occupation);
```

**欄位說明：**
- `id`：自動遞增的主鍵
- `name`：受訪者姓名
- `phone`：受訪者電話
- `region`：受訪者地區
- `occupation`：受訪者工作性質
- `timestamp`：問卷提交時間（ISO 8601 格式）
- `created_at`：資料庫記錄建立時間

**索引說明：**
- `idx_timestamp`：加速按時間排序查詢
- `idx_phone_timestamp`：用於檢測重複記錄
- `idx_region`：加速地區統計查詢
- `idx_occupation`：加速職業統計查詢

### 2. Cloudflare Worker API

**API 端點：**

#### POST /api/responses
建立新的問卷回應

**請求：**
```json
{
  "name": "張三",
  "phone": "0912345678",
  "region": "台北市",
  "occupation": "藥師",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**回應（成功）：**
```json
{
  "success": true,
  "id": 123
}
```

**回應（失敗）：**
```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

#### GET /api/responses
取得所有問卷回應

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "張三",
      "phone": "0912345678",
      "region": "台北市",
      "occupation": "藥師",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET /api/export?password=xxx
匯出 CSV 檔案（需要密碼驗證）

**查詢參數：**
- `password`：管理員密碼（必填）

**回應（成功）：**
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="survey_responses_YYYYMMDD_HHMMSS.csv"`
- Body: CSV 格式資料（包含 UTF-8 BOM）

**回應（失敗）：**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 3. 前端 API 客戶端

**新增檔案：src/D1ApiClient.js**

```javascript
export class D1ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async createResponse(data) {
    // POST /api/responses
  }

  async getAllResponses() {
    // GET /api/responses
  }

  async exportCSV(password) {
    // GET /api/export?password=xxx
  }
}
```

### 4. 資料遷移工具

**新增檔案：src/MigrationTool.js**

```javascript
export class MigrationTool {
  constructor(apiClient, csvManager) {
    this.apiClient = apiClient;
    this.csvManager = csvManager;
  }

  async migrateFromLocalStorage() {
    // 1. 從 localStorage 讀取資料
    // 2. 驗證每筆資料
    // 3. 批次上傳到 D1
    // 4. 回傳遷移結果
  }
}
```

## 資料模型

### Response Record

```typescript
interface ResponseRecord {
  id?: number;              // 資料庫 ID（選填，新增時不需要）
  name: string;             // 姓名（1-50 字元）
  phone: string;            // 電話（台灣手機格式：09xxxxxxxx）
  region: string;           // 地區（必須是 TAIWAN_REGIONS 之一）
  occupation: string;       // 工作性質（必須是 OCCUPATION_TYPES 之一）
  timestamp: string;        // ISO 8601 格式時間戳記
  created_at?: string;      // 資料庫建立時間（選填）
}
```

### API Response

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
```

### Migration Result

```typescript
interface MigrationResult {
  total: number;           // 總記錄數
  migrated: number;        // 成功遷移數
  skipped: number;         // 跳過數（重複）
  failed: number;          // 失敗數
  errors: Array<{
    record: ResponseRecord;
    error: string;
  }>;
}
```


## 正確性屬性

*屬性是一個特徵或行為，應該在系統的所有有效執行中保持為真——本質上是關於系統應該做什麼的正式陳述。屬性作為人類可讀規範和機器可驗證正確性保證之間的橋樑。*

### Property 1: 回應記錄插入完整性
*對於任何*有效的回應記錄，當透過 API 插入到 D1 資料庫時，該記錄應該能夠被檢索回來且所有欄位值保持不變
**驗證：需求 1.2, 2.1**

### Property 2: 回應記錄檢索完整性
*對於任何*插入到資料庫的回應記錄集合，當透過 API 檢索時，應該返回所有記錄且不遺漏任何記錄
**驗證：需求 1.3, 2.2**

### Property 3: 無效資料拒絕
*對於任何*不符合驗證規則的回應記錄（例如：無效電話格式、空白姓名、不在清單中的地區），API 應該拒絕該記錄並返回適當的錯誤訊息
**驗證：需求 2.3**

### Property 4: 遷移資料驗證
*對於任何*從 localStorage 讀取的記錄集合（包含有效和無效記錄），遷移工具應該只插入通過驗證的記錄
**驗證：需求 3.2, 3.3**

### Property 5: 重複記錄檢測
*對於任何*具有相同電話號碼和時間戳記的記錄對，遷移工具應該識別為重複並只保留一筆記錄
**驗證：需求 3.5**

### Property 6: CSV 轉換往返一致性
*對於任何*有效的回應記錄集合，將其轉換為 CSV 格式後再解析回來，應該得到等價的記錄集合
**驗證：需求 4.1, 4.2**

### Property 7: CSV 特殊字元轉義
*對於任何*包含特殊字元（逗號、引號、換行符）的回應記錄，CSV 轉換應該正確轉義這些字元，使得解析後能還原原始值
**驗證：需求 4.4**

### Property 8: 認證失敗拒絕
*對於任何*無效的密碼（包括空字串、錯誤密碼、缺少密碼），API 應該拒絕下載請求並返回 401 狀態碼
**驗證：需求 6.3**

### Property 9: API 錯誤處理
*對於任何*導致 API 請求失敗的情況（網路錯誤、伺服器錯誤、驗證錯誤），前端應該顯示使用者友善的錯誤訊息
**驗證：需求 7.4**

## 錯誤處理

### 1. 前端錯誤處理

**網路錯誤：**
- 捕獲 fetch API 的網路錯誤
- 顯示訊息：「無法連接到伺服器，請檢查網路連線」
- 提供重試按鈕

**API 錯誤回應：**
- 400 Bad Request：顯示具體的驗證錯誤訊息
- 401 Unauthorized：顯示「密碼錯誤，請重新輸入」
- 500 Internal Server Error：顯示「伺服器錯誤，請稍後再試」
- 其他錯誤：顯示通用錯誤訊息

**超時處理：**
- 設定 API 請求超時時間（例如 30 秒）
- 超時後顯示：「請求超時，請重試」

### 2. Worker API 錯誤處理

**輸入驗證錯誤：**
```javascript
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "phone", "message": "Invalid phone number format" }
  ]
}
```

**資料庫錯誤：**
```javascript
{
  "success": false,
  "error": "Database error",
  "message": "Failed to insert record"
}
```

**認證錯誤：**
```javascript
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid password"
}
```

### 3. 資料庫錯誤處理

**連線錯誤：**
- 使用 try-catch 捕獲資料庫連線錯誤
- 記錄錯誤到 Cloudflare Workers 日誌
- 返回 500 狀態碼給客戶端

**約束違反：**
- 捕獲 NOT NULL 約束違反
- 返回 400 狀態碼和具體錯誤訊息

**查詢錯誤：**
- 捕獲 SQL 語法錯誤
- 記錄完整錯誤堆疊
- 返回通用錯誤訊息（不暴露 SQL 細節）

## 測試策略

### 1. 單元測試

使用 Vitest 進行單元測試，涵蓋：

**前端元件：**
- `D1ApiClient`：測試 API 請求建構和回應處理
- `MigrationTool`：測試遷移邏輯和錯誤處理
- `CSVManager`：測試 CSV 轉換和解析（現有測試）
- `Validator`：測試資料驗證規則（現有測試）

**Worker API：**
- 請求處理函數：測試路由和參數解析
- 驗證函數：測試輸入驗證邏輯
- 資料庫操作：使用 mock D1 binding 測試

**測試範例：**
- 有效資料的成功案例
- 無效資料的錯誤處理
- 邊界值測試（空字串、極長字串等）
- 特殊字元處理

### 2. 屬性基礎測試

使用 fast-check 進行屬性基礎測試，配置每個測試至少執行 100 次迭代。

**測試庫：** fast-check (已安裝)

**測試標記格式：** 每個屬性測試必須使用註解標記對應的設計文件屬性
```javascript
// Feature: d1-database-migration, Property 1: 回應記錄插入完整性
test('property: response record insertion integrity', async () => {
  // 測試實作
});
```

**屬性測試涵蓋：**

1. **Property 1: 回應記錄插入完整性**
   - 生成隨機有效回應記錄
   - 插入資料庫後檢索
   - 驗證所有欄位值相同

2. **Property 2: 回應記錄檢索完整性**
   - 生成隨機數量的回應記錄
   - 批次插入資料庫
   - 檢索並驗證數量和內容

3. **Property 3: 無效資料拒絕**
   - 生成各種無效回應記錄
   - 驗證 API 拒絕並返回錯誤

4. **Property 4: 遷移資料驗證**
   - 生成混合有效和無效記錄
   - 執行遷移
   - 驗證只有有效記錄被插入

5. **Property 5: 重複記錄檢測**
   - 生成包含重複的記錄集
   - 執行遷移
   - 驗證重複記錄被跳過

6. **Property 6: CSV 轉換往返一致性**
   - 生成隨機回應記錄集
   - 轉換為 CSV 再解析回來
   - 驗證資料等價

7. **Property 7: CSV 特殊字元轉義**
   - 生成包含特殊字元的記錄
   - 轉換為 CSV 再解析
   - 驗證特殊字元正確保留

8. **Property 8: 認證失敗拒絕**
   - 生成各種無效密碼
   - 嘗試下載
   - 驗證返回 401

9. **Property 9: API 錯誤處理**
   - 模擬各種 API 錯誤
   - 驗證顯示適當錯誤訊息

### 3. 整合測試

**本地開發環境：**
- 使用 Miniflare 模擬 Cloudflare Workers 環境
- 使用 SQLite 作為 D1 的本地替代
- 測試完整的 API 流程

**測試場景：**
- 端到端表單提交流程
- 資料遷移完整流程
- CSV 匯出流程
- 錯誤恢復場景

### 4. 測試資料生成器

**使用 fast-check 建立生成器：**

```javascript
// 有效的台灣手機號碼
const phoneArbitrary = fc.string({ minLength: 10, maxLength: 10 })
  .filter(s => /^09\d{8}$/.test(s));

// 有效的姓名
const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

// 有效的地區
const regionArbitrary = fc.constantFrom(...TAIWAN_REGIONS);

// 有效的職業
const occupationArbitrary = fc.constantFrom(...OCCUPATION_TYPES);

// 完整的回應記錄
const responseArbitrary = fc.record({
  name: nameArbitrary,
  phone: phoneArbitrary,
  region: regionArbitrary,
  occupation: occupationArbitrary,
  timestamp: fc.date().map(d => d.toISOString())
});
```

## 實作注意事項

### 1. Cloudflare Workers 限制

- CPU 時間限制：每個請求最多 50ms（免費方案）或 50ms-30s（付費方案）
- 記憶體限制：128MB
- 請求大小限制：100MB
- 批次操作建議：每次最多處理 100 筆記錄

### 2. D1 資料庫限制

- 資料庫大小：500MB（免費方案）或 10GB（付費方案）
- 每日讀取次數：500 萬次（免費方案）
- 每日寫入次數：10 萬次（免費方案）
- 單次查詢時間限制：30 秒

### 3. CORS 配置

Worker 需要設定 CORS 標頭以允許前端存取：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 生產環境應限制為特定網域
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### 4. 安全性考量

- 密碼應使用環境變數儲存，不要硬編碼
- 考慮使用更安全的認證機制（例如 JWT）
- 實作速率限制防止濫用
- 記錄所有下載操作以供審計

### 5. 效能優化

- 使用資料庫索引加速查詢
- 實作分頁以處理大量資料
- 考慮使用 Cloudflare Cache API 快取統計資料
- 批次插入以提高遷移效能

### 6. 向後相容性

- 保留 CSVManager 類別以支援 CSV 匯出功能
- 遷移工具應該是可選的，不影響新使用者
- 提供降級方案：如果 API 不可用，顯示友善訊息

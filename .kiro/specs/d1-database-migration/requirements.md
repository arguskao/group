# 需求文件

## 簡介

將問卷調查系統的資料儲存方式從 localStorage 遷移到 Cloudflare D1 資料庫，以支援雲端儲存、多裝置存取和更好的資料管理能力。

## 術語表

- **Survey System**：問卷調查系統，用於收集和管理受訪者資訊的應用程式
- **D1 Database**：Cloudflare D1，一個基於 SQLite 的無伺服器資料庫服務
- **Response Record**：回應記錄，包含受訪者的姓名、電話、地區、工作性質和提交時間
- **Cloudflare Worker**：Cloudflare Workers，在邊緣運行的無伺服器函數
- **API Endpoint**：API 端點，用於前端與後端通訊的 HTTP 介面
- **localStorage**：瀏覽器本地儲存，目前用於儲存問卷資料的機制

## 需求

### 需求 1

**使用者故事：** 作為系統管理員，我希望問卷資料儲存在雲端資料庫中，以便資料可以在不同裝置間共享並持久保存。

#### 驗收標準

1. WHEN the Survey System initializes THEN the Survey System SHALL connect to the D1 Database
2. WHEN a user submits a survey response THEN the Survey System SHALL store the Response Record in the D1 Database
3. WHEN the Survey System retrieves responses THEN the Survey System SHALL query the D1 Database and return all Response Records
4. WHEN the D1 Database is unavailable THEN the Survey System SHALL display an appropriate error message to the user
5. WHEN multiple users submit responses simultaneously THEN the D1 Database SHALL handle concurrent writes without data loss

### 需求 2

**使用者故事：** 作為開發者，我希望建立 RESTful API 端點來處理問卷資料的 CRUD 操作，以便前端可以與資料庫互動。

#### 驗收標準

1. WHEN a POST request is sent to the API Endpoint with valid Response Record data THEN the Cloudflare Worker SHALL insert the record into the D1 Database and return success status
2. WHEN a GET request is sent to the API Endpoint THEN the Cloudflare Worker SHALL retrieve all Response Records from the D1 Database and return them as JSON
3. WHEN an API request contains invalid data THEN the Cloudflare Worker SHALL validate the input and return appropriate error messages
4. WHEN an API request fails due to database errors THEN the Cloudflare Worker SHALL return appropriate HTTP status codes and error details
5. WHEN the API Endpoint receives requests THEN the Cloudflare Worker SHALL enforce CORS policies to allow requests from authorized origins

### 需求 3

**使用者故事：** 作為系統管理員，我希望能夠將現有的 localStorage 資料遷移到 D1 資料庫，以便保留歷史資料。

#### 驗收標準

1. WHEN a migration function is executed THEN the Survey System SHALL read all Response Records from localStorage
2. WHEN Response Records are read from localStorage THEN the Survey System SHALL validate each record before migration
3. WHEN valid Response Records exist in localStorage THEN the Survey System SHALL insert them into the D1 Database
4. WHEN migration is complete THEN the Survey System SHALL provide a summary of migrated records count
5. WHEN duplicate records are detected during migration THEN the Survey System SHALL skip duplicates based on phone number and timestamp

### 需求 4

**使用者故事：** 作為使用者，我希望系統能夠匯出 CSV 檔案，以便我可以在 Excel 或其他工具中分析資料。

#### 驗收標準

1. WHEN a user requests CSV export THEN the Survey System SHALL retrieve all Response Records from the D1 Database
2. WHEN Response Records are retrieved THEN the Survey System SHALL convert them to CSV format with proper encoding
3. WHEN CSV data is generated THEN the Survey System SHALL include UTF-8 BOM for Excel compatibility
4. WHEN CSV fields contain special characters THEN the Survey System SHALL properly escape commas, quotes, and newlines
5. WHEN CSV download is triggered THEN the Survey System SHALL generate a file with timestamp in the filename

### 需求 5

**使用者故事：** 作為開發者，我希望建立資料庫 schema 和初始化腳本，以便正確設定 D1 資料庫結構。

#### 驗收標準

1. WHEN the D1 Database is created THEN the Survey System SHALL execute a schema definition script
2. WHEN the schema is created THEN the D1 Database SHALL contain a table with columns for name, phone, region, occupation, and timestamp
3. WHEN the schema is created THEN the D1 Database SHALL define appropriate data types for each column
4. WHEN the schema is created THEN the D1 Database SHALL create indexes on frequently queried columns
5. WHEN the schema is created THEN the D1 Database SHALL enforce constraints to ensure data integrity

### 需求 6

**使用者故事：** 作為系統管理員，我希望 API 端點受到密碼保護，以便只有授權使用者可以下載資料。

#### 驗收標準

1. WHEN a download request is sent to the API Endpoint THEN the Cloudflare Worker SHALL require authentication credentials
2. WHEN valid credentials are provided THEN the Cloudflare Worker SHALL authorize the download request
3. WHEN invalid credentials are provided THEN the Cloudflare Worker SHALL reject the request with 401 status code
4. WHEN authentication fails THEN the Cloudflare Worker SHALL not expose any Response Records
5. WHEN authentication succeeds THEN the Cloudflare Worker SHALL log the access for audit purposes

### 需求 7

**使用者故事：** 作為開發者，我希望更新前端程式碼以使用新的 API 端點，以便應用程式可以與 D1 資料庫互動。

#### 驗收標準

1. WHEN the Survey System loads THEN the Survey System SHALL replace localStorage calls with API requests
2. WHEN a form is submitted THEN the Survey System SHALL send data to the API Endpoint via HTTP POST
3. WHEN statistics are displayed THEN the Survey System SHALL fetch data from the API Endpoint via HTTP GET
4. WHEN API requests fail THEN the Survey System SHALL display user-friendly error messages
5. WHEN API requests are in progress THEN the Survey System SHALL show loading indicators to users

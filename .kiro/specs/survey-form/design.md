# 設計文件

## 概述

問卷系統是一個純前端的靜態網頁應用程式，使用 HTML、CSS 和 JavaScript 實作。系統將部署到 Cloudflare Pages，使用瀏覽器的 localStorage 來儲存 CSV 格式的問卷資料。應用程式包含一個表單介面供受訪者填寫，以及一個即時統計面板顯示回覆數據。

## 架構

### 系統架構

```
┌─────────────────────────────────────────┐
│         Browser (Client-Side)           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      User Interface Layer         │ │
│  │  - Survey Form                    │ │
│  │  - Statistics Panel               │ │
│  │  - Download Button                │ │
│  └───────────────────────────────────┘ │
│              │                          │
│              ▼                          │
│  ┌───────────────────────────────────┐ │
│  │     Application Logic Layer       │ │
│  │  - Form Validation                │ │
│  │  - Data Processing                │ │
│  │  - Statistics Calculation         │ │
│  │  - Password Authentication        │ │
│  └───────────────────────────────────┘ │
│              │                          │
│              ▼                          │
│  ┌───────────────────────────────────┐ │
│  │      Data Storage Layer           │ │
│  │  - CSV Manager                    │ │
│  │  - localStorage Interface         │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 技術棧

- **前端框架**: 純 JavaScript (Vanilla JS) 或輕量級框架（如 Vue.js）
- **樣式**: CSS3 / Tailwind CSS
- **資料儲存**: Browser localStorage
- **資料格式**: CSV (逗號分隔值)
- **部署平台**: Cloudflare Pages

## 元件與介面

### 1. SurveyForm 元件

**職責**: 處理使用者輸入和表單驗證

**介面**:
```javascript
class SurveyForm {
  constructor(onSubmit: Function)
  
  // 驗證表單資料
  validate(): ValidationResult
  
  // 取得表單資料
  getData(): SurveyResponse
  
  // 清空表單
  clear(): void
  
  // 顯示驗證錯誤
  showErrors(errors: ValidationError[]): void
}
```

### 2. StatisticsPanel 元件

**職責**: 顯示問卷統計資料

**介面**:
```javascript
class StatisticsPanel {
  constructor(container: HTMLElement)
  
  // 更新統計資料
  update(responses: SurveyResponse[]): void
  
  // 計算統計數據
  calculateStats(responses: SurveyResponse[]): Statistics
  
  // 渲染統計面板
  render(stats: Statistics): void
}
```

### 3. CSVManager 類別

**職責**: 處理 CSV 資料的讀寫和格式化

**介面**:
```javascript
class CSVManager {
  constructor(storageKey: string)
  
  // 新增一筆回覆到 CSV
  append(response: SurveyResponse): void
  
  // 讀取所有回覆
  readAll(): SurveyResponse[]
  
  // 將回覆陣列轉換為 CSV 字串
  toCSV(responses: SurveyResponse[]): string
  
  // 將 CSV 字串解析為回覆陣列
  fromCSV(csvString: string): SurveyResponse[]
  
  // 處理 CSV 特殊字元轉義
  escapeField(field: string): string
  
  // 下載 CSV 檔案
  download(password: string): boolean
}
```

### 4. Validator 類別

**職責**: 驗證表單輸入

**介面**:
```javascript
class Validator {
  // 驗證姓名
  static validateName(name: string): ValidationResult
  
  // 驗證電話
  static validatePhone(phone: string): ValidationResult
  
  // 驗證地區選擇
  static validateRegion(region: string): ValidationResult
  
  // 驗證職業選擇
  static validateOccupation(occupation: string): ValidationResult
  
  // 驗證完整表單
  static validateForm(data: SurveyResponse): ValidationResult
}
```

### 5. AuthManager 類別

**職責**: 處理管理員密碼驗證

**介面**:
```javascript
class AuthManager {
  constructor(adminPassword: string)
  
  // 驗證密碼
  authenticate(inputPassword: string): boolean
}
```

## 資料模型

### SurveyResponse

```typescript
interface SurveyResponse {
  name: string;           // 姓名
  phone: string;          // 電話
  region: string;         // 地區
  occupation: string;     // 工作性質
  timestamp: string;      // 提交時間 (ISO 8601 格式)
}
```

### Statistics

```typescript
interface Statistics {
  total: number;                          // 總回覆數
  byRegion: Map<string, number>;          // 按地區分組的計數
  byOccupation: Map<string, number>;      // 按職業分組的計數
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

### 常數定義

```typescript
const TAIWAN_REGIONS = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
  '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣'
];

const OCCUPATION_TYPES = ['藥師', '藥助', '其他'];

const ADMIN_PASSWORD = '3939889';

const STORAGE_KEY = 'survey_responses_csv';
```

## 正確性屬性


*屬性是一個特徵或行為，應該在系統的所有有效執行中保持為真——本質上是關於系統應該做什麼的正式陳述。屬性作為人類可讀規範和機器可驗證正確性保證之間的橋樑。*

### Property 1: 表單輸入接受

*對於任何*包含中文字元、英文字母和空格的名稱字串，系統應該接受並正確顯示該輸入
**驗證需求：2.4**

### Property 2: 數字輸入接受

*對於任何*數字輸入，電話欄位應該接受該輸入
**驗證需求：3.2**

### Property 3: 電話格式驗證

*對於任何*僅包含數字、連字號或空格的字串，如果其數字長度在 8-15 之間，系統應該接受該電話號碼
**驗證需求：3.4, 3.5**

### Property 4: 地區選擇儲存

*對於任何*台灣地區選項，當使用者選擇該地區時，系統應該正確儲存該選擇值
**驗證需求：4.4**

### Property 5: 職業選擇儲存

*對於任何*職業類型選項，當使用者選擇該職業時，系統應該正確儲存該選擇值
**驗證需求：5.4**

### Property 6: 有效表單提交儲存

*對於任何*完整填寫的有效表單資料，當提交時，系統應該成功儲存該回覆資料
**驗證需求：6.2**

### Property 7: 提交後表單清空

*對於任何*成功提交的表單，系統應該清空所有表單欄位
**驗證需求：6.3**

### Property 8: 提交後統計更新

*對於任何*成功提交的表單，系統應該立即更新統計面板
**驗證需求：6.4**

### Property 9: 不完整表單驗證

*對於任何*缺少必填欄位的表單，系統應該顯示所有缺失欄位的驗證訊息
**驗證需求：6.5**

### Property 10: 回覆計數增加

*對於任何*新提交的回覆，系統應該將總計數增加一
**驗證需求：7.2**

### Property 11: 地區分組統計

*對於任何*提交的回覆集合，系統應該正確計算並顯示按地區分組的回覆數量
**驗證需求：7.3**

### Property 12: 職業分組統計

*對於任何*提交的回覆集合，系統應該正確計算並顯示按職業分組的回覆數量
**驗證需求：7.4**

### Property 13: 統計計數準確性

*對於任何*統計更新操作，所有類別的計數總和應該等於總回覆數
**驗證需求：7.5**

### Property 14: CSV 資料附加

*對於任何*提交的回覆，系統應該將該資料附加到 CSV 檔案中
**驗證需求：8.1**

### Property 15: CSV 格式化

*對於任何*回覆，系統應該將其格式化為包含姓名、電話、地區、工作性質、提交時間的 CSV 行
**驗證需求：8.2**

### Property 16: CSV 往返一致性

*對於任何*回覆資料，寫入 CSV 後再讀取應該得到相同的資料
**驗證需求：8.4**

### Property 17: CSV 特殊字元處理

*對於任何*包含逗號或引號的欄位值，系統應該正確轉義這些特殊字元
**驗證需求：8.5**

### Property 18: 錯誤密碼拒絕

*對於任何*不等於 "3939889" 的密碼輸入，系統應該顯示錯誤訊息並阻止下載
**驗證需求：9.4**

### Property 19: 下載檔案命名

*對於任何*下載操作，檔案名稱應該符合 survey_responses_YYYYMMDD_HHMMSS.csv 格式
**驗證需求：9.6**

### Property 20: UTF-8 編碼保持

*對於任何*包含中文字元的回覆資料，下載的 CSV 檔案應該正確保持 UTF-8 編碼
**驗證需求：9.7**

## 錯誤處理

### 驗證錯誤

- **空欄位錯誤**: 當必填欄位為空時，顯示「此欄位為必填」
- **電話格式錯誤**: 當電話格式不正確時，顯示「請輸入有效的電話號碼（8-15 位數字）」
- **未選擇錯誤**: 當下拉選單未選擇時，顯示「請選擇一個選項」

### 儲存錯誤

- **localStorage 已滿**: 當 localStorage 空間不足時，顯示警告訊息並建議下載備份
- **資料損壞**: 當讀取的 CSV 資料格式錯誤時，嘗試恢復或初始化新資料

### 認證錯誤

- **密碼錯誤**: 當輸入錯誤的管理員密碼時，顯示「密碼錯誤，請重試」
- **密碼為空**: 當未輸入密碼時，顯示「請輸入管理員密碼」

## 測試策略

### 單元測試

使用 Jest 或 Vitest 作為測試框架，針對以下元件進行單元測試：

1. **Validator 類別測試**
   - 測試各種有效和無效的輸入
   - 測試邊界條件（最小/最大長度）
   - 測試特殊字元處理

2. **CSVManager 類別測試**
   - 測試 CSV 格式化和解析
   - 測試特殊字元轉義
   - 測試空資料處理

3. **AuthManager 類別測試**
   - 測試正確密碼驗證
   - 測試錯誤密碼拒絕

4. **統計計算測試**
   - 測試空資料集的統計
   - 測試單一回覆的統計
   - 測試多筆回覆的分組統計

### 屬性基礎測試

使用 fast-check (JavaScript 的屬性測試庫) 進行屬性基礎測試。每個屬性測試應該執行至少 100 次迭代。

**測試庫**: fast-check

**測試要求**:
- 每個屬性測試必須執行最少 100 次迭代
- 每個屬性測試必須使用註解明確引用設計文件中的正確性屬性
- 註解格式: `// Feature: survey-form, Property {number}: {property_text}`
- 每個正確性屬性必須由單一屬性測試實作

**屬性測試範例**:

```javascript
// Feature: survey-form, Property 3: 電話格式驗證
test('phone validation accepts valid formats', () => {
  fc.assert(
    fc.property(
      fc.string().filter(s => /^[\d\s-]{8,15}$/.test(s)),
      (phone) => {
        const result = Validator.validatePhone(phone);
        expect(result.isValid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: survey-form, Property 16: CSV 往返一致性
test('CSV round-trip preserves data', () => {
  fc.assert(
    fc.property(
      fc.record({
        name: fc.string(),
        phone: fc.string(),
        region: fc.constantFrom(...TAIWAN_REGIONS),
        occupation: fc.constantFrom(...OCCUPATION_TYPES),
        timestamp: fc.date().map(d => d.toISOString())
      }),
      (response) => {
        const csv = csvManager.toCSV([response]);
        const parsed = csvManager.fromCSV(csv);
        expect(parsed[0]).toEqual(response);
      }
    ),
    { numRuns: 100 }
  );
});
```

### 整合測試

使用 Playwright 或 Cypress 進行端對端測試：

1. **完整表單提交流程**
   - 填寫表單 → 提交 → 驗證統計更新 → 驗證資料儲存

2. **資料持久化測試**
   - 提交資料 → 重新載入頁面 → 驗證統計恢復

3. **下載功能測試**
   - 點擊下載 → 輸入密碼 → 驗證檔案下載

## 實作注意事項

### CSV 格式

CSV 檔案格式範例：
```csv
姓名,電話,地區,工作性質,提交時間
張三,0912345678,台北市,藥師,2024-01-15T10:30:00.000Z
李四,02-12345678,新北市,藥助,2024-01-15T11:45:00.000Z
"王五,小名",0987654321,桃園市,其他,2024-01-15T14:20:00.000Z
```

### 特殊字元轉義規則

- 如果欄位包含逗號，整個欄位用雙引號包圍
- 如果欄位包含雙引號，將雙引號替換為兩個雙引號
- 如果欄位包含換行符，整個欄位用雙引號包圍

### localStorage 使用

- 使用單一 key (`survey_responses_csv`) 儲存整個 CSV 字串
- 定期檢查 localStorage 使用量，接近限制時提醒使用者下載備份
- 提供清除資料的功能（需要管理員密碼確認）

### 時間戳記格式

使用 ISO 8601 格式：`YYYY-MM-DDTHH:mm:ss.sssZ`

範例：`2024-01-15T10:30:00.000Z`

### 響應式設計

- 支援桌面和行動裝置
- 表單在小螢幕上應該垂直排列
- 統計面板在小螢幕上應該可滾動

### 無障礙設計

- 所有表單欄位都有適當的 label
- 使用語意化 HTML 標籤
- 支援鍵盤導航
- 錯誤訊息與對應欄位關聯（使用 aria-describedby）

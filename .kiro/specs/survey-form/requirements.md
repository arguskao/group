# 需求文件

## 簡介

本系統是一個簡單的問卷調查應用程式，用於收集受訪者的基本資訊（姓名、電話、地區、工作性質）並統計參與人數。系統需要提供友善的表單介面供使用者填寫，並即時顯示統計結果。系統將部署至 Cloudflare Pages，並使用 CSV 文字檔案格式儲存問卷資料。

## 術語表

- **Survey System（問卷系統）**: 整個問卷調查應用程式
- **Respondent（受訪者）**: 填寫問卷的使用者
- **Form（表單）**: 用於收集受訪者資訊的輸入介面
- **Statistics Panel（統計面板）**: 顯示問卷統計結果的區域
- **Taiwan Region（台灣地區）**: 台灣的縣市行政區劃
- **Occupation Type（工作性質）**: 受訪者的職業類別
- **CSV File（CSV 檔案）**: 以逗號分隔值格式儲存問卷資料的文字檔案
- **Cloudflare Pages**: 用於部署靜態網站的雲端平台
- **Admin Password（管理員密碼）**: 用於驗證管理員身份以存取敏感功能的密碼

## 需求

### 需求 1

**使用者故事：** 作為受訪者，我想要看到清楚的問卷開頭說明，以便了解這份問卷的目的

#### 驗收標準

1. WHEN the Survey System loads THEN the Survey System SHALL display an introductory text at the top of the form
2. THE Survey System SHALL ensure the introductory text is clearly visible and readable
3. THE Survey System SHALL position the introductory text before any form fields

### 需求 2

**使用者故事：** 作為受訪者，我想要填寫我的姓名，以便提交我的個人資訊

#### 驗收標準

1. THE Survey System SHALL provide a text input field labeled for name entry
2. WHEN a Respondent types into the name field THEN the Survey System SHALL accept and display the input text
3. WHEN a Respondent attempts to submit with an empty name field THEN the Survey System SHALL prevent submission and display a validation message
4. THE Survey System SHALL accept name inputs containing Chinese characters, English letters, and spaces

### 需求 3

**使用者故事：** 作為受訪者，我想要填寫我的電話號碼，以便提供我的聯絡方式

#### 驗收標準

1. THE Survey System SHALL provide a text input field labeled for phone number entry
2. WHEN a Respondent types into the phone field THEN the Survey System SHALL accept numeric input
3. WHEN a Respondent attempts to submit with an empty phone field THEN the Survey System SHALL prevent submission and display a validation message
4. THE Survey System SHALL validate that the phone number contains only digits and optional hyphens or spaces
5. THE Survey System SHALL accept phone numbers with a minimum length of 8 digits and maximum length of 15 digits

### 需求 4

**使用者故事：** 作為受訪者，我想要從下拉選單選擇我所在的台灣縣市，以便提供我的地區資訊

#### 驗收標準

1. THE Survey System SHALL provide a dropdown menu containing all Taiwan Region options
2. THE Survey System SHALL include the following Taiwan Region options: 台北市, 新北市, 桃園市, 台中市, 台南市, 高雄市, 基隆市, 新竹市, 新竹縣, 苗栗縣, 彰化縣, 南投縣, 雲林縣, 嘉義市, 嘉義縣, 屏東縣, 宜蘭縣, 花蓮縣, 台東縣, 澎湖縣, 金門縣, 連江縣
3. WHEN a Respondent clicks the region dropdown THEN the Survey System SHALL display all available Taiwan Region options
4. WHEN a Respondent selects a Taiwan Region THEN the Survey System SHALL store the selected value
5. WHEN a Respondent attempts to submit without selecting a region THEN the Survey System SHALL prevent submission and display a validation message

### 需求 5

**使用者故事：** 作為受訪者，我想要選擇我的工作性質，以便提供我的職業資訊

#### 驗收標準

1. THE Survey System SHALL provide a dropdown menu for Occupation Type selection
2. THE Survey System SHALL include the following Occupation Type options: 藥師, 藥助, 其他
3. WHEN a Respondent clicks the occupation dropdown THEN the Survey System SHALL display all available Occupation Type options
4. WHEN a Respondent selects an Occupation Type THEN the Survey System SHALL store the selected value
5. WHEN a Respondent attempts to submit without selecting an occupation THEN the Survey System SHALL prevent submission and display a validation message

### 需求 6

**使用者故事：** 作為受訪者，我想要提交我填寫的問卷，以便我的回覆被記錄

#### 驗收標準

1. THE Survey System SHALL provide a submit button on the Form
2. WHEN a Respondent clicks the submit button with all required fields completed THEN the Survey System SHALL save the response data
3. WHEN a response is successfully submitted THEN the Survey System SHALL clear the Form fields for the next entry
4. WHEN a response is successfully submitted THEN the Survey System SHALL update the Statistics Panel immediately
5. WHEN a Respondent clicks submit with incomplete fields THEN the Survey System SHALL display validation messages for all missing required fields

### 需求 7

**使用者故事：** 作為問卷管理者，我想要看到即時的統計資料，以便了解問卷的回覆情況

#### 驗收標準

1. THE Survey System SHALL display a Statistics Panel showing the total number of responses
2. WHEN a new response is submitted THEN the Survey System SHALL increment the total count by one
3. THE Survey System SHALL display the count of responses grouped by Taiwan Region
4. THE Survey System SHALL display the count of responses grouped by Occupation Type
5. WHEN the Statistics Panel updates THEN the Survey System SHALL maintain accurate counts for all categories
6. THE Survey System SHALL initialize all statistics to zero when no responses exist

### 需求 8

**使用者故事：** 作為使用者，我想要問卷資料能夠以 CSV 格式儲存，以便資料可以輕鬆匯出和分析

#### 驗收標準

1. WHEN a response is submitted THEN the Survey System SHALL append the data to a CSV File
2. THE Survey System SHALL format each response as a CSV row with fields: 姓名, 電話, 地區, 工作性質, 提交時間
3. THE Survey System SHALL include a header row in the CSV File with column names
4. WHEN the Survey System loads THEN the Survey System SHALL read and parse the CSV File to retrieve all responses
5. THE Survey System SHALL handle CSV special characters by properly escaping commas and quotes in field values
6. WHEN the CSV File does not exist THEN the Survey System SHALL create a new CSV File with the header row

### 需求 9

**使用者故事：** 作為管理者，我想要能夠透過密碼保護下載 CSV 檔案，以便只有授權人員可以存取敏感資料

#### 驗收標準

1. THE Survey System SHALL provide a download button for the CSV File
2. WHEN a user clicks the download button THEN the Survey System SHALL prompt for an Admin Password
3. WHEN a user enters the correct Admin Password THEN the Survey System SHALL trigger a file download with the current CSV data
4. WHEN a user enters an incorrect Admin Password THEN the Survey System SHALL display an error message and prevent the download
5. THE Survey System SHALL use the Admin Password value "3939889" for authentication
6. THE Survey System SHALL name the downloaded file with a timestamp format: survey_responses_YYYYMMDD_HHMMSS.csv
7. THE Survey System SHALL ensure the downloaded CSV File is properly encoded in UTF-8 to support Chinese characters

### 需求 10

**使用者故事：** 作為開發者，我想要系統能夠部署到 Cloudflare Pages，以便提供快速且可靠的服務

#### 驗收標準

1. THE Survey System SHALL be implemented as a static web application compatible with Cloudflare Pages
2. THE Survey System SHALL use client-side storage mechanisms compatible with browser environments
3. THE Survey System SHALL not require server-side processing for basic functionality
4. THE Survey System SHALL function correctly when served from Cloudflare Pages CDN

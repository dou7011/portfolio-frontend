# 🚀 Portfolio Frontend (個人網頁前端)

這是一個使用 **Angular 21 Standalone 架構** 建構的個人履歷與作品集前端專案。
目前專案已串接 Cloudflare Workers 後端 API，包含履歷資料讀取、履歷編輯、管理員登入、JWT Token 攔截與受保護路由驗證流程。

## ✨ 核心技術棧 (Tech Stack)

* **前端框架**: [Angular](https://angular.dev/) 21
* **架構模式**: Standalone Components + ApplicationConfig
* **開發語言**: TypeScript
* **樣式處理**: CSS
* **非同步處理**: RxJS
* **HTTP 與 DI**: Angular HttpClient、Interceptor、`inject()` API

## 📁 目前專案結構

```text
portfolio-frontend/
├── src/
│   ├── app/
│   │   ├── guards/              # 路由守衛（auth.guard.ts）
│   │   ├── interceptors/        # HTTP 攔截器（auth.interceptor.ts）
│   │   ├── models/              # 前後端資料結構介面（resume.interface.ts）
│   │   ├── pages/
│   │   │   ├── home/            # 首頁履歷展示頁
│   │   │   ├── login/           # 管理員登入頁
│   │   │   └── register/        # 臨時管理員建立頁
│   │   ├── services/            # API 服務層（auth.service.ts、resume.service.ts）
│   │   ├── app.config.ts        # Router、HttpClient、Interceptor 提供者設定
│   │   ├── app.routes.ts        # 路由設定
│   │   ├── app.ts               # Root component
│   │   └── app.spec.ts          # 基本單元測試
│   ├── environments/            # 開發 / 正式環境 API 設定
│   ├── main.ts                  # Angular 啟動入口
│   └── styles.css               # 全域樣式
├── public/                      # 靜態資源
├── angular.json                 # Angular 專案設定
└── package.json                 # 套件與腳本設定
```

## 🛠️ 本地開發環境設置

### 1. 安裝依賴套件

```bash
npm install
```

### 2. 確認 API 環境設定

專案使用 `src/environments/` 管理 API 位址：

* **`environment.development.ts`**：`http://localhost:8787/api`
* **`environment.ts`**：`https://portfolio-backend.dou7011.workers.dev/api`

### 3. 啟動開發伺服器

請先確認後端 API 已啟動，再執行：

```bash
npm start
```

前端開發伺服器預設運行於 `http://localhost:4200/`。

### 4. 執行測試

```bash
npm test
```

## 🗺️ 目前路由與頁面

* **`/`**：首頁，顯示履歷內容，支援中英文切換
* **`/login`**：系統管理員登入頁
* **`/admin`**：受 `authGuard` 保護的管理路由，預設會重新導向 `/admin/resume`
* **`/admin/resume`**：履歷編輯頁面，可編輯標題、簡介、技能、工作經歷、學歷與證照
* **萬用路由 (`**`)**：未定義路由會重新導回首頁

## ✅ 目前已完成功能

- [x] Angular Standalone 基礎環境建置
- [x] Router 與 HttpClient 全域設定
- [x] Development / Production 環境 API 切換
- [x] 串接履歷 API 並支援 `lang` 查詢參數
- [x] 首頁履歷資料動態渲染
- [x] 中英文履歷切換
- [x] 載入中與錯誤狀態處理
- [x] 管理員登入表單與 JWT Token 儲存
- [x] HTTP Interceptor 自動附加 Bearer Token
- [x] Auth Guard 透過 `/auth/me` 驗證登入狀態
- [x] 管理界面履歷編輯功能（`/admin/resume`）
- [x] `PUT /resume` API 更新履歷：傳送 `lang`, `title`, `summary`, `skills`, `experience`, `education`, `certifications`
- [x] 工作與學歷時間改用年月選擇器，不再手動輸入日期格式

## ⚠️ 目前狀態說明

* `/admin` 路由已改為預設導向 `/admin/resume`，而非僅顯示暫時建立頁。
* `RegisterComponent` 相關路由仍保留為註解，暫時未對外開放。
* `authGuard` 若驗證失敗會拒絕進入受保護頁面。

---
*Developed with Angular.*
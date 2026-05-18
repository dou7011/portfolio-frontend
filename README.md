# 🚀 Portfolio Frontend (個人網頁前端)

這是一個使用最新版 **Angular (Standalone 模式)** 建構的個人履歷與作品集前端專案。
此專案與基於 Cloudflare Workers + D1 的無伺服器後端 API 完美整合，具備極佳的效能、嚴謹的型別檢查與極致的開發體驗。

## ✨ 核心技術棧 (Tech Stack)

* **前端框架**: [Angular](https://angular.dev/) (v17+ Standalone Component 架構)
* **開發語言**: TypeScript
* **樣式處理**: CSS
* **非同步處理**: RxJS
* **狀態與依賴注入**: Angular `inject()` API & Services

## 📁 核心目錄結構

```text
portfolio-frontend/
├── src/
│   ├── app/
│   │   ├── pages/         # 頁面元件 (例如：Home, Login)
│   │   ├── services/      # 負責與後端 API 溝通的服務層 (例如：resume.service.ts)
│   │   ├── app.config.ts  # 全域設定檔 (包含 Router 與 HttpClient 提供者)
│   │   └── app.routes.ts  # 路由設定
│   ├── environments/      # 環境變數設定檔 (區分開發與正式上線環境)
│   └── styles.scss        # 全域共用樣式表
└── angular.json           # Angular 專案核心設定
```

## 🛠️ 本地開發環境設置 (Local Setup)

### 1. 安裝依賴套件

```bash
npm install
```

### 2. 環境變數設定 (Environment Variables)

專案預設需要設定後端 API 的位址。請確認 `src/environments/` 目錄下的設定：

* **`environment.development.ts`** (本地開發)：
  預設指向本地 Wrangler 伺服器 `http://localhost:8787/api`
* **`environment.ts`** (正式環境)：
  預設指向 Cloudflare Workers 正式網址。

### 3. 啟動開發伺服器

請確保後端伺服器已啟動後，執行以下指令：

```bash
npm start
```

伺服器將預設運行在 `http://localhost:4200/`，且會在修改程式碼時自動重新載入 (Live Reload)。

## 🗺️ 目前實作進度 (Features)

- [x] Angular 基礎環境建置與 HttpClient 設定
- [x] 多環境變數管理機制 (Development / Production)
- [x] 後端 API (Cloudflare D1) 成功串接與跨域 (CORS) 處理
- [x] 履歷資料取得與動態渲染 (Resume Service)
- [ ] 履歷畫面視覺化排版 (UI/UX)
- [ ] 系統管理員登入機制 (JWT Auth)
- [ ] 路由守衛防護 (Auth Guard)

---
*Developed with ❤️ using Angular.*
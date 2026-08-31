# Portfolio Frontend

這個專案是個人作品集與履歷網站的前端，使用 Angular 21 Standalone Components 建立，負責展示履歷與作品內容，並提供受保護的後台管理頁面。

## 目前技術棧

- Angular 21
- Standalone Components
- TypeScript
- RxJS
- Angular Router + HttpClient
- JWT auth flow through backend API

## 專案結構

```text
portfolio-frontend/
├── src/                                     # Angular 應用程式來源碼
│   ├── app/                                 # 應用程式根層
│   │   ├── components/                      # 共用 UI 元件
│   │   │   └── toast/                       # Toast 通知組件
│   │   │       └── toast.component.ts       # 顯示成功/錯誤通知
│   │   ├── guards/                          # 路由守衛
│   │   │   └── auth.guard.ts                # 檢查是否已登入並保護 admin 路由
│   │   ├── interceptors/                    # HTTP 攔截器
│   │   │   └── auth.interceptor.ts          # 自動附加 Authorization header
│   │   ├── models/                          # API / 資料結構型別
│   │   │   ├── api.interface.ts             # API 回應通用型別
│   │   │   ├── article.interface.ts         # 文章資料介面
│   │   │   ├── auth.interface.ts            # 登入使用者型別
│   │   │   ├── permission.interface.ts      # 權限型別
│   │   │   ├── resume.interface.ts          # 履歷資料型別
│   │   │   ├── role.interface.ts            # 角色型別
│   │   │   └── user.interface.ts            # 使用者型別
│   │   ├── pages/                           # 各頁面元件
│   │   │   ├── admin/                       # 後台管理頁
│   │   │   │   ├── admin/                   # 管理 shell / 側邊導航
│   │   │   │   │   ├── admin.ts             # 後台主容器元件
│   │   │   │   │   ├── admin.html           # 後台版型
│   │   │   │   │   └── admin.css            # 後台樣式
│   │   │   │   ├── permissions/             # 權限管理頁
│   │   │   │   ├── resume-edit/             # 履歷編輯頁
│   │   │   │   ├── roles/                   # 角色管理頁
│   │   │   │   └── users/                   # 使用者管理頁
│   │   │   ├── home/                        # 首頁
│   │   │   │   ├── home.ts                  # 首頁資料載入與 UI 邏輯
│   │   │   │   ├── home.html                # 首頁版型
│   │   │   │   └── home.css                 # 首頁樣式
│   │   │   ├── login/                       # 管理員登入頁
│   │   │   │   ├── login.ts                 # 登入邏輯
│   │   │   │   ├── login.html               # 登入表單
│   │   │   │   └── login.css                # 登入頁樣式
│   │   │   └── resume/                      # 履歷展示頁
│   │   │       ├── resume-interactive/      # 互動式履歷版型
│   │   │       └── resume-formal/           # 正式履歷版型
│   │   ├── services/                        # API 服務層
│   │   │   ├── articles.service.ts          # 文章資料 API
│   │   │   ├── auth.service.ts              # 登入 / logout / JWT 驗證
│   │   │   ├── permission.service.ts        # 權限資料 API
│   │   │   ├── resume.service.ts            # 履歷 API
│   │   │   ├── role.service.ts              # 角色 API
│   │   │   ├── toast.service.ts             # 全域通知服務
│   │   │   └── user.service.ts              # 使用者 API
│   │   ├── app.config.ts                    # Router / HTTP / provider 設定
│   │   ├── app.routes.ts                    # 路由配置
│   │   ├── app.ts                           # App root component
│   │   ├── app.html                         # Root layout 與全域導覽
│   │   ├── app.css                          # 全域樣式
│   │   └── app.spec.ts                      # 基本 app 測試
│   ├── environments/                        # 環境變數設定
│   │   ├── environment.development.ts       # 本機 API base URL
│   │   └── environment.ts                   # 正式 / 預設 API base URL
│   ├── index.html                           # Angular HTML entry
│   ├── main.ts                              # 啟動 entry point
│   └── styles.css                           # 全域 shared style
├── public/                                  # 靜態資源（如 favicon、圖片等）
├── angular.json                              # Angular 專案設定
├── package.json                              # 專案腳本與依賴
├── tsconfig.json                             # TypeScript 基本設定
├── tsconfig.app.json                         # App 編譯設定
├── tsconfig.spec.json                        # 測試編譯設定
├── README.md                                 # 專案說明文件
├── .gitignore                                # Git 忽略設定
└── ...
```

## 目前路由

- `/`：首頁，展示個人簡介與精選作品
- `/resume`：互動式履歷頁
- `/resume-formal`：正式履歷頁
- `/login`：後台登入頁
- `/admin`：受保護管理頁面，預設導向 `/admin/resume`
  - `/admin/resume`
  - `/admin/users`
  - `/admin/roles`
  - `/admin/permissions`

> 目前沒有單獨的 `/articles` 前端頁面；首頁上的作品卡片是由後端文章資料匯入，不會導向不存在的路由。

## 本機開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動前端

請先確認後端已在本機啟動：

```bash
npm start
```

預設開發地址：

```text
http://localhost:4200/
```

### 3. 建置專案

```bash
npm run build
```

### 4. 執行測試

```bash
npm test
```

## 目前功能狀態

- [x] 首頁展示與精選作品區塊
- [x] 互動式與正式履歷頁
- [x] 管理者登入與 JWT 保存
- [x] `AuthInterceptor` 自動附加 Bearer Token
- [x] `authGuard` 保護管理路由
- [x] 使用者 / 角色 / 權限 CRUD 管理
- [x] 履歷內容編輯
- [x] 亮暗主題切換
- [x] Toast 通知與全域錯誤處理

## 專案維護重點

這次整理修正了幾個過時點：

- 移除未使用的靜態原型 HTML
- 刪除過時的註冊型別與錯誤路由假設
- 修正首頁與導覽中不存在的 `/articles` 連結
- README 現在與實際架構一致


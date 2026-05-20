# 專案回報中心 Doc 同步系統

把 index.html 的 Firebase 資料（TRUNKS / NODES / DAILY_REPORTS / MENTIONS / MEMBERS / 設定）**即時同步**到 Google Doc，分章節各自獨立覆蓋。

## 架構

```
┌─────────────────┐   onSnapshot     ┌──────────────────┐
│  Firebase       │ ───────────────▶ │  index.html      │
│  Firestore      │                  │  + sync.js       │
└─────────────────┘                  └────────┬─────────┘
                                              │  POST (debounce 5s)
                                              ▼
                                     ┌──────────────────┐
                                     │  Apps Script     │
                                     │  Web App         │
                                     │  (Code.gs)       │
                                     └────────┬─────────┘
                                              │  DocumentApp API
                                              ▼
                                     ┌──────────────────┐
                                     │  Google Doc      │
                                     │  (6 章節覆蓋)    │
                                     └──────────────────┘
```

## 部署步驟

### 0. 先輪替 Firebase 服務帳戶金鑰（重要！）

之前的金鑰已在對話中外洩，要先：

1. 打開 https://console.cloud.google.com/iam-admin/serviceaccounts?project=game-pm-system02
2. 找到 `firebase-adminsdk-fbsvc@...` → 「金鑰」分頁
3. 刪除舊金鑰、產生新金鑰（JSON）
4. 新金鑰只用在 Apps Script，不要再貼到別的地方

> 註：這套同步系統其實 **不需要** 服務帳戶（Apps Script 不會直接讀 Firestore，是由 app.js 主動 POST），所以你也可以乾脆把原本的 `doGet` + Firebase 服務帳戶整段刪掉，安全性更好。

### 1. 設定 Apps Script

1. 打開 Google Doc：https://docs.google.com/document/d/1EbTbo-ct85ESlaG9821kdUcn8I0hY-MVZLC970_Nmdw/edit
2. 選單「擴充功能 → Apps Script」
3. 把 `Code.gs` 內容**整段**貼進去（覆蓋既有的 `doGet`）
4. Ctrl+S 存檔
5. 上方選單「執行」→ 選函式 `initDoc` → 執行
   - 第一次會跳授權，按「審查權限 → 允許」
   - 執行完 Doc 裡會自動補齊 6 個 H1 骨架
6. 「部署」→「新增部署作業」→ 齒輪選「網頁應用程式」
   - 說明：填 `doc sync v1` 之類
   - 執行身分：**我（你的帳號）**
   - 誰可以存取：**任何人**（不選的話 app.js 無法匿名 POST）
7. 部署完會給你一個 Web App URL，長這樣：
   `https://script.google.com/macros/s/AKfycb.../exec`
8. **複製這個 URL**

### 2. 設定前端 sync.js

1. 打開 `doc-sync/sync.js`
2. 把第 27 行的 `'PASTE_APPS_SCRIPT_WEB_APP_URL_HERE'` 改成剛才那個 Web App URL
3. （選用）把 `SYNC_TOKEN` 改成更長的隨機字串，並同步改 `Code.gs` 第 24 行

### 3. 在 index.html 載入 sync.js

打開 `index.html`，在 `<script src="app.js"></script>` 那一行**之後**加一行：

```html
<script src="doc-sync/sync.js"></script>
```

### 4. 測試

1. 重新整理 index.html
2. 開 F12 Console，應該看到：
   ```
   [DocSync] Firestore ready, attaching listeners
   ```
3. 8 秒後會看到：
   ```
   [DocSync] trunks ok (N blocks)
   [DocSync] nodes ok (N blocks)
   ...
   ```
4. 打開 Doc，6 個章節應該都填上內容了
5. 在 index.html 修改任一專案 / 留言，5 秒後 Doc 對應章節自動更新

### Console 工具

```js
DocSync.reSync()           // 全部重推
DocSync.reSync('nodes')    // 只重推留言泡泡
DocSync.status             // 看每個章節的最後同步狀態
```

## 章節對應表

| collection key | Doc Heading 1                | 觸發 |
|---|---|---|
| trunks         | `1. 主幹專案 (TRUNKS)`       | trunks 集合變動 |
| nodes          | `2. 留言泡泡 (NODES)`        | nodes 集合變動 |
| dailyReports   | `3. 每日進度 (DAILY_REPORTS)`| dailyReports 變動 |
| mentions       | `4. 標註紀錄 (MENTIONS)`     | mentions 變動 |
| members        | `5. 成員 (MEMBERS)`          | members 變動 |
| dictionary     | `6. 資料字典`                | settings 變動 |

## 已知限制

- **Apps Script Web App 配額：** 一般帳號每日 6 小時執行時間、每分鐘最多 30 次觸發。debounce 5 秒夠用，但如果同時 10 個人狂改可能會卡。
- **Doc 不會即時刷新給其他正在開的人：** 必須重新整理 Doc 才看得到最新內容（Google Docs 本身的限制，不是這套的問題）。
- **圖片內容不會進 Doc：** NODES 的圖片只會顯示「🖼️ N 張」計數。要看圖請回 index.html。
- **回覆 (replies) 結構假設：** sync.js 假設 NODES 有 `replies: [{member, date, msg}]` 陣列。若你的實作不同，需調整 `buildNodesBlocks()`。
- **archived 欄位假設：** sync.js 用 `item.archived` 或 `item.isArchived` 判斷封存。若你的欄位名不同，請改 `isArchived()` 函式。

## 檔案

- `Code.gs` — Apps Script 端
- `sync.js` — 前端推送模組
- `doc-skeleton.md` — Doc 骨架說明
- `README.md` — 本檔

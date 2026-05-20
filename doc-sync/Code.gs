/**
 * 閃動格子 — 專案回報中心 Doc 同步端點 (Apps Script Web App)
 *
 * 功能：
 *   - 接收來自 index.html / app.js 的 POST，依 collection 重寫對應 Doc 章節
 *   - 章節 heading 必須完全照 SECTION_HEADINGS 文字才會被偵測
 *   - 使用 LockService 避免多筆同時寫入互相覆蓋
 *
 * 部署步驟：
 *   1. 在 Apps Script 編輯器把這個檔案內容貼進來，存檔
 *   2. 第一次先「執行」→ initDoc()  → 它會在 Doc 上補齊 6 個 Heading 1 骨架
 *   3. 「部署」→「新增部署作業」→ 類型「網頁應用程式」
 *      - 執行身分：我（你自己的 Google 帳號）
 *      - 誰可以存取：任何人（這樣 app.js 才能匿名 POST）
 *   4. 部署完取得 Web App URL，貼到 sync.js 的 SYNC_WEBAPP_URL
 *
 * 安全提醒：
 *   - SYNC_TOKEN 是弱保護（URL 公開），仍須輪替 Firebase 服務帳戶金鑰
 *   - 部署網址洩漏不至於導致 Firebase 寫入，但任何人能改寫你的 Doc
 */

const DOC_ID      = '1EbTbo-ct85ESlaG9821kdUcn8I0hY-MVZLC970_Nmdw';
const SYNC_TOKEN  = 'game_sync_888';   // 之後請改成更長的隨機字串

const SECTION_HEADINGS = {
  trunks       : '1. 主幹專案 (TRUNKS)',
  nodes        : '2. 留言泡泡 (NODES)',
  dailyReports : '3. 每日進度 (DAILY_REPORTS)',
  mentions     : '4. 標註紀錄 (MENTIONS)',
  members      : '5. 成員 (MEMBERS)',
  dictionary   : '6. 資料字典'
};

// ──────────────────────────────────────────────────────────────────────
// HTTP entry points
// ──────────────────────────────────────────────────────────────────────

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // 30s
  } catch (err) {
    return _resp({ok:false, error:'busy, please retry'});
  }
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== SYNC_TOKEN) return _resp({ok:false, error:'unauthorized'});

    const heading = SECTION_HEADINGS[body.collection];
    if (!heading) return _resp({ok:false, error:'unknown collection: '+body.collection});

    if (!Array.isArray(body.blocks)) return _resp({ok:false, error:'blocks must be array'});

    const doc  = DocumentApp.openById(DOC_ID);
    const root = doc.getBody();
    _replaceSection(root, heading, body.blocks);
    doc.saveAndClose();

    return _resp({ok:true, collection:body.collection, blocks:body.blocks.length, at:new Date().toISOString()});
  } catch (err) {
    return _resp({ok:false, error:err.message, stack:String(err.stack || '')});
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  // 健康檢查用：訪問 ?ping=1 看是否活著
  if (e.parameter && e.parameter.ping) {
    return _resp({ok:true, msg:'doc-sync alive', at:new Date().toISOString()});
  }
  return _resp({ok:false, error:'use POST'});
}

function _resp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────────────────────────────
// Section replace
// ──────────────────────────────────────────────────────────────────────

/**
 * 找到 heading 對應的 Heading 1 段落，刪除直到下一個 Heading 1（或文件結尾），
 * 然後在該位置依序插入 blocks。
 */
function _replaceSection(body, headingText, blocks) {
  const n = body.getNumChildren();
  let startIdx = -1, endIdx = -1;

  for (let i = 0; i < n; i++) {
    const c = body.getChild(i);
    if (c.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    const p = c.asParagraph();
    if (p.getHeading() !== DocumentApp.ParagraphHeading.HEADING1) continue;
    const t = p.getText().trim();
    if (startIdx === -1) {
      if (t === headingText) startIdx = i;
    } else {
      endIdx = i;
      break;
    }
  }
  if (startIdx === -1) throw new Error('heading not found: '+headingText+'（請先執行 initDoc 建立骨架，或檢查 Doc 內 heading 文字是否完全一致）');
  if (endIdx === -1) endIdx = body.getNumChildren();

  // 若這是文件最後一個章節，預先在文件結尾加一個空段落，
  // 否則刪到最後一個段落時 Google Docs 會丟「不得移除最後一個段落」錯誤
  if (endIdx === body.getNumChildren()) {
    body.appendParagraph('');
    // endIdx 維持原值；新增的空段落落在 endIdx 之後，不會被本次刪除迴圈動到
  }

  // 刪除 startIdx+1 ~ endIdx-1
  for (let i = endIdx - 1; i > startIdx; i--) {
    body.removeChild(body.getChild(i));
  }

  // 從 startIdx+1 開始依序插入
  let cursor = startIdx + 1;
  if (!blocks.length) {
    body.insertParagraph(cursor, '（無資料）').setItalic(true);
    return;
  }
  for (let i = 0; i < blocks.length; i++) {
    cursor = _renderBlock(body, cursor, blocks[i]);
  }
}

/**
 * 將單一 block 插入 body，回傳下一個可插入的 index。
 * block 形態：
 *   { type:'h2', text }
 *   { type:'h3', text }
 *   { type:'p',  text, italic?, archived? }
 *   { type:'bullet', text }
 *   { type:'sub',    text }   // 縮排條列（用於回覆）
 *   { type:'table', headers:[], rows:[[]], widths?:[] }
 *   { type:'spacer' }
 */
function _renderBlock(body, idx, b) {
  switch (b.type) {
    case 'h2': {
      const p = body.insertParagraph(idx, b.text || '');
      p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      return idx + 1;
    }
    case 'h3': {
      const p = body.insertParagraph(idx, b.text || '');
      p.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      return idx + 1;
    }
    case 'p': {
      const p = body.insertParagraph(idx, b.text || '');
      if (b.italic) p.setItalic(true);
      if (b.archived) p.setForegroundColor('#888888');
      return idx + 1;
    }
    case 'bullet': {
      const li = body.insertListItem(idx, b.text || '');
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      return idx + 1;
    }
    case 'sub': {
      const li = body.insertListItem(idx, b.text || '');
      li.setGlyphType(DocumentApp.GlyphType.BULLET).setNestingLevel(1);
      return idx + 1;
    }
    case 'table': {
      const cells = [];
      cells.push(b.headers || []);
      (b.rows || []).forEach(r => cells.push(r));
      const t = body.insertTable(idx, cells);
      // 表頭加粗
      if (t.getNumRows() > 0) {
        const headRow = t.getRow(0);
        for (let c = 0; c < headRow.getNumCells(); c++) {
          headRow.getCell(c).setBackgroundColor('#f0f0f0');
          headRow.getCell(c).editAsText().setBold(true);
        }
      }
      return idx + 1;
    }
    case 'spacer': {
      body.insertParagraph(idx, '');
      return idx + 1;
    }
    default: {
      body.insertParagraph(idx, '⚠️ 未知 block 類型: '+(b.type||'?'));
      return idx + 1;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// 初始化 Doc 骨架（第一次用）
// ──────────────────────────────────────────────────────────────────────

function initDoc() {
  const doc  = DocumentApp.openById(DOC_ID);
  const body = doc.getBody();

  // 收集現有的 Heading 1 文字
  const existing = new Set();
  for (let i = 0; i < body.getNumChildren(); i++) {
    const c = body.getChild(i);
    if (c.getType() === DocumentApp.ElementType.PARAGRAPH) {
      const p = c.asParagraph();
      if (p.getHeading() === DocumentApp.ParagraphHeading.HEADING1) {
        existing.add(p.getText().trim());
      }
    }
  }

  // 缺少的章節補在文件末尾
  Object.keys(SECTION_HEADINGS).forEach(k => {
    const txt = SECTION_HEADINGS[k];
    if (!existing.has(txt)) {
      body.appendParagraph(txt).setHeading(DocumentApp.ParagraphHeading.HEADING1);
      body.appendParagraph('（尚未同步）').setItalic(true);
    }
  });
  doc.saveAndClose();
  Logger.log('initDoc done');
}

// ──────────────────────────────────────────────────────────────────────
// 手動測試用（在 Apps Script 編輯器執行）
// ──────────────────────────────────────────────────────────────────────

function _testMembersWrite() {
  const fakeReq = {
    postData: { contents: JSON.stringify({
      token: SYNC_TOKEN,
      collection: 'members',
      blocks: [
        { type:'p', text:'目前共 2 名成員。' },
        { type:'table',
          headers:['ID','名稱','顏色','狀態'],
          rows:[['M','Momo','#1976d2','在職'],['K','Kai','#d32f2f','已停用']]
        }
      ]
    }) }
  };
  const r = doPost(fakeReq);
  Logger.log(r.getContent());
}

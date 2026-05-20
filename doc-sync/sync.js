/**
 * 閃動格子 — Doc 同步前端模組
 *
 * 用法：
 *   1. 在 index.html 的 <script src="app.js"> 之後加上：
 *        <script src="doc-sync/sync.js"></script>
 *   2. 部署好 Apps Script Web App 後，把網址填到下面 SYNC_WEBAPP_URL
 *   3. App 啟動後會自動：
 *      - 對 trunks / nodes / members / dailyReports / mentions 各掛一個 onSnapshot
 *      - 任一變動觸發 5 秒 debounce，然後 POST 對應章節到 Apps Script
 *      - dictionary（settings）在啟動時推一次（變動很少，可手動 reSync）
 *   4. Console 可用：
 *      - DocSync.reSync('all')        // 全部章節重推
 *      - DocSync.reSync('trunks')     // 單一章節重推
 *      - DocSync.status               // 看每個章節的最後同步時間
 */

(function(){
  'use strict';
  console.log('[DocSync] sync.js loaded, script start');

  // ════════════════════════════════════════════════════════════════════
  // 設定
  // ════════════════════════════════════════════════════════════════════

  const SYNC_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwvDCVGTiiByIVfuzZkhK6tYHJihXaKUpKDV9xie45OwsKwFAWmBkrDwUXX0P2tcUXAYQ/exec';
  const SYNC_TOKEN      = 'game_sync_888';
  const DEBOUNCE_MS     = 5000;

  // 跨 <script> 取得全域變數（app.js 用 let/const 宣告，不在 window 上）
  // 用 eval 在全域 lexical scope 找名稱，找不到回傳 undefined
  function $g(name) {
    try { return (0, eval)(name); } catch (e) { return undefined; }
  }
  const G = {
    get db()                { return $g('db'); },
    get MEMBERS()           { return $g('MEMBERS') || []; },
    get TRUNKS()            { return $g('TRUNKS') || []; },
    get NODES()             { return $g('NODES') || []; },
    get DAILY_REPORTS()     { return $g('DAILY_REPORTS') || []; },
    get MENTIONS()          { return $g('MENTIONS') || []; },
    get CATS()              { return $g('CATS') || []; },
    get REPORT_TYPES()      { return $g('REPORT_TYPES') || []; },
    get PROJECT_STATUSES()  { return $g('PROJECT_STATUSES') || []; },
    get PRIORITIES()        { return $g('PRIORITIES') || []; },
    get deriveTrunkStatus() { return $g('deriveTrunkStatus'); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Lookup helpers（從 app.js 全域抓資料）
  // ════════════════════════════════════════════════════════════════════

  function memName(id) {
    const m = (G.MEMBERS || []).find(x => x.id === id);
    return m ? m.name : (id || '?');
  }
  function memNames(ids) {
    return (ids || []).map(memName).join(', ');
  }
  function statusLabel(id) {
    const s = (G.PROJECT_STATUSES || []).find(x => x.id === id);
    return s ? s.label : (id || '');
  }
  function priorityLabel(id) {
    const p = (G.PRIORITIES || []).find(x => x.id === id);
    return p ? p.label : (id || '');
  }
  function reportTypeLabel(id) {
    const r = (G.REPORT_TYPES || []).find(x => x.id === id);
    return r ? r.label : (id || '');
  }
  function catLabel(id) {
    const c = (G.CATS || []).find(x => x.id === id);
    return c ? c.label : (id || '');
  }
  function findBranch(branchId) {
    for (const t of (G.TRUNKS || [])) {
      const b = (t.branches || []).find(x => x.id === branchId);
      if (b) return { trunk:t, branch:b };
    }
    return null;
  }
  function fmtDate(d) { return d || '(無日期)'; }
  function fmtRange(s, e) {
    return (s || '?') + ' ~ ' + (e || '進行中');
  }
  function isArchived(item) {
    return !!(item && (item.archived || item.isArchived));
  }
  function arch(item) { return isArchived(item) ? '📦 ' : ''; }

  // ════════════════════════════════════════════════════════════════════
  // Block builders — 每個 collection 一個函式，回傳 blocks 陣列
  // ════════════════════════════════════════════════════════════════════

  function buildTrunksBlocks() {
    const trunks = G.TRUNKS || [];
    const blocks = [];
    blocks.push({ type:'p', text:'共 ' + trunks.length + ' 個主幹專案（含已封存）。', italic:true });

    trunks.forEach(t => {
      const status   = statusLabel((G.deriveTrunkStatus ? G.deriveTrunkStatus(t).id : t.status) || 'todo');
      const priority = priorityLabel(t.priority || 'normal');
      const owners   = memNames(t.owners && t.owners.length ? t.owners : (t.owner ? [t.owner] : []));
      const collabs  = memNames(t.collaborators || []);
      const trackers = memNames(t.trackers || []);
      const links    = (t.links || []).join('  |  ') || '—';

      blocks.push({ type:'h2', text: arch(t) + (t.name || '(未命名)') + '  (id: ' + t.id + ')' });
      blocks.push({ type:'bullet', text:'狀態：' + status + '    優先度：' + priority });
      blocks.push({ type:'bullet', text:'期間：' + fmtRange(t.start, t.end) });
      blocks.push({ type:'bullet', text:'負責人：' + (owners||'—') + '    協作：' + (collabs||'—') + '    追蹤：' + (trackers||'—') });
      blocks.push({ type:'bullet', text:'連結：' + links });
      if (t.desc) blocks.push({ type:'bullet', text:'說明：' + t.desc });

      const bs = t.branches || [];
      if (bs.length) {
        blocks.push({ type:'h3', text:'枝幹（' + bs.length + '）' });
        blocks.push({ type:'table',
          headers:['ID','名稱','期間','進度','狀態'],
          rows: bs.map(b => [
            arch(b) + b.id,
            b.name || '',
            fmtRange(b.start, b.end),
            (b.prog != null ? b.prog + '%' : '—'),
            statusLabel(b.status || '')
          ])
        });
      }
      blocks.push({ type:'spacer' });
    });
    return blocks;
  }

  function buildNodesBlocks() {
    const nodes = G.NODES || [];
    const trunks = G.TRUNKS || [];

    // group by trunk → branch
    const grouped = {}; // trunkId -> branchId -> nodes[]
    nodes.forEach(n => {
      const tId = n.trunk || '_';
      const bId = n.branch || '_';
      grouped[tId] = grouped[tId] || {};
      grouped[tId][bId] = grouped[tId][bId] || [];
      grouped[tId][bId].push(n);
    });

    const blocks = [];
    blocks.push({ type:'p', text:'共 ' + nodes.length + ' 則留言泡泡（含已封存）。', italic:true });

    trunks.forEach(t => {
      const g = grouped[t.id];
      if (!g) return;
      (t.branches || []).forEach(b => {
        const list = g[b.id];
        if (!list || !list.length) return;
        blocks.push({ type:'h2', text: arch(t) + t.name + ' / ' + arch(b) + b.name + '  （' + list.length + ' 則）' });
        // 依日期排序（新→舊）
        const sorted = list.slice().sort((a,c) => (c.date||'').localeCompare(a.date||''));
        sorted.forEach(n => {
          const type    = reportTypeLabel(n.type);
          const author  = memName(n.member);
          const collabs = (n.collaborators||[]).length ? '  (協作: ' + memNames(n.collaborators) + ')' : '';
          const archTag = isArchived(n) ? '  📦' : '';
          blocks.push({ type:'bullet', text: fmtDate(n.date) + '  ' + type + '  ' + author + collabs + archTag });
          if (n.msg)   blocks.push({ type:'sub', text: n.msg });
          if (n.notes) blocks.push({ type:'sub', text: '備註：' + n.notes });
          if ((n.images||[]).length) blocks.push({ type:'sub', text: '🖼️ ' + n.images.length + ' 張圖片' });
          if ((n.replies||[]).length) {
            n.replies.forEach(r => {
              blocks.push({ type:'sub', text: '↳ ' + memName(r.member) + '  ' + (r.date||'') + '：' + (r.msg||'') });
            });
          }
        });
        blocks.push({ type:'spacer' });
      });
    });
    return blocks;
  }

  function buildDailyReportsBlocks() {
    const list = (G.DAILY_REPORTS || []).slice();
    list.sort((a,b) => (b.date||'').localeCompare(a.date||''));

    // group by date
    const byDate = {};
    list.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });

    const blocks = [];
    blocks.push({ type:'p', text:'共 ' + list.length + ' 筆每日進度記錄。', italic:true });

    Object.keys(byDate).sort((a,b) => b.localeCompare(a)).forEach(date => {
      const d = new Date(date);
      const wk = ['日','一','二','三','四','五','六'][d.getDay()];
      blocks.push({ type:'h2', text: date + ' (週' + wk + ')' });
      byDate[date].forEach(r => {
        const bInfo = findBranch(r.branch);
        const branchName = bInfo ? (bInfo.trunk.name + ' / ' + bInfo.branch.name) : (r.branch || '—');
        blocks.push({ type:'h3', text: memName(r.member) + '  @  ' + branchName });
        (r.entries || []).forEach(en => {
          blocks.push({ type:'bullet', text: '[' + catLabel(en.cat) + ']  ' + (en.note || '') });
        });
      });
      blocks.push({ type:'spacer' });
    });
    return blocks;
  }

  function buildMentionsBlocks() {
    const list = (G.MENTIONS || []).slice();
    list.sort((a,b) => (b.at||'').localeCompare(a.at||''));

    const blocks = [];
    blocks.push({ type:'p', text:'共 ' + list.length + ' 筆標註紀錄。', italic:true });
    if (!list.length) return blocks;
    blocks.push({ type:'table',
      headers:['時間','來源 NODE','標註者 → 被標註','已讀'],
      rows: list.map(m => [
        m.at || '',
        String(m.nodeId || ''),
        memName(m.from) + ' → ' + memName(m.to),
        m.read ? '✓' : ''
      ])
    });
    return blocks;
  }

  function buildMembersBlocks() {
    const list = G.MEMBERS || [];
    const blocks = [];
    blocks.push({ type:'p', text:'共 ' + list.length + ' 位成員（含已停用）。', italic:true });
    blocks.push({ type:'table',
      headers:['ID','名稱','顏色','狀態'],
      rows: list.map(m => [
        m.id || '',
        m.name || '',
        m.color || '',
        m.active === false ? '已停用' : '在職'
      ])
    });
    return blocks;
  }

  function buildDictionaryBlocks() {
    const blocks = [];
    blocks.push({ type:'p', text:'系統設定的對照表（變動頻率低）。', italic:true });

    blocks.push({ type:'h2', text:'專案狀態 (PROJECT_STATUSES)' });
    blocks.push({ type:'table',
      headers:['ID','標籤','文字色','底色'],
      rows: (G.PROJECT_STATUSES||[]).map(s => [s.id, s.label, s.color, s.bg])
    });

    blocks.push({ type:'h2', text:'優先度 (PRIORITIES)' });
    blocks.push({ type:'table',
      headers:['ID','標籤','文字色','底色'],
      rows: (G.PRIORITIES||[]).map(p => [p.id, p.label, p.color, p.bg])
    });

    blocks.push({ type:'h2', text:'回報類型 (REPORT_TYPES)' });
    blocks.push({ type:'table',
      headers:['ID','標籤','文字色','底色'],
      rows: (G.REPORT_TYPES||[]).map(r => [r.id, r.label, r.color, r.bg])
    });

    blocks.push({ type:'h2', text:'進度類別 (CATS)' });
    blocks.push({ type:'table',
      headers:['ID','標籤','文字色','底色'],
      rows: (G.CATS||[]).map(c => [c.id, c.label, c.color, c.bg])
    });
    return blocks;
  }

  const BUILDERS = {
    trunks       : buildTrunksBlocks,
    nodes        : buildNodesBlocks,
    dailyReports : buildDailyReportsBlocks,
    mentions     : buildMentionsBlocks,
    members      : buildMembersBlocks,
    dictionary   : buildDictionaryBlocks
  };

  // ════════════════════════════════════════════════════════════════════
  // Debounced push
  // ════════════════════════════════════════════════════════════════════

  const _timers = {};
  const status = {}; // collection -> { lastAt, lastOk, lastError }
  let _queue = Promise.resolve(); // 全域序列化佇列：所有 _push 排隊執行
  const _pending = new Set();     // 已排入佇列但尚未跑的 collection（去重用）

  function _push(collection) {
    const builder = BUILDERS[collection];
    if (!builder) return Promise.reject(new Error('unknown collection: '+collection));
    const blocks = builder();
    const payload = { token: SYNC_TOKEN, collection, blocks };

    if (!SYNC_WEBAPP_URL || SYNC_WEBAPP_URL.indexOf('PASTE_') === 0) {
      console.warn('[DocSync] SYNC_WEBAPP_URL 尚未設定，跳過推送', collection);
      return Promise.resolve();
    }
    return fetch(SYNC_WEBAPP_URL, {
      method: 'POST',
      // 不指定 Content-Type 以避開 preflight；Apps Script 會以 text 接收後 JSON.parse
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).then(r => r.text()).then(txt => {
      let parsed = null;
      try { parsed = JSON.parse(txt); } catch(e) {}
      status[collection] = {
        lastAt: new Date().toISOString(),
        lastOk: !!(parsed && parsed.ok),
        lastError: parsed && parsed.ok ? null : (parsed && parsed.error) || txt.slice(0,200)
      };
      if (!parsed || !parsed.ok) console.warn('[DocSync] '+collection+' 失敗：', status[collection].lastError);
      else console.log('[DocSync] '+collection+' ok ('+blocks.length+' blocks)');
    }).catch(err => {
      status[collection] = { lastAt:new Date().toISOString(), lastOk:false, lastError:String(err) };
      console.warn('[DocSync] '+collection+' fetch 失敗：', err);
    });
  }

  function schedule(collection) {
    if (_timers[collection]) clearTimeout(_timers[collection]);
    _timers[collection] = setTimeout(() => {
      // 同一 collection 已在排隊就不重複加
      if (_pending.has(collection)) return;
      _pending.add(collection);
      _queue = _queue.then(() => {
        _pending.delete(collection);
        return _push(collection);
      });
    }, DEBOUNCE_MS);
  }

  function reSync(target) {
    if (!target || target === 'all') {
      // 序列推送，避免 Apps Script LockService 一窩蜂排隊超時
      return Object.keys(BUILDERS).reduce(
        (p, key) => p.then(() => _push(key)),
        Promise.resolve()
      );
    }
    return _push(target);
  }

  // ════════════════════════════════════════════════════════════════════
  // 接 Firestore：等 app.js 把 db 初始化好之後再掛 listener
  // ════════════════════════════════════════════════════════════════════

  function attach() {
    const db = G.db;
    if (!db || !db.collection) {
      console.log('[DocSync] waiting for Firestore...');
      setTimeout(attach, 1000);
      return;
    }
    console.log('[DocSync] Firestore ready, attaching listeners');

    db.collection('trunks').onSnapshot(() => schedule('trunks'));
    db.collection('nodes').onSnapshot(() => schedule('nodes'));
    db.collection('members').onSnapshot(() => schedule('members'));
    db.collection('dailyReports').onSnapshot(() => schedule('dailyReports'));
    db.collection('mentions').onSnapshot(() => schedule('mentions'));

    // settings 也聽（dictionary）
    db.collection('settings').onSnapshot(() => schedule('dictionary'));

    // 啟動後 8 秒先推一次完整內容，確保 Doc 初始填滿
    setTimeout(() => reSync('all'), 8000);
  }

  // 對外
  window.DocSync = { reSync, status, _push, schedule };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();

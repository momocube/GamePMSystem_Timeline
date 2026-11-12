const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'weekly-report.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function load(extra = {}) {
  const context = vm.createContext({console: {error() {}}, ...extra});
  vm.runInContext(source, context);
  return context.GamePMWeeklyReport;
}

const api = load();
const now = new Date('2026-11-12T02:00:00Z');

test('Wednesday rollover uses Taipei midnight regardless of host timezone', () => {
  const before = api.getPeriods(new Date('2026-11-10T15:59:59Z'));
  const after = api.getPeriods(new Date('2026-11-10T16:00:00Z'));
  assert.equal(before[1].start, '2026-11-04');
  assert.equal(before[1].end, '2026-11-10');
  assert.equal(after[0].start, '2026-11-04');
  assert.equal(after[0].end, '2026-11-10');
  assert.equal(after[1].start, '2026-11-11');
  assert.equal(after[1].end, '2026-11-17');
});

test('periods handle cross-year and leap-day dates', () => {
  assert.equal(api.getPeriods(new Date('2026-01-01T00:00:00Z'))[1].start, '2025-12-31');
  assert.equal(api.getPeriods(new Date('2026-01-01T00:00:00Z'))[0].end, '2025-12-30');
  const leap = api.getPeriods(new Date('2028-02-29T15:59:59Z'));
  assert.equal(leap[1].start, '2028-02-23');
  assert.equal(leap[1].end, '2028-02-29');
});

test('daily content includes exactly the five active members and excludes all other profiles', () => {
  const members = [
    {id: 'a', name: '同名', active: true}, {id: 'b', name: '同名', active: true},
    {id: 'c', name: '無回報'}, {id: 'd', name: '離職', active: false},
    {id: 'e', name: '成員四', active: true}, {id: 'f', name: '成員五', active: true},
    {id: 'g', name: '已停用主管', active: false}
  ];
  const reports = [
    {id: '1', member: 'a', date: '2026-11-04', cat: '設計', text: '左界線 | 保留符號\n第二行', done: false},
    {id: '2', member: 'b', date: '2026-11-10', cat: '文件', text: '不同人的回報'},
    {id: '3', member: 'd', date: '2026-11-11', cat: '請假', text: '休假'},
    {id: '4', member: 'missing-profile', date: '2026-11-12', text: '未知成員紀錄'},
    {id: '5', member: 'a', date: '2026-11-17', cat: '設計', text: '右界線'},
    {id: '6', member: 'a', date: '2026-11-03', text: '太早不應出現'},
    {id: '7', member: 'a', date: '2026-11-18', text: '太晚不應出現'},
    {id: '8', member: 'e', date: '2026-11-12', cat: '請假', text: '當日請假原文'},
    {id: '9', member: 'g', date: '2026-11-12', text: '停用主管紀錄'},
    {id: '10', date: '2026-11-12', text: '未指定成員紀錄'}
  ];
  const result = api.buildText({members, reports, now});
  assert.equal(result.filename, '全員週報_2026-11-04_2026-11-17.txt');
  assert.equal(result.mime, 'text/plain;charset=utf-8');
  assert.equal(result.content.charCodeAt(0), 0xFEFF);
  assert.equal(result.content.replace(/\r\n/g, '').includes('\n'), false);
  assert.equal((result.content.match(/^\uFEFF?2026-\d{2}-\d{2}（.）$/gm) || []).length, 14);
  assert.equal((result.content.match(/^【.*】$/gm) || []).length, 70);
  assert.equal((result.content.match(/【同名】/g) || []).length, 28);
  assert.equal((result.content.match(/【無回報】/g) || []).length, 14);
  assert.equal((result.content.match(/【成員四】/g) || []).length, 14);
  assert.equal((result.content.match(/【成員五】/g) || []).length, 14);
  assert.match(result.content, /左界線 \| 保留符號\r\n    第二行/);
  assert.match(result.content, /2026-11-17（二）/);
  assert.match(result.content, /當日請假原文/);
  assert.doesNotMatch(result.content, /太早不應出現|太晚不應出現|missing-profile|未知成員紀錄|未指定成員紀錄|離職|停用主管|休假/);
  assert.doesNotMatch(result.content, /匯出時間|週期：|範圍：|合計|工作類型|筆工作|筆請假|未結算|預填紀錄|\[設計\]|\[文件\]|\[請假\]/);
  const firstDay = result.content.split('2026-11-05（四）')[0];
  assert.match(firstDay, /左界線/);
  assert.doesNotMatch(firstDay, /不同人的回報|當日請假原文|右界線/);
  const secondWeek = result.content.split('2026-11-11（三）')[1];
  assert.match(secondWeek, /當日請假原文/);
  assert.doesNotMatch(secondWeek, /左界線|不同人的回報/);
  assert.equal(reports.length, 10);
  assert.equal(members.length, 7);
});

test('legacy nested reports retain every original entry without category labels or statistics', () => {
  const migration = html.slice(html.indexOf('function migrateDailyDocs('), html.indexOf('function _isMigId('));
  const context = vm.createContext({});
  vm.runInContext(migration, context);
  const reports = context.migrateDailyDocs([{id: 'old', date: '2026-11-04', member: 'a', entries: [
    {note: '舊資料文件', cat: 'doc', done: false}, {note: '舊資料請假', cat: 'leave', done: false}
  ]}]);
  const result = api.buildText({members: [{id: 'a', name: '成員'}], reports, now});
  assert.match(result.content, /  - 舊資料文件/);
  assert.match(result.content, /  - 舊資料請假/);
  assert.doesNotMatch(result.content, /\[文件\]|\[請假\]|合計|工作類型/);
});

test('successful empty reads produce explicit no-data output', () => {
  assert.equal((api.buildText({now}).content.match(/無成員工作紀錄/g) || []).length, 14);
  assert.equal((api.buildText({now, members: [{id: 'a', name: '成員'}]}).content.match(/（無回報紀錄）/g) || []).length, 14);
});

function ui() {
  const buttons = [0, 1].map(() => ({
    textContent: '產生全員週報', disabled: false, attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(event, fn) { this.click = fn; }
  }));
  const notices = [], downloads = [];
  let user = {uid: 'test-user'};
  let readCount = 0;
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const localApi = load({document: {querySelectorAll: () => buttons}});
  const app = {
    getCurrentUser: () => user,
    toast: text => notices.push(text),
    downloadBlob: (...args) => downloads.push(args),
    loadReports: async (start, end) => { readCount++; assert.equal(start < end, true); return pending; }
  };
  return {buttons, notices, downloads, release, app, localApi, setUser: value => { user = value; }, getReads: () => readCount};
}

test('one click disables both buttons, ignores duplicate clicks and downloads once', async () => {
  const view = ui();
  view.localApi.connect(view.app);
  const done = view.buttons[0].click();
  assert.equal(view.buttons.every(button => button.disabled && button.attributes['aria-busy'] === 'true'), true);
  await view.buttons[1].click();
  assert.equal(view.getReads(), 1);
  view.release({members: [], reports: []});
  await done;
  assert.equal(view.downloads.length, 1);
  assert.equal(view.buttons.every(button => !button.disabled && button.textContent === '產生全員週報'), true);
});

test('signed-out, failed reads and changed sessions never download a partial report', async () => {
  const view = ui();
  view.setUser(null);
  view.localApi.connect(view.app);
  await view.buttons[0].click();
  assert.equal(view.getReads(), 0);
  view.setUser({uid: 'test-user'});
  view.app.loadReports = async () => { throw new Error('network unavailable'); };
  await view.buttons[0].click();
  assert.equal(view.downloads.length, 0);
  assert.equal(view.buttons[0].disabled, false);
  assert.match(view.notices.at(-1), /失敗/);
  view.app.loadReports = async () => { view.setUser(null); return {members: [], reports: []}; };
  await view.buttons[0].click();
  assert.equal(view.downloads.length, 0);
});

test('HTML adapter requests both collections from the server and supports nested legacy entries', async () => {
  const calls = [];
  let app;
  const docs = {
    members: [{id: 'm', data: () => ({name: '測試成員'})}],
    dailyReports: [{id: 'legacy', data: () => ({member: 'm', date: '2026-11-04', entries: [{note: '內容', cat: 'doc'}]})}]
  };
  const context = vm.createContext({
    window: {GamePMWeeklyReport: {connect: value => { app = value; }}},
    currentUser: {uid: 'user'}, downloadBlob() {}, toast() {},
    db: {collection(name) {
      const query = {
        where(...args) { calls.push([name, ...args]); return query; },
        async get(options) { calls.push([name, options.source]); return {docs: docs[name]}; }
      };
      return query;
    }}
  });
  vm.runInContext(html.slice(html.indexOf('function migrateDailyDocs('), html.indexOf('function _isMigId(')), context);
  const adapter = html.match(/<script>\s*(if\(window\.GamePMWeeklyReport\)[\s\S]*?)<\/script>/);
  assert.ok(adapter, 'Weekly report adapter has its own script block');
  vm.runInContext(adapter[1], context);
  const data = await app.loadReports('2026-11-04', '2026-11-17');
  assert.deepEqual(calls, [
    ['members', 'server'], ['dailyReports', 'date', '>=', '2026-11-04'],
    ['dailyReports', 'date', '<=', '2026-11-17'], ['dailyReports', 'server']
  ]);
  assert.equal(data.members[0].name, '測試成員');
  assert.equal(data.reports[0].cat, '文件');
  assert.equal(data.reports[0].text, '內容');
});

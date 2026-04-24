// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const TODAY = new Date();
// START/END will be recalculated dynamically based on trunk data
let START = new Date(TODAY);
let END   = new Date(TODAY);
START.setMonth(START.getMonth()-2); // default: 2 months before today
END.setMonth(END.getMonth()+4);     // default: 4 months after today

function recalcTimeRange(){
  const allDates=[];
  TRUNKS.forEach(t=>{
    if(t.start)allDates.push(new Date(t.start));
    if(t.end)allDates.push(new Date(t.end));
    (t.branches||[]).forEach(b=>{
      if(b.start)allDates.push(new Date(b.start));
      if(b.end)allDates.push(new Date(b.end));
    });
  });
  NODES.forEach(n=>{if(n.date)allDates.push(new Date(n.date));});
  allDates.push(TODAY);
  if(allDates.length){
    let min=new Date(Math.min(...allDates));
    let max=new Date(Math.max(...allDates));
    // Padding: 1 month before, 2 months after
    min=new Date(min);min.setDate(1);min.setMonth(min.getMonth()-1);
    max=new Date(max);max.setMonth(max.getMonth()+2);
    // Limit: no more than 18 months total to keep timeline manageable
    const maxDays=Math.round((max-min)/86400000);
    if(maxDays>548){
      // Center on today, show 9 months before and 9 months after
      min=new Date(TODAY);min.setMonth(min.getMonth()-9);min.setDate(1);
      max=new Date(TODAY);max.setMonth(max.getMonth()+9);
    }
    START=min; END=max;
  }
}
const BASE_DP = 44;
let DP = 44;

let MEMBERS = [
  {id:'M',name:'Momo',color:'#1976d2'},
  {id:'K',name:'Kai', color:'#d32f2f'},
  {id:'L',name:'Lin', color:'#2e7d32'},
  {id:'R',name:'Ray', color:'#e65100'},
  {id:'T',name:'Taro',color:'#7b1fa2'},
];

const TRUNKS = [
  {id:'game',name:'遊戲本體',color:'#1976d2',status:'wip',priority:'normal',start:'2024-03-01',end:'2024-06-30',
   owner:'M',collaborators:['K','T'],trackers:['L'],desc:'遊戲核心開發專案，包含玩法、關卡、特效等。',links:[],
   branches:[
     {id:'core',name:'核心玩法',start:'2024-03-01',end:'2024-05-15',color:'#1976d2',prog:62},
     {id:'lvl', name:'關卡設計',start:'2024-04-01',end:null,       color:'#1976d2',prog:28},
     {id:'vfx', name:'視覺特效',start:'2024-04-10',end:'2024-06-10',color:'#1976d2',prog:40},
   ]},
  {id:'art',name:'美術 & 音效',color:'#e65100',status:'wip',priority:'normal',start:'2024-03-10',end:'2024-06-15',
   owner:'L',collaborators:['R'],trackers:['M'],desc:'美術資源與音效開發。',links:['https://figma.com/example'],
   branches:[
     {id:'ui',   name:'UI 設計',start:'2024-03-10',end:'2024-04-30',color:'#e65100',prog:80},
     {id:'audio',name:'音效',   start:'2024-03-20',end:null,       color:'#e65100',prog:55},
   ]}
];

let NODES = [
  {id:1, trunk:'game',branch:'core', type:'update',   date:'2024-03-05',member:'M',collaborators:[],msg:'完成基礎移動系統，跳躍手感已調整',notes:'',images:[]},
  {id:2, trunk:'game',branch:'core', type:'update',   date:'2024-03-18',member:'K',collaborators:['M'],msg:'碰撞偵測初版完成，邊緣案例待修',notes:'',images:[]},
  {id:3, trunk:'art', branch:'ui',   type:'update',   date:'2024-03-12',member:'L',collaborators:[],msg:'主選單草稿設計完成，等候確認',notes:'',images:[]},
  {id:4, trunk:'game',branch:'core', type:'milestone',date:'2024-04-01',member:'M',collaborators:['K','L'],msg:'核心玩法 Alpha 版本完成，可內部試玩',notes:'',images:[]},
  {id:5, trunk:'art', branch:'audio',type:'update',   date:'2024-03-28',member:'R',collaborators:[],msg:'BGM 第一首完成混音',notes:'',images:[]},
  {id:6, trunk:'art', branch:'ui',   type:'update',  date:'2024-04-05',member:'L',collaborators:['M','K'],msg:'UI Review 確認風格方向',notes:'',images:[]},
  {id:7, trunk:'game',branch:'core', type:'update',   date:'2024-04-12',member:'K',collaborators:[],msg:'敵人 AI 基礎行為完成',notes:'',images:[]},
  {id:8, trunk:'game',branch:'lvl',  type:'update',   date:'2024-04-08',member:'T',collaborators:[],msg:'第一章關卡佈局完成',notes:'',images:[]},
  {id:9, trunk:'game',branch:'vfx',  type:'update',   date:'2024-04-18',member:'M',collaborators:['T'],msg:'命中特效第一版，粒子數待優化',notes:'',images:[]},
  {id:10,trunk:'art', branch:'audio',type:'milestone',date:'2024-04-15',member:'R',collaborators:[],msg:'音效庫基礎建立完成，共 42 個音效',notes:'',images:[]},
];

// Daily reports: [{id, date, branch, member, entries:[{cat,note}]}]
let DAILY_REPORTS = [
  {id:'dr1',date:'2024-04-18',branch:'vfx',member:'M',entries:[{cat:'dev',note:'命中特效粒子系統完成'},{cat:'bug',note:'修復碰撞邊緣 bug'}]},
  {id:'dr2',date:'2024-04-18',branch:'ui',member:'L',entries:[{cat:'design',note:'主畫面第二版 mockup'}]},
  {id:'dr3',date:'2024-04-19',branch:'core',member:'K',entries:[{cat:'dev',note:'敵人 AI 追蹤邏輯優化'}]},
];

const CATS = [
  {id:'dev',label:'研發',bg:'#fce4e4',color:'#c62828'},
  {id:'design',label:'設計',bg:'#fff3e0',color:'#e65100'},
  {id:'outsource',label:'外包',bg:'#e3f2fd',color:'#1565c0'},
  {id:'doc',label:'文件',bg:'#e8f5e9',color:'#2e7d32'},
  {id:'eng',label:'工務',bg:'#f3e5f5',color:'#6a1b9a'},
  {id:'maintain',label:'維護',bg:'#fce4ec',color:'#ad1457'},
  {id:'outreach',label:'外展',bg:'#e0f2f1',color:'#00695c'},
  {id:'misc',label:'雜項',bg:'#f5f5f5',color:'#616161'},
  {id:'leave',label:'請假',bg:'#fce4e4',color:'#c62828'},
];

let REPORT_TYPES = [
  {id:'update',label:'📝 進度回報',color:'#1565c0',bg:'#e3f2fd',border:'#90caf9'},
  {id:'milestone',label:'🏁 里程碑',color:'#e65100',bg:'#fff3e0',border:'#ffcc80'},
];
function reportTypeObj(id){ return REPORT_TYPES.find(r=>r.id===id)||REPORT_TYPES[0]; }

// Taiwan holidays & make-up workdays (補班日)
const TW_HOLIDAYS = {
  '2024-01-01':'元旦','2024-02-08':'除夕','2024-02-09':'春節','2024-02-10':'春節',
  '2024-02-11':'春節','2024-02-12':'春節(補假)','2024-02-28':'和平紀念日',
  '2024-04-04':'兒童節','2024-04-05':'清明節','2024-05-01':'勞動節',
  '2024-06-10':'端午節','2024-09-17':'中秋節','2024-10-10':'國慶日',
  '2025-01-01':'元旦','2025-01-27':'除夕','2025-01-28':'春節','2025-01-29':'春節',
  '2025-01-30':'春節','2025-01-31':'春節(補假)','2025-02-28':'和平紀念日',
  '2025-04-03':'兒童節(補假)','2025-04-04':'兒童節','2025-04-05':'清明節',
  '2025-05-01':'勞動節','2025-05-30':'端午節','2025-05-31':'端午節(補假)',
  '2025-10-06':'中秋節','2025-10-10':'國慶日',
  '2026-01-01':'元旦','2026-02-15':'除夕','2026-02-16':'春節','2026-02-17':'春節',
  '2026-02-18':'春節','2026-02-19':'春節(補假)','2026-02-20':'春節(補假)',
  '2026-02-28':'和平紀念日','2026-04-04':'兒童節','2026-04-05':'清明節',
  '2026-05-01':'勞動節','2026-06-19':'端午節','2026-09-25':'中秋節','2026-10-10':'國慶日',
};
// 補班日：週六日但需上班的日子
const TW_MAKEUP_WORKDAYS = {
  '2024-02-17':'補班(春節)','2024-06-08':'補班(端午)',
  '2025-01-25':'補班(春節)','2025-02-08':'補班(和平紀念日)',
  '2026-02-14':'補班(春節)','2026-06-20':'補班(端午)',
};

// Project statuses
let PROJECT_STATUSES = [
  {id:'todo',label:'待處理',color:'#757575',bg:'#f5f5f5'},
  {id:'wip',label:'製作中',color:'#1565c0',bg:'#e3f2fd'},
  {id:'testing',label:'測試中',color:'#e65100',bg:'#fff3e0'},
  {id:'done',label:'已完成',color:'#2e7d32',bg:'#e8f5e9'},
  {id:'hold',label:'擱置中',color:'#c62828',bg:'#fce4e4'},
];
function statusObj(id){ return PROJECT_STATUSES.find(s=>s.id===id)||PROJECT_STATUSES[0]; }

let PRIORITIES = [
  {id:'highest',label:'最高',color:'#c62828',bg:'#fce4e4'},
  {id:'high',label:'高',color:'#e65100',bg:'#fff3e0'},
  {id:'normal',label:'普通',color:'#1565c0',bg:'#e3f2fd'},
  {id:'low',label:'低',color:'#757575',bg:'#f5f5f5'},
];
function priorityObj(id){ return PRIORITIES.find(p=>p.id===id)||PRIORITIES[2]; }

let NC=100, DRC=100;
const exp={};TRUNKS.forEach(t=>exp[t.id]=false);
let activeType='all',activeMems=new Set(),activeOwner='all',pendImgs=[],editImgs=[],pendLinks=[],editNodeLinks=[];
let currentNodeId=null,slIdx=0,slImgs=[];
let progTarget=null;
let openTrunkId=null; // for detail panel
let dailyEntries=[{cat:'dev',note:'',branchId:'',done:false,statusNote:'',links:[]}];
let wkOffset=0; // weeks offset from TODAY's week
let currentView='timeline';

// ─────────────────────────────────────────────
// FIRESTORE SYNC LAYER
// ─────────────────────────────────────────────
let _firestoreReady = false;
let _unsubs = []; // onSnapshot unsubscribe handles

// ── Save helpers ──
async function fsave(collection, docId, data) {
  if (!_firestoreReady || typeof db === 'undefined') return;
  try { await db.collection(collection).doc(docId).set(data); }
  catch (e) { console.warn('Firestore save error:', e); }
}
function saveTrunk(t) {
  const plain = JSON.parse(JSON.stringify(t));
  fsave('trunks', t.id, plain);
}
function saveNode(n) {
  const plain = JSON.parse(JSON.stringify(n));
  plain.id = String(plain.id); // ensure string
  fsave('nodes', String(n.id), plain);
}
function saveAllMembers() { MEMBERS.forEach(m => fsave('members', m.id, {...m})); }
function saveMember(m) { fsave('members', m.id, {...m}); }
function deleteMember(id) { if (_firestoreReady && typeof db !== 'undefined') db.collection('members').doc(id).delete().catch(()=>{}); }
function saveDailyReport(date, member, entries) {
  const docId = `${date}_${member}`;
  fsave('dailyReports', docId, { date, member, entries: entries.map(e=>({...e})) });
}
function saveSettings(key, items) { fsave('settings', key, { items: JSON.parse(JSON.stringify(items)) }); }

// ── Load from Firestore (initial) ──
async function loadFromFirestore() {
  if (typeof db === 'undefined') return false;
  try {
    // Check if Firestore has any data
    const memSnap = await db.collection('members').get();
    if (memSnap.empty) return false; // no data yet, use defaults

    MEMBERS = memSnap.docs.map(d => d.data());

    const trunkSnap = await db.collection('trunks').get();
    if (!trunkSnap.empty) {
      TRUNKS.length = 0;
      trunkSnap.docs.forEach(d => TRUNKS.push(d.data()));
    }

    const nodeSnap = await db.collection('nodes').orderBy('date', 'desc').get();
    if (!nodeSnap.empty) {
      NODES.length = 0;
      nodeSnap.docs.forEach(d => { const n = d.data(); n.id = isNaN(n.id) ? n.id : Number(n.id); NODES.push(n); });
      NC = NODES.reduce((mx, n) => Math.max(mx, typeof n.id === 'number' ? n.id : 0), NC);
    }

    const drSnap = await db.collection('dailyReports').get();
    if (!drSnap.empty) {
      DAILY_REPORTS.length = 0;
      drSnap.docs.forEach(d => DAILY_REPORTS.push({ id: d.id, ...d.data() }));
      DRC = DAILY_REPORTS.length + 100;
    }

    // Settings
    const stDoc = await db.collection('settings').doc('projectStatuses').get();
    if (stDoc.exists) PROJECT_STATUSES = stDoc.data().items;
    const prDoc = await db.collection('settings').doc('priorities').get();
    if (prDoc.exists) PRIORITIES = prDoc.data().items;
    const rtDoc = await db.collection('settings').doc('reportTypes').get();
    if (rtDoc.exists) REPORT_TYPES = rtDoc.data().items;
    const catDoc = await db.collection('settings').doc('categories').get();
    if (catDoc.exists) { const items = catDoc.data().items; if (items && items.length) CATS.length = 0; items.forEach(c => CATS.push(c)); }

    return true;
  } catch (e) {
    console.warn('Firestore load error:', e);
    return false;
  }
}

// ── Real-time listeners ──
function startRealtimeSync() {
  if (typeof db === 'undefined') return;
  _unsubs.push(
    db.collection('trunks').onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return; // skip local writes
      TRUNKS.length = 0;
      snap.docs.forEach(d => TRUNKS.push(d.data()));
      Object.keys(exp).forEach(k => { if (!TRUNKS.find(t => t.id === k)) delete exp[k]; });
      TRUNKS.forEach(t => { if (!(t.id in exp)) exp[t.id] = false; });
      recalcTimeRange();
      buildLabels(); buildTimeline(); buildSelects(); buildDailySelects(); updateHeaderRange();
    }),
    db.collection('nodes').orderBy('date','desc').onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return;
      NODES.length = 0;
      snap.docs.forEach(d => { const n = d.data(); n.id = isNaN(n.id) ? n.id : Number(n.id); NODES.push(n); });
      NC = NODES.reduce((mx, n) => Math.max(mx, typeof n.id === 'number' ? n.id : 0), NC);
      recalcTimeRange();buildTimeline();
    }),
    db.collection('members').onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return;
      MEMBERS = snap.docs.map(d => d.data());
      buildHeaderAvatars(); buildSelects(); buildDailySelects();
    }),
    db.collection('dailyReports').onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return;
      DAILY_REPORTS.length = 0;
      snap.docs.forEach(d => DAILY_REPORTS.push({ id: d.id, ...d.data() }));
      if (document.getElementById('weekly-panel').style.display === 'flex') buildWeekly();
    })
  );
}

// ── Migrate current hardcoded data to Firestore (one-time) ──
async function migrateToFirestore() {
  if (typeof db === 'undefined') { console.warn('db not available'); return; }
  const batch = db.batch();
  MEMBERS.forEach(m => batch.set(db.collection('members').doc(m.id), {...m}));
  TRUNKS.forEach(t => batch.set(db.collection('trunks').doc(t.id), JSON.parse(JSON.stringify(t))));
  NODES.forEach(n => { const plain = JSON.parse(JSON.stringify(n)); plain.id = String(plain.id); batch.set(db.collection('nodes').doc(String(n.id)), plain); });
  DAILY_REPORTS.forEach(r => { const docId = `${r.date}_${r.member}`; batch.set(db.collection('dailyReports').doc(docId), { date: r.date, member: r.member, entries: r.entries }); });
  batch.set(db.collection('settings').doc('projectStatuses'), { items: PROJECT_STATUSES });
  batch.set(db.collection('settings').doc('priorities'), { items: PRIORITIES });
  batch.set(db.collection('settings').doc('reportTypes'), { items: REPORT_TYPES });
  batch.set(db.collection('settings').doc('categories'), { items: [...CATS] });
  await batch.commit();
  console.log('✅ 資料已成功匯入 Firestore！');
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const dx  = d => (new Date(d)-START)/86400000*DP;
const tw  = () => (END-START)/86400000*DP+32*DP;
const fmt = d => { const dt=new Date(d); return`${dt.getMonth()+1}/${dt.getDate()}`; };
const fmtFull = d => { const dt=new Date(d+'T00:00:00'); const dn=['日','一','二','三','四','五','六']; return`${dt.getMonth()+1}/${dt.getDate()}(${dn[dt.getDay()]})`; };
const BH  = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--branch-h'));
const mem = id => MEMBERS.find(m=>m.id===id)||MEMBERS.find(m=>m.name===id)||{name:id||'?',color:'#aaa'};
const branchObj = id => {
  // Check nested branches first
  const nested = TRUNKS.flatMap(t=>t.branches).find(b=>b.id===id);
  if(nested) return nested;
  // Check independent branch-trunks (isBranch:true, their trunk id IS the branch id)
  const indep = TRUNKS.find(t=>t.isBranch && t.id===id);
  if(indep) return {id:indep.id,name:indep.name,start:indep.start,end:indep.end,color:indep.color,prog:0};
  return undefined;
};
const calcDuration = b => { if(!b.end) return null; return Math.round((new Date(b.end)-new Date(b.start))/86400000); };
// Find trunk id for a given branch id (handles independent branches)
function trunkForBranch(bid){
  const indep=TRUNKS.find(t=>t.isBranch&&t.id===bid);
  if(indep) return indep.id;
  for(const t of TRUNKS){if(t.branches.find(b=>b.id===bid))return t.id;}
  return null;
}
function initials(name){ return name.slice(0,1).toUpperCase(); }
function makeAv(mid, size=22, extra=''){
  const m=mem(mid),d=document.createElement('div');d.className='av';
  d.style.cssText=`width:${size}px;height:${size}px;background:${m.color};font-size:${Math.floor(size*.38)}px;${extra}`;
  d.textContent=initials(m.name);d.title=m.name;return d;
}
function addDays(dateStr,n){ const d=new Date(dateStr+'T00:00:00');d.setDate(d.getDate()+n);return d.toISOString().split('T')[0]; }
function getWeekStart(dateStr){ const d=new Date(dateStr+'T00:00:00');const day=d.getDay();d.setDate(d.getDate()-((day===0)?6:(day-1)));return d.toISOString().split('T')[0]; }
function catObj(id){ return CATS.find(c=>c.id===id)||CATS.find(c=>c.label===id)||CATS.find(c=>c.id==='misc')||CATS[0]; }
const todayStr=TODAY.toISOString().split('T')[0];

// ─────────────────────────────────────────────
// COLOR UTILITIES
// ─────────────────────────────────────────────
function hexToHSL(hex){
  let r=parseInt(hex.slice(1,3),16)/255;
  let g=parseInt(hex.slice(3,5),16)/255;
  let b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}else{
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r:h=((g-b)/d+(g<b?6:0))/6;break;
      case g:h=((b-r)/d+2)/6;break;
      case b:h=((r-g)/d+4)/6;break;
    }
  }
  return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
}
function hslToHex(h,s,l){
  h=h/360;s=s/100;l=l/100;
  let r,g,b;
  if(s===0){r=g=b=l;}else{
    const hue2rgb=(p,q,t)=>{
      if(t<0)t+=1;if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q=l<0.5?l*(1+s):l+s-l*s;
    const p=2*l-q;
    r=hue2rgb(p,q,h+1/3);
    g=hue2rgb(p,q,h);
    b=hue2rgb(p,q,h-1/3);
  }
  const toHex=x=>{
    const hex=Math.round(x*255).toString(16);
    return hex.length===1?'0'+hex:hex;
  };
  return '#'+toHex(r)+toHex(g)+toHex(b);
}
function deriveColor(baseHex,idx){
  const hsl=hexToHSL(baseHex);
  const newL=Math.min(80,hsl.l+idx*6);
  const newS=Math.max(20,hsl.s-idx*3);
  return hslToHex(hsl.h,newS,newL);
}

// ─────────────────────────────────────────────
// SCALE DROPDOWN
// ─────────────────────────────────────────────
document.getElementById('scale-sel').addEventListener('change',function(){
  const pct=parseInt(this.value);
  const sa=document.getElementById('sa');
  const oldCenter=(sa.scrollLeft+sa.clientWidth*0.35)/DP;
  DP=Math.round(BASE_DP*pct/100);
  document.documentElement.style.setProperty('--DAY',DP+'px');
  document.getElementById('canvas').style.width=tw()+'px';
  buildRuler();buildTimeline();
  sa.scrollLeft=oldCenter*DP-sa.clientWidth*0.35;
  alignTodayLine();
});

document.getElementById('btn-today').addEventListener('click',()=>{
  const sa=document.getElementById('sa');
  sa.scrollLeft=dx(todayStr)-sa.clientWidth*.35;
});

// ─────────────────────────────────────────────
// RULER (with holidays + all dates)
// ─────────────────────────────────────────────
function buildRuler(){
  const el=document.getElementById('ruler');el.innerHTML='';
  const days=Math.ceil((END-START)/86400000+32);
  for(let i=0;i<=days;i++){
    const d=new Date(START);d.setDate(d.getDate()+i);
    const ds=d.toISOString().split('T')[0];
    const c=document.createElement('div');c.className='rc';
    if(d.toDateString()===TODAY.toDateString())c.classList.add('td');
    if(d.getDay()===0||d.getDay()===6)c.classList.add('weekend');
    if(TW_HOLIDAYS[ds]){
      c.classList.add('holiday');
      const lbl=document.createElement('div');lbl.className='rc-holiday-label';lbl.textContent=TW_HOLIDAYS[ds];
      c.appendChild(lbl);
    }
    // always show date number
    if(d.getDate()===1){c.classList.add('ms');c.insertAdjacentHTML('beforeend',`${d.getMonth()+1}月`);}
    else c.insertAdjacentHTML('beforeend',`${d.getDate()}`);
    el.appendChild(c);
  }
}

// ─────────────────────────────────────────────
// MEMBER AVATARS in header
// ─────────────────────────────────────────────
function buildHeaderAvatars(){
  const c=document.getElementById('mavs');c.innerHTML='';
  const row=document.createElement('div');row.className='av-row';
  MEMBERS.forEach(m=>{
    const av=makeAv(m.id,24);
    av.style.marginLeft='-5px';
    if(activeMems.size>0&&!activeMems.has(m.id))av.classList.add('muted');
    av.addEventListener('click',()=>{
      if(activeMems.has(m.id)){activeMems.delete(m.id);}
      else{activeMems.add(m.id);}
      buildHeaderAvatars();applyF();
    });
    row.appendChild(av);
  });
  if(row.firstChild)row.firstChild.style.marginLeft='0';
  c.appendChild(row);
}

// ─────────────────────────────────────────────
// REPORT PANEL SELECTS
// ─────────────────────────────────────────────
let rpOwnerFilter='all';
function buildSelects(){
  // Owner filter for branches
  const owf=document.getElementById('rp-owner-filter');
  const prevOwner=owf.value||rpOwnerFilter;
  owf.innerHTML='';
  const allOpt=document.createElement('option');allOpt.value='all';allOpt.textContent='👤 全部負責人';owf.appendChild(allOpt);
  const owners=[...new Set(TRUNKS.map(t=>t.owner).filter(Boolean))];
  owners.forEach(oid=>{
    const m=mem(oid);
    const o=document.createElement('option');o.value=oid;o.textContent=m.name;owf.appendChild(o);
  });
  owf.value=prevOwner;rpOwnerFilter=prevOwner;
  owf.onchange=()=>{rpOwnerFilter=owf.value;populateBranchSelect();};

  populateBranchSelect();
  const rp=document.getElementById('rprep');rp.innerHTML='';
  MEMBERS.forEach(m=>{
    const o=document.createElement('option');o.value=m.id;o.textContent=m.name;rp.appendChild(o);
  });
  buildCollabPicks();
  // Pre-fill date
  const msdate=document.getElementById('msdate');
  if(msdate&&!msdate.value)msdate.value=todayStr;
}
function populateBranchSelect(){
  const br=document.getElementById('rpbr');br.innerHTML='';
  const filtered=rpOwnerFilter==='all'?TRUNKS:TRUNKS.filter(t=>t.owner===rpOwnerFilter);
  let totalOpts=0;
  // Independent branches first
  const indeps=filtered.filter(t=>t.isBranch);
  if(indeps.length){
    const grp=document.createElement('optgroup');grp.label='獨立枝幹';
    indeps.forEach(t=>{
      const o=document.createElement('option');o.value=t.id;o.textContent=t.name;grp.appendChild(o);
      totalOpts++;
    });
    br.appendChild(grp);
  }
  // Normal trunks with child branches
  filtered.filter(t=>!t.isBranch).forEach(t=>{
    const grp=document.createElement('optgroup');
    grp.label=t.name;
    t.branches.forEach(b=>{
      const o=document.createElement('option');o.value=b.id;
      o.textContent=b.name;grp.appendChild(o);
      totalOpts++;
    });
    br.appendChild(grp);
  });
  br.size=Math.min(6,Math.max(2,totalOpts+filtered.length));
}

function buildCollabPicks(){
  const c=document.getElementById('collab-picks');if(c)c.innerHTML='';
}

// ─────────────────────────────────────────────
// OWNER FILTER
// ─────────────────────────────────────────────
function buildOwnerFilter(){
  activeOwner='all';
}

// ─────────────────────────────────────────────
// UPDATE HEADER RANGE
// ─────────────────────────────────────────────
function updateHeaderRange(){
  const starts=TRUNKS.map(t=>t.start).sort();
  const ends=TRUNKS.map(t=>t.end).filter(Boolean).sort();
  const earliest=starts[0]||'?';
  const latest=ends.length>0?ends[ends.length-1]:null;
  const fmtYM=d=>{const dt=new Date(d);return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}`;};
  document.querySelector('.hdr-range').textContent=earliest!=='?'?`${fmtYM(earliest)} → ${latest?fmtYM(latest):'∞'}`:'';
}

// ─────────────────────────────────────────────
// LEFT COLUMN (with drag reorder)
// ─────────────────────────────────────────────
let dragTrunkIdx=null;
function buildLabels(){
  const body=document.getElementById('lbody');body.innerHTML='';
  // Drop zone: dragging a child branch here makes it independent
  body.addEventListener('dragover',e=>{
    if(e.dataTransfer.types.includes('type'))e.preventDefault();
  });
  body.addEventListener('drop',e=>{
    const dropType=e.dataTransfer.getData('type');
    if(dropType==='child-branch'){
      e.preventDefault();e.stopPropagation();
      const srcTrunkId=e.dataTransfer.getData('trunkId');
      const srcBranchId=e.dataTransfer.getData('branchId');
      const srcTrunk=TRUNKS.find(x=>x.id===srcTrunkId);
      if(!srcTrunk)return;
      const bi=srcTrunk.branches.findIndex(x=>x.id===srcBranchId);
      if(bi===-1)return;
      const [branch]=srcTrunk.branches.splice(bi,1);
      // Create independent trunk from branch
      const newTrunk={id:branch.id,name:branch.name,color:branch.color||srcTrunk.color,status:'wip',priority:'normal',start:branch.start,end:branch.end||'',owner:srcTrunk.owner||'',collaborators:[],trackers:[],desc:'',links:[],branches:[],isBranch:true};
      TRUNKS.push(newTrunk);
      exp[newTrunk.id]=false;
      saveTrunk(srcTrunk);saveTrunk(newTrunk);
      buildLabels();buildTimeline();buildSelects();buildDailySelects();updateHeaderRange();
    }
  });
  const filtered=activeOwner==='all'?TRUNKS:TRUNKS.filter(t=>t.owner===activeOwner);
  filtered.forEach((t,ti)=>{
    // ── Independent branch (isBranch trunk) ──
    if(t.isBranch){
      const ibr=document.createElement('div');ibr.className='lc-trunk lc-indep-branch';ibr.dataset.trunk=t.id;
      ibr.draggable=true;
      ibr.addEventListener('dragstart',e=>{dragTrunkIdx=TRUNKS.indexOf(t);ibr.classList.add('dragging');e.dataTransfer.setData('type','indep-branch');e.dataTransfer.effectAllowed='move';});
      ibr.addEventListener('dragend',()=>{ibr.classList.remove('dragging');document.querySelectorAll('.lc-trunk').forEach(x=>x.classList.remove('drag-over'));dragTrunkIdx=null;});
      ibr.addEventListener('dragover',e=>{e.preventDefault();ibr.classList.add('drag-over');});
      ibr.addEventListener('dragleave',()=>ibr.classList.remove('drag-over'));
      ibr.addEventListener('drop',e=>{
        e.preventDefault();ibr.classList.remove('drag-over');
        const toIdx=TRUNKS.indexOf(t);
        if(dragTrunkIdx!==null&&dragTrunkIdx!==toIdx){
          const [moved]=TRUNKS.splice(dragTrunkIdx,1);TRUNKS.splice(toIdx,0,moved);
          buildLabels();buildTimeline();updateHeaderRange();
        }
        dragTrunkIdx=null;
      });
      const drag=document.createElement('span');drag.className='lc-drag';drag.textContent='⠿';drag.title='拖曳排序';
      const bd=document.createElement('span');bd.className='lc-brdot';bd.style.background=t.color;
      const bn=document.createElement('span');bn.className='lc-tname lc-indep-name';bn.style.color=t.color;bn.textContent=t.name;
      ibr.append(drag,bd,bn);
      ibr.addEventListener('contextmenu',e=>{
        e.preventDefault();e.stopPropagation();
        showContextMenu(e,t.id,null);
      });
      ibr.addEventListener('click',e=>{if(e.target===drag)return;openBranchDetail(t.id,t.id);});
      body.appendChild(ibr);
      return; // no child bg needed
    }

    // ── Normal trunk ──
    const tr=document.createElement('div');tr.className='lc-trunk';tr.dataset.trunk=t.id;
    tr.draggable=true;
    // drag reorder
    tr.addEventListener('dragstart',e=>{dragTrunkIdx=TRUNKS.indexOf(t);tr.classList.add('dragging');e.dataTransfer.setData('type','trunk');e.dataTransfer.effectAllowed='move';});
    tr.addEventListener('dragend',()=>{tr.classList.remove('dragging');document.querySelectorAll('.lc-trunk').forEach(x=>x.classList.remove('drag-over'));dragTrunkIdx=null;});
    // Accept drop of independent branch INTO this trunk
    tr.addEventListener('dragover',e=>{e.preventDefault();tr.classList.add('drag-over');});
    tr.addEventListener('dragleave',()=>tr.classList.remove('drag-over'));
    tr.addEventListener('drop',e=>{
      e.preventDefault();tr.classList.remove('drag-over');
      const dropType=e.dataTransfer.getData('type');
      const toIdx=TRUNKS.indexOf(t);
      if(dropType==='indep-branch'&&dragTrunkIdx!==null){
        // Move independent branch INTO this trunk as a child branch
        const moved=TRUNKS[dragTrunkIdx];
        if(moved&&moved.isBranch&&moved.id!==t.id){
          TRUNKS.splice(dragTrunkIdx,1);
          const newBranch={id:moved.id,name:moved.name,start:moved.start,end:moved.end||null,color:t.color,prog:0};
          t.branches.push(newBranch);
          saveTrunk(t);
          // Delete the old independent trunk from Firestore
          if(_firestoreReady&&typeof db!=='undefined')db.collection('trunks').doc(moved.id).delete().catch(()=>{});
          if(!exp[t.id])toggle(t.id);
          buildLabels();buildTimeline();buildSelects();buildDailySelects();updateHeaderRange();
        }
      } else if(dragTrunkIdx!==null&&dragTrunkIdx!==toIdx){
        const [moved]=TRUNKS.splice(dragTrunkIdx,1);TRUNKS.splice(toIdx,0,moved);
        buildLabels();buildTimeline();updateHeaderRange();
      }
      dragTrunkIdx=null;
    });

    const drag=document.createElement('span');drag.className='lc-drag';drag.textContent='⠿';drag.title='拖曳排序';
    const ca=document.createElement('span');ca.className='lc-caret'+(exp[t.id]?' open':'');ca.textContent='▶';
    const dt=document.createElement('span');dt.className='lc-tdot';dt.style.background=t.color;
    const nm=document.createElement('span');nm.className='lc-tname';nm.style.color=t.color;nm.textContent=t.name;
    const addBrBtn=document.createElement('span');addBrBtn.className='lc-add-br-inline';addBrBtn.textContent='＋';addBrBtn.title='新增枝幹';
    addBrBtn.addEventListener('click',e=>{e.stopPropagation();openAddBranchModal(t.id);});
    tr.append(drag,ca,dt,nm,addBrBtn);
    // Right-click context menu for edit/delete
    tr.addEventListener('contextmenu',e=>{
      e.preventDefault();e.stopPropagation();
      showContextMenu(e,t.id,null);
    });
    tr.addEventListener('click',e=>{
      if(e.target===drag)return;
      toggle(t.id);
      openDetailPanel(t.id);
    });
    body.appendChild(tr);

    const bg=document.createElement('div');bg.className='lc-bg';bg.dataset.trunk=t.id;
    const lcAddBtnH=24;
    if(exp[t.id]){bg.classList.add('open');bg.style.height=(t.branches.length*BH()+lcAddBtnH)+'px';}else{bg.style.height='0px';}
    t.branches.forEach((b,bidx)=>{
      const displayColor=b.color===t.color?deriveColor(b.color,bidx+1):b.color;
      const br=document.createElement('div');br.className='lc-br';
      br.draggable=true;
      // Drag child branch out → becomes independent
      br.addEventListener('dragstart',e=>{
        e.stopPropagation();
        e.dataTransfer.setData('type','child-branch');
        e.dataTransfer.setData('trunkId',t.id);
        e.dataTransfer.setData('branchId',b.id);
        e.dataTransfer.effectAllowed='move';
        br.classList.add('dragging');
      });
      br.addEventListener('dragend',()=>br.classList.remove('dragging'));
      // top row
      const top=document.createElement('div');top.className='lc-brtop';
      const bd=document.createElement('div');bd.className='lc-brdot';bd.style.background=displayColor;
      const bn=document.createElement('div');bn.className='lc-brname';bn.textContent=b.name;
      // status chip (branch-level, fallback to trunk status)
      const bStatus=b.status||t.status||'todo';
      const stObj=statusObj(bStatus);
      const stChip=document.createElement('div');stChip.className='lc-br-status';
      stChip.style.cssText=`background:${stObj.bg};color:${stObj.color};`;
      stChip.textContent=stObj.label;
      stChip.addEventListener('click',e=>{
        e.stopPropagation();
        const curIdx=PROJECT_STATUSES.findIndex(s=>s.id===bStatus);
        const nextIdx=(curIdx+1)%PROJECT_STATUSES.length;
        b.status=PROJECT_STATUSES[nextIdx].id;
        saveTrunk(t);buildLabels();
      });
      top.append(bd,bn,stChip);br.appendChild(top);
      // duration
      const dur=calcDuration(b);
      const durEl=document.createElement('div');durEl.className='lc-duration';
      durEl.textContent=dur!=null?`⏱ ${dur} 天`:'⏱ 無截止日';
      br.appendChild(durEl);
      // (progress bar and collaborator avatars removed)
      br.style.cursor='pointer';
      br.addEventListener('contextmenu',e=>{
        e.preventDefault();e.stopPropagation();
        showContextMenu(e,t.id,b.id);
      });
      br.addEventListener('click',e=>{e.stopPropagation();openBranchDetail(t.id,b.id);});
      bg.appendChild(br);
    });
    // Add branch button
    if(exp[t.id]){
      const addBr=document.createElement('div');addBr.className='lc-add-branch';
      addBr.innerHTML='＋ 新增枝幹';
      addBr.addEventListener('click',e=>{e.stopPropagation();openAddBranchModal(t.id);});
      bg.appendChild(addBr);
    }
    body.appendChild(bg);
  });
  // Add trunk/branch buttons (inside lbody so scroll heights match #sa)
  const btnWrap=document.createElement('div');
  btnWrap.id='add-trunk-btn-wrap';
  btnWrap.innerHTML='<button id="add-trunk-btn" class="add-btn">+ 新增主幹</button><button id="add-branch-quick-btn" class="add-btn">+ 新增枝幹</button>';
  body.appendChild(btnWrap);
  // Spacer to match #ruler height inside #sa for scroll sync
  const spacer=document.createElement('div');spacer.style.cssText='height:40px;flex-shrink:0;';
  body.appendChild(spacer);
  // Re-attach button listeners (elements are recreated each call)
  initAddButtons();
}

// ─────────────────────────────────────────────
// CONTEXT MENU (edit/delete trunk/branch)
// ─────────────────────────────────────────────
function showContextMenu(e,trunkId,branchId){
  document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());
  const menu=document.createElement('div');menu.className='ctx-menu';
  menu.style.cssText=`position:fixed;z-index:300;background:var(--surface);border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 16px var(--shadow2);padding:4px;min-width:120px;left:${Math.min(e.clientX,window.innerWidth-130)}px;top:${Math.min(e.clientY,window.innerHeight-80)}px;`;

  const editItem=document.createElement('div');
  editItem.style.cssText='padding:6px 10px;font-size:11px;cursor:pointer;border-radius:4px;transition:background .1s;';
  editItem.textContent='✏️ 重新命名';
  editItem.addEventListener('mouseenter',()=>editItem.style.background='var(--surface2)');
  editItem.addEventListener('mouseleave',()=>editItem.style.background='');
  editItem.addEventListener('click',()=>{
    menu.remove();
    if(branchId){
      const t=TRUNKS.find(x=>x.id===trunkId);const b=t?.branches.find(x=>x.id===branchId);
      if(b){const newName=prompt('枝幹名稱：',b.name);if(newName&&newName.trim()){b.name=newName.trim();saveTrunk(t);buildLabels();buildTimeline();buildSelects();}}
    }else{
      const t=TRUNKS.find(x=>x.id===trunkId);
      if(t){const newName=prompt('主幹名稱：',t.name);if(newName&&newName.trim()){t.name=newName.trim();saveTrunk(t);buildLabels();buildTimeline();buildSelects();buildOwnerFilter();}}
    }
  });

  // Status change for trunk only
  if(!branchId){
    const statusItem=document.createElement('div');
    statusItem.style.cssText='padding:6px 10px;font-size:11px;cursor:pointer;border-radius:4px;transition:background .1s;';
    statusItem.textContent='📌 變更狀態';
    statusItem.addEventListener('mouseenter',()=>statusItem.style.background='var(--surface2)');
    statusItem.addEventListener('mouseleave',()=>statusItem.style.background='');
    statusItem.addEventListener('click',()=>{
      menu.remove();
      showStatusPicker(e,trunkId);
    });
    menu.appendChild(statusItem);
  }

  // Color picker
  const colorItem=document.createElement('div');
  colorItem.style.cssText='padding:6px 10px;font-size:11px;cursor:pointer;border-radius:4px;transition:background .1s;display:flex;align-items:center;gap:6px;';
  const colorPrev=document.createElement('div');
  const curColor=(()=>{
    const t=TRUNKS.find(x=>x.id===trunkId);
    if(branchId){const b=t?.branches.find(x=>x.id===branchId);return b?b.color:'#999';}
    return t?t.color:'#999';
  })();
  colorPrev.style.cssText=`width:12px;height:12px;border-radius:50%;background:${curColor};border:1px solid var(--border);`;
  const colorLabel=document.createElement('span');colorLabel.textContent='🎨 變更顏色';
  colorItem.append(colorPrev,colorLabel);
  colorItem.addEventListener('mouseenter',()=>colorItem.style.background='var(--surface2)');
  colorItem.addEventListener('mouseleave',()=>colorItem.style.background='');
  colorItem.addEventListener('click',()=>{
    const inp=document.createElement('input');inp.type='color';inp.value=curColor;
    inp.style.cssText='position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(inp);
    inp.addEventListener('input',()=>{
      const t=TRUNKS.find(x=>x.id===trunkId);
      if(branchId){const b=t?.branches.find(x=>x.id===branchId);if(b)b.color=inp.value;}
      else if(t){t.color=inp.value;t.branches.forEach(b=>{b.color=t.color;});}
      saveTrunk(t);buildLabels();buildTimeline();
    });
    inp.addEventListener('change',()=>{inp.remove();menu.remove();});
    inp.click();
  });

  const delItem=document.createElement('div');
  delItem.style.cssText='padding:6px 10px;font-size:11px;cursor:pointer;border-radius:4px;transition:background .1s;color:var(--red);';
  delItem.textContent='🗑️ 刪除';
  delItem.addEventListener('mouseenter',()=>delItem.style.background='var(--notion-red)');
  delItem.addEventListener('mouseleave',()=>delItem.style.background='');
  delItem.addEventListener('click',()=>{
    menu.remove();
    if(branchId){
      const t=TRUNKS.find(x=>x.id===trunkId);
      if(t&&confirm(`確定刪除枝幹「${t.branches.find(b=>b.id===branchId)?.name}」？`)){
        t.branches=t.branches.filter(b=>b.id!==branchId);
        NODES=NODES.filter(n=>n.branch!==branchId);
        saveTrunk(t);buildLabels();buildTimeline();buildSelects();
      }
    }else{
      const t=TRUNKS.find(x=>x.id===trunkId);
      if(t&&confirm(`確定刪除主幹「${t.name}」及其所有枝幹？`)){
        const idx=TRUNKS.indexOf(t);
        NODES=NODES.filter(n=>n.trunk!==trunkId);
        TRUNKS.splice(idx,1);
        if(typeof db!=='undefined')db.collection('trunks').doc(trunkId).delete().catch(()=>{});
        buildLabels();buildTimeline();buildSelects();buildOwnerFilter();updateHeaderRange();
      }
    }
  });

  menu.append(editItem,colorItem,delItem);
  document.body.appendChild(menu);
  setTimeout(()=>{
    const close=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('click',close);}};
    document.addEventListener('click',close);
  },10);
}

function showStatusPicker(e,trunkId){
  const t=TRUNKS.find(x=>x.id===trunkId);if(!t)return;
  const picker=document.createElement('div');
  picker.style.cssText=`position:fixed;z-index:300;background:var(--surface);border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 16px var(--shadow2);padding:4px;min-width:100px;left:${Math.min(e.clientX,window.innerWidth-120)}px;top:${Math.min(e.clientY,window.innerHeight-150)}px;`;
  PROJECT_STATUSES.forEach(st=>{
    const item=document.createElement('div');
    item.style.cssText='padding:5px 10px;font-size:11px;cursor:pointer;border-radius:4px;transition:background .1s;display:flex;align-items:center;gap:6px;';
    item.innerHTML=`<span class="dash-status" style="background:${st.bg};color:${st.color};font-size:9px;">${st.label}</span>`;
    if(t.status===st.id)item.innerHTML+='<span style="font-size:10px;">✓</span>';
    item.addEventListener('mouseenter',()=>item.style.background='var(--surface2)');
    item.addEventListener('mouseleave',()=>item.style.background='');
    item.addEventListener('click',()=>{
      t.status=st.id;saveTrunk(t);picker.remove();buildLabels();buildTimeline();
      if(openTrunkId===trunkId)openDetailPanel(trunkId,true);
    });
    picker.appendChild(item);
  });
  document.body.appendChild(picker);
  setTimeout(()=>{
    const close=ev=>{if(!picker.contains(ev.target)){picker.remove();document.removeEventListener('click',close);}};
    document.addEventListener('click',close);
  },10);
}

// ─────────────────────────────────────────────
// ADD TRUNK / BRANCH
// ─────────────────────────────────────────────
let addBranchTargetTrunk=null;

function initAddButtons(){
  const trunkBtn=document.getElementById('add-trunk-btn');
  const branchBtn=document.getElementById('add-branch-quick-btn');
  if(trunkBtn){
    trunkBtn.addEventListener('click',()=>{
      document.getElementById('add-trunk-name').value='';
      document.getElementById('add-trunk-color').value='#6492c5';
      document.getElementById('add-trunk-start').value=todayStr;
      document.getElementById('add-trunk-end').value='';
      document.getElementById('add-trunk-modal').classList.add('open');
    });
  }
  if(branchBtn){
    branchBtn.addEventListener('click',(e)=>{
      document.querySelectorAll('.trunk-picker-pop').forEach(p=>p.remove());
      const pop=document.createElement('div');pop.className='trunk-picker-pop';
      pop.style.cssText=`position:fixed;z-index:300;background:var(--surface);border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 16px var(--shadow2);padding:4px;min-width:160px;`;
      const rect=e.target.getBoundingClientRect();
      pop.style.left=rect.left+'px';pop.style.bottom=(window.innerHeight-rect.top+4)+'px';
      const indepItem=document.createElement('div');
      indepItem.style.cssText='padding:6px 10px;cursor:pointer;border-radius:4px;font-size:11px;display:flex;align-items:center;gap:6px;font-weight:600;color:var(--accent);border-bottom:1px solid var(--border);margin-bottom:2px;';
      indepItem.textContent='＋ 獨立枝幹';
      indepItem.addEventListener('mouseenter',()=>indepItem.style.background='var(--surface2)');
      indepItem.addEventListener('mouseleave',()=>indepItem.style.background='');
      indepItem.addEventListener('click',()=>{pop.remove();openAddBranchModal(null);});
      pop.appendChild(indepItem);
      TRUNKS.filter(t=>!t.isBranch).forEach(t=>{
        const item=document.createElement('div');
        item.style.cssText='padding:6px 10px;cursor:pointer;border-radius:4px;font-size:11px;display:flex;align-items:center;gap:6px;';
        item.innerHTML=`<span style="width:8px;height:8px;border-radius:50%;background:${t.color};flex-shrink:0;"></span>${t.name}`;
        item.addEventListener('mouseenter',()=>item.style.background='var(--surface2)');
        item.addEventListener('mouseleave',()=>item.style.background='');
        item.addEventListener('click',()=>{pop.remove();openAddBranchModal(t.id);});
        pop.appendChild(item);
      });
      document.body.appendChild(pop);
      const closePopOnClick=(ev)=>{if(!pop.contains(ev.target)){pop.remove();document.removeEventListener('click',closePopOnClick);}};
      setTimeout(()=>document.addEventListener('click',closePopOnClick),0);
    });
  }
}
document.getElementById('add-trunk-close').addEventListener('click',()=>document.getElementById('add-trunk-modal').classList.remove('open'));
document.getElementById('add-trunk-cancel').addEventListener('click',()=>document.getElementById('add-trunk-modal').classList.remove('open'));
document.getElementById('add-trunk-modal').addEventListener('click',e=>{if(e.target===document.getElementById('add-trunk-modal'))document.getElementById('add-trunk-modal').classList.remove('open');});
document.getElementById('add-trunk-confirm').addEventListener('click',()=>{
  const name=document.getElementById('add-trunk-name').value.trim();
  const color=document.getElementById('add-trunk-color').value;
  const start=document.getElementById('add-trunk-start').value;
  const end=document.getElementById('add-trunk-end').value;
  if(!name||!start)return;
  const id='t'+Date.now().toString(36);
  const newTrunk={id,name,color,status:'todo',start,end:end||start,owner:MEMBERS[0]?.id||'',collaborators:[],trackers:[],desc:'',links:[],branches:[]};
  TRUNKS.push(newTrunk);
  exp[id]=false;
  saveTrunk(newTrunk);
  document.getElementById('add-trunk-modal').classList.remove('open');
  buildOwnerFilter();buildLabels();buildTimeline();buildSelects();buildDailySelects();updateHeaderRange();
});

function openAddBranchModal(trunkId){
  addBranchTargetTrunk=trunkId; // null = independent branch
  const t=trunkId?TRUNKS.find(x=>x.id===trunkId):null;
  document.getElementById('add-branch-name').value='';
  document.getElementById('add-branch-start').value=todayStr;
  document.getElementById('add-branch-end').value='';
  // show auto-derived color preview
  if(t){
    const nextIdx=t.branches.length+1;
    document.getElementById('add-branch-color-swatch').style.background=deriveColor(t.color,nextIdx);
    document.getElementById('add-branch-color-preview').querySelector('label').textContent='顏色（自動衍生自主幹）';
  } else {
    document.getElementById('add-branch-color-swatch').style.background='#6492c5';
    document.getElementById('add-branch-color-preview').querySelector('label').textContent='顏色（獨立枝幹）';
  }
  document.getElementById('add-branch-modal').classList.add('open');
}
document.getElementById('add-branch-close').addEventListener('click',()=>document.getElementById('add-branch-modal').classList.remove('open'));
document.getElementById('add-branch-cancel').addEventListener('click',()=>document.getElementById('add-branch-modal').classList.remove('open'));
document.getElementById('add-branch-modal').addEventListener('click',e=>{if(e.target===document.getElementById('add-branch-modal'))document.getElementById('add-branch-modal').classList.remove('open');});
document.getElementById('add-branch-confirm').addEventListener('click',()=>{
  const name=document.getElementById('add-branch-name').value.trim();
  const start=document.getElementById('add-branch-start').value;
  const end=document.getElementById('add-branch-end').value;
  if(!name||!start)return;

  if(!addBranchTargetTrunk){
    // Create independent branch (stored as trunk with isBranch:true)
    const id='b'+Date.now().toString(36);
    const newTrunk={id,name,color:'#6492c5',status:'wip',priority:'normal',start,end:end||'',owner:MEMBERS[0]?.id||'',collaborators:[],trackers:[],desc:'',links:[],branches:[],isBranch:true};
    TRUNKS.push(newTrunk);
    exp[id]=false;
    saveTrunk(newTrunk);
    document.getElementById('add-branch-modal').classList.remove('open');
    buildLabels();buildTimeline();buildSelects();buildDailySelects();updateHeaderRange();
    return;
  }

  const t=TRUNKS.find(x=>x.id===addBranchTargetTrunk);if(!t)return;
  const id='b'+Date.now().toString(36);
  // Use trunk color — deriveColor will be applied at render time
  t.branches.push({id,name,start,end:end||null,color:t.color,prog:0});
  saveTrunk(t);
  document.getElementById('add-branch-modal').classList.remove('open');
  if(!exp[t.id])toggle(t.id);
  buildLabels();buildTimeline();buildSelects();buildDailySelects();
});

// ─────────────────────────────────────────────
// DETAIL PANEL (right side)
// ─────────────────────────────────────────────
function openDetailPanel(trunkId,force){
  const panel=document.getElementById('detail-panel');
  if(!force&&openTrunkId===trunkId&&panel.classList.contains('open')){
    panel.classList.remove('open');openTrunkId=null;openBranchId=null;return;
  }
  openTrunkId=trunkId;openBranchId=null;
  const t=TRUNKS.find(x=>x.id===trunkId);if(!t)return;
  document.getElementById('dp-hdr-dot').style.background=t.color;
  document.getElementById('dp-hdr-name').textContent=t.name;
  const body=document.getElementById('dp-body');body.innerHTML='';

  // Status
  const statusSec=sec('專案狀態');
  const statusRow=document.createElement('div');statusRow.style.cssText='display:flex;flex-wrap:wrap;gap:4px;';
  PROJECT_STATUSES.forEach(st=>{
    const chip=document.createElement('div');chip.className='dash-status';
    chip.style.cssText=`background:${st.bg};color:${st.color};cursor:pointer;border:2px solid ${t.status===st.id?st.color:'transparent'};transition:all .12s;`;
    chip.textContent=st.label;
    chip.addEventListener('click',()=>{t.status=st.id;saveTrunk(t);openDetailPanel(trunkId,true);buildLabels();buildTimeline();});
    statusRow.appendChild(chip);
  });
  statusSec.appendChild(statusRow);body.appendChild(statusSec);

  // Priority
  const priSec=sec('優先度');
  const priRow=document.createElement('div');priRow.style.cssText='display:flex;flex-wrap:wrap;gap:4px;';
  PRIORITIES.forEach(pr=>{
    const chip=document.createElement('div');chip.className='dash-status';
    chip.style.cssText=`background:${pr.bg};color:${pr.color};cursor:pointer;border:2px solid ${t.priority===pr.id?pr.color:'transparent'};transition:all .12s;`;
    chip.textContent=pr.label;
    chip.addEventListener('click',()=>{t.priority=pr.id;saveTrunk(t);openDetailPanel(trunkId,true);buildLabels();buildTimeline();});
    priRow.appendChild(chip);
  });
  priSec.appendChild(priRow);body.appendChild(priSec);

  // Owner
  const ownerSec=sec('負責人');
  const ownerRow=document.createElement('div');ownerRow.className='dp-people-row';
  if(t.owner){
    ownerRow.appendChild(personChip(t.owner));
  }
  const ownerAdd=document.createElement('div');ownerAdd.className='dp-add-person';ownerAdd.textContent='+';
  ownerAdd.addEventListener('click',e=>openPersonPop(e,mid=>{t.owner=mid;saveTrunk(t);openDetailPanel(trunkId,true);buildOwnerFilter();}));
  ownerRow.appendChild(ownerAdd);ownerSec.appendChild(ownerRow);body.appendChild(ownerSec);

  // Collaborators
  const collabSec=sec('協作者');
  const collabRow=document.createElement('div');collabRow.className='dp-people-row';
  (t.collaborators||[]).forEach(mid=>collabRow.appendChild(personChip(mid,()=>{t.collaborators=t.collaborators.filter(x=>x!==mid);saveTrunk(t);openDetailPanel(trunkId,true);})));
  const collabAdd=document.createElement('div');collabAdd.className='dp-add-person';collabAdd.textContent='+';
  collabAdd.addEventListener('click',e=>openPersonPop(e,mid=>{if(!t.collaborators.includes(mid)){t.collaborators.push(mid);saveTrunk(t);openDetailPanel(trunkId,true);}}));
  collabRow.appendChild(collabAdd);collabSec.appendChild(collabRow);body.appendChild(collabSec);

  // Trackers
  const trackSec=sec('追蹤者');
  const trackRow=document.createElement('div');trackRow.className='dp-people-row';
  (t.trackers||[]).forEach(mid=>trackRow.appendChild(personChip(mid,()=>{t.trackers=t.trackers.filter(x=>x!==mid);saveTrunk(t);openDetailPanel(trunkId,true);})));
  const trackAdd=document.createElement('div');trackAdd.className='dp-add-person';trackAdd.textContent='+';
  trackAdd.addEventListener('click',e=>openPersonPop(e,mid=>{if(!t.trackers)t.trackers=[];if(!t.trackers.includes(mid)){t.trackers.push(mid);saveTrunk(t);openDetailPanel(trunkId,true);}}));
  trackRow.appendChild(trackAdd);trackSec.appendChild(trackRow);body.appendChild(trackSec);

  // Trunk dates
  const dateSec=sec('期間設定');
  const dateRow=document.createElement('div');dateRow.style.cssText='display:flex;gap:6px;';
  const startInp=document.createElement('input');startInp.type='date';startInp.value=t.start;startInp.style.cssText='flex:1;padding:4px 6px;font-size:11px;';
  startInp.addEventListener('change',()=>{t.start=startInp.value;saveTrunk(t);buildTimeline();buildLabels();});
  const endInp=document.createElement('input');endInp.type='date';endInp.value=t.end||'';endInp.style.cssText='flex:1;padding:4px 6px;font-size:11px;';
  endInp.addEventListener('change',()=>{t.end=endInp.value;saveTrunk(t);buildTimeline();buildLabels();});
  const startLbl=document.createElement('div');startLbl.style.cssText='display:flex;flex-direction:column;flex:1;gap:2px;';
  startLbl.innerHTML='<span style="font-size:8px;color:var(--text-dim);">開始</span>';startLbl.appendChild(startInp);
  const endLbl=document.createElement('div');endLbl.style.cssText='display:flex;flex-direction:column;flex:1;gap:2px;';
  endLbl.innerHTML='<span style="font-size:8px;color:var(--text-dim);">截止</span>';endLbl.appendChild(endInp);
  dateRow.append(startLbl,endLbl);dateSec.appendChild(dateRow);body.appendChild(dateSec);

  // Branch deadlines
  if(t.branches.length>0){
    const brDateSec=sec('枝幹截止日設定');
    t.branches.forEach((b,bidx)=>{
      const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:6px;margin-bottom:6px;';
      const dot=document.createElement('div');dot.style.cssText=`width:6px;height:6px;border-radius:50%;background:${b.color===t.color?deriveColor(b.color,bidx+1):b.color};flex-shrink:0;`;
      const name=document.createElement('span');name.style.cssText='font-size:10px;color:var(--text-mid);min-width:50px;';name.textContent=b.name;
      const bEnd=document.createElement('input');bEnd.type='date';bEnd.value=b.end||'';bEnd.style.cssText='flex:1;padding:3px 5px;font-size:10px;';
      bEnd.addEventListener('change',()=>{
        b.end=bEnd.value||null;
        saveTrunk(t);buildTimeline();buildLabels();
      });
      row.append(dot,name,bEnd);brDateSec.appendChild(row);
    });
    body.appendChild(brDateSec);
  }

  // Description
  const descSec=sec('說明');
  const descTA=document.createElement('textarea');descTA.className='dp-desc';descTA.value=t.desc||'';descTA.placeholder='專案說明…';
  descTA.addEventListener('change',()=>{t.desc=descTA.value;saveTrunk(t);});
  descSec.appendChild(descTA);body.appendChild(descSec);

  // Links
  body.appendChild(buildLinkSection('附件連結',t.links||[],
    lk=>{if(!t.links)t.links=[];t.links.push(lk);saveTrunk(t);openDetailPanel(trunkId,true);},
    i=>{t.links.splice(i,1);saveTrunk(t);openDetailPanel(trunkId,true);}
  ));

  // Stats
  const statSec=sec('節點回報統計');
  const statRow=document.createElement('div');statRow.className='dp-stat-row';
  const trunkNodes=NODES.filter(n=>n.trunk===trunkId);
  const updates=trunkNodes.filter(n=>n.type==='update').length;
  const milestones=trunkNodes.filter(n=>n.type==='milestone').length;
  const trips=trunkNodes.filter(n=>n.type==='trip').length;
  [{n:trunkNodes.length,l:'總計'},{n:updates,l:'進度'},{n:milestones,l:'里程碑'},{n:trips,l:'出差'}].forEach(s=>{
    const item=document.createElement('div');item.className='dp-stat-item';
    item.innerHTML=`<span class="dp-stat-num">${s.n}</span><span class="dp-stat-label">${s.l}</span>`;
    statRow.appendChild(item);
  });
  statSec.appendChild(statRow);body.appendChild(statSec);

  panel.classList.add('open');
}

// ── Branch detail panel ──
let openBranchId=null;
function openBranchDetail(trunkId,branchId,force){
  const panel=document.getElementById('detail-panel');
  if(!force&&openBranchId===branchId&&panel.classList.contains('open')){
    panel.classList.remove('open');openBranchId=null;openTrunkId=null;return;
  }
  openBranchId=branchId;openTrunkId=null;
  const t=TRUNKS.find(x=>x.id===trunkId);
  let b,isIndep=false;
  if(t&&t.isBranch){
    // Independent branch — stored as trunk
    b={id:t.id,name:t.name,start:t.start,end:t.end,color:t.color,desc:t.desc||'',links:t.links||[]};
    isIndep=true;
  } else if(t){
    b=t.branches.find(x=>x.id===branchId);
    if(!b)return;
  } else return;

  document.getElementById('dp-hdr-dot').style.background=b.color||(t?t.color:'#aaa');
  document.getElementById('dp-hdr-name').textContent=b.name;
  const body=document.getElementById('dp-body');body.innerHTML='';

  // Dates
  const dateSec=sec('期間設定');
  const dateRow=document.createElement('div');dateRow.style.cssText='display:flex;gap:6px;';
  const startInp=document.createElement('input');startInp.type='date';startInp.value=b.start||'';startInp.style.cssText='flex:1;padding:4px 6px;font-size:11px;';
  startInp.addEventListener('change',()=>{
    b.start=startInp.value;
    if(isIndep){t.start=b.start;}
    saveTrunk(t);buildTimeline();buildLabels();
  });
  const endInp=document.createElement('input');endInp.type='date';endInp.value=b.end||'';endInp.style.cssText='flex:1;padding:4px 6px;font-size:11px;';
  endInp.addEventListener('change',()=>{
    b.end=endInp.value||null;
    if(isIndep){t.end=b.end;}
    saveTrunk(t);buildTimeline();buildLabels();
  });
  const startLbl=document.createElement('div');startLbl.style.cssText='display:flex;flex-direction:column;flex:1;gap:2px;';
  startLbl.innerHTML='<span style="font-size:8px;color:var(--text-dim);">開始</span>';startLbl.appendChild(startInp);
  const endLbl=document.createElement('div');endLbl.style.cssText='display:flex;flex-direction:column;flex:1;gap:2px;';
  endLbl.innerHTML='<span style="font-size:8px;color:var(--text-dim);">截止</span>';endLbl.appendChild(endInp);
  dateRow.append(startLbl,endLbl);dateSec.appendChild(dateRow);body.appendChild(dateSec);

  // Description
  const descSec=sec('枝幹說明');
  const descTA=document.createElement('textarea');descTA.className='dp-desc';descTA.value=b.desc||'';descTA.placeholder='枝幹說明…';
  descTA.addEventListener('change',()=>{
    b.desc=descTA.value;
    if(isIndep){t.desc=b.desc;}
    saveTrunk(t);
  });
  descSec.appendChild(descTA);body.appendChild(descSec);

  // Links
  const bLinks=isIndep?(t.links||[]):(b.links||[]);
  body.appendChild(buildLinkSection('相關連結',bLinks,
    lk=>{
      if(isIndep){if(!t.links)t.links=[];t.links.push(lk);}
      else{if(!b.links)b.links=[];b.links.push(lk);}
      saveTrunk(t);openBranchDetail(trunkId,branchId,true);
    },
    i=>{bLinks.splice(i,1);if(isIndep)t.links=bLinks;else b.links=bLinks;saveTrunk(t);openBranchDetail(trunkId,branchId,true);}
  ));

  // Node stats for this branch
  const branchNodes=NODES.filter(n=>n.branch===branchId);
  if(branchNodes.length>0){
    const statSec=sec('回報統計');
    const statRow=document.createElement('div');statRow.className='dp-stat-row';
    const updates=branchNodes.filter(n=>n.type==='update').length;
    const milestones=branchNodes.filter(n=>n.type==='milestone').length;
    [{n:branchNodes.length,l:'總計'},{n:updates,l:'進度'},{n:milestones,l:'里程碑'}].forEach(s=>{
      const item=document.createElement('div');item.className='dp-stat-item';
      item.innerHTML=`<span class="dp-stat-num">${s.n}</span><span class="dp-stat-label">${s.l}</span>`;
      statRow.appendChild(item);
    });
    statSec.appendChild(statRow);body.appendChild(statSec);
  }

  panel.classList.add('open');
}

// Normalize link: old format (string) → {name, url}
function normLink(l){
  if(typeof l==='string') return {name:'',url:l};
  return {name:l.name||'',url:l.url||''};
}
function normLinks(arr){ return (arr||[]).map(normLink); }

// Build a reusable link section for detail panels
function buildLinkSection(label,linksArr,onAdd,onRemove,onRefresh){
  const linkSec=sec(label);
  const linkList=document.createElement('div');linkList.className='dp-link-row';
  const norms=normLinks(linksArr);
  norms.forEach((lk,i)=>{
    const item=document.createElement('div');item.className='dp-link-item';
    const a=document.createElement('a');a.href=lk.url;a.target='_blank';a.rel='noopener';
    a.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--blue);text-decoration:none;font-size:11px;';
    a.textContent=lk.name||lk.url;a.title=lk.url;
    const rm=document.createElement('span');rm.className='link-rm';rm.textContent='✕';
    rm.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();onRemove(i);});
    item.append(a,rm);
    item.addEventListener('click',e=>{if(e.target===item)window.open(lk.url,'_blank');});
    linkList.appendChild(item);
  });
  const addLinkRow=document.createElement('div');addLinkRow.className='dp-add-link';addLinkRow.style.flexDirection='column';addLinkRow.style.gap='3px';
  const nameInp=document.createElement('input');nameInp.placeholder='連結名稱（選填）';nameInp.type='text';nameInp.style.fontSize='11px';
  const urlInp=document.createElement('input');urlInp.placeholder='貼上網址…';urlInp.type='text';urlInp.style.fontSize='11px';
  const btnRow=document.createElement('div');btnRow.style.cssText='display:flex;gap:4px;';
  const linkBtn=document.createElement('button');linkBtn.textContent='＋ 新增連結';linkBtn.style.flex='1';
  linkBtn.addEventListener('click',()=>{
    const url=urlInp.value.trim();if(!url)return;
    onAdd({name:nameInp.value.trim(),url});
  });
  btnRow.appendChild(linkBtn);
  addLinkRow.append(nameInp,urlInp,btnRow);
  linkSec.append(linkList,addLinkRow);
  return linkSec;
}

function sec(label){
  const s=document.createElement('div');s.className='dp-section';
  const l=document.createElement('div');l.className='dp-label';l.textContent=label;
  s.appendChild(l);return s;
}
function personChip(mid,onRemove){
  const m=mem(mid);
  const chip=document.createElement('div');chip.className='dp-person';
  chip.appendChild(makeAv(mid,18));
  const name=document.createElement('span');name.textContent=m.name;chip.appendChild(name);
  if(onRemove){
    const rm=document.createElement('span');rm.textContent='✕';rm.style.cssText='cursor:pointer;font-size:9px;color:var(--text-dim);margin-left:3px;';
    rm.addEventListener('click',e=>{e.stopPropagation();onRemove();});chip.appendChild(rm);
  }
  return chip;
}
document.getElementById('dp-close').addEventListener('click',()=>{document.getElementById('detail-panel').classList.remove('open');openTrunkId=null;openBranchId=null;});

// Person picker popover
function openPersonPop(e,callback){
  const pop=document.getElementById('person-pop');pop.innerHTML='';
  MEMBERS.forEach(m=>{
    const item=document.createElement('div');item.className='pp-item';
    item.appendChild(makeAv(m.id,18));
    const name=document.createElement('span');name.textContent=m.name;item.appendChild(name);
    item.addEventListener('click',()=>{callback(m.id);pop.classList.remove('open');});
    pop.appendChild(item);
  });
  const rect=e.target.getBoundingClientRect();
  pop.style.left=Math.min(rect.left,window.innerWidth-150)+'px';
  pop.style.top=Math.min(rect.bottom+4,window.innerHeight-200)+'px';
  pop.classList.add('open');
  e.stopPropagation();
}
document.addEventListener('click',e=>{
  const pop=document.getElementById('person-pop');
  if(pop.classList.contains('open')&&!pop.contains(e.target))pop.classList.remove('open');
});

// ─────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────
function buildTimeline(){
  const rows=document.getElementById('rows');rows.innerHTML='';
  const filtered=activeOwner==='all'?TRUNKS:TRUNKS.filter(t=>t.owner===activeOwner);
  filtered.forEach(t=>{
    // ── Independent branch-trunk: render as trow (32px) to match left column ──
    if(t.isBranch){
      const tr=document.createElement('div');tr.className='trow trow-indep';tr.dataset.trunk=t.id;tr.dataset.branch=t.id;
      const displayColor=t.color;
      // bar (thinner, branch style)
      const bar=document.createElement('div');bar.className='tbar tbar-indep';
      if(!t.end){
        bar.style.cssText=`left:${dx(t.start)}px;width:${tw()-dx(t.start)}px;background:${displayColor};opacity:.7;height:8px;top:12px;border-radius:4px`;
      } else {
        bar.style.cssText=`left:${dx(t.start)}px;width:${dx(t.end)-dx(t.start)}px;background:${displayColor};height:8px;top:12px;border-radius:4px;opacity:.9`;
      }
      tr.appendChild(bar);
      // start dot
      const mkd=document.createElement('div');mkd.className='bmark-dot';
      mkd.style.cssText=`position:absolute;left:${dx(t.start)-3}px;top:11px;width:8px;height:8px;border-radius:50%;background:${displayColor};z-index:3;`;
      tr.appendChild(mkd);
      // Node bubbles on the trow
      NODES.filter(n=>n.branch===t.id).forEach(n=>addCard(n,tr));
      spreadOverlappingCards(tr);
      alternateCardPositions(tr);
      tr.style.cursor='pointer';
      tr.addEventListener('click',e=>{if(!e.target.closest('.nwrap'))openBranchDetail(t.id,t.id);});
      rows.appendChild(tr);
      return;
    }

    // ── Normal trunk ──
    const tr=document.createElement('div');tr.className='trow';tr.dataset.trunk=t.id;
    const bar=document.createElement('div');bar.className='tbar';
    bar.style.cssText=`left:${dx(t.start)}px;width:${dx(t.end)-dx(t.start)}px;background:${t.color}`;
    tr.appendChild(bar);
    addPills(tr,t);
    tr.addEventListener('click',()=>{toggle(t.id);openDetailPanel(t.id);});
    rows.appendChild(tr);

    const bg=document.createElement('div');bg.className='bgroup';bg.dataset.trunk=t.id;
    const addBtnH=24;
    bg.style.height=exp[t.id]?(t.branches.length*BH()+addBtnH)+'px':'0px';
    t.branches.forEach((b,bidx)=>{
      const brow=document.createElement('div');brow.className='brow';brow.dataset.branch=b.id;
      const displayColor=b.color===t.color?deriveColor(b.color,bidx+1):b.color;
      // stem
      const st=document.createElement('div');st.className='stem';
      st.style.cssText=`left:${dx(b.start)}px;background:${displayColor}`;brow.appendChild(st);
      // start marker
      const mk=document.createElement('div');mk.className='bmark';mk.style.left=dx(b.start)+'px';
      const mkd=document.createElement('div');mkd.className='bmark-dot';mkd.style.background=displayColor;
      const mklbl=document.createElement('div');mklbl.className='bmark-date';mklbl.textContent=fmt(b.start);
      mk.append(mkd,mklbl);brow.appendChild(mk);
      // bar
      const bb=document.createElement('div');bb.className='bbar';
      if(!b.end){
        // no end date: bar extends to visible right (solid)
        const w=tw()-dx(b.start);
        bb.style.cssText=`left:${dx(b.start)}px;width:${w}px;background:${displayColor};opacity:.7;`;
      } else {
        bb.style.cssText=`left:${dx(b.start)}px;width:${dx(b.end)-dx(b.start)}px;background:${displayColor}`;
        const el=document.createElement('div');el.className='endlbl';
        el.style.left=(dx(b.end)+4)+'px';el.textContent=fmt(b.end);brow.appendChild(el);
        // deadline warning
        const daysLeft=(new Date(b.end)-TODAY)/86400000;
        if(daysLeft>0&&daysLeft<14){
          const dw=document.createElement('div');
          dw.style.cssText=`position:absolute;height:8px;top:20px;border-radius:0 4px 4px 0;width:14px;left:${dx(b.end)-12}px;background:var(--red);opacity:.7`;
          brow.appendChild(dw);
        }
      }
      brow.appendChild(bb);
      NODES.filter(n=>n.branch===b.id).forEach(n=>addCard(n,brow));
      // Fan out overlapping cards on the same date
      spreadOverlappingCards(brow);
      // Alternate visible cards up/down
      alternateCardPositions(brow);
      brow.style.cursor='pointer';
      brow.addEventListener('click',e=>{if(!e.target.closest('.nwrap'))openBranchDetail(t.id,b.id);});
      bg.appendChild(brow);
    });
    if(exp[t.id])drawVinePaths(bg,t);
    rows.appendChild(bg);
  });
  applyF();
}

function drawVinePaths(bgEl,trunk){
  const TH=BH();const BranchH=BH();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','bgroup-svg');
  svg.setAttribute('viewBox',`0 0 ${tw()} ${trunk.branches.length*BranchH}`);
  svg.setAttribute('preserveAspectRatio','none');

  trunk.branches.forEach((b,idx)=>{
    const branchY=idx*BranchH+BranchH/2;
    const trunkY=-TH/2;
    const branchX=dx(b.start);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    const branchColor=b.color===trunk.color?deriveColor(b.color,idx+1):b.color;
    const d=`M ${branchX} ${trunkY} C ${branchX} ${trunkY+BranchH*0.3}, ${branchX} ${branchY-BranchH*0.3}, ${branchX} ${branchY}`;
    path.setAttribute('d',d);
    path.setAttribute('stroke',branchColor);
    path.setAttribute('class','vine-path');
    svg.appendChild(path);
  });

  bgEl.appendChild(svg);
}

function addPills(tr,trunk){
  trunk.branches.forEach(b=>{
    const p=document.createElement('div');p.className='tpill';
    const endX=b.end?dx(b.end):dx(b.start)+120;
    const displayColor=b.color===trunk.color?deriveColor(b.color,trunk.branches.indexOf(b)+1):b.color;
    p.style.cssText=`left:${dx(b.start)}px;width:${endX-dx(b.start)}px;background:${displayColor}`;
    p.textContent=b.name;tr.appendChild(p);
  });
}

// ─────────────────────────────────────────────
// NODE CARD
// ─────────────────────────────────────────────
function addCard(n,brow){
  const m=mem(n.member);
  const icon=n.type==='milestone'?'🏁':n.type==='trip'?'✈️':'📝';
  const w=document.createElement('div');
  w.className='nwrap';w.dataset.id=n.id;w.dataset.type=n.type;w.dataset.member=n.member;
  w.style.left=(dx(n.date)+DP/2)+'px';

  // avatar dot (circular, member color)
  const avDot=document.createElement('div');
  avDot.className='nav-dot';
  avDot.style.background=m.color;
  avDot.textContent=initials(m.name);
  avDot.title=m.name;

  const card=document.createElement('div');card.className='ncard';
  // Type-based bubble colors from REPORT_TYPES
  const rtObj=reportTypeObj(n.type);
  const tc={bg:rtObj.bg,border:rtObj.border,accent:rtObj.color};
  card.style.background=tc.bg;
  card.style.borderColor=tc.border;

  let imgH='';
  if(n.images&&n.images.length>0){
    imgH=`<img class="ncthumb" src="${n.images[0]}">`;
    if(n.images.length>1)imgH+=`<div class="ncmore">+${n.images.length-1}</div>`;
  }
  // collaborator dots
  let collabH='';
  if(n.collaborators&&n.collaborators.length>0){
    collabH='<div style="display:flex;gap:2px;margin-top:3px;">';
    n.collaborators.slice(0,3).forEach(cid=>{
      const cm=mem(cid);
      collabH+=`<div style="width:14px;height:14px;border-radius:50%;background:${cm.color};display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;border:1.5px solid #fff;">${initials(cm.name)}</div>`;
    });
    collabH+='</div>';
  }
  // For trip type, show location prominently
  let displayMsg=n.msg;
  if(n.type==='trip'){
    const locMatch=n.msg.match(/📍 地點：([^\n]*)/);
    if(locMatch)displayMsg='📍 '+locMatch[1];
  }
  let linkH='';
  const nLinks=normLinks(n.links);
  if(nLinks.length>0){
    linkH='<div style="display:flex;flex-direction:column;gap:1px;margin-top:3px;">';
    nLinks.slice(0,2).forEach(lk=>{
      linkH+=`<div style="font-size:8px;color:var(--blue);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🔗 ${lk.name||lk.url}</div>`;
    });
    if(nLinks.length>2)linkH+=`<div style="font-size:8px;color:var(--text-dim);">+${nLinks.length-2} 連結</div>`;
    linkH+='</div>';
  }
  card.innerHTML=`<div class="ncwho" style="color:${tc.accent}">${icon} <span class="ncdate">${fmt(n.date)}</span></div><div class="ncmsg">${displayMsg}</div>${collabH}${linkH}${imgH}`;
  w.append(avDot,card);
  w.addEventListener('click',()=>openNodeModal(n.id));
  brow.appendChild(w);return w;
}

// ─────────────────────────────────────────────
// SPREAD OVERLAPPING CARDS (stacking with badge)
// ─────────────────────────────────────────────
function spreadOverlappingCards(brow){
  const cards=[...brow.querySelectorAll('.nwrap')];
  if(cards.length<2)return;
  const groups={};
  cards.forEach(c=>{
    const key=c.style.left;
    if(!groups[key])groups[key]=[];
    groups[key].push(c);
  });
  Object.values(groups).forEach(group=>{
    if(group.length<2)return;
    // Hide all but the first card
    group.forEach((c,i)=>{
      if(i>0)c.style.display='none';
    });
    // Add count badge on the first card
    const first=group[0];
    const badge=document.createElement('div');
    badge.className='nwrap-badge';
    badge.textContent=group.length;
    first.querySelector('.nav-dot').appendChild(badge);
    // Override click to show picker
    first.replaceWith(first.cloneNode(true));
    const newFirst=brow.querySelector(`.nwrap[data-id="${first.dataset.id}"]`);
    newFirst.addEventListener('click',e=>{
      e.stopPropagation();
      showCardPicker(e, group.map(c=>parseInt(c.dataset.id)));
    });
  });
}

function showCardPicker(e, nodeIds){
  // Remove any existing picker
  document.querySelectorAll('.card-picker').forEach(p=>p.remove());
  const picker=document.createElement('div');
  picker.className='card-picker';
  nodeIds.forEach(nid=>{
    const n=NODES.find(x=>x.id===nid);if(!n)return;
    const m=mem(n.member);
    const icon=n.type==='milestone'?'🏁':n.type==='trip'?'✈️':'📝';
    const rtObj=reportTypeObj(n.type);
    const tc={bg:rtObj.bg,border:rtObj.border};
    const item=document.createElement('div');
    item.className='card-picker-item';
    item.style.background=tc.bg;
    item.style.borderColor=tc.border;
    item.innerHTML=`<span style="font-size:10px;">${icon}</span><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${m.color};color:#fff;font-size:7px;font-weight:700;text-align:center;line-height:14px;flex-shrink:0;">${initials(m.name)}</span><span style="flex:1;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n.msg}</span>`;
    item.addEventListener('click',()=>{picker.remove();openNodeModal(nid);});
    picker.appendChild(item);
  });
  // Position near click
  const rect=e.currentTarget.getBoundingClientRect();
  picker.style.left=Math.min(rect.left,window.innerWidth-220)+'px';
  picker.style.top=Math.min(rect.bottom+4,window.innerHeight-200)+'px';
  document.body.appendChild(picker);
  // Close on outside click
  setTimeout(()=>{
    const close=ev=>{if(!picker.contains(ev.target)){picker.remove();document.removeEventListener('click',close);}};
    document.addEventListener('click',close);
  },10);
}

function alternateCardPositions(brow){
  const visible=[...brow.querySelectorAll('.nwrap')].filter(c=>c.style.display!=='none');
  visible.sort((a,b)=>parseFloat(a.style.left)-parseFloat(b.style.left));
  visible.forEach((c,i)=>{
    if(i%2===1){
      c.style.top='26px'; // below the bar line
    }
  });
}

// ─────────────────────────────────────────────
// TOGGLE TRUNK
// ─────────────────────────────────────────────
function toggle(id){
  const t=TRUNKS.find(x=>x.id===id);
  if(!t||t.isBranch)return; // independent branches have nothing to toggle
  exp[id]=!exp[id];const open=exp[id];
  const brH=t.branches.length*BH();
  const addBtnH=24; // height of the "＋ 新增枝幹" button inside lc-bg
  const ca=document.querySelector(`.lc-trunk[data-trunk="${id}"] .lc-caret`);
  ca&&(open?ca.classList.add('open'):ca.classList.remove('open'));
  // Left column: set explicit height including add-branch button
  const lb=document.querySelector(`.lc-bg[data-trunk="${id}"]`);
  if(lb){
    if(open){lb.classList.add('open');lb.style.height=(brH+addBtnH)+'px';}
    else{lb.classList.remove('open');lb.style.height='0px';}
  }
  // Timeline: set explicit height matching branch rows only (no add button there, use spacer)
  const tb=document.querySelector(`.bgroup[data-trunk="${id}"]`);
  if(tb)tb.style.height=(open?(brH+addBtnH):0)+'px';
  const tr=document.querySelector(`.trow[data-trunk="${id}"]`);
  if(tr){tr.querySelectorAll('.tpill').forEach(p=>p.remove());addPills(tr,t);}
}

// ─────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────
function applyF(){
  document.querySelectorAll('.nwrap').forEach(w=>{
    const tok=activeType==='all'||w.dataset.type===activeType;
    const mok=activeMems.size===0||activeMems.has(w.dataset.member);
    w.classList.toggle('hidden',!(tok&&mok));
  });
  document.querySelectorAll('.brow').forEach(br=>{
    const any=[...br.querySelectorAll('.nwrap')].some(w=>!w.classList.contains('hidden'));
    br.classList.toggle('dimmed',!any&&(activeType!=='all'||activeMems.size>0));
  });
}
document.getElementById('type-filter-sel').addEventListener('change',function(){
  activeType=this.value;
  applyF();
});

// ─────────────────────────────────────────────
// NODE MODAL
// ─────────────────────────────────────────────
function openNodeModal(id){
  const n=NODES.find(x=>x.id===id);if(!n)return;
  currentNodeId=id;editImgs=[...(n.images||[])];
  const m=mem(n.member),b=branchObj(n.branch);
  document.getElementById('nmod-av2').style.background=m.color;
  document.getElementById('nmod-av2').textContent=initials(m.name);
  document.getElementById('nmod-who2').textContent=m.name;
  document.getElementById('nmod-type-hdr').textContent=n.type==='milestone'?'🏁 里程碑':n.type==='trip'?'✈️ 出差/公出':'📝 進度回報';
  document.getElementById('nmod-branch').textContent=b?`${b.name}`:'';
  document.getElementById('nmod-branch').style.color=b?b.color:'#aaa';
  document.getElementById('nmod-msg-edit').value=n.msg;
  // Notes
  let notesTA=document.getElementById('nmod-notes-edit');
  if(!notesTA){
    notesTA=document.createElement('textarea');notesTA.id='nmod-notes-edit';
    notesTA.className='nmod-edit';notesTA.rows=2;notesTA.placeholder='備註…';
    notesTA.style.cssText='margin-top:6px;min-height:36px;font-size:11px;color:var(--text-dim);';
    document.getElementById('nmod-msg-edit').after(notesTA);
  }
  notesTA.value=n.notes||'';
  document.getElementById('nmod-date').textContent=`📅 ${n.date}`;
  // collaborators
  const cc=document.getElementById('nmod-collabs');cc.innerHTML='';
  (n.collaborators||[]).forEach(cid=>cc.appendChild(makeAv(cid,18)));
  // meeting attendees removed
  // links
  const linksArea=document.getElementById('nmod-links');linksArea.innerHTML='';
  editNodeLinks=normLinks(n.links||[]);
  function renderNodeLinks(){
    linksArea.innerHTML='';
    editNodeLinks.forEach((lk,i)=>{
      const item=document.createElement('div');item.className='dp-link-item';item.style.fontSize='11px';
      const a=document.createElement('a');a.href=lk.url;a.target='_blank';a.rel='noopener';
      a.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--blue);text-decoration:none;';
      a.textContent=lk.name||lk.url;a.title=lk.url;
      const rm=document.createElement('span');rm.className='link-rm';rm.textContent='✕';
      rm.addEventListener('click',e=>{e.stopPropagation();editNodeLinks.splice(i,1);renderNodeLinks();});
      item.append(a,rm);linksArea.appendChild(item);
    });
    // add row
    const addRow=document.createElement('div');addRow.style.cssText='display:flex;flex-direction:column;gap:2px;margin-top:4px;';
    const nameI=document.createElement('input');nameI.type='text';nameI.placeholder='連結名稱（選填）';nameI.style.cssText='padding:3px 6px;font-size:10px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);outline:none;';
    const urlRow=document.createElement('div');urlRow.style.cssText='display:flex;gap:4px;';
    const urlI=document.createElement('input');urlI.type='text';urlI.placeholder='貼上網址…';urlI.style.cssText='flex:1;padding:3px 6px;font-size:10px;border-radius:4px;border:1px solid var(--border);background:var(--surface2);outline:none;';
    const addBtn=document.createElement('button');addBtn.textContent='＋';addBtn.style.cssText='padding:3px 8px;font-size:10px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);cursor:pointer;';
    addBtn.addEventListener('click',()=>{const u=urlI.value.trim();if(!u)return;editNodeLinks.push({name:nameI.value.trim(),url:u});renderNodeLinks();});
    urlRow.append(urlI,addBtn);addRow.append(nameI,urlRow);linksArea.appendChild(addRow);
  }
  renderNodeLinks();
  // images
  slImgs=[...editImgs];slIdx=0;updSlide();renderEditPrev();
  document.getElementById('nmodal').classList.add('open');
}
function updSlide(){
  const sl=document.getElementById('nmod-slides'),img=document.getElementById('nmod-img'),ctr=document.getElementById('slctr');
  if(!slImgs.length){sl.classList.remove('has');}
  else{sl.classList.add('has');img.src=slImgs[slIdx];ctr.textContent=`${slIdx+1} / ${slImgs.length}`;}
}
function renderEditPrev(){
  const c=document.getElementById('nmod-img-previews');c.innerHTML='';
  editImgs.forEach((s,i)=>{
    const wrap=document.createElement('div');wrap.className='ipwrap';
    const img=document.createElement('img');img.className='ipt';img.src=s;
    const rm=document.createElement('div');rm.className='iprm';rm.textContent='✕';
    rm.addEventListener('click',()=>{editImgs.splice(i,1);slImgs=[...editImgs];slIdx=Math.min(slIdx,slImgs.length-1);updSlide();renderEditPrev();});
    wrap.append(img,rm);c.appendChild(wrap);
  });
}
document.getElementById('slprev').addEventListener('click',e=>{e.stopPropagation();slIdx=(slIdx-1+slImgs.length)%slImgs.length;updSlide();});
document.getElementById('slnext').addEventListener('click',e=>{e.stopPropagation();slIdx=(slIdx+1)%slImgs.length;updSlide();});
document.getElementById('nmod-close').addEventListener('click',()=>document.getElementById('nmodal').classList.remove('open'));
document.getElementById('nmodal').addEventListener('click',e=>{if(e.target===document.getElementById('nmodal'))document.getElementById('nmodal').classList.remove('open');});
document.getElementById('nmod-ifinput').addEventListener('change',e=>{
  [...e.target.files].forEach(f=>{const r=new FileReader();r.onload=ev=>{editImgs.push(ev.target.result);slImgs=[...editImgs];slIdx=slImgs.length-1;updSlide();renderEditPrev();};r.readAsDataURL(f);});
  e.target.value='';
});
document.getElementById('nmod-save').addEventListener('click',()=>{
  const n=NODES.find(x=>x.id===currentNodeId);if(!n)return;
  n.msg=document.getElementById('nmod-msg-edit').value.trim();
  n.notes=document.getElementById('nmod-notes-edit')?.value?.trim()||'';
  n.images=[...editImgs];
  n.links=[...editNodeLinks];
  saveNode(n);
  // re-render that card
  const oldCard=document.querySelector(`.nwrap[data-id="${n.id}"]`);
  if(oldCard){const parent=oldCard.parentElement;oldCard.remove();addCard(n,parent);}
  document.getElementById('nmodal').classList.remove('open');
});

// Delete button in node modal
document.getElementById('nmod-del').addEventListener('click',()=>{
  const n=NODES.find(x=>x.id===currentNodeId);if(!n)return;
  const m=mem(n.member);
  const confirmMsg=`確定要刪除這筆回報嗎？\n\n👤 ${m.name}\n📅 ${n.date}\n📝 ${n.msg.substring(0,50)}${n.msg.length>50?'…':''}`;
  if(!confirm(confirmMsg))return;
  // Remove from NODES
  const idx=NODES.findIndex(x=>x.id===currentNodeId);
  if(idx!==-1)NODES.splice(idx,1);
  // Remove from Firestore
  if(typeof db!=='undefined'){
    db.collection('nodes').doc(String(currentNodeId)).delete().catch(()=>{});
  }
  // Remove card from DOM
  const oldCard=document.querySelector(`.nwrap[data-id="${currentNodeId}"]`);
  if(oldCard)oldCard.remove();
  // Close modal and rebuild
  document.getElementById('nmodal').classList.remove('open');
  buildLabels();buildTimeline();
});

// Copy button in node modal
document.getElementById('nmod-copy').addEventListener('click',()=>{
  const n=NODES.find(x=>x.id===currentNodeId);if(!n)return;
  const m=mem(n.member);
  const b=branchObj(n.branch);
  const branchName=b?b.name:'—';
  // Find trunk name
  let trunkName='';
  const _tid=trunkForBranch(n.branch);
  if(_tid){const _tt=TRUNKS.find(x=>x.id===_tid);if(_tt)trunkName=_tt.isBranch?'':_tt.name;}
  const hasImg=(n.images&&n.images.length>0)?'有':'無';
  // Format like a bank notification card
  const notesLine=n.notes?`\n📎 備註：${n.notes}`:'';
  const text=`══════════════════\n  📋 任務回報通知\n══════════════════\n\n📌 任務名稱：${trunkName} › ${branchName}\n👤 負責人：${m.name}\n📅 日期：${n.date}\n\n──────────────────\n📝 回報內容：\n${n.msg}${notesLine}\n──────────────────\n\n🖼️ 圖片附件：${hasImg}${hasImg==='有'?' ('+n.images.length+'張)':''}\n\n══════════════════`;
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.getElementById('nmod-copy');
    btn.classList.add('copied');btn.textContent='✓';
    setTimeout(()=>{btn.classList.remove('copied');btn.textContent='📋';},1500);
  });
});

// (Progress popover removed)

// ─────────────────────────────────────────────
// SETTINGS MODAL (Members, Categories, Statuses)
// ─────────────────────────────────────────────
let activeSettingsTab='members';

document.getElementById('btn-settings').addEventListener('click',()=>{
  activeSettingsTab='members';
  renderSettingsModal();
  document.getElementById('settings-modal').classList.add('open');
});
document.getElementById('settings-close').addEventListener('click',()=>document.getElementById('settings-modal').classList.remove('open'));
document.getElementById('settings-modal').addEventListener('click',e=>{if(e.target===document.getElementById('settings-modal'))document.getElementById('settings-modal').classList.remove('open');});

document.querySelectorAll('.settings-tab').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('.settings-tab').forEach(x=>x.classList.remove('on'));
  tab.classList.add('on');
  activeSettingsTab=tab.dataset.stab;
  renderSettingsModal();
}));

function renderSettingsModal(){
  if(activeSettingsTab==='members') renderMembersSettings();
  else if(activeSettingsTab==='categories') renderCategoriesSettings();
  else if(activeSettingsTab==='statuses') renderStatusesSettings();
  else if(activeSettingsTab==='priorities') renderPrioritiesSettings();
}

function renderMembersSettings(){
  const body=document.getElementById('settings-body');
  body.innerHTML='';
  // Member list
  const list=document.createElement('div');list.className='settings-list';
  MEMBERS.forEach((m,i)=>{
    const row=document.createElement('div');row.className='settings-row';
    const col=document.createElement('input');col.type='color';col.className='s-color';col.value=m.color;
    col.addEventListener('change',()=>{m.color=col.value;saveMember(m);buildHeaderAvatars();buildLabels();buildTimeline();buildOwnerFilter();});
    const av=document.createElement('div');av.style.cssText=`width:24px;height:24px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;`;
    av.textContent=initials(m.name);
    const nm=document.createElement('input');nm.className='s-name';nm.value=m.name;
    nm.addEventListener('change',()=>{m.name=nm.value.trim()||m.name;saveMember(m);renderMembersSettings();buildHeaderAvatars();buildLabels();buildTimeline();buildOwnerFilter();});
    const del=document.createElement('button');del.className='s-del';del.textContent='✕';
    del.addEventListener('click',()=>{const delId=m.id;MEMBERS.splice(i,1);deleteMember(delId);renderMembersSettings();buildHeaderAvatars();buildSelects();buildOwnerFilter();buildDailySelects();});
    row.append(col,av,nm,del);list.appendChild(row);
  });
  body.appendChild(list);
  // Add new member (single row at bottom)
  const addRow=document.createElement('div');addRow.className='settings-add';
  const inp=document.createElement('input');inp.type='text';inp.placeholder='新成員名稱';
  const colInp=document.createElement('input');colInp.type='color';colInp.value='#5b9cf6';colInp.style.cssText='width:32px;height:28px;padding:2px;border-radius:4px;border:1px solid var(--border);cursor:pointer;';
  const btn=document.createElement('button');btn.textContent='新增';
  btn.addEventListener('click',()=>{
    const name=inp.value.trim();if(!name)return;
    const newMem={id:'U'+Date.now().toString(36),name,color:colInp.value};
    MEMBERS.push(newMem);saveMember(newMem);
    renderMembersSettings();buildHeaderAvatars();buildSelects();buildOwnerFilter();buildDailySelects();
  });
  addRow.append(inp,colInp,btn);body.appendChild(addRow);
}

function renderCategoriesSettings(){
  const body=document.getElementById('settings-body');body.innerHTML='';
  const list=document.createElement('div');list.className='settings-list';
  REPORT_TYPES.forEach((rt,i)=>{
    const row=document.createElement('div');row.className='settings-row';
    const col=document.createElement('input');col.type='color';col.className='s-color';col.value=rt.color;
    col.addEventListener('change',()=>{rt.color=col.value;saveSettings('reportTypes',REPORT_TYPES);renderCategoriesSettings();buildTimeline();});
    const swatch=document.createElement('div');swatch.style.cssText=`padding:2px 6px;border-radius:8px;font-size:9px;font-weight:600;background:${rt.bg};color:${rt.color};border:1px solid ${rt.border};flex-shrink:0;`;swatch.textContent=rt.label;
    const nm=document.createElement('input');nm.className='s-name';nm.value=rt.label;
    nm.addEventListener('change',()=>{rt.label=nm.value.trim()||rt.label;saveSettings('reportTypes',REPORT_TYPES);renderCategoriesSettings();buildTimeline();buildSelects();});
    const bgInp=document.createElement('input');bgInp.type='color';bgInp.className='s-color';bgInp.value=rt.bg;bgInp.title='背景色';
    bgInp.addEventListener('change',()=>{rt.bg=bgInp.value;saveSettings('reportTypes',REPORT_TYPES);renderCategoriesSettings();buildTimeline();});
    const borderInp=document.createElement('input');borderInp.type='color';borderInp.className='s-color';borderInp.value=rt.border;borderInp.title='邊框色';
    borderInp.addEventListener('change',()=>{rt.border=borderInp.value;saveSettings('reportTypes',REPORT_TYPES);renderCategoriesSettings();buildTimeline();});
    const del=document.createElement('button');del.className='s-del';del.textContent='✕';
    del.addEventListener('click',()=>{if(REPORT_TYPES.length<=1)return;REPORT_TYPES.splice(i,1);saveSettings('reportTypes',REPORT_TYPES);renderCategoriesSettings();buildTimeline();buildSelects();});
    row.append(col,swatch,nm,bgInp,borderInp,del);list.appendChild(row);
  });
  body.appendChild(list);
  const addRow=document.createElement('div');addRow.className='settings-add';
  const inp=document.createElement('input');inp.type='text';inp.placeholder='新回報類別名稱';
  const colInp=document.createElement('input');colInp.type='color';colInp.value='#5a6d82';colInp.style.cssText='width:32px;height:28px;padding:2px;border-radius:4px;border:1px solid var(--border);cursor:pointer;';
  const btn=document.createElement('button');btn.textContent='新增';
  btn.addEventListener('click',()=>{
    const label=inp.value.trim();if(!label)return;
    const id='rt'+Date.now().toString(36);
    const c=colInp.value;
    REPORT_TYPES.push({id,label,color:c,bg:c+'1a',border:c+'66'});
    saveSettings('reportTypes',REPORT_TYPES);
    renderCategoriesSettings();buildTimeline();buildSelects();
  });
  addRow.append(inp,colInp,btn);body.appendChild(addRow);
}

function renderStatusesSettings(){
  const body=document.getElementById('settings-body');body.innerHTML='';
  const list=document.createElement('div');list.className='settings-list';
  PROJECT_STATUSES.forEach((st,i)=>{
    const row=document.createElement('div');row.className='settings-row';
    const col=document.createElement('input');col.type='color';col.className='s-color';col.value=st.color;
    col.addEventListener('change',()=>{st.color=col.value;saveSettings('projectStatuses',PROJECT_STATUSES);renderStatusesSettings();});
    const swatch=document.createElement('div');swatch.className='dash-status';swatch.style.cssText=`background:${st.bg};color:${st.color};`;swatch.textContent=st.label;
    const nm=document.createElement('input');nm.className='s-name';nm.value=st.label;
    nm.addEventListener('change',()=>{st.label=nm.value.trim()||st.label;saveSettings('projectStatuses',PROJECT_STATUSES);renderStatusesSettings();});
    const bgInp=document.createElement('input');bgInp.type='color';bgInp.className='s-color';bgInp.value=st.bg;bgInp.title='背景色';
    bgInp.addEventListener('change',()=>{st.bg=bgInp.value;saveSettings('projectStatuses',PROJECT_STATUSES);renderStatusesSettings();});
    const del=document.createElement('button');del.className='s-del';del.textContent='✕';
    del.addEventListener('click',()=>{PROJECT_STATUSES.splice(i,1);saveSettings('projectStatuses',PROJECT_STATUSES);renderStatusesSettings();});
    row.append(col,swatch,nm,bgInp,del);list.appendChild(row);
  });
  body.appendChild(list);
  const addRow=document.createElement('div');addRow.className='settings-add';
  const inp=document.createElement('input');inp.type='text';inp.placeholder='新狀態名稱';
  const colInp=document.createElement('input');colInp.type='color';colInp.value='#5a6d82';colInp.style.cssText='width:32px;height:28px;padding:2px;border-radius:4px;border:1px solid var(--border);cursor:pointer;';
  const btn=document.createElement('button');btn.textContent='新增';
  btn.addEventListener('click',()=>{
    const label=inp.value.trim();if(!label)return;
    const id='st'+Date.now().toString(36);
    PROJECT_STATUSES.push({id,label,color:colInp.value,bg:colInp.value+'1a'});
    saveSettings('projectStatuses',PROJECT_STATUSES);
    renderStatusesSettings();
  });
  addRow.append(inp,colInp,btn);body.appendChild(addRow);
}

function renderPrioritiesSettings(){
  const body=document.getElementById('settings-body');body.innerHTML='';
  const list=document.createElement('div');list.className='settings-list';
  PRIORITIES.forEach((pr,i)=>{
    const row=document.createElement('div');row.className='settings-row';
    const col=document.createElement('input');col.type='color';col.className='s-color';col.value=pr.color;
    col.addEventListener('change',()=>{pr.color=col.value;saveSettings('priorities',PRIORITIES);renderPrioritiesSettings();});
    const swatch=document.createElement('div');swatch.className='dash-status';swatch.style.cssText=`background:${pr.bg};color:${pr.color};`;swatch.textContent=pr.label;
    const nm=document.createElement('input');nm.className='s-name';nm.value=pr.label;
    nm.addEventListener('change',()=>{pr.label=nm.value.trim()||pr.label;saveSettings('priorities',PRIORITIES);renderPrioritiesSettings();});
    const bgInp=document.createElement('input');bgInp.type='color';bgInp.className='s-color';bgInp.value=pr.bg;bgInp.title='背景色';
    bgInp.addEventListener('change',()=>{pr.bg=bgInp.value;saveSettings('priorities',PRIORITIES);renderPrioritiesSettings();});
    const del=document.createElement('button');del.className='s-del';del.textContent='✕';
    del.addEventListener('click',()=>{PRIORITIES.splice(i,1);saveSettings('priorities',PRIORITIES);renderPrioritiesSettings();});
    row.append(col,swatch,nm,bgInp,del);list.appendChild(row);
  });
  body.appendChild(list);
  const addRow=document.createElement('div');addRow.className='settings-add';
  const inp=document.createElement('input');inp.type='text';inp.placeholder='新優先度名稱';
  const colInp=document.createElement('input');colInp.type='color';colInp.value='#5a6d82';colInp.style.cssText='width:32px;height:28px;padding:2px;border-radius:4px;border:1px solid var(--border);cursor:pointer;';
  const btn=document.createElement('button');btn.textContent='新增';
  btn.addEventListener('click',()=>{
    const label=inp.value.trim();if(!label)return;
    const id='pri'+Date.now().toString(36);
    PRIORITIES.push({id,label,color:colInp.value,bg:colInp.value+'1a',border:colInp.value+'cc'});
    saveSettings('priorities',PRIORITIES);
    renderPrioritiesSettings();
  });
  addRow.append(inp,colInp,btn);body.appendChild(addRow);
}

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────
document.getElementById('btn-dashboard').addEventListener('click',()=>switchView('dashboard'));
document.getElementById('btn-timeline').addEventListener('click',()=>switchView('timeline'));

function switchView(view){
  currentView=view;
  const main=document.getElementById('main');
  const botResize=document.getElementById('bot-resize-handle');
  const botTabs=document.getElementById('bot-tabs');
  const rp=document.getElementById('rp');
  const wk=document.getElementById('weekly-panel');
  const dash=document.getElementById('dashboard-page');
  const btnDash=document.getElementById('btn-dashboard');
  const btnTL=document.getElementById('btn-timeline');

  if(view==='dashboard'){
    main.style.display='none';
    botResize.style.display='none';
    botTabs.style.display='none';
    rp.style.display='none';
    wk.style.display='none';
    dash.style.display='flex';
    btnDash.classList.add('active');
    btnTL.classList.remove('active');
    buildDashboard();
  }else{
    main.style.display='flex';
    botResize.style.display='';
    botTabs.style.display='';
    dash.style.display='none';
    btnDash.classList.remove('active');
    btnTL.classList.add('active');
    // restore active bottom tab
    const activeTab=document.querySelector('.bot-tab.on');
    if(activeTab){
      const p=activeTab.dataset.panel;
      if(p==='rp')rp.style.display='flex';
      else if(p==='weekly-panel'){wk.style.display='flex';buildWeekly();}
    }else rp.style.display='flex';
  }
}

function buildDashboard(){
  const body=document.getElementById('dash-body');body.innerHTML='';

  // ── Metrics panel ──
  const metrics=document.createElement('div');metrics.className='dash-metrics';

  // Total projects
  const totalCard=document.createElement('div');totalCard.className='dash-metric-card';
  totalCard.innerHTML=`<div class="dm-value">${TRUNKS.length}</div><div class="dm-label">專案總數</div>`;
  metrics.appendChild(totalCard);

  // Total branches
  const totalBranches=TRUNKS.reduce((s,t)=>s+(t.isBranch?1:t.branches.length),0);
  const brCard=document.createElement('div');brCard.className='dash-metric-card';
  brCard.innerHTML=`<div class="dm-value">${totalBranches}</div><div class="dm-label">枝幹總數</div>`;
  metrics.appendChild(brCard);

  // Total nodes
  const nodeCard=document.createElement('div');nodeCard.className='dash-metric-card';
  nodeCard.innerHTML=`<div class="dm-value">${NODES.length}</div><div class="dm-label">回報總數</div>`;
  metrics.appendChild(nodeCard);

  // Status counts
  PROJECT_STATUSES.forEach(st=>{
    const count=TRUNKS.filter(t=>t.status===st.id).length;
    const card=document.createElement('div');card.className='dash-metric-card';
    card.style.borderLeft=`3px solid ${st.color}`;
    card.innerHTML=`<div class="dm-value" style="color:${st.color}">${count}</div><div class="dm-label">${st.label}</div>`;
    metrics.appendChild(card);
  });

  // Priority counts
  PRIORITIES.forEach(pri=>{
    const count=TRUNKS.filter(t=>t.priority===pri.id).length;
    if(count>0){
      const card=document.createElement('div');card.className='dash-metric-card';
      card.style.borderLeft=`3px solid ${pri.color}`;
      card.innerHTML=`<div class="dm-value" style="color:${pri.color}">${count}</div><div class="dm-label">${pri.label}</div>`;
      metrics.appendChild(card);
    }
  });

  body.appendChild(metrics);

  const table=document.createElement('table');table.className='dash-table';
  const thead=document.createElement('thead');
  const htr=document.createElement('tr');
  ['','專案/枝幹','狀態','優先度','負責人','協作者','開始','截止','進度','節點數','最新回報'].forEach(h=>{
    const th=document.createElement('th');th.textContent=h;htr.appendChild(th);
  });
  thead.appendChild(htr);table.appendChild(thead);
  const tbody=document.createElement('tbody');
  const dashExp={};
  TRUNKS.forEach(t=>{
    const tr=document.createElement('tr');tr.style.cursor='pointer';
    // Toggle cell
    const togTd=document.createElement('td');togTd.style.cssText='text-align:center;font-size:10px;color:var(--text-dim);width:24px;';
    togTd.textContent=t.branches.length>0?'▶':'';
    tr.appendChild(togTd);
    // Name
    const nameTd=document.createElement('td');
    nameTd.innerHTML=`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.color};margin-right:6px;vertical-align:middle;"></span><strong>${t.name}</strong>`;
    tr.appendChild(nameTd);
    // Status
    const stTd=document.createElement('td');
    const st=statusObj(t.status);
    stTd.innerHTML=`<span class="dash-status" style="background:${st.bg};color:${st.color};">${st.label}</span>`;
    tr.appendChild(stTd);
    // Priority
    const priTd=document.createElement('td');
    const pri=priorityObj(t.priority);
    priTd.innerHTML=`<span class="dash-status" style="background:${pri.bg};color:${pri.color};">${pri.label}</span>`;
    tr.appendChild(priTd);
    // Owner
    const ownerTd=document.createElement('td');
    if(t.owner){const m=mem(t.owner);ownerTd.innerHTML=`<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${m.color};color:#fff;font-size:7px;font-weight:700;text-align:center;line-height:16px;vertical-align:middle;margin-right:4px;">${initials(m.name)}</span>${m.name}`;}
    tr.appendChild(ownerTd);
    // Collaborators
    const collabTd=document.createElement('td');
    (t.collaborators||[]).forEach(cid=>{const m=mem(cid);collabTd.innerHTML+=`<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${m.color};color:#fff;font-size:7px;font-weight:700;text-align:center;line-height:16px;margin-right:2px;" title="${m.name}">${initials(m.name)}</span>`;});
    tr.appendChild(collabTd);
    // Start
    const startTd=document.createElement('td');startTd.style.cssText='font-family:"DM Mono",monospace;font-size:11px;white-space:nowrap;';startTd.textContent=t.start;tr.appendChild(startTd);
    // End
    const endTd=document.createElement('td');endTd.style.cssText='font-family:"DM Mono",monospace;font-size:11px;white-space:nowrap;';endTd.textContent=t.end||'∞';tr.appendChild(endTd);
    // Progress (avg of branches)
    const progTd=document.createElement('td');progTd.style.textAlign='center';
    if(t.branches.length>0){
      const avgProg=Math.round(t.branches.reduce((s,b)=>s+b.prog,0)/t.branches.length);
      progTd.textContent=avgProg+'%';
    }else progTd.textContent='—';
    tr.appendChild(progTd);
    // Node count
    const nodeTd=document.createElement('td');nodeTd.style.textAlign='center';
    nodeTd.textContent=NODES.filter(n=>n.trunk===t.id).length;tr.appendChild(nodeTd);
    // Latest message
    const latestTd=document.createElement('td');
    const tNodes=NODES.filter(n=>n.trunk===t.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(tNodes.length>0){
      const ln=tNodes[0];const lm=mem(ln.member);
      latestTd.innerHTML=`<div class="dash-latest-msg"><span style="font-size:10px;color:var(--text-dim);font-family:'DM Mono',monospace;">${ln.date}</span> <strong style="font-size:10px;">${lm.name}</strong>: ${ln.msg}</div>`;
    }else{latestTd.innerHTML='<span style="color:var(--text-dim);font-size:10px;">尚無回報</span>';}
    tr.appendChild(latestTd);
    tbody.appendChild(tr);

    // Branch sub-rows (initially hidden)
    const brRows=[];
    t.branches.forEach((b,bidx)=>{
      const btr=document.createElement('tr');btr.className='dash-branch-row';btr.style.display='none';
      btr.style.background='var(--surface2)';
      const emTd=document.createElement('td');emTd.textContent='';btr.appendChild(emTd);
      const bnameTd=document.createElement('td');
      const displayColor=b.color===t.color?deriveColor(b.color,bidx+1):b.color;
      bnameTd.innerHTML=`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${displayColor};margin:0 6px 0 16px;vertical-align:middle;"></span><span style="font-size:11px;">${b.name}</span>`;
      btr.appendChild(bnameTd);
      // status placeholder
      const bstTd=document.createElement('td');bstTd.textContent='—';btr.appendChild(bstTd);
      // priority placeholder
      const bpriTd=document.createElement('td');bpriTd.textContent='—';btr.appendChild(bpriTd);
      // reporters
      const bOwnerTd=document.createElement('td');
      const reporters=new Set();
      NODES.filter(n=>n.branch===b.id).forEach(n=>reporters.add(n.member));
      reporters.forEach(mid=>{const m=mem(mid);bOwnerTd.innerHTML+=`<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${m.color};color:#fff;font-size:6px;font-weight:700;text-align:center;line-height:14px;margin-right:2px;" title="${m.name}">${initials(m.name)}</span>`;});
      btr.appendChild(bOwnerTd);
      const bCollabTd=document.createElement('td');btr.appendChild(bCollabTd);
      // dates
      const bsTd=document.createElement('td');bsTd.style.cssText='font-family:"DM Mono",monospace;font-size:10px;color:var(--text-dim);';bsTd.textContent=b.start;btr.appendChild(bsTd);
      const beTd=document.createElement('td');beTd.style.cssText='font-family:"DM Mono",monospace;font-size:10px;color:var(--text-dim);';beTd.textContent=b.end||'∞';btr.appendChild(beTd);
      // progress
      const bpTd=document.createElement('td');bpTd.style.textAlign='center';bpTd.innerHTML=`<span style="font-size:10px;">${b.prog}%</span>`;btr.appendChild(bpTd);
      // node count
      const bnTd=document.createElement('td');bnTd.style.textAlign='center';bnTd.textContent=NODES.filter(n=>n.branch===b.id).length;btr.appendChild(bnTd);
      // latest
      const blTd=document.createElement('td');
      const bNodes=NODES.filter(n=>n.branch===b.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
      if(bNodes.length>0){const ln=bNodes[0];const lm=mem(ln.member);blTd.innerHTML=`<div class="dash-latest-msg"><span style="font-size:9px;color:var(--text-dim);">${ln.date}</span> ${lm.name}: ${ln.msg}</div>`;}
      else blTd.innerHTML='<span style="color:var(--text-dim);font-size:9px;">—</span>';
      btr.appendChild(blTd);
      tbody.appendChild(btr);
      brRows.push(btr);
    });

    // Toggle click
    let expanded=false;
    tr.addEventListener('click',()=>{
      expanded=!expanded;
      togTd.textContent=t.branches.length>0?(expanded?'▼':'▶'):'';
      brRows.forEach(r=>r.style.display=expanded?'':'none');
    });
  });
  table.appendChild(tbody);body.appendChild(table);

  // Update week label
  const weekLabel=document.getElementById('dash-week-label');
  if(weekLabel){
    const now=TODAY;
    const day=now.getDay()||7;
    const mon=new Date(now);mon.setDate(now.getDate()-(day-1));
    const fri=new Date(mon);fri.setDate(mon.getDate()+4);
    const fmtD=d=>`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    const days=['日','一','二','三','四','五','六'];
    weekLabel.textContent=`本週 ${fmtD(mon)}（${days[mon.getDay()]}）～ ${fmtD(fri)}（${days[fri.getDay()]}）`;
  }
}

// ── Dashboard Export ──
function getWeekRangeStr(){
  const now=TODAY;const day=now.getDay()||7;
  const mon=new Date(now);mon.setDate(now.getDate()-(day-1));
  const fri=new Date(mon);fri.setDate(mon.getDate()+4);
  const fmtD=d=>`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  return `${fmtD(mon)} ~ ${fmtD(fri)}`;
}
function getDashData(){
  const rows=[];
  TRUNKS.forEach(t=>{
    const st=statusObj(t.status);const pri=priorityObj(t.priority);
    const owner=t.owner?mem(t.owner).name:'';
    const collabs=(t.collaborators||[]).map(c=>mem(c).name).join(', ');
    const avgProg=t.branches.length>0?Math.round(t.branches.reduce((s,b)=>s+b.prog,0)/t.branches.length):0;
    const nodeCount=NODES.filter(n=>n.trunk===t.id).length;
    const tNodes=NODES.filter(n=>n.trunk===t.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const latest=tNodes.length>0?`${tNodes[0].date} ${mem(tNodes[0].member).name}: ${tNodes[0].msg}`:'';
    rows.push({type:'trunk',name:t.name,status:st.label,priority:pri.label,owner,collabs,start:t.start,end:t.end||'∞',prog:avgProg+'%',nodes:nodeCount,latest});
    t.branches.forEach(b=>{
      const reporters=[...new Set(NODES.filter(n=>n.branch===b.id).map(n=>mem(n.member).name))].join(', ');
      const bNodeCount=NODES.filter(n=>n.branch===b.id).length;
      const bNodes=NODES.filter(n=>n.branch===b.id).sort((a,bb)=>new Date(bb.date)-new Date(a.date));
      const bLatest=bNodes.length>0?`${bNodes[0].date} ${mem(bNodes[0].member).name}: ${bNodes[0].msg}`:'';
      rows.push({type:'branch',name:'  └ '+b.name,status:'—',priority:'—',owner:reporters,collabs:'',start:b.start,end:b.end||'∞',prog:b.prog+'%',nodes:bNodeCount,latest:bLatest});
    });
  });
  return rows;
}

document.getElementById('dash-export-xlsx').addEventListener('click',()=>{
  if(typeof XLSX==='undefined'){alert('SheetJS 載入失敗，請檢查網路連線');return;}
  const header=['專案/枝幹','狀態','優先度','負責人','協作者','開始','截止','進度','節點數','最新回報'];
  const data=getDashData().map(r=>[r.name,r.status,r.priority,r.owner,r.collabs,r.start,r.end,r.prog,r.nodes,r.latest]);
  const wsData=[
    ['專案總表 — '+getWeekRangeStr()],
    [],
    header,
    ...data
  ];
  const ws=XLSX.utils.aoa_to_sheet(wsData);
  // Merge title row
  ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:header.length-1}}];
  // Column widths
  ws['!cols']=header.map((_,i)=>({wch:i===0?22:i===9?40:14}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'專案總表');
  XLSX.writeFile(wb,`專案總表_${todayStr}.xlsx`);
});

document.getElementById('dash-export-pdf').addEventListener('click',()=>{
  // Expand all branch rows before printing
  document.querySelectorAll('.dash-branch-row').forEach(r=>r.style.display='');
  window.print();
});

// ─────────────────────────────────────────────
// REPORT PANEL SUBMIT
// ─────────────────────────────────────────────
document.getElementById('ifinput').addEventListener('change',e=>{
  [...e.target.files].forEach(f=>{const r=new FileReader();r.onload=ev=>{pendImgs.push(ev.target.result);renderPendPrev();};r.readAsDataURL(f);});e.target.value='';
});
function renderPendPrev(){
  const c=document.getElementById('ipreviews');c.innerHTML='';
  pendImgs.forEach((s,i)=>{
    const wrap=document.createElement('div');wrap.className='ipwrap';
    const img=document.createElement('img');img.className='ipt';img.src=s;
    const rm=document.createElement('div');rm.className='iprm';rm.textContent='✕';
    rm.addEventListener('click',()=>{pendImgs.splice(i,1);renderPendPrev();});
    wrap.append(img,rm);c.appendChild(wrap);
  });
}
function renderPendLinks(){
  const c=document.getElementById('rp-link-previews');c.innerHTML='';
  pendLinks.forEach((lk,i)=>{
    const item=document.createElement('div');item.className='dp-link-item';item.style.fontSize='10px';
    const a=document.createElement('a');a.href=lk.url;a.target='_blank';a.rel='noopener';
    a.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--blue);text-decoration:none;';
    a.textContent=lk.name||lk.url;a.title=lk.url;
    const rm=document.createElement('span');rm.className='link-rm';rm.textContent='✕';
    rm.addEventListener('click',e=>{e.stopPropagation();pendLinks.splice(i,1);renderPendLinks();});
    item.append(a,rm);c.appendChild(item);
  });
}
document.getElementById('rp-link-add').addEventListener('click',()=>{
  const url=document.getElementById('rp-link-url').value.trim();if(!url)return;
  const name=document.getElementById('rp-link-name').value.trim();
  pendLinks.push({name,url});
  document.getElementById('rp-link-url').value='';document.getElementById('rp-link-name').value='';
  renderPendLinks();
});
document.getElementById('rprep').addEventListener('change',buildCollabPicks);
document.getElementById('subbt').addEventListener('click',()=>{
  const bid=document.getElementById('rpbr').value,mk=document.getElementById('rprep').value;
  const di=document.getElementById('msdate').value;
  const title=(document.getElementById('rp-title')?.value||'').trim();
  const desc=document.getElementById('rmsg').value.trim();

  if(!title&&!desc){
    const el=document.getElementById('rp-title')||document.getElementById('rmsg');
    el.style.borderColor='#c97b7b';setTimeout(()=>el.style.borderColor='',800);return;
  }

  // Combine title + description into msg
  let msg=title?(desc?title+'\n\n'+desc:title):desc;

  const dateStr=di||todayStr;
  let tid=trunkForBranch(bid);
  const nodeLinks=[...pendLinks];
  const nn={id:++NC,trunk:tid,branch:bid,type:'update',date:dateStr,member:mk,collaborators:[],msg,notes:'',images:[...pendImgs],links:nodeLinks};
  NODES.push(nn);saveNode(nn);pendImgs=[];pendLinks=[];renderPendPrev();renderPendLinks();
  if(!exp[tid]){exp[tid]=true;}
  buildLabels();buildTimeline();
  if(document.getElementById('rp-title'))document.getElementById('rp-title').value='';
  document.getElementById('rmsg').value='';
  document.getElementById('rp-link-url').value='';document.getElementById('rp-link-name').value='';
  const sb=document.getElementById('subbt');sb.style.background='#6aaa82';sb.textContent='✓';
  setTimeout(()=>{sb.style.background='var(--text)';sb.textContent='↑';},800);
  if(openTrunkId===tid)openDetailPanel(tid);
});

// ─────────────────────────────────────────────
// BOTTOM TABS
// ─────────────────────────────────────────────
document.querySelectorAll('.bot-tab').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('.bot-tab').forEach(x=>x.classList.remove('on'));tab.classList.add('on');
  const p=tab.dataset.panel;
  document.getElementById('rp').style.display=p==='rp'?'flex':'none';
  document.getElementById('weekly-panel').style.display=p==='weekly-panel'?'flex':'none';
  if(p==='rp')renderDailyEntries();
  if(p==='weekly-panel')buildWeekly();
}));

let botCollapsed=false;
document.getElementById('btn-collapse-bot').addEventListener('click',()=>{
  botCollapsed=!botCollapsed;
  const rp=document.getElementById('rp');
  const wk=document.getElementById('weekly-panel');
  const btn=document.getElementById('btn-collapse-bot');
  const tabs=document.getElementById('bot-tabs');
  const handle=document.getElementById('bot-resize-handle');
  if(botCollapsed){
    rp.style.height='0';rp.style.minHeight='0';rp.style.padding='0';rp.style.borderTop='none';rp.style.overflow='hidden';
    wk.style.height='0';wk.style.minHeight='0';wk.style.overflow='hidden';
    tabs.style.height='0';tabs.style.overflow='hidden';tabs.style.borderTop='none';tabs.style.padding='0';
    handle.style.height='0';handle.style.overflow='hidden';
    btn.textContent='▲';btn.style.position='fixed';btn.style.bottom='0';btn.style.left='50%';btn.style.transform='translateX(-50%)';btn.style.top='auto';btn.style.borderRadius='8px 8px 0 0';btn.style.zIndex='50';
  }else{
    btn.textContent='▼';btn.style.position='';btn.style.bottom='';btn.style.left='';btn.style.transform='';btn.style.top='';btn.style.borderRadius='';btn.style.zIndex='';
    tabs.style.height='';tabs.style.overflow='';tabs.style.borderTop='';tabs.style.padding='';
    handle.style.height='';handle.style.overflow='';
    rp.style.height='';rp.style.minHeight='';rp.style.padding='';rp.style.borderTop='';rp.style.overflow='';
    wk.style.height='';wk.style.minHeight='';wk.style.overflow='';
    // restore active tab
    const activeTab=document.querySelector('.bot-tab.on');
    if(activeTab){
      const p=activeTab.dataset.panel;
      if(p==='rp')rp.style.display='flex';
      else if(p==='weekly-panel'){wk.style.display='flex';buildWeekly();}
    }else{rp.style.display='flex';}
  }
});

// Bottom panel resize
(()=>{
  const handle=document.getElementById('bot-resize-handle');
  if(!handle)return;
  let resizing=false,startY,startH;
  handle.addEventListener('mousedown',e=>{
    const rp=document.getElementById('rp');
    const wk=document.getElementById('weekly-panel');
    const target=rp.style.display!=='none'?rp:wk;
    if(!target||target.style.display==='none')return;
    resizing=true;startY=e.clientY;startH=target.offsetHeight;
    document.body.style.cursor='ns-resize';document.body.style.userSelect='none';
    const onMove=ev=>{if(!resizing)return;const dy=startY-ev.clientY;const newH=Math.max(100,Math.min(window.innerHeight*0.6,startH+dy));target.style.height=newH+'px';};
    const onUp=()=>{resizing=false;document.body.style.cursor='';document.body.style.userSelect='';window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);
  });
})();

// Detail panel resize
(()=>{
  const panel=document.getElementById('detail-panel');
  if(!panel)return;
  let resizing=false,startX,startW;
  panel.addEventListener('mousedown',e=>{
    if(!panel.classList.contains('open'))return;
    const rect=panel.getBoundingClientRect();
    if(e.clientX>rect.left+6)return; // only trigger near left edge
    resizing=true;startX=e.clientX;startW=panel.offsetWidth;
    document.body.style.cursor='ew-resize';document.body.style.userSelect='none';
    e.preventDefault();
    const onMove=ev=>{if(!resizing)return;const dxVal=startX-ev.clientX;const newW=Math.max(200,Math.min(window.innerWidth*0.5,startW+dxVal));panel.style.width=newW+'px';};
    const onUp=()=>{resizing=false;document.body.style.cursor='';document.body.style.userSelect='';window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);
  });
})();

// ─────────────────────────────────────────────
// DAILY PANEL (代辦 → 自動回報)
// ─────────────────────────────────────────────
function getAllBranches(){
  const list=[];
  TRUNKS.forEach(t=>{
    if(t.isBranch){
      // Independent branch-trunk: branch id = trunk id
      list.push({trunkId:null,trunkName:'(獨立)',trunkColor:t.color,branchId:t.id,branchName:t.name,branchColor:t.color});
    } else {
      t.branches.forEach(b=>{list.push({trunkId:t.id,trunkName:t.name,trunkColor:t.color,branchId:b.id,branchName:b.name,branchColor:b.color||t.color});});
    }
  });
  return list;
}
function showDailyWarning(msg){
  const w=document.getElementById('daily-warning');
  w.textContent=msg;w.style.display='block';
}
function hideDailyWarning(){
  const w=document.getElementById('daily-warning');
  w.style.display='none';w.textContent='';
}
function buildDailySelects(){
  const ms=document.getElementById('daily-member');
  const prevMember=ms.value;
  ms.innerHTML='';
  MEMBERS.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.name;ms.appendChild(o);});
  // Restore previous member selection or default
  if(prevMember&&MEMBERS.find(m=>m.id===prevMember)){ms.value=prevMember;}
  const dd=document.getElementById('daily-date');
  if(!dd.value)dd.value=todayStr;
  loadDailyEntries();
}
function renderDailyEntries(){
  const c=document.getElementById('daily-entries');c.innerHTML='';
  const allBranches=getAllBranches();
  dailyEntries.forEach((entry,i)=>{
    // --- Main row ---
    const row=document.createElement('div');row.className='daily-entry'+(entry.done?' done':'');

    // Checkbox
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!entry.done;cb.className='daily-cb';
    cb.addEventListener('change',()=>{
      if(cb.checked){
        // Validate: must have branch + note before completing
        if(!entry.branchId||!entry.note.trim()){
          cb.checked=false;
          if(!entry.branchId) shakeEl(row.querySelector('.daily-branch-sel'));
          if(!entry.note.trim()) shakeEl(row.querySelector('.daily-note-input'));
          return;
        }
        dailyEntries[i].done=true;
        autoGenerateReport(i);
      }else{
        // Undo: uncheck → remove the auto-generated node
        dailyEntries[i].done=false;
        undoAutoReport(i);
      }
      renderDailyEntries();
      autoSyncDaily();
    });

    // Branch selector
    const brSel=document.createElement('select');brSel.className='daily-branch-sel';
    const defOpt=document.createElement('option');defOpt.value='';defOpt.textContent='── 枝幹 ──';brSel.appendChild(defOpt);
    allBranches.forEach(b=>{
      const o=document.createElement('option');o.value=b.branchId;
      o.textContent=b.trunkName+' / '+b.branchName;
      o.style.color=b.branchColor;
      if(b.branchId===entry.branchId)o.selected=true;
      brSel.appendChild(o);
    });
    if(entry.branchId){
      const matched=allBranches.find(b=>b.branchId===entry.branchId);
      if(matched){brSel.style.borderLeft='3px solid '+matched.branchColor;}
    }
    brSel.addEventListener('change',()=>{
      dailyEntries[i].branchId=brSel.value;
      const matched=allBranches.find(b=>b.branchId===brSel.value);
      brSel.style.borderLeft=matched?'3px solid '+matched.branchColor:'';
      autoSyncDaily();
    });

    // Category selector
    const catSel=document.createElement('select');catSel.className='daily-cat-sel';
    CATS.forEach(cat=>{const o=document.createElement('option');o.value=cat.id;o.textContent=cat.label;o.style.background=cat.bg;o.style.color=cat.color;if(cat.id===entry.cat)o.selected=true;catSel.appendChild(o);});
    const selCat=catObj(entry.cat);
    catSel.style.background=selCat.bg;catSel.style.color=selCat.color;catSel.style.fontWeight='600';
    catSel.addEventListener('change',()=>{
      dailyEntries[i].cat=catSel.value;
      const sc=catObj(catSel.value);
      catSel.style.background=sc.bg;catSel.style.color=sc.color;
      autoSyncDaily();
    });

    // Note input
    const inp=document.createElement('input');inp.type='text';inp.className='daily-note-input';
    inp.placeholder='代辦事項…';inp.value=entry.note;
    if(entry.done)inp.style.textDecoration='line-through';
    inp.addEventListener('input',()=>{dailyEntries[i].note=inp.value;autoSyncDaily();});

    // Expand/collapse details button
    const expBtn=document.createElement('button');expBtn.className='daily-exp-btn';
    expBtn.textContent=entry._expanded?'▾':'▸';expBtn.title='展開詳細';
    expBtn.addEventListener('click',()=>{
      dailyEntries[i]._expanded=!dailyEntries[i]._expanded;
      renderDailyEntries();
    });

    // Remove button
    const rm=document.createElement('button');rm.className='daily-rm';rm.textContent='✕';
    rm.addEventListener('click',()=>{if(dailyEntries.length>1){dailyEntries.splice(i,1);renderDailyEntries();autoSyncDaily();}});

    // Auto-report indicator
    if(entry._reportGenerated){
      const badge=document.createElement('span');badge.className='daily-reported-badge';badge.textContent='✓ 已回報';
      row.append(cb,brSel,catSel,inp,badge,expBtn,rm);
      // Click completed entry → scroll timeline to that node
      if(entry._reportNodeId){
        row.style.cursor='pointer';
        row.title='點擊跳轉到時間軸上的回報';
        row.addEventListener('click',(e)=>{
          if(e.target.closest('select,input,button,.daily-cb'))return;
          scrollToNode(entry._reportNodeId);
        });
      }
    }else{
      row.append(cb,brSel,catSel,inp,expBtn,rm);
    }
    c.appendChild(row);

    // --- Expandable detail row ---
    if(entry._expanded){
      const detail=document.createElement('div');detail.className='daily-detail';

      // Status note (optional)
      const noteLabel=document.createElement('span');noteLabel.className='daily-detail-label';noteLabel.textContent='狀態說明';
      const noteArea=document.createElement('textarea');noteArea.className='daily-detail-textarea';
      noteArea.placeholder='補充說明（選填）…';noteArea.value=entry.statusNote||'';noteArea.rows=2;
      noteArea.addEventListener('input',()=>{dailyEntries[i].statusNote=noteArea.value;autoSyncDaily();});

      // Link attachment
      const linkLabel=document.createElement('span');linkLabel.className='daily-detail-label';linkLabel.textContent='附件連結';
      const linkInput=document.createElement('input');linkInput.type='text';linkInput.className='daily-detail-link';
      linkInput.placeholder='貼上附件連結…';linkInput.value=(entry.links&&entry.links.length)?entry.links[0]:'';
      linkInput.addEventListener('input',()=>{
        dailyEntries[i].links=linkInput.value.trim()?[linkInput.value.trim()]:[];
        autoSyncDaily();
      });

      detail.append(noteLabel,noteArea,linkLabel,linkInput);
      c.appendChild(detail);
    }
  });
}

// Scroll timeline to a specific node by ID and flash-highlight it
function scrollToNode(nodeId){
  const sa=document.getElementById('sa');
  const node=NODES.find(n=>n.id===nodeId);
  if(!node)return;
  // Switch to timeline view if on dashboard
  const btnTimeline=document.getElementById('btn-timeline');
  const btnDash=document.getElementById('btn-dashboard');
  if(btnDash&&btnDash.classList.contains('active')){
    btnTimeline.click();
  }
  // Scroll horizontally to the node's date
  const nodeX=dx(node.date);
  sa.scrollLeft=nodeX-sa.clientWidth*0.35;
  // Find and highlight the node element
  setTimeout(()=>{
    const el=document.querySelector(`.nwrap[data-id="${nodeId}"]`);
    if(el){
      // Scroll vertically if needed
      el.scrollIntoView({behavior:'smooth',block:'center'});
      // Flash highlight
      el.style.transition='box-shadow 0.3s, transform 0.3s';
      el.style.boxShadow='0 0 12px 4px rgba(100,146,197,0.7)';
      el.style.transform='scale(1.08)';
      el.style.zIndex='999';
      setTimeout(()=>{
        el.style.boxShadow='';
        el.style.transform='';
        setTimeout(()=>{el.style.zIndex='';},300);
      },1500);
    }
  },100);
}

// Visual shake for validation errors
function shakeEl(el){
  if(!el)return;
  el.style.borderColor='#c97b7b';
  el.classList.add('shake');
  setTimeout(()=>{el.style.borderColor='';el.classList.remove('shake');},600);
}

// Check if a date is a holiday or weekend (not a workday)
function isDayOff(dateStr){
  if(TW_HOLIDAYS[dateStr])return TW_HOLIDAYS[dateStr];
  if(TW_MAKEUP_WORKDAYS[dateStr])return false; // 補班日不算放假
  const d=new Date(dateStr+'T00:00:00');
  const dow=d.getDay();
  if(dow===0)return '週日';
  if(dow===6)return '週六';
  return false;
}

// Auto-generate a progress report node when a todo is checked done
function autoGenerateReport(idx){
  const entry=dailyEntries[idx];
  if(!entry.branchId||!entry.note.trim())return;
  let tid=trunkForBranch(entry.branchId);
  if(!tid)return;
  const date=document.getElementById('daily-date').value||todayStr;
  const member=document.getElementById('daily-member').value||MEMBERS[0].id;
  let msg=entry.note.trim();
  if(entry.statusNote&&entry.statusNote.trim()){
    msg+='\n\n📋 狀態說明：'+entry.statusNote.trim();
  }
  const nodeLinks=(entry.links&&entry.links.length)?[...entry.links]:[];
  const newId=++NC;
  const nn={id:newId,trunk:tid,branch:entry.branchId,type:'update',date,member,collaborators:[],msg,notes:'',images:[],links:nodeLinks};
  NODES.push(nn);saveNode(nn);
  if(!exp[tid]){exp[tid]=true;}
  buildLabels();buildTimeline();
  if(openTrunkId===tid)openDetailPanel(tid);
  // Store the node ID so we can undo later
  dailyEntries[idx]._reportGenerated=true;
  dailyEntries[idx]._reportNodeId=newId;
}

// Undo auto-generated report
function undoAutoReport(idx){
  const entry=dailyEntries[idx];
  if(!entry._reportGenerated||!entry._reportNodeId)return;
  const nodeId=entry._reportNodeId;
  // Remove from NODES array
  const ni=NODES.findIndex(n=>n.id===nodeId);
  if(ni!==-1)NODES.splice(ni,1);
  // Remove from Firestore
  if(typeof db!=='undefined'){
    db.collection('nodes').doc(String(nodeId)).delete().catch(()=>{});
  }
  entry._reportGenerated=false;
  entry._reportNodeId=null;
  buildLabels();buildTimeline();
}

// Load entries for a specific date+member from DAILY_REPORTS into dailyEntries
function loadDailyEntries(){
  const date=document.getElementById('daily-date').value;
  const member=document.getElementById('daily-member').value;
  if(!date||!member){dailyEntries=[{cat:'dev',note:'',branchId:'',done:false,statusNote:'',links:[]}];renderDailyEntries();return;}
  const existing=DAILY_REPORTS.find(r=>r.date===date&&r.member===member);
  if(existing&&existing.entries&&existing.entries.length){
    dailyEntries=existing.entries.map(e=>({cat:e.cat||'dev',note:e.note||'',branchId:e.branchId||'',done:!!e.done,statusNote:e.statusNote||'',links:e.links||[]}));
  }else{
    dailyEntries=[{cat:'dev',note:'',branchId:'',done:false,statusNote:'',links:[]}];
  }
  renderDailyEntries();
}

document.getElementById('daily-add').addEventListener('click',()=>{
  dailyEntries.push({cat:'dev',note:'',branchId:'',done:false,statusNote:'',links:[]});
  renderDailyEntries();
  autoSyncDaily();
});
document.getElementById('daily-date').addEventListener('change',()=>{
  const dateVal=document.getElementById('daily-date').value;
  if(dateVal){
    const off=isDayOff(dateVal);
    if(off){
      showDailyWarning('⚠️ '+dateVal+' 是「'+off+'」，確定要填寫這天的代辦嗎？');
    }else{
      hideDailyWarning();
    }
  }
  loadDailyEntries();
});
document.getElementById('daily-member').addEventListener('change',()=>{loadDailyEntries();});

// Auto-sync daily entries: debounce save on every change
let _dailySyncTimer=null;
function autoSyncDaily(){
  clearTimeout(_dailySyncTimer);
  _dailySyncTimer=setTimeout(()=>{
    const date=document.getElementById('daily-date').value;
    const member=document.getElementById('daily-member').value;
    if(!date||!member)return;
    // Strip internal UI flags before saving
    const valid=dailyEntries.filter(e=>e.note.trim()).map(e=>({cat:e.cat,note:e.note,branchId:e.branchId||'',done:!!e.done,statusNote:e.statusNote||'',links:e.links||[]}));
    const existing=DAILY_REPORTS.find(r=>r.date===date&&r.member===member);
    if(existing){
      existing.entries=valid.length?valid.map(e=>({...e})):[];
    }else if(valid.length){
      DAILY_REPORTS.push({id:'dr'+(++DRC),date,branch:'',member,entries:valid.map(e=>({...e}))});
    }
    if(valid.length) saveDailyReport(date, member, valid);
    buildWeekly();
  },600);
}

// ─────────────────────────────────────────────
// WEEKLY PANEL (person rows × date columns)
// ─────────────────────────────────────────────
function isWorkday(dateStr){
  const d=new Date(dateStr+'T00:00:00');
  const dow=d.getDay(); // 0=Sun,6=Sat
  // 補班日 = 週末但要上班
  if(TW_MAKEUP_WORKDAYS[dateStr])return true;
  // 週六日排除
  if(dow===0||dow===6)return false;
  return true;
}
function buildWeekly(){
  const ws=getWeekStart(addDays(todayStr,wkOffset*7));
  const we=addDays(ws,6);
  document.getElementById('wk-range').textContent=`${fmtFull(ws)} – ${fmtFull(we)}`;
  const body=document.getElementById('wk-body');body.innerHTML='';
  // build dates array: only workdays (Mon-Fri + makeup workdays on weekends)
  const allDates=[];for(let i=0;i<7;i++)allDates.push(addDays(ws,i));
  const dates=allDates.filter(ds=>isWorkday(ds));
  if(!dates.length){body.innerHTML='<div style="padding:20px;color:var(--text-dim);font-size:12px;">本週無工作日</div>';return;}
  // build table
  const table=document.createElement('table');table.className='wk-table';
  // header row: empty + workday dates
  const thead=document.createElement('thead');
  const htr=document.createElement('tr');
  const cornerTh=document.createElement('th');cornerTh.className='wk-member-th';cornerTh.textContent='成員';htr.appendChild(cornerTh);
  const WEEKDAY_NAMES=['日','一','二','三','四','五','六'];
  dates.forEach(ds=>{
    const th=document.createElement('th');
    if(ds===todayStr)th.classList.add('today');
    if(TW_HOLIDAYS[ds])th.classList.add('holiday');
    const dow=new Date(ds+'T00:00:00').getDay();
    let label=fmtFull(ds)+' ('+WEEKDAY_NAMES[dow]+')';
    if(TW_HOLIDAYS[ds])label+='\n'+TW_HOLIDAYS[ds];
    if(TW_MAKEUP_WORKDAYS[ds])label+='\n'+TW_MAKEUP_WORKDAYS[ds];
    th.textContent=label;
    th.style.whiteSpace='pre-line';
    htr.appendChild(th);
  });
  thead.appendChild(htr);table.appendChild(thead);
  // body: one row per member
  const tbody=document.createElement('tbody');
  MEMBERS.forEach(m=>{
    const tr=document.createElement('tr');
    // member cell
    const mtd=document.createElement('td');mtd.className='wk-member-td';
    mtd.innerHTML=`<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${m.color};vertical-align:middle;margin-right:4px;text-align:center;line-height:14px;font-size:7px;font-weight:700;color:#fff;">${initials(m.name)}</span>${m.name}`;
    tr.appendChild(mtd);
    // one cell per date
    dates.forEach(ds=>{
      const td=document.createElement('td');
      const dayDR=DAILY_REPORTS.filter(r=>r.date===ds&&r.member===m.id);
      if(!dayDR.length){
        td.innerHTML='<span class="wk-empty">—</span>';
      } else {
        dayDR.forEach(dr=>{
          dr.entries.forEach(e=>{
            const card=document.createElement('div');card.className='wk-card';
            const cat=catObj(e.cat);
            let brTag='';
            if(e.branchId){
              const allBr=getAllBranches();const br=allBr.find(b=>b.branchId===e.branchId);
              if(br)brTag=`<span style="font-size:7px;padding:1px 3px;border-radius:2px;background:${br.branchColor}22;color:${br.branchColor};font-weight:600;margin-right:3px;display:inline-block;vertical-align:middle;">${br.branchName}</span>`;
            }
            const doneIcon=e.done?'<span style="color:#0f7b6c;font-size:9px;margin-right:2px;">✓</span>':'';
            card.innerHTML=`${doneIcon}<span style="font-size:7px;padding:1px 3px;border-radius:2px;background:${cat.bg};color:${cat.color};font-weight:600;margin-right:3px;display:inline-block;vertical-align:middle;">${cat.label}</span>${brTag}<span class="wk-card-msg" style="white-space:normal;overflow:visible;max-width:none;">${e.note}</span>`;
            td.appendChild(card);
          });
        });
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);body.appendChild(table);
}
document.getElementById('wk-prev').addEventListener('click',()=>{wkOffset--;buildWeekly();});
document.getElementById('wk-next').addEventListener('click',()=>{wkOffset++;buildWeekly();});

// ─────────────────────────────────────────────
// DRAG SCROLL
// ─────────────────────────────────────────────
(()=>{
  const sa=document.getElementById('sa');
  let down=false,sx,sy,sl,st,moved=false;
  const DRAG_THRESHOLD=5; // px before treating as drag

  sa.addEventListener('mousedown',e=>{
    // Don't intercept clicks on interactive elements
    if(e.target.closest('.nwrap'))return;
    down=true;moved=false;sx=e.clientX;sy=e.clientY;sl=sa.scrollLeft;st=sa.scrollTop;
  });

  window.addEventListener('mousemove',e=>{
    if(!down)return;
    const dx=Math.abs(e.clientX-sx),dy=Math.abs(e.clientY-sy);
    if(!moved&&(dx>DRAG_THRESHOLD||dy>DRAG_THRESHOLD)){
      moved=true;
      sa.classList.add('drag','dragging-active');
      document.body.style.userSelect='none';
    }
    if(moved){
      sa.scrollLeft=sl-(e.clientX-sx);
      sa.scrollTop=st-(e.clientY-sy);
    }
  });

  window.addEventListener('mouseup',()=>{
    if(down){
      down=false;
      sa.classList.remove('drag','dragging-active');
      document.body.style.userSelect='';
      if(moved){
        // Suppress the click that fires right after mouseup from a drag
        const suppress=e=>{e.stopPropagation();e.preventDefault();};
        sa.addEventListener('click',suppress,{capture:true,once:true});
      }
    }
  });

  sa.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;sl=sa.scrollLeft;st=sa.scrollTop;},{passive:true});
  sa.addEventListener('touchmove',e=>{sa.scrollLeft=sl-(e.touches[0].clientX-sx);sa.scrollTop=st-(e.touches[0].clientY-sy);},{passive:true});
})();

// ─────────────────────────────────────────────
// VERTICAL SCROLL SYNC (left column ↔ timeline)
// ─────────────────────────────────────────────
(()=>{
  const sa=document.getElementById('sa');
  const lb=document.getElementById('lbody');
  let syncing=false;
  sa.addEventListener('scroll',()=>{
    if(syncing)return;syncing=true;
    lb.scrollTop=sa.scrollTop;
    requestAnimationFrame(()=>{syncing=false;});
  });
  lb.addEventListener('scroll',()=>{
    if(syncing)return;syncing=true;
    sa.scrollTop=lb.scrollTop;
    requestAnimationFrame(()=>{syncing=false;});
  });
})();

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function alignTodayLine(){
  const tdCell=document.querySelector('.rc.td');
  const canvas=document.getElementById('canvas');
  if(tdCell&&canvas){
    const cellRect=tdCell.getBoundingClientRect();
    const canvasRect=canvas.getBoundingClientRect();
    document.getElementById('tdline').style.left=(cellRect.left-canvasRect.left+cellRect.width/2)+'px';
  } else {
    document.getElementById('tdline').style.left=(dx(todayStr)+DP/2)+'px';
  }
}
function render(){
  recalcTimeRange();
  document.getElementById('canvas').style.width=tw()+'px';
  buildRuler();buildHeaderAvatars();buildOwnerFilter();buildLabels();buildTimeline();buildSelects();buildDailySelects();renderDailyEntries();updateHeaderRange();
  alignTodayLine();
  const sa=document.getElementById('sa');
  sa.scrollLeft=dx(todayStr)-sa.clientWidth*.35;
  // default hide weekly
  document.getElementById('weekly-panel').style.display='none';
}
// Left column resize
(()=>{
  const handle=document.getElementById('lcol-resize-handle');
  const lcol=document.getElementById('lcol');
  if(!handle||!lcol)return;
  let resizing=false,startX,startW;
  handle.addEventListener('mousedown',e=>{
    resizing=true;startX=e.clientX;startW=lcol.offsetWidth;
    document.body.style.cursor='ew-resize';document.body.style.userSelect='none';
    e.preventDefault();
    const onMove=ev=>{if(!resizing)return;const newW=Math.max(120,Math.min(400,startW+(ev.clientX-startX)));lcol.style.width=newW+'px';};
    const onUp=()=>{resizing=false;document.body.style.cursor='';document.body.style.userSelect='';window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);
  });
})();

// ─────────────────────────────────────────────
// CLEAR FIRESTORE (run in console: clearFirestore())
// ─────────────────────────────────────────────
async function clearFirestore(){
  if(typeof db==='undefined'){console.warn('Firestore 未連線');return;}
  const cols=['members','trunks','nodes','dailyReports','settings'];
  for(const col of cols){
    const snap=await db.collection(col).get();
    const batch=db.batch();
    snap.docs.forEach(d=>batch.delete(d.ref));
    await batch.commit();
    console.log(`🗑️ 已清空 ${col}（${snap.size} 筆）`);
  }
  console.log('✅ Firestore 全部清空完成');
}

// ─────────────────────────────────────────────
// USE_LOCAL: set to true to skip Firestore, use in-code test data
// ─────────────────────────────────────────────
const USE_LOCAL = true;

(async function init(){
  if(!USE_LOCAL){
    try {
      const loaded = await loadFromFirestore();
      if (loaded) {
        TRUNKS.forEach(t => { if (!(t.id in exp)) exp[t.id] = false; });
        console.log('✅ 已從 Firestore 載入資料');
      } else {
        console.log('ℹ️ Firestore 尚無資料，使用預設資料。');
      }
      _firestoreReady = true;
      startRealtimeSync();
    } catch (e) {
      console.warn('Firebase 初始化失敗，使用離線模式：', e);
    }
  } else {
    console.log('🧪 本地測試模式：使用內建假資料，不連線 Firestore');
  }
  render();
})();

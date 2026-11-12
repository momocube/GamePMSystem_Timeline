(function (global) {
  'use strict';

  const timeZone = 'Asia/Taipei';
  const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

  function taipeiParts(now) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(now).map(part => [part.type, part.value]));
  }

  function taipeiDate(now) {
    const parts = taipeiParts(now);
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function addDays(iso, days) {
    const date = new Date(iso + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function getPeriods(now = new Date()) {
    const today = taipeiDate(now);
    const day = new Date(today + 'T00:00:00Z').getUTCDay();
    const start = addDays(today, -((day + 4) % 7));
    return [
      {label: '上週', start: addDays(start, -7), end: addDays(start, -1)},
      {label: '本週（未結算）', start, end: addDays(start, 6)}
    ];
  }

  function dateLabel(iso) {
    return iso + '（' + weekNames[new Date(iso + 'T00:00:00Z').getUTCDay()] + '）';
  }

  function category(report) { return report.cat || '開發'; }

  function summary(reports) {
    const leave = reports.filter(report => category(report) === '請假').length;
    return (reports.length - leave) + ' 筆工作；' + leave + ' 筆請假';
  }

  function distribution(reports) {
    const counts = new Map();
    reports.forEach(report => {
      const name = category(report);
      if (name !== '請假') counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'))
      .map(([name, count]) => name + ' ' + count + ' 筆').join('、') || '無工作回報';
  }

  function buildText({members = [], reports = [], now = new Date(), generatedAt = now}) {
    const periods = getPeriods(now);
    const today = taipeiDate(now);
    const parts = taipeiParts(generatedAt);
    const relevant = reports.filter(report => report.date >= periods[0].start && report.date <= periods[1].end);
    // Group by member ID so members with identical display names remain separate.
    const roster = new Map(members.map(member => [member.id, member]));
    let unknownCount = 0;
    relevant.forEach(report => {
      const id = report.member || '';
      if (!roster.has(id)) roster.set(id, {id, name: id ? '未識別成員 ' + (++unknownCount) : '未指定成員'});
    });
    const people = Array.from(roster.values()).sort((a, b) =>
      Number(a.active === false) - Number(b.active === false) ||
      String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant') || String(a.id).localeCompare(String(b.id)));
    const lines = [
      '遊戲部全員週報｜上週＋本週',
      '匯出時間：' + taipeiDate(generatedAt) + ' ' + parts.hour + ':' + parts.minute + ':' + parts.second + '（台北時間）',
      '週期：每週三至次週二；按每日回報的工作日期歸期。',
      '範圍：全體成員（含已停用），保留原始工作內容。',
      '工作筆數不含請假；無回報紀錄不代表未工作。本週尚未結算，資料截至匯出時。',
      ''
    ];

    periods.forEach(period => {
      const logs = relevant.filter(report => report.date >= period.start && report.date <= period.end)
        .sort((a, b) => a.date.localeCompare(b.date) || String(a.id || '').localeCompare(String(b.id || '')));
      const grouped = new Map();
      logs.forEach(report => {
        const id = report.member || '';
        if (!grouped.has(id)) grouped.set(id, []);
        grouped.get(id).push(report);
      });
      lines.push('='.repeat(48), period.label + '｜' + dateLabel(period.start) + ' ～ ' + dateLabel(period.end),
        '全員合計：' + people.length + ' 人；' + summary(logs), '工作類型：' + distribution(logs), '');
      if (!people.length) lines.push('尚無成員與回報資料。', '');
      people.forEach(person => {
        const entries = grouped.get(person.id) || [];
        lines.push('【' + (person.name || '未命名成員') + (person.active === false ? '（已停用）' : '') + '】',
          '合計：' + summary(entries));
        if (!entries.length) {
          lines.push('本週無回報紀錄。', '');
          return;
        }
        lines.push('工作類型：' + distribution(entries));
        let currentDate = '';
        entries.forEach(report => {
          if (report.date !== currentDate) {
            currentDate = report.date;
            lines.push(dateLabel(currentDate) + (currentDate > today ? '（尚未到期，預填紀錄）' : ''));
          }
          const content = String(report.text || '（未填寫工作內容）').replace(/\r\n?/g, '\n').replace(/\n/g, '\n    ');
          lines.push('  - [' + category(report) + '] ' + content);
        });
        lines.push('');
      });
    });
    return {
      filename: '全員週報_' + periods[0].start + '_' + periods[1].end + '.txt',
      content: '\uFEFF' + lines.join('\n').replace(/\n/g, '\r\n'),
      mime: 'text/plain;charset=utf-8'
    };
  }

  function connect(app) {
    const buttons = Array.from(global.document.querySelectorAll('[data-weekly-text-export]'));
    const labels = buttons.map(button => button.textContent);
    let busy = false;
    const notify = message => app.toast(message);
    async function exportText() {
      if (busy) return;
      const user = app.getCurrentUser();
      if (!user) { notify('請先登入 Google，再產生全員週報。'); return; }
      const now = new Date();
      const periods = getPeriods(now);
      busy = true;
      buttons.forEach(button => {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = '正在產生週報…';
      });
      try {
        const data = await app.loadReports(periods[0].start, periods[1].end);
        if (app.getCurrentUser()?.uid !== user.uid) throw new Error('登入狀態已改變，請重新操作。');
        const result = buildText({...data, now, generatedAt: new Date()});
        app.downloadBlob(result.content, result.filename, result.mime);
        notify('已產生上週＋本週全員週報文字檔。');
      } catch (error) {
        global.console.error('Weekly text export failed', error);
        notify('週報產生失敗，請確認登入與網路後重試。');
      } finally {
        busy = false;
        buttons.forEach((button, index) => {
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = labels[index];
        });
      }
    }
    buttons.forEach(button => button.addEventListener('click', exportText));
  }

  global.GamePMWeeklyReport = {getPeriods, buildText, connect};
})(typeof window !== 'undefined' ? window : globalThis);

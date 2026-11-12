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

  function buildText({members = [], reports = [], now = new Date()}) {
    const periods = getPeriods(now);
    // Match the active roster shown by the interface, preserving its member order.
    const roster = new Map(members.filter(member => member.active !== false).map(member => [member.id, member]));
    const relevant = reports.filter(report => roster.has(report.member) &&
      report.date >= periods[0].start && report.date <= periods[1].end)
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.id || '').localeCompare(String(b.id || '')));
    const grouped = new Map();
    relevant.forEach(report => {
      if (!grouped.has(report.date)) grouped.set(report.date, new Map());
      const byMember = grouped.get(report.date);
      if (!byMember.has(report.member)) byMember.set(report.member, []);
      byMember.get(report.member).push(report);
    });
    const lines = [];

    for (let date = periods[0].start; date <= periods[1].end; date = addDays(date, 1)) {
      lines.push(dateLabel(date), '');
      const byMember = grouped.get(date) || new Map();
      if (!roster.size) lines.push('無成員工作紀錄。', '');
      roster.forEach(person => {
        const entries = byMember.get(person.id) || [];
        lines.push('【' + (person.name || '未命名成員') + '】');
        if (!entries.length) {
          lines.push('（無回報紀錄）', '');
          return;
        }
        entries.forEach(report => {
          const content = String(report.text || '（未填寫工作內容）').replace(/\r\n?/g, '\n').replace(/\n/g, '\n    ');
          lines.push('  - ' + content);
        });
        lines.push('');
      });
    }
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
        const result = buildText({...data, now});
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

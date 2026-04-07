const EXPORT_KEYS = [
  'publishedReports',
  'reportDrafts',
  'monthlyPnl',
  'pnlNotes',
  'watchlist',
  'savedLinks',
];

export function exportAllData() {
  const data = {};
  for (const key of EXPORT_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        data[key] = JSON.parse(raw);
      }
    } catch {
      // skip keys that fail to parse
    }
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `economica-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importAllData() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const payload = JSON.parse(ev.target.result);
          if (!payload.data || typeof payload.data !== 'object') {
            reject(new Error('Invalid backup file: missing data'));
            return;
          }

          if (!window.confirm('This will replace all existing data. Continue?')) {
            reject(new Error('Import cancelled'));
            return;
          }

          const keysImported = [];
          const keysSkipped = [];

          for (const key of EXPORT_KEYS) {
            if (!(key in payload.data)) continue;
            try {
              localStorage.setItem(key, JSON.stringify(payload.data[key]));
              keysImported.push(key);
            } catch {
              keysSkipped.push(key);
            }
          }

          window.dispatchEvent(new Event('pnl-updated'));
          window.dispatchEvent(new Event('app-data-imported'));

          resolve({ keysImported, keysSkipped });
        } catch (err) {
          reject(new Error('Failed to parse file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}

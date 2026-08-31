const escapeCell = value => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function rowsToCsv(rows) {
  if (!rows.length) return '';
  const headers = [...new Set(rows.flatMap(Object.keys))];
  return [headers.join(','), ...rows.map(row => headers.map(key => escapeCell(row[key])).join(','))].join('\n');
}

export function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click(); URL.revokeObjectURL(url);
}

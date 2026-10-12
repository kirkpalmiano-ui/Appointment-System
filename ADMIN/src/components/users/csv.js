// CSV export helpers (quoted fields, CRLF rows), shared by the Users and Audit log pages.

// Cells that start like a formula (= @ or +/- before a non-digit) get a leading '
// so spreadsheet apps show them as text instead of running them. Phone numbers are left alone.
const cell = (value) => {
  let text = String(value ?? '');
  if (/^[=@\t\r]|^[+-](?![\d\s])/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export function toCsv(head, rows) {
  return [head, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}

// Saves `text` as a .csv file. The BOM makes Excel read it as UTF-8 (names with ñ, ₱).
export function downloadCsv(filename, text) {
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// "2026-10-13T02:42:10.000Z" -> "2026-10-13 10:42" in the viewer's local time.
export function csvDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

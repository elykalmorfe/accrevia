export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(value: CsvCell): string {
  let text = value === null || value === undefined ? '' : String(value);
  // Spreadsheet apps execute cells starting with these characters as formulas.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/** Downloads a CSV that opens directly in Excel (UTF-8 with BOM so accented names display correctly). */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const blob = new Blob([`\uFEFF${toCsv(headers, rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

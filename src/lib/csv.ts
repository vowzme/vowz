// Helpers for building CSV downloads safely.
//
// Values starting with =, +, - or @ are treated as formulas by Excel, Numbers
// and Google Sheets. Since a lot of exported data is written by users (emails,
// coupon codes, payout handles), every cell is neutralized before export.

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Neutralize formula triggers, including ones hidden behind leading spaces.
  if (/^[\s]*[=+\-@\t\r|]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadCsv(filename: string, rows: unknown[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

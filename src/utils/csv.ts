/** Quote a cell and neutralise spreadsheet formula injection (=, +, -, @ at the start). */
export function csvCell(value: unknown): string {
  const text = String(value ?? '')
  const isNumber = typeof value === 'number' || /^-?\d+(\.\d+)?$/.test(text)
  const safe = !isNumber && /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

/** Build a CSV file in the browser and start the download. */
export function downloadCsv(fileName: string, header: string[], rows: unknown[][]): void {
  const body = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
  // BOM so Excel opens ₹ and other UTF-8 text correctly.
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

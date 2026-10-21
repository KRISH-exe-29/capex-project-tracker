/** Project codes look like CPX-2026-01: fixed prefix, year, running number within that year. */

const PATTERN = /^CPX-(\d{4})-(\d+)$/

export interface ParsedCode {
  year: number
  seq: number
}

export function parseProjectCode(code: string): ParsedCode | null {
  const match = PATTERN.exec(code.trim().toUpperCase())
  return match ? { year: Number(match[1]), seq: Number(match[2]) } : null
}

export function formatProjectCode(year: number, seq: number): string {
  return `CPX-${year}-${String(seq).padStart(2, '0')}`
}

/** Next code in the year: one after the highest number used so far (gaps are not reused). */
export function nextProjectCode(codes: string[], year: number): string {
  const highest = codes
    .map(parseProjectCode)
    .filter((parsed): parsed is ParsedCode => parsed?.year === year)
    .reduce((max, parsed) => Math.max(max, parsed.seq), 0)
  return formatProjectCode(year, highest + 1)
}

/** Projects numbered after `deletedCode` in the same year. */
export function laterInSequence<T extends { code: string }>(deletedCode: string, projects: T[]): T[] {
  const deleted = parseProjectCode(deletedCode)
  if (!deleted) return []
  return projects.filter(project => {
    const parsed = parseProjectCode(project.code)
    return parsed?.year === deleted.year && parsed.seq > deleted.seq
  })
}

/** Renumbering that closes the gap left by `deletedCode`: every later project in that year moves down by one. */
export function closeGapAfter<T extends { id: string; code: string }>(
  deletedCode: string,
  projects: T[]
): { id: string; from: string; to: string }[] {
  return laterInSequence(deletedCode, projects)
    .map(project => ({ project, parsed: parseProjectCode(project.code)! }))
    .sort((a, b) => a.parsed.seq - b.parsed.seq)
    .map(({ project, parsed }) => ({
      id: project.id,
      from: project.code,
      to: formatProjectCode(parsed.year, parsed.seq - 1)
    }))
}

/** Dato-hjelpere som deles mellom frontend og worker. */

export function isoDay(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/** ISO-8601 ukenummer, f.eks. `2026-W35`. Mandag er første ukedag. */
export function isoWeek(ms: number): string {
  const target = new Date(ms)
  target.setUTCHours(0, 0, 0, 0)
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** De siste `count` ISO-ukene til og med uken `ms` faller i, eldst først. */
export function recentWeeks(ms: number, count: number): string[] {
  const weeks: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    weeks.push(isoWeek(ms - i * 7 * 24 * 3600 * 1000))
  }
  return weeks
}

/** Måned og dag, `MM-DD`. Brukes av «på denne dag»-variantene. */
export function monthDay(ms: number): string {
  return isoDay(ms).slice(5)
}

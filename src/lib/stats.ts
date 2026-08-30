import type { DayStat, QuizSession, SessionSummary, Topic, TopicStat, WeekStat } from '../../shared/types'
import { isoDay, isoWeek } from '../../shared/time'
import { QUESTION_BY_ID } from './content'

export function isFinished(s: QuizSession): boolean {
  return s.finishedAt !== null
}

export function summarize(s: QuizSession): SessionSummary {
  return {
    id: s.id,
    category: s.category,
    difficulty: s.difficulty,
    region: s.region,
    finishedAt: s.finishedAt ?? s.startedAt,
    correct: s.questions.filter((q) => q.verdict === 'rett').length,
    total: s.questions.filter((q) => q.verdict !== null).length,
    hintsUsed: s.questions.reduce((sum, q) => sum + q.hintsUsed, 0),
  }
}

export { isoDay, isoWeek }

export function pct(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100)
}

export function byDay(sessions: QuizSession[]): DayStat[] {
  const map = new Map<string, DayStat>()
  for (const s of sessions.filter(isFinished)) {
    const day = isoDay(s.finishedAt!)
    const entry = map.get(day) ?? { day, correct: 0, total: 0 }
    for (const q of s.questions) {
      if (q.verdict === null) continue
      entry.total++
      if (q.verdict === 'rett') entry.correct++
    }
    map.set(day, entry)
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export function byWeek(sessions: QuizSession[]): WeekStat[] {
  const map = new Map<string, WeekStat>()
  for (const s of sessions.filter(isFinished)) {
    const week = isoWeek(s.finishedAt!)
    const entry = map.get(week) ?? { week, correct: 0, total: 0 }
    for (const q of s.questions) {
      if (q.verdict === null) continue
      entry.total++
      if (q.verdict === 'rett') entry.correct++
    }
    map.set(week, entry)
  }
  return [...map.values()].sort((a, b) => a.week.localeCompare(b.week))
}

export function byTopic(sessions: QuizSession[]): TopicStat[] {
  const map = new Map<Topic, TopicStat>()
  for (const s of sessions.filter(isFinished)) {
    for (const asked of s.questions) {
      if (asked.verdict === null) continue
      const q = QUESTION_BY_ID.get(asked.questionId)
      if (!q) continue
      for (const topic of q.topics) {
        const entry = map.get(topic) ?? { topic, correct: 0, total: 0 }
        entry.total++
        if (asked.verdict === 'rett') entry.correct++
        map.set(topic, entry)
      }
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export function byCategory(sessions: QuizSession[]): { category: string; correct: number; total: number }[] {
  const map = new Map<string, { category: string; correct: number; total: number }>()
  for (const s of sessions.filter(isFinished)) {
    const entry = map.get(s.category) ?? { category: s.category, correct: 0, total: 0 }
    for (const q of s.questions) {
      if (q.verdict === null) continue
      entry.total++
      if (q.verdict === 'rett') entry.correct++
    }
    map.set(s.category, entry)
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export function totals(sessions: QuizSession[]): { correct: number; total: number; rounds: number; streak: number } {
  const finished = sessions.filter(isFinished)
  let correct = 0
  let total = 0
  for (const s of finished) {
    for (const q of s.questions) {
      if (q.verdict === null) continue
      total++
      if (q.verdict === 'rett') correct++
    }
  }
  return { correct, total, rounds: finished.length, streak: dayStreak(finished) }
}

/** Antall sammenhengende dager fram til i dag med minst én fullført runde. */
function dayStreak(finished: QuizSession[]): number {
  const days = new Set(finished.map((s) => isoDay(s.finishedAt!)))
  let streak = 0
  const cursor = new Date()
  // I dag teller bare hvis det faktisk er spilt i dag; ellers starter vi på gårsdagen.
  if (!days.has(isoDay(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(isoDay(cursor.getTime()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

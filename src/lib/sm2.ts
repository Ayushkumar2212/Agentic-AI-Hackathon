import type { Sm2State } from '../types'

/**
 * SM-2 spaced-repetition scheduler (super-memo 2, as used by Anki-style systems).
 * Quality scale: 0–5, where < 3 means the learner must see the node again very soon.
 */

export function initialSm2(day: number): Sm2State {
  return { ef: 2.5, reps: 0, interval: 1, dueDay: day + 1 }
}

/** Map an answer + reasoning verdict into an SM-2 quality score. */
export function qualityFrom(correct: boolean, verdict: 'sound' | 'lucky' | 'flawed' | 'thin'): number {
  if (correct) {
    if (verdict === 'sound') return 5
    if (verdict === 'thin') return 4
    return 3 // correct by luck — weak evidence of retention
  }
  if (verdict === 'lucky') return 2
  return 1
}

export function updateSm2(prev: Sm2State, quality: number, day: number): Sm2State {
  const ef = Math.max(1.3, prev.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  if (quality < 3) {
    // Lapse: reset the repetition count and review again tomorrow.
    return { ef, reps: 0, interval: 1, dueDay: day + 1 }
  }

  const reps = prev.reps + 1
  let interval: number
  if (reps === 1) interval = 1
  else if (reps === 2) interval = 3
  else interval = Math.round(prev.interval * ef)

  return { ef, reps, interval, dueDay: day + interval }
}

export function intervalLabel(interval: number): string {
  if (interval <= 1) return '1d'
  if (interval <= 3) return '3d'
  if (interval <= 7) return '7d'
  return `${interval}d`
}

export function dueLabel(daysUntilDue: number): string {
  if (daysUntilDue <= 0) return 'Due for review'
  if (daysUntilDue === 1) return 'Due tomorrow'
  return `Due in ${daysUntilDue} days`
}

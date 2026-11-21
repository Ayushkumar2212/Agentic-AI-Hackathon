import { CONCEPTS, CONCEPT_MAP, dependentsOf } from '../data/concepts'
import type {
  ConceptId,
  Difficulty,
  LearnerState,
  MasteryBand,
  NodeState,
  ReasoningVerdict,
  RerouteAlert,
} from '../types'
import { initialSm2, updateSm2 } from './sm2'

/* ------------------------------------------------------------------ */
/* Bands & tokens                                                      */
/* ------------------------------------------------------------------ */

export const BAND_META: Record<
  MasteryBand,
  { label: string; hex: string; text: string; bg: string; border: string; glow: string }
> = {
  weak: {
    label: 'Weak',
    hex: '#EF4444',
    text: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/12',
    border: 'border-[#EF4444]/45',
    glow: 'shadow-[0_0_26px_-8px_rgba(239,68,68,0.85)]',
  },
  developing: {
    label: 'Developing',
    hex: '#F59E0B',
    text: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/12',
    border: 'border-[#F59E0B]/45',
    glow: 'shadow-[0_0_26px_-8px_rgba(245,158,11,0.85)]',
  },
  mastered: {
    label: 'Mastered',
    hex: '#10B981',
    text: 'text-[#10B981]',
    bg: 'bg-[#10B981]/12',
    border: 'border-[#10B981]/45',
    glow: 'shadow-[0_0_26px_-8px_rgba(16,185,129,0.85)]',
  },
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

export function bandOf(mastery: number): MasteryBand {
  if (mastery < 0.5) return 'weak'
  if (mastery < 0.8) return 'developing'
  return 'mastered'
}

export function bandToken(mastery: number) {
  return BAND_META[bandOf(mastery)]
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

/* ------------------------------------------------------------------ */
/* Retention decay (Memory Retention Radar)                            */
/* ------------------------------------------------------------------ */

/** Nodes with more successful repetitions decay more slowly. */
export function decayRate(node: NodeState): number {
  return 0.09 / (1 + 0.3 * node.sm2.reps)
}

export function decayFactor(node: NodeState, day: number): number {
  const elapsed = Math.max(0, day - node.lastReviewedDay)
  if (elapsed === 0) return 1
  return Math.exp(-decayRate(node) * elapsed)
}

/** The mastery the learner can be credited with *today* (before any new attempt). */
export function effectiveMastery(node: NodeState, day: number): number {
  return clamp(node.mastery * decayFactor(node, day))
}

export function daysSinceReview(node: NodeState, day: number): number {
  return Math.max(0, day - node.lastReviewedDay)
}

export function daysUntilDue(node: NodeState, day: number): number {
  return node.sm2.dueDay - day
}

export type RetentionStatus = 'due' | 'soon' | 'scheduled'

export interface RetentionRow {
  conceptId: ConceptId
  mastery: number
  decayed: number
  retention: number
  interval: number
  reps: number
  daysUntilDue: number
  status: RetentionStatus
  attempts: number
}

export function retentionQueue(nodes: Record<ConceptId, NodeState>, day: number): RetentionRow[] {
  return CONCEPTS.map((concept) => {
    const node = nodes[concept.id]
    const decayed = effectiveMastery(node, day)
    const left = daysUntilDue(node, day)
    const status: RetentionStatus = node.attempts === 0 ? 'scheduled' : left <= 0 ? 'due' : left <= 2 ? 'soon' : 'scheduled'
    return {
      conceptId: concept.id,
      mastery: node.mastery,
      decayed,
      retention: node.mastery > 0 ? decayed / node.mastery : 1,
      interval: node.sm2.interval,
      reps: node.sm2.reps,
      daysUntilDue: left,
      status,
      attempts: node.attempts,
    }
  }).sort((a, b) => {
    const order: Record<RetentionStatus, number> = { due: 0, soon: 1, scheduled: 2 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return a.decayed - b.decayed
  })
}

/* ------------------------------------------------------------------ */
/* Elo / BKT style mastery updater                                      */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_K: Record<Difficulty, number> = { Easy: 0.22, Medium: 0.3, Hard: 0.38 }

export function emptyNodeState(day: number, mastery = 0.15, estimated = true): NodeState {
  return {
    mastery,
    attempts: 0,
    correctCount: 0,
    failStreak: 0,
    estimated,
    lastReviewedDay: day,
    sm2: initialSm2(day),
    misconceptions: {},
  }
}

export interface AttemptInput {
  correct: boolean
  difficulty: Difficulty
  verdict: ReasoningVerdict
  misconceptionId: string | null
  day: number
}

export interface AttemptOutcome {
  node: NodeState
  before: number
  after: number
  delta: number
}

/**
 * Weighted Elo/ BKT hybrid update:
 *   delta = K_difficulty × (outcome − expected_mastery)
 * with a penalty for correct-answers-by-luck and for reasoning-free answers.
 */
export function applyAttempt(node: NodeState, input: AttemptInput): AttemptOutcome {
  const before = effectiveMastery(node, input.day)
  const carried = node.mastery * decayFactor(node, input.day)

  let outcome: number
  if (input.correct) outcome = input.verdict === 'lucky' ? 0.5 : input.verdict === 'thin' ? 0.8 : 1
  else outcome = 0

  let k = DIFFICULTY_K[input.difficulty]
  if (input.verdict === 'thin') k *= 0.7 // no reasoning given — weaker evidence
  if (input.verdict === 'lucky') k *= 0.85

  const delta = k * (outcome - before)
  const after = clamp(carried + delta)

  const quality = input.correct
    ? input.verdict === 'sound'
      ? 5
      : input.verdict === 'thin'
        ? 4
        : 3
    : input.verdict === 'lucky'
      ? 2
      : 1

  const misconceptions = { ...node.misconceptions }
  if (input.misconceptionId) {
    misconceptions[input.misconceptionId] = (misconceptions[input.misconceptionId] ?? 0) + 1
  }

  const nextNode: NodeState = {
    mastery: after,
    attempts: node.attempts + 1,
    correctCount: node.correctCount + (input.correct ? 1 : 0),
    failStreak: input.correct ? 0 : node.failStreak + 1,
    estimated: false,
    lastReviewedDay: input.day,
    sm2: updateSm2(node.sm2, quality, input.day),
    misconceptions,
  }

  return { node: nextNode, before, after, delta: after - before }
}

/**
 * Knowledge propagation across the dependency graph: mastering a node
 * strengthens prerequisites slightly and drags dependent nodes along.
 */
export function propagate(
  nodes: Record<ConceptId, NodeState>,
  conceptId: ConceptId,
  delta: number,
  day: number,
): Record<ConceptId, NodeState> {
  const next: Record<ConceptId, NodeState> = { ...nodes }
  const concept = CONCEPT_MAP[conceptId]

  for (const prereq of concept.prerequisites) {
    const share = delta > 0 ? delta * 0.15 : 0
    if (share === 0) continue
    const node = next[prereq]
    next[prereq] = { ...node, mastery: clamp(node.mastery * decayFactor(node, day) + share) }
  }

  for (const dependent of dependentsOf(conceptId)) {
    const share = delta * 0.2
    if (share === 0) continue
    const node = next[dependent]
    next[dependent] = { ...node, mastery: clamp(node.mastery * decayFactor(node, day) + share) }
  }

  return next
}

/* ------------------------------------------------------------------ */
/* Predicted board score                                               */
/* ------------------------------------------------------------------ */

export interface Prediction {
  percent: number
  marksOutOf30: number
  grade: string
  weightedMastery: number
  atRiskConceptIds: ConceptId[]
}

export function predictedScore(nodes: Record<ConceptId, NodeState>, day: number): Prediction {
  let weighted = 0
  let totalWeight = 0
  const atRisk: ConceptId[] = []

  for (const concept of CONCEPTS) {
    const mastery = effectiveMastery(nodes[concept.id], day)
    weighted += mastery * concept.examWeight
    totalWeight += concept.examWeight
    if (mastery < 0.5) atRisk.push(concept.id)
  }

  const weightedMastery = totalWeight > 0 ? weighted / totalWeight : 0
  const percent = Math.round(weightedMastery * 100)
  const grade = percent >= 90 ? 'A1' : percent >= 80 ? 'A2' : percent >= 70 ? 'B1' : percent >= 60 ? 'B2' : percent >= 50 ? 'C1' : percent >= 40 ? 'C2' : 'D'

  return {
    percent,
    marksOutOf30: Math.round(weightedMastery * 30 * 10) / 10,
    grade,
    weightedMastery,
    atRiskConceptIds: atRisk,
  }
}

/* ------------------------------------------------------------------ */
/* Targeting & prerequisite reroute                                    */
/* ------------------------------------------------------------------ */

export function weakestConcept(nodes: Record<ConceptId, NodeState>, day: number): ConceptId {
  let weakest = CONCEPTS[0].id
  let lowest = Number.POSITIVE_INFINITY
  for (const concept of CONCEPTS) {
    const mastery = effectiveMastery(nodes[concept.id], day)
    if (mastery < lowest) {
      lowest = mastery
      weakest = concept.id
    }
  }
  return weakest
}

export interface PrereqStatus {
  conceptId: ConceptId
  mastery: number
  ready: boolean
}

/** Prerequisite readiness of a node — used by the node detail panel. */
export function prerequisiteStatus(
  nodes: Record<ConceptId, NodeState>,
  conceptId: ConceptId,
  day: number,
): PrereqStatus[] {
  return CONCEPT_MAP[conceptId].prerequisites.map((p) => {
    const mastery = effectiveMastery(nodes[p], day)
    return { conceptId: p, mastery, ready: mastery >= 0.6 }
  })
}

/**
 * Prerequisite Reroute Rule:
 * if the learner fails an advanced node twice while a prerequisite is below 60%,
 * push the learner back to the root concept.
 */
export function evaluateReroute(
  nodes: Record<ConceptId, NodeState>,
  day: number,
  beacons: string[],
): RerouteAlert[] {
  const alerts: RerouteAlert[] = []
  for (const concept of CONCEPTS) {
    const node = nodes[concept.id]
    if (node.failStreak < 2) continue
    for (const prereq of concept.prerequisites) {
      const prereqMastery = effectiveMastery(nodes[prereq], day)
      if (prereqMastery >= 0.6) continue
      const id = `${concept.id}->${prereq}`
      if (beacons.includes(id)) continue
      alerts.push({
        id,
        failingConceptId: concept.id,
        prerequisiteId: prereq,
        failingMastery: effectiveMastery(node, day),
        prerequisiteMastery: prereqMastery,
        failStreak: node.failStreak,
        message: `Two consecutive misses on ${concept.name} while ${CONCEPT_MAP[prereq].name} sits at ${pct(
          prereqMastery,
        )}. Rerouting to the root concept will raise the ceiling of everything downstream.`,
      })
    }
  }
  return alerts.sort((a, b) => b.failStreak - a.failStreak)
}

/* ------------------------------------------------------------------ */
/* Diagnostics & helpers                                               */
/* ------------------------------------------------------------------ */

/** Seed the whole graph from the 6-question Pre-Flight Calibration. */
export function seedFromDiagnostic(
  nodes: Record<ConceptId, NodeState>,
  results: { conceptId: ConceptId; correct: boolean }[],
  day: number,
): Record<ConceptId, NodeState> {
  const next: Record<ConceptId, NodeState> = { ...nodes }

  for (const result of results) {
    const node = next[result.conceptId]
    next[result.conceptId] = {
      ...node,
      mastery: result.correct ? 0.74 : 0.3,
      attempts: 1,
      correctCount: result.correct ? 1 : 0,
      failStreak: result.correct ? 0 : 1,
      estimated: false,
      lastReviewedDay: day,
      sm2: updateSm2(node.sm2, result.correct ? 4 : 1, day),
    }
  }

  // Untested nodes inherit a fraction of their prerequisites (BKT prior).
  for (const concept of CONCEPTS) {
    const node = next[concept.id]
    if (!node.estimated) continue
    const prereqValues = concept.prerequisites.map((p) => next[p].mastery)
    if (prereqValues.length === 0) continue
    const average = prereqValues.reduce((a, b) => a + b, 0) / prereqValues.length
    next[concept.id] = { ...node, mastery: clamp(average * 0.72 + 0.08, 0.12, 0.72) }
  }

  return next
}

export function learnerStrength(nodes: Record<ConceptId, NodeState>, day: number): number {
  const values = CONCEPTS.map((c) => effectiveMastery(nodes[c.id], day))
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function diagnosticAccuracy(state: LearnerState): number {
  const answered = Object.values(state.nodes).filter((n) => !n.estimated)
  if (answered.length === 0) return 0
  const correct = answered.reduce((sum, n) => sum + n.correctCount, 0)
  const attempts = answered.reduce((sum, n) => sum + n.attempts, 0)
  return attempts === 0 ? 0 : correct / attempts
}

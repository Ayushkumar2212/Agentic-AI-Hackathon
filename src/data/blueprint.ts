import type { ConceptId } from '../types'

/**
 * CBSE Class 10 Board Exam blueprint — Physics section
 * (Ch. 12 Electricity + Ch. 10 Light: Reflection & Refraction).
 *
 * `BLUEPRINT_MARKS` is the marks weightage each Concept Graph node carries in
 * the board paper. It powers the What-If Exam Score Simulator: the live and
 * simulated scores are both a marks-weighted aggregate of node mastery.
 */
export const BLUEPRINT_MARKS: Record<ConceptId, number> = {
  charge_current: 4,
  ohms_law: 4,
  resistance_factors: 5,
  series_parallel: 6,
  electric_power: 4,
  reflection_laws: 4,
  spherical_mirrors: 5,
  mirror_formula: 5,
  refraction_snell: 5,
}

export const BLUEPRINT_TOTAL = Object.values(BLUEPRINT_MARKS).reduce((sum, m) => sum + m, 0)

/** Base the projected board score is reported against. */
export const BOARD_SCORE_BASE = 80

/** Focused study hours needed to lift a node from 0% → full mastery. */
export const STUDY_HOURS: Record<ConceptId, number> = {
  charge_current: 5,
  ohms_law: 6,
  resistance_factors: 6,
  series_parallel: 7,
  electric_power: 6,
  reflection_laws: 5,
  spherical_mirrors: 7,
  mirror_formula: 7,
  refraction_snell: 7,
}

/** Marks a node is worth at full mastery, projected onto the board base. */
export function marksPotential(conceptId: ConceptId): number {
  return (BLUEPRINT_MARKS[conceptId] / BLUEPRINT_TOTAL) * BOARD_SCORE_BASE
}

/** Marks-weighted projection of any mastery map, out of BOARD_SCORE_BASE. */
export function projectScore(mastery: Record<ConceptId, number>): number {
  let weighted = 0
  for (const id of Object.keys(BLUEPRINT_MARKS) as ConceptId[]) {
    weighted += (mastery[id] ?? 0) * BLUEPRINT_MARKS[id]
  }
  return (weighted / BLUEPRINT_TOTAL) * BOARD_SCORE_BASE
}

/** Planning hours modelled as a mild stretch penalty: bigger jumps cost more per point. */
export function plannedHours(conceptId: ConceptId, from: number, to: number): number {
  const delta = Math.max(0, to - from)
  return STUDY_HOURS[conceptId] * delta * (1 + 0.6 * delta)
}

/**
 * Marks gained per study hour ("ROI") for planning a node from `from` → `to`.
 * At zero planned gain this returns the node's standing per-hour yield, so the
 * chart is never empty and the ranking is meaningful before the first drag.
 */
export function roiPerHour(conceptId: ConceptId, from: number, to: number): number {
  const potential = marksPotential(conceptId)
  const hours = plannedHours(conceptId, from, to)
  const delta = Math.max(0, to - from)
  if (hours <= 0 || delta <= 0) return potential / STUDY_HOURS[conceptId]
  return (potential * delta) / hours
}

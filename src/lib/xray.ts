import { CONCEPT_MAP } from '../data/concepts'
import { MISCONCEPTION_MAP, misconceptionsForConcept } from '../data/misconceptions'
import type { Question, ReasoningVerdict, XRayFinding } from '../types'

/* ------------------------------------------------------------------ */
/* Text normalisation so casual student wording still matches           */
/* ------------------------------------------------------------------ */

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()
const compact = (value: string) => normalise(value).replace(/[^a-z0-9+/*=^.<>-]/g, '')

function matchedTriggers(reasoning: string, triggers: string[]): string[] {
  const text = normalise(reasoning)
  const squeezed = compact(reasoning)
  const hits: string[] = []
  for (const trigger of triggers) {
    const t = normalise(trigger)
    const c = compact(trigger)
    if (!t) continue
    if (text.includes(t) || (c.length > 3 && squeezed.includes(c))) hits.push(trigger)
  }
  return hits
}

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export interface XRayInput {
  question: Question
  selectedIndex: number
  reasoning: string
  day: number
}

/**
 * Reasoning X-Ray: diagnoses the *flawed mental model* behind an answer,
 * using the written reasoning plus the diagnostic value of the chosen option.
 */
export function analyzeReasoning({ question, selectedIndex, reasoning, day }: XRayInput): XRayFinding {
  const correct = selectedIndex === question.correctIndex
  const words = wordCount(reasoning)

  // Candidate misconceptions: the chosen distractor's trap, the question's primary
  // misconception, then every misconception attached to the concept.
  const candidates = new Map<string, number>()
  const trapId = question.trapOptions[selectedIndex]
  if (trapId) candidates.set(trapId, 15)
  candidates.set(question.primaryMisconception, (candidates.get(question.primaryMisconception) ?? 0) + 8)
  for (const m of misconceptionsForConcept(question.conceptId)) {
    candidates.set(m.id, (candidates.get(m.id) ?? 0) + 2)
  }

  let bestId: string | null = null
  let bestScore = 0
  let bestHits: string[] = []

  for (const [id, weight] of candidates) {
    const misconception = MISCONCEPTION_MAP[id]
    if (!misconception) continue
    const hits = matchedTriggers(reasoning, misconception.triggers)
    const score = hits.length * 10 + weight
    if (hits.length > 0 && score > bestScore) {
      bestScore = score
      bestId = id
      bestHits = hits
    }
  }

  let verdict: ReasoningVerdict
  let misconceptionId: string | null = bestId
  let confidence: number

  if (correct) {
    if (bestId) {
      // Hit the right option but reasoned through a flawed model — luck, not mastery.
      verdict = 'lucky'
      confidence = Math.min(0.95, 0.62 + bestHits.length * 0.08)
    } else if (words < 6) {
      verdict = 'thin'
      misconceptionId = null
      confidence = 0.45
    } else {
      verdict = 'sound'
      misconceptionId = null
      confidence = Math.min(0.95, 0.7 + Math.min(words, 40) * 0.01)
    }
  } else if (bestId) {
    verdict = 'flawed'
    confidence = Math.min(0.97, 0.68 + bestHits.length * 0.07)
  } else if (trapId) {
    verdict = 'flawed'
    misconceptionId = trapId
    confidence = 0.66
  } else if (words < 6) {
    verdict = 'thin'
    confidence = 0.42
  } else {
    verdict = 'flawed'
    misconceptionId = question.primaryMisconception
    confidence = 0.55
  }

  return {
    id: `xray_${question.id}_${day}`,
    questionId: question.id,
    conceptId: question.conceptId,
    optionCorrect: correct,
    verdict,
    misconceptionId,
    matchedTriggers: bestHits,
    confidence,
    excerpt: reasoning.trim().slice(0, 220),
    day,
    difficulty: question.difficulty,
  }
}

/* ------------------------------------------------------------------ */
/* 1-click reasoning quick-fill chips (hackathon demo speed)            */
/* ------------------------------------------------------------------ */

const CHIP_TEMPLATES: Record<string, string> = {
  additive_parallel: 'I added the resistances R₁ + R₂ because the resistors are connected in parallel.',
  parallel_formula_in_series: 'I used the reciprocal formula 1/R1 + 1/R2 for the series circuit.',
  current_consumption: 'The current is used up as it passes through each resistor, so less current flows later.',
  series_current_split: 'The current divides in series and the voltage stays the same across each resistor.',
  resistance_voltage_dependence: 'Resistance depends on voltage, so when V increases R also increases.',
  rated_wattage_series: 'The 100 W bulb glows brighter because it has the higher wattage rating.',
  power_formula_slip: 'I used P = VI and forgot to multiply by time to get the heat energy.',
  charge_current_confusion: 'I took Q = I/t because charge and current are the same thing.',
  dimension_slip: 'I forgot to convert the time from minutes into seconds before substituting.',
  angle_from_surface: 'I took the angle of reflection as 30° because the angle with the surface is 30°.',
  real_virtual_confusion: 'A plane mirror forms a real image which can be caught on a screen.',
  concave_always_real: 'A concave mirror always forms a real and inverted image, so this one is real.',
  mirror_sign_convention: 'I took f as positive for the concave mirror and all distances as positive.',
  focal_length_half: 'I took f = R, so the focal length is the same as the radius of curvature.',
  magnification_sign: 'The magnification is negative, so the image must be virtual and small.',
  inverted_snell: 'I used n = sin r / sin i, so the angle of refraction came out larger than i.',
  frequency_change: 'The frequency of the light changes inside the medium, so the wavelength remains the same.',
  refractive_index_angle: 'The refractive index depends on the angle of incidence, so it changes as i changes.',
  no_bending: 'There is no refraction here, the light does not bend at all and keeps its speed.',
  constant_volume_geometry: 'The length doubles so the resistance doubles; the area remains the same.',
}

export interface ReasoningChip {
  label: string
  text: string
  kind: 'flawed' | 'sound' | 'thin'
}

export function reasoningChips(question: Question): ReasoningChip[] {
  const chips: ReasoningChip[] = []
  const trapIds = Array.from(new Set(Object.values(question.trapOptions)))

  for (const id of trapIds.slice(0, 2)) {
    const text = CHIP_TEMPLATES[id]
    if (text) chips.push({ label: MISCONCEPTION_MAP[id]?.label ?? 'Flawed reasoning', text, kind: 'flawed' })
  }

  chips.push({
    label: 'Correct reasoning',
    text: `I used ${CONCEPT_MAP[question.conceptId].formula} and substituted the given values with their units, so my answer follows from the law itself.`,
    kind: 'sound',
  })

  chips.push({
    label: 'No reasoning',
    text: 'By the formula.',
    kind: 'thin',
  })

  return chips
}

export const VERDICT_META: Record<
  ReasoningVerdict,
  { label: string; tone: 'good' | 'warn' | 'bad' | 'muted'; blurb: string }
> = {
  sound: {
    label: 'Reasoning sound',
    tone: 'good',
    blurb: 'The physics behind your answer is correct and the reasoning is complete.',
  },
  lucky: {
    label: 'Correct answer, flawed reasoning',
    tone: 'warn',
    blurb: 'You reached the right option but your reasoning used the wrong mental model — this will fail on a different numerical.',
  },
  flawed: {
    label: 'Reasoning flaw detected',
    tone: 'bad',
    blurb: 'The X-Ray matched your explanation to a specific Physics misconception.',
  },
  thin: {
    label: 'Reasoning too thin to diagnose',
    tone: 'muted',
    blurb: 'Write one line of Physics reasoning (which law and why) so the X-Ray can diagnose your model.',
  },
}

import { CONCEPT_MAP } from '../data/concepts'
import type { ConceptId, Difficulty, Question } from '../types'

/**
 * Optional server-side question generation endpoint.
 * The app posts to `/api/generate-question` (override with VITE_QUESTION_ENDPOINT).
 * If the endpoint is missing or slow, the caller silently falls back to the
 * built-in offline Class 10 Physics generator — so live demos never break.
 */
export const QUESTION_ENDPOINT = import.meta.env.VITE_QUESTION_ENDPOINT ?? '/api/generate-question'

interface DraftQuestion {
  stem: string
  options: string[]
  correctIndex: number
  explanation: string
  trapOptions?: Record<number, string>
  primaryMisconception?: string
  tags?: string[]
}

export interface GeneratedQuestionResult {
  question: Question | null
  endpoint: string
  latencyMs: number
  error?: string
}

function buildPrompt(conceptId: ConceptId, difficulty: Difficulty): string {
  const concept = CONCEPT_MAP[conceptId]
  return [
    'You are an examiner for the CBSE Class 10 Science curriculum (NCERT).',
    `Write ONE multiple-choice question of ${difficulty} difficulty on "${concept.name}" (${concept.chapter}).`,
    `Core relation to respect: ${concept.formula}.`,
    'Requirements: exactly 4 options, one unambiguously correct, distractors that reflect real Class 10 misconceptions,',
    'authentic NCERT numerical values or conceptual wording, no "Lorem ipsum", and a 2-3 sentence solution.',
    'Reply ONLY with JSON: {"stem": string, "options": [string, string, string, string], "correctIndex": number, "explanation": string}',
  ].join(' ')
}

function isValidDraft(value: unknown): value is DraftQuestion {
  if (typeof value !== 'object' || value === null) return false
  const draft = value as DraftQuestion
  return (
    typeof draft.stem === 'string' &&
    draft.stem.length > 10 &&
    Array.isArray(draft.options) &&
    draft.options.length === 4 &&
    draft.options.every((o) => typeof o === 'string' && o.length > 0) &&
    typeof draft.correctIndex === 'number' &&
    draft.correctIndex >= 0 &&
    draft.correctIndex < 4 &&
    typeof draft.explanation === 'string'
  )
}

let generatedCounter = 0

export async function requestGeneratedQuestion(
  conceptId: ConceptId,
  difficulty: Difficulty,
  timeoutMs = 4500,
): Promise<GeneratedQuestionResult> {
  const started = performance.now()
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(QUESTION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conceptId,
        conceptName: CONCEPT_MAP[conceptId].name,
        formula: CONCEPT_MAP[conceptId].formula,
        curriculum: 'CBSE Class 10 Science - Electricity & Light',
        difficulty,
        prompt: buildPrompt(conceptId, difficulty),
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload: unknown = await response.json()
    const draft = (payload as { question?: unknown }).question ?? payload
    if (!isValidDraft(draft)) throw new Error('Malformed server payload')

    generatedCounter += 1
    return {
      endpoint: QUESTION_ENDPOINT,
      latencyMs: Math.round(performance.now() - started),
      question: {
        id: `gen_${conceptId}_${generatedCounter}`,
        conceptId,
        difficulty,
        source: 'Generated Set',
        stem: draft.stem,
        options: draft.options,
        correctIndex: draft.correctIndex,
        explanation: draft.explanation,
        trapOptions: draft.trapOptions ?? {},
        primaryMisconception: draft.primaryMisconception ?? 'dimension_slip',
        tags: draft.tags ?? ['Generated Set'],
      },
    }
  } catch (error) {
    return {
      question: null,
      endpoint: QUESTION_ENDPOINT,
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'Server generator unavailable',
    }
  } finally {
    window.clearTimeout(timer)
  }
}

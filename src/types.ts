/**
 * PrepPilots shared domain types.
 * Curriculum scope: CBSE / NCERT Class 10 Science
 *   - Chapter 12: Electricity
 *   - Chapter 10: Light - Reflection and Refraction
 */

export type ConceptId =
  | 'charge_current'
  | 'ohms_law'
  | 'resistance_factors'
  | 'series_parallel'
  | 'electric_power'
  | 'reflection_laws'
  | 'spherical_mirrors'
  | 'mirror_formula'
  | 'refraction_snell'

export type Track = 'Electricity' | 'Optics'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type MasteryBand = 'weak' | 'developing' | 'mastered'
export type QuestionSource = 'Diagnostic' | 'PrepPilots Bank' | 'Generated Set'

export interface Concept {
  id: ConceptId
  name: string
  shortName: string
  formula: string
  track: Track
  chapter: string
  summary: string
  keyIdeas: string[]
  prerequisites: ConceptId[]
  examWeight: number
  /** Layout coordinates inside a 1000 x 560 graph canvas */
  x: number
  y: number
}

export interface Misconception {
  id: string
  label: string
  concepts: ConceptId[]
  /** The exact flaw in the learner's physics logic */
  flaw: string
  /** The correct frame the learner should switch to */
  correctFrame: string
  formula: string
  microLesson: string[]
  /** Reasoning phrases that signal this flawed mental model */
  triggers: string[]
  topic: string
}

export interface Question {
  id: string
  conceptId: ConceptId
  difficulty: Difficulty
  source: QuestionSource
  stem: string
  options: string[]
  correctIndex: number
  explanation: string
  /** wrong option index -> misconception id it betrays */
  trapOptions: Record<number, string>
  primaryMisconception: string
  tags: string[]
}

export type ReasoningVerdict = 'sound' | 'lucky' | 'flawed' | 'thin'

export interface XRayFinding {
  id: string
  questionId: string
  conceptId: ConceptId
  optionCorrect: boolean
  verdict: ReasoningVerdict
  misconceptionId: string | null
  matchedTriggers: string[]
  confidence: number
  excerpt: string
  day: number
  difficulty: Difficulty
}

export interface NodeState {
  mastery: number
  attempts: number
  correctCount: number
  failStreak: number
  /** true until the node gets a direct attempt (value estimated from prerequisites) */
  estimated: boolean
  lastReviewedDay: number
  sm2: Sm2State
  misconceptions: Record<string, number>
}

export interface Sm2State {
  ef: number
  reps: number
  interval: number
  dueDay: number
}

export interface LearnerState {
  version: number
  studentName: string
  grade: string
  diagnosticDone: boolean
  diagnosticScore: number
  currentDay: number
  nodes: Record<ConceptId, NodeState>
  xrayLog: XRayFinding[]
  totalAnswers: number
  rerouteBeacons: string[]
}

export interface ClassStudent {
  id: string
  rollNo: number
  name: string
  isLive: boolean
  mastery: Record<ConceptId, number>
  misconceptions: string[]
  attendance: number
}

export interface ConceptStat {
  conceptId: ConceptId
  classAverage: number
  stuckRatio: number
  isBottleneck: boolean
}

export interface SubmissionResult {
  correct: boolean
  delta: number
  before: number
  after: number
  xray: XRayFinding
  reroute: RerouteAlert | null
}

export interface RerouteAlert {
  id: string
  failingConceptId: ConceptId
  prerequisiteId: ConceptId
  failingMastery: number
  prerequisiteMastery: number
  failStreak: number
  message: string
}

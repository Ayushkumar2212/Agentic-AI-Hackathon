import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONCEPTS } from '../data/concepts'
import { calibrateDifficulty, generateQuestion, generateDiagnosticSet, mulberry32 } from '../data/questions'
import type {
  ConceptId,
  Difficulty,
  LearnerState,
  NodeState,
  Question,
  RerouteAlert,
  SubmissionResult,
} from '../types'
import { requestGeneratedQuestion } from '../lib/questionService'
import {
  applyAttempt,
  effectiveMastery,
  evaluateReroute,
  predictedScore,
  propagate,
  retentionQueue,
  seedFromDiagnostic,
  weakestConcept,
} from '../lib/mastery'
import { clearState, createInitialState, loadState, saveState, type Identity } from '../lib/storage'
import { updateSm2 } from '../lib/sm2'
import { analyzeReasoning } from '../lib/xray'

export type GeneratorStatus = 'idle' | 'loading' | 'server' | 'offline'

export interface PrepPilotsApi {
  state: LearnerState
  day: number
  effective: Record<ConceptId, number>
  prediction: ReturnType<typeof predictedScore>
  retention: ReturnType<typeof retentionQueue>
  rerouteAlerts: RerouteAlert[]
  dueCount: number
  diagnosticQuestions: Question[]
  question: Question
  target: ConceptId
  difficulty: Difficulty
  calibrationNote: string
  genStatus: GeneratorStatus
  lastResult: SubmissionResult | null
  flash: { conceptId: ConceptId; delta: number; nonce: number } | null
  submitDiagnostic: (answers: { conceptId: ConceptId; correct: boolean }[]) => void
  submitAnswer: (question: Question, selectedIndex: number, reasoning: string) => SubmissionResult
  /** line-by-line OCR remediation — lifts live mastery and schedules a fresh review */
  remediateConcept: (conceptId: ConceptId) => void
  selectTarget: (conceptId: ConceptId, difficulty?: Difficulty) => void
  setDifficulty: (difficulty: Difficulty) => void
  nextQuestion: () => void
  requestFreshQuestion: () => Promise<void>
  simulateDays: (days: number) => void
  dismissReroute: (id: string) => void
  clearResult: () => void
  resetProgress: () => void
}

export interface PrepPilotsOptions {
  /** namespaces persisted progress per account */
  learnerId?: string | null
  identity?: Identity
}

export function usePrepPilots(options: PrepPilotsOptions = {}): PrepPilotsApi {
  const { learnerId = null, identity } = options
  const [state, setState] = useState<LearnerState>(() => loadState(learnerId, identity))
  const stateRef = useRef(state)
  stateRef.current = state

  const rngRef = useRef(mulberry32((Date.now() ^ 0x5f3759df) >>> 0))

  useEffect(() => {
    saveState(state, learnerId)
  }, [state, learnerId])

  /* ---------------- derived learner model ---------------- */

  const day = state.currentDay

  const effective = useMemo(() => {
    const map = {} as Record<ConceptId, number>
    for (const concept of CONCEPTS) map[concept.id] = effectiveMastery(state.nodes[concept.id], day)
    return map
  }, [state.nodes, day])

  const prediction = useMemo(() => predictedScore(state.nodes, day), [state.nodes, day])
  const retention = useMemo(() => retentionQueue(state.nodes, day), [state.nodes, day])
  const rerouteAlerts = useMemo(
    () => evaluateReroute(state.nodes, day, state.rerouteBeacons),
    [state.nodes, day, state.rerouteBeacons],
  )
  const dueCount = retention.filter((row) => row.status === 'due').length

  const diagnosticQuestions = useMemo(() => generateDiagnosticSet(mulberry32(777)), [])

  /* ---------------- practice engine ---------------- */

  const [practiceTarget, setPracticeTarget] = useState<ConceptId | null>(null)
  const [manualDifficulty, setManualDifficulty] = useState<Difficulty | null>(null)
  const [genStatus, setGenStatus] = useState<GeneratorStatus>('idle')
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null)
  const [flash, setFlash] = useState<{ conceptId: ConceptId; delta: number; nonce: number } | null>(null)

  const target = practiceTarget ?? weakestConcept(state.nodes, day)
  const calibrated = calibrateDifficulty(effectiveMastery(state.nodes[target], day))
  const difficulty = manualDifficulty ?? calibrated

  const [question, setQuestion] = useState<Question>(() => {
    const fresh = loadState(learnerId, identity)
    const firstTarget = weakestConcept(fresh.nodes, fresh.currentDay)
    return generateQuestion(firstTarget, calibrateDifficulty(effectiveMastery(fresh.nodes[firstTarget], fresh.currentDay)), rngRef.current)
  })

  const calibrationNote = useMemo(() => {
    const percent = Math.round(effective[target] * 100)
    if (difficulty === 'Easy') return `${percent}% mastery → Easy calibration (rebuilding the foundation)`
    if (difficulty === 'Medium') return `${percent}% mastery → Medium calibration (applying the formula)`
    return `${percent}% mastery → Hard calibration (board-level stretch)`
  }, [effective, target, difficulty])

  const selectTarget = useCallback((conceptId: ConceptId, forced?: Difficulty) => {
    const current = stateRef.current
    const mastery = effectiveMastery(current.nodes[conceptId], current.currentDay)
    const nextDifficulty = forced ?? calibrateDifficulty(mastery)
    setPracticeTarget(conceptId)
    setManualDifficulty(forced ?? null)
    setGenStatus('idle')
    setQuestion(generateQuestion(conceptId, nextDifficulty, rngRef.current))
  }, [])

  const setDifficulty = useCallback((next: Difficulty) => {
    const current = stateRef.current
    const conceptId = practiceTarget ?? weakestConcept(current.nodes, current.currentDay)
    setManualDifficulty(next)
    setGenStatus('idle')
    setQuestion(generateQuestion(conceptId, next, rngRef.current))
  }, [practiceTarget])

  const nextQuestion = useCallback(() => {
    const current = stateRef.current
    const conceptId = practiceTarget ?? weakestConcept(current.nodes, current.currentDay)
    const mastery = effectiveMastery(current.nodes[conceptId], current.currentDay)
    setManualDifficulty(null)
    setGenStatus('idle')
    setQuestion(generateQuestion(conceptId, calibrateDifficulty(mastery), rngRef.current))
  }, [practiceTarget])

  const requestFreshQuestion = useCallback(async () => {
    const current = stateRef.current
    const conceptId = practiceTarget ?? weakestConcept(current.nodes, current.currentDay)
    const mastery = effectiveMastery(current.nodes[conceptId], current.currentDay)
    const level = manualDifficulty ?? calibrateDifficulty(mastery)
    setGenStatus('loading')
    const result = await requestGeneratedQuestion(conceptId, level)
    if (result.question) {
      setQuestion(result.question)
      setGenStatus('server')
    } else {
      setQuestion(generateQuestion(conceptId, level, rngRef.current, 'PrepPilots Bank'))
      setGenStatus('offline')
    }
  }, [manualDifficulty, practiceTarget])

  /* ---------------- learner model updates ---------------- */

  const submitAnswer = useCallback(
    (submitted: Question, selectedIndex: number, reasoning: string): SubmissionResult => {
      const current = stateRef.current
      const currentDay = current.currentDay
      const xray = analyzeReasoning({ question: submitted, selectedIndex, reasoning, day: currentDay })

      const outcome = applyAttempt(current.nodes[submitted.conceptId], {
        correct: xray.optionCorrect,
        difficulty: submitted.difficulty,
        verdict: xray.verdict,
        misconceptionId: xray.misconceptionId,
        day: currentDay,
      })

      let nodes = { ...current.nodes, [submitted.conceptId]: outcome.node }
      nodes = propagate(nodes, submitted.conceptId, outcome.delta, currentDay)

      const nextState: LearnerState = {
        ...current,
        nodes,
        xrayLog: [xray, ...current.xrayLog].slice(0, 60),
        totalAnswers: current.totalAnswers + 1,
      }

      const alerts = evaluateReroute(nodes, currentDay, current.rerouteBeacons)
      const reroute = alerts.length > 0 ? alerts[0] : null

      setState(nextState)
      setFlash({ conceptId: submitted.conceptId, delta: outcome.delta, nonce: Date.now() })

      const result: SubmissionResult = {
        correct: xray.optionCorrect,
        delta: outcome.delta,
        before: outcome.before,
        after: effectiveMastery(nodes[submitted.conceptId], currentDay),
        xray,
        reroute,
      }
      setLastResult(result)
      return result
    },
    [],
  )

  const submitDiagnostic = useCallback((answers: { conceptId: ConceptId; correct: boolean }[]) => {
    setState((prev) => ({
      ...prev,
      nodes: seedFromDiagnostic(prev.nodes, answers, prev.currentDay),
      diagnosticDone: true,
      diagnosticScore: answers.filter((a) => a.correct).length,
    }))
    setPracticeTarget(null)
    setManualDifficulty(null)
    setGenStatus('idle')
  }, [])

  /**
   * Line-by-line OCR remediation hook: credits the learner with having worked
   * through the corrected step, lifting live mastery on the flawed node (and
   * nudging its dependents through graph propagation).
   */
  const remediateConcept = useCallback((conceptId: ConceptId) => {
    const current = stateRef.current
    const currentDay = current.currentDay
    const node = current.nodes[conceptId]
    const before = effectiveMastery(node, currentDay)
    const after = Math.min(0.98, before + 0.16)

    const repaired: NodeState = {
      ...node,
      mastery: after,
      attempts: node.attempts + 1,
      correctCount: node.correctCount + 1,
      failStreak: 0,
      estimated: false,
      lastReviewedDay: currentDay,
      sm2: updateSm2(node.sm2, 5, currentDay),
    }

    let nodes = { ...current.nodes, [conceptId]: repaired }
    nodes = propagate(nodes, conceptId, after - before, currentDay)

    setState({ ...current, nodes, totalAnswers: current.totalAnswers + 1 })
    setFlash({ conceptId, delta: after - before, nonce: Date.now() })
  }, [])

  const simulateDays = useCallback((days: number) => {
    setState((prev) => ({ ...prev, currentDay: prev.currentDay + days }))
  }, [])

  const dismissReroute = useCallback((id: string) => {
    setState((prev) =>
      prev.rerouteBeacons.includes(id)
        ? prev
        : { ...prev, rerouteBeacons: [...prev.rerouteBeacons, id] },
    )
  }, [])

  const clearResult = useCallback(() => {
    setLastResult(null)
    setFlash(null)
  }, [])

  const resetProgress = useCallback(() => {
    clearState(learnerId)
    setState(createInitialState(identity))
    setPracticeTarget(null)
    setManualDifficulty(null)
    setLastResult(null)
    setFlash(null)
    setGenStatus('idle')
  }, [learnerId, identity])

  return {
    state,
    day,
    effective,
    prediction,
    retention,
    rerouteAlerts,
    dueCount,
    diagnosticQuestions,
    question,
    target,
    difficulty,
    calibrationNote,
    genStatus,
    lastResult,
    flash,
    submitDiagnostic,
    submitAnswer,
    remediateConcept,
    selectTarget,
    setDifficulty,
    nextQuestion,
    requestFreshQuestion,
    simulateDays,
    dismissReroute,
    clearResult,
    resetProgress,
  }
}

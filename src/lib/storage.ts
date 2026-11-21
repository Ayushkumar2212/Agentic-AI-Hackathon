import { CONCEPTS } from '../data/concepts'
import type { ConceptId, LearnerState, NodeState } from '../types'
import { emptyNodeState } from './mastery'

const BASE_KEY = 'preppilots.learner.v1'

/** Progress is namespaced per account so several learners can share one device. */
export function storageKey(userId?: string | null): string {
  return userId ? `${BASE_KEY}.${userId}` : BASE_KEY
}

export function createInitialNodes(day = 0): Record<ConceptId, NodeState> {
  const nodes = {} as Record<ConceptId, NodeState>
  for (const concept of CONCEPTS) {
    nodes[concept.id] = emptyNodeState(day, 0.18, true)
  }
  return nodes
}

export interface Identity {
  name: string
  grade: string
}

export function createInitialState(identity?: Identity): LearnerState {
  return {
    version: 1,
    studentName: identity?.name ?? 'Learner',
    grade: identity?.grade ?? 'Class 10',
    diagnosticDone: false,
    diagnosticScore: 0,
    currentDay: 0,
    nodes: createInitialNodes(0),
    xrayLog: [],
    totalAnswers: 0,
    rerouteBeacons: [],
  }
}

/** Merge persisted progress with the current schema so old saves never crash the app. */
export function loadState(userId?: string | null, identity?: Identity): LearnerState {
  const base = createInitialState(identity)
  if (typeof localStorage === 'undefined') return base
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<LearnerState>
    if (!parsed || typeof parsed !== 'object') return base

    const nodes = { ...base.nodes }
    for (const concept of CONCEPTS) {
      const stored = parsed.nodes?.[concept.id]
      if (!stored) continue
      nodes[concept.id] = {
        ...base.nodes[concept.id],
        ...stored,
        sm2: { ...base.nodes[concept.id].sm2, ...(stored.sm2 ?? {}) },
        misconceptions: stored.misconceptions ?? {},
      }
    }

    return {
      ...base,
      ...parsed,
      studentName: identity?.name ?? parsed.studentName ?? base.studentName,
      grade: identity?.grade ?? parsed.grade ?? base.grade,
      nodes,
      xrayLog: Array.isArray(parsed.xrayLog) ? parsed.xrayLog.slice(0, 60) : [],
      rerouteBeacons: Array.isArray(parsed.rerouteBeacons) ? parsed.rerouteBeacons : [],
    }
  } catch {
    return base
  }
}

export function saveState(state: LearnerState, userId?: string | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    /* storage full or blocked — progress simply will not persist */
  }
}

export function clearState(userId?: string | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    /* ignore */
  }
}

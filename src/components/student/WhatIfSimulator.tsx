import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  Crown,
  Flame,
  Lock,
  Map,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { CONCEPTS, CONCEPT_MAP } from '../../data/concepts'
import {
  BLUEPRINT_MARKS,
  BLUEPRINT_TOTAL,
  BOARD_SCORE_BASE,
  marksPotential,
  plannedHours,
  projectScore,
  roiPerHour,
} from '../../data/blueprint'
import { clamp, pct } from '../../lib/mastery'
import type { PrepPilotsApi } from '../../state/usePrepPilots'
import type { ConceptId } from '../../types'

interface WhatIfSimulatorProps {
  api: PrepPilotsApi
  /** pushes the simulated (ghost) mastery map up to the Concept Graph */
  onSimulated: (targets: Partial<Record<ConceptId, number>>) => void
  onViewMap: () => void
  onPractice: (id: ConceptId) => void
}

interface Mission {
  conceptId: ConceptId
  from: number
  to: number
  hours: number
  marks: number
  roi: number
}

interface PlanDay {
  day: number
  hours: number
  marks: number
  missions: Mission[]
}

/** Smoothly eases a number whenever its target changes. */
function useAnimatedNumber(value: number, duration = 620): number {
  const [display, setDisplay] = useState(value)
  const ref = useRef(value)

  useEffect(() => {
    const from = ref.current
    const to = value
    if (Math.abs(from - to) < 0.0005) {
      ref.current = to
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      ref.current = current
      setDisplay(current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}

/** Radial gauge: dim ghost arc = live score, gradient arc = simulated score. */
function ScoreGauge({ current, simulated, max }: { current: number; simulated: number; max: number }) {
  const size = 200
  const stroke = 13
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const live = useAnimatedNumber(current)
  const sim = useAnimatedNumber(simulated)
  const delta = simulated - current

  const simArc = clamp(simulated / max)
  const liveArc = clamp(current / max)

  const deltaTone =
    delta > 0.05
      ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]'
      : delta < -0.05
        ? 'border-[#EF4444]/50 bg-[#EF4444]/15 text-[#EF4444]'
        : 'border-white/15 bg-white/[0.05] text-slate-400'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="whatifGauge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="55%" stopColor="#5EF2FF" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={stroke} />
          {/* live baseline */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#64748B"
            strokeOpacity="0.6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - liveArc)}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)' }}
          />
          {/* simulated */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#whatifGauge)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - simArc)}
            style={{
              transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)',
              filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.55))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">Projected</span>
          <span className="mono text-[38px] font-extrabold leading-none text-white">{sim.toFixed(1)}</span>
          <span className="mono mt-0.5 text-[11px] text-slate-500">/ {max} marks</span>
          <span className={`mono mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${deltaTone}`}>
            {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)} Marks
          </span>
        </div>
      </div>
      <div className="mono mt-1 text-[10px] text-slate-600">live baseline {live.toFixed(1)} / {max}</div>
    </div>
  )
}

/** Balance the planned missions across three days by effort. */
function buildPlan(missions: Mission[]): PlanDay[] {
  const days: PlanDay[] = [1, 2, 3].map((day) => ({ day, hours: 0, marks: 0, missions: [] }))
  const byEffort = [...missions].sort((a, b) => b.hours - a.hours)
  for (const mission of byEffort) {
    const lightest = days.reduce((min, d) => (d.hours < min.hours ? d : min), days[0])
    lightest.missions.push(mission)
    lightest.hours += mission.hours
    lightest.marks += mission.marks
  }
  for (const day of days) day.missions.sort((a, b) => b.roi - a.roi)
  return days
}

/**
 * Feature A — "Mission Trajectory: What-If Exam Score Simulator".
 *
 * Sliders on the four weakest / highest-weightage blueprint nodes drive a live
 * marks projection (radial gauge), an ROI-sorted bar chart and a dashed-cyan
 * ghost overlay on the Concept Graph. "Lock In Study Plan" turns the simulated
 * targets into a 3-day mission checklist.
 */
export function WhatIfSimulator({ api, onSimulated, onViewMap, onPractice }: WhatIfSimulatorProps) {
  const { effective } = api
  const [open, setOpen] = useState(true)
  const [targets, setTargets] = useState<Partial<Record<ConceptId, number>>>({})
  const [plan, setPlan] = useState<PlanDay[] | null>(null)
  const [done, setDone] = useState<Record<string, boolean>>({})

  /* the four nodes with the biggest unclaimed blueprint marks */
  const candidates = useMemo(
    () =>
      CONCEPTS.map((concept) => ({ concept, mastery: effective[concept.id] }))
        .map((row) => ({ ...row, gapMarks: (1 - row.mastery) * marksPotential(row.concept.id) }))
        .sort((a, b) => b.gapMarks - a.gapMarks)
        .slice(0, 4),
    [effective],
  )

  const simulatedAll = useMemo(() => {
    const map = { ...effective }
    for (const [id, value] of Object.entries(targets)) map[id as ConceptId] = value as number
    return map
  }, [effective, targets])

  const liveScore = projectScore(effective)
  const simScore = projectScore(simulatedAll)
  const delta = simScore - liveScore

  const roiRows = useMemo(
    () =>
      candidates
        .map((row) => {
          const from = row.mastery
          const to = clamp(targets[row.concept.id] ?? from)
          return {
            conceptId: row.concept.id,
            name: row.concept.shortName,
            from,
            to,
            gain: marksPotential(row.concept.id) * Math.max(0, to - from),
            hours: plannedHours(row.concept.id, from, to),
            roi: roiPerHour(row.concept.id, from, to),
          }
        })
        .sort((a, b) => b.roi - a.roi),
    [candidates, targets],
  )

  const maxRoi = roiRows.length > 0 ? Math.max(...roiRows.map((row) => row.roi)) : 1
  const planned = roiRows.filter((row) => row.to - row.from > 0.02)

  /* ghost map handed to the Concept Graph */
  const ghosts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const [id, value] of Object.entries(targets)) {
      const live = effective[id as ConceptId] ?? 0
      if (Math.abs((value as number) - live) > 0.005) map[id] = value as number
    }
    return map as Record<ConceptId, number>
  }, [targets, effective])

  useEffect(() => {
    onSimulated(ghosts)
  }, [ghosts, onSimulated])

  // clear the ghost overlay when the panel unmounts
  useEffect(() => () => onSimulated({}), [onSimulated])

  const autoFill = () => {
    const next: Partial<Record<ConceptId, number>> = {}
    for (const row of candidates) next[row.concept.id] = clamp(Math.max(row.mastery + 0.3, 0.55), 0, 0.95)
    setTargets(next)
  }

  const lockIn = () => {
    if (planned.length === 0) return
    const missions: Mission[] = planned.map((row) => ({
      conceptId: row.conceptId,
      from: row.from,
      to: row.to,
      hours: row.hours,
      marks: row.gain,
      roi: row.roi,
    }))
    setPlan(buildPlan(missions))
    setDone({})
  }

  const resetAll = () => {
    setTargets({})
    setPlan(null)
    setDone({})
  }

  const planGain = plan ? plan.reduce((sum, day) => sum + day.marks, 0) : 0
  const firstMission = plan ? plan.flatMap((day) => day.missions)[0] : null

  return (
    <div className="glass overflow-hidden">
      {/* header / collapse toggle */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
          <TrendingUp className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold text-white">Mission Trajectory · What-If Score Simulator</span>
            <span className="chip border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">CBSE Blueprint ROI Optimizer</span>
          </span>
          <span className="mono mt-0.5 block text-[11px] text-slate-500">
            live {liveScore.toFixed(1)} / {BOARD_SCORE_BASE}
            {Math.abs(delta) > 0.05 && (
              <span className={delta >= 0 ? ' text-[#10B981]' : ' text-[#EF4444]'}>
                {' '}→ {simScore.toFixed(1)} / {BOARD_SCORE_BASE}
              </span>
            )}
          </span>
        </span>
        <span className="mono hidden shrink-0 text-right sm:block">
          <span className="block text-[9px] uppercase tracking-[0.2em] text-slate-500">Simulated</span>
          <span className="text-lg font-bold text-white">{simScore.toFixed(1)}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-white/[0.06] p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(250px,320px),1fr]">
            {/* gauge column */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#070B13]/60 p-4">
              <ScoreGauge current={liveScore} simulated={simScore} max={BOARD_SCORE_BASE} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-2 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Current</div>
                  <div className="mono text-[15px] font-bold text-slate-300">{liveScore.toFixed(1)}</div>
                </div>
                <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/[0.07] px-2 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#A7F3D0]">Target</div>
                  <div className="mono text-[15px] font-bold text-[#10B981]">{simScore.toFixed(1)}</div>
                </div>
              </div>
              <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500">
                Marks-weighted across all nine nodes ({BLUEPRINT_TOTAL} board-marks blueprint basis, projected to the{' '}
                {BOARD_SCORE_BASE}-mark paper).
              </p>
            </div>

            {/* sliders + ROI */}
            <div className="space-y-4">
              <div>
                <div className="section-label mb-2 flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-[#00F0FF]" /> Top 4 weakest / highest-weightage nodes
                </div>
                <div className="space-y-3">
                  {candidates.map((row) => {
                    const live = row.mastery
                    const value = targets[row.concept.id] ?? live
                    const gain = marksPotential(row.concept.id) * Math.max(0, value - live)
                    const percent = Math.round(value * 100)
                    return (
                      <div key={row.concept.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-200">
                            {row.concept.shortName}
                            <span className="chip mono border-white/10 !px-1.5 !py-0.5 text-[9px] text-slate-400">
                              {BLUEPRINT_MARKS[row.concept.id]} marks
                            </span>
                          </span>
                          <span className="mono flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500">{pct(live)}</span>
                            <span className="text-slate-600">→</span>
                            <span className="font-bold text-[#00F0FF]">{pct(value)}</span>
                            {gain > 0.05 && (
                              <span className="rounded-md bg-[#10B981]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#10B981]">
                                +{gain.toFixed(1)}
                              </span>
                            )}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={percent}
                          onChange={(event) =>
                            setTargets((prev) => ({ ...prev, [row.concept.id]: Number(event.target.value) / 100 }))
                          }
                          className="neon-range mt-3"
                          style={{
                            background: `linear-gradient(90deg, #00F0FF ${percent}%, var(--track) ${percent}%)`,
                          }}
                          aria-label={`${row.concept.shortName} simulated mastery`}
                        />
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600">
                          <span>live {pct(live)}</span>
                          <span className="mono">{row.concept.formula}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="section-label mb-2 flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-[#F59E0B]" /> Marks gained per study hour (ROI)
                </div>
                <div className="space-y-2.5">
                  {roiRows.map((row, index) => (
                    <div key={row.conceptId}>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {index === 0 && (
                            <span className="badge-pulse-cyan inline-flex shrink-0 items-center gap-1 rounded-full border border-[#00F0FF]/60 bg-[#00F0FF]/12 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#00F0FF]">
                              <Crown className="h-2.5 w-2.5" /> #1 ROI
                            </span>
                          )}
                          <span className="truncate font-semibold text-slate-300">{row.name}</span>
                        </span>
                        <span className="mono shrink-0 font-bold text-[#00F0FF]">
                          {row.roi.toFixed(2)}
                          <span className="ml-1 text-[9px] text-slate-500">marks/h</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${maxRoi > 0 ? (row.roi / maxRoi) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, #00F0FF, #10B981)',
                            boxShadow: '0 0 10px -1px rgba(0,240,255,0.8)',
                            transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)',
                          }}
                        />
                      </div>
                      <div className="mono mt-0.5 text-[10px] text-slate-600">
                        +{row.gain.toFixed(1)} marks planned · {row.hours.toFixed(1)} h effort
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={lockIn}
                  disabled={planned.length === 0}
                  className="btn btn-primary sweep-host"
                >
                  <Lock className="h-3.5 w-3.5" /> Lock In Study Plan
                </button>
                <button type="button" onClick={autoFill} className="btn">
                  <Sparkles className="h-3.5 w-3.5" /> Auto-fill best plan
                </button>
                <button type="button" onClick={resetAll} className="btn">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to Live Mastery
                </button>
                <button type="button" onClick={onViewMap} className="btn">
                  <Map className="h-3.5 w-3.5" /> Preview on Concept Graph
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500">
                {planned.length === 0
                  ? 'Drag a slider above to simulate a target, then lock the plan in.'
                  : `${planned.length} node${planned.length === 1 ? '' : 's'} in the simulation · ghost targets are previewed on the Concept Graph as dashed cyan rings.`}
              </p>
            </div>
          </div>

          {/* locked 3-day mission checklist */}
          {plan && (
            <div className="mt-4 rounded-2xl border border-[#10B981]/25 bg-[#10B981]/[0.05] p-3.5 ocr-line-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#10B981]/35 bg-[#10B981]/12 text-[#10B981]">
                    <Lock className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[13px] font-bold text-white">3-Day Mission Checklist locked in</div>
                    <div className="text-[10px] text-slate-500">
                      Converted from your simulated targets · +{planGain.toFixed(1)} marks projected
                    </div>
                  </div>
                </div>
                {firstMission && (
                  <button
                    type="button"
                    onClick={() => onPractice(firstMission.conceptId)}
                    className="btn border-[#10B981]/40 bg-[#10B981]/12 text-[#A7F3D0]"
                  >
                    <Play className="h-3.5 w-3.5" /> Start Day 1 mission
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {plan.map((day) => (
                  <div key={day.day} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#00F0FF]">
                        Day {day.day}
                      </span>
                      <span className="mono text-[10px] text-slate-500">
                        {day.hours.toFixed(1)} h · +{day.marks.toFixed(1)} marks
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {day.missions.length === 0 ? (
                        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[10px] text-slate-500">
                          Free slot — run a Revision Radar sweep on due nodes.
                        </p>
                      ) : (
                        day.missions.map((mission) => {
                          const key = `${day.day}-${mission.conceptId}`
                          const isDone = !!done[key]
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setDone((prev) => ({ ...prev, [key]: !prev[key] }))}
                              className={`flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                                isDone
                                  ? 'border-[#10B981]/30 bg-[#10B981]/[0.06]'
                                  : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'
                              }`}
                            >
                              <span
                                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  isDone ? 'border-[#10B981] bg-[#10B981]/20 text-[#10B981]' : 'border-white/20 text-transparent'
                                }`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </span>
                              <span className="min-w-0">
                                <span
                                  className={`block text-[11px] font-semibold ${
                                    isDone ? 'text-slate-500 line-through' : 'text-slate-200'
                                  }`}
                                >
                                  {CONCEPT_MAP[mission.conceptId].shortName}
                                </span>
                                <span className="mono block text-[10px] text-slate-500">
                                  {pct(mission.from)} → {pct(mission.to)} · {mission.hours.toFixed(1)} h · +
                                  {mission.marks.toFixed(1)} marks
                                </span>
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-[#00F0FF]" /> follow the ROI order — highest yield first
                </span>
                <span>Tick a mission to mark it flown.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useCallback, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Brain,
  Gauge,
  Layers,
  Radar,
  ScanLine,
  Target,
  TrendingUp,
} from 'lucide-react'
import { CONCEPT_MAP, CONCEPTS } from '../../data/concepts'
import { bandOf } from '../../lib/mastery'
import type { PrepPilotsApi } from '../../state/usePrepPilots'
import type { ConceptId } from '../../types'
import { Callout, MasteryRing, SectionHeading, StatTile } from '../Primitives'
import { ConceptGraph } from './ConceptGraph'
import { NodeDrawer } from './NodeDrawer'
import { PracticeStudio } from './PracticeStudio'
import { RetentionRadar } from './RetentionRadar'
import { WhatIfSimulator } from './WhatIfSimulator'

interface StudentCockpitProps {
  api: PrepPilotsApi
}

type FeatureId = 'map' | 'practice' | 'revision'

const FEATURES: { id: FeatureId; label: string; hint: string; Icon: typeof Brain }[] = [
  { id: 'map', label: 'Syllabus Map', hint: 'concept dependency graph', Icon: Brain },
  { id: 'practice', label: 'Practice & X-Ray', hint: 'targeted questions + reasoning scan', Icon: Target },
  { id: 'revision', label: 'Revision Radar', hint: 'spaced-repetition due list', Icon: Radar },
]

/**
 * Student view — the Prep Cockpit.
 * Three working tools: Syllabus Map (concept graph), Practice & X-Ray
 * (targeted questions + reasoning analysis) and the Revision Radar.
 */
export function StudentCockpit({ api }: StudentCockpitProps) {
  const { state, effective, prediction, retention, dueCount, target, flash, rerouteAlerts } = api
  const [openNode, setOpenNode] = useState<ConceptId | null>(null)
  const [feature, setFeature] = useState<FeatureId>('map')
  /** What-If ghost targets surfaced by the score simulator, previewed on the graph */
  const [ghosts, setGhosts] = useState<Partial<Record<ConceptId, number>>>({})

  const handleSimulated = useCallback((next: Partial<Record<ConceptId, number>>) => setGhosts(next), [])

  const masteredCount = CONCEPTS.filter((c) => bandOf(effective[c.id]) === 'mastered').length
  const atRiskCount = prediction.atRiskConceptIds.length
  const weakest = CONCEPT_MAP[target]
  const recentXray = state.xrayLog.slice(0, 6)

  /** jump into practice on a chosen node — used by the graph, radar and reroutes */
  const practiceNode = (id: ConceptId) => {
    api.selectTarget(id)
    setOpenNode(null)
    setFeature('practice')
  }

  return (
    <div className="space-y-4">
      {/* live learner model strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Predicted Score"
          value={`${prediction.percent}%`}
          hint={`${prediction.marksOutOf30}/30 marks · Grade ${prediction.grade}`}
          accent="cyan"
        />
        <StatTile
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Nodes Mastered"
          value={`${masteredCount}/9`}
          hint="mastery ≥ 80% across the graph"
          accent="emerald"
        />
        <StatTile
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="At-Risk Nodes"
          value={atRiskCount}
          hint="mastery below 50%"
          accent="crimson"
        />
        <StatTile
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Due Reviews"
          value={dueCount}
          hint="spaced-repetition decay alerts"
          accent="amber"
        />
        <StatTile
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Answers Logged"
          value={state.totalAnswers}
          hint={state.diagnosticDone ? `diagnostic ${state.diagnosticScore}/6` : 'diagnostic pending'}
          accent="violet"
          className="col-span-2 md:col-span-3 xl:col-span-1"
        />
      </div>

      {!state.diagnosticDone && (
        <Callout
          tone="amber"
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Learner model not calibrated yet"
        >
          Run the <strong>Pre-Flight Diagnostic</strong> from the top bar to seed mastery estimates across all nine nodes —
          until then, every score on this screen is an unverified prior.
        </Callout>
      )}

      {/* recommended target */}
      <div className="glass flex flex-wrap items-center gap-3 p-3.5">
        <MasteryRing value={effective[target]} size={56} stroke={6} />
        <div className="min-w-0 flex-1">
          <div className="section-label flex items-center gap-1.5">
            <Target className="h-3 w-3 text-[#00F0FF]" /> PrepPilots recommendation
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">
            Target locked on {weakest.name}
            <span className="mono ml-2 text-slate-500">{weakest.formula}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">{api.calibrationNote}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rerouteAlerts.length > 0 && (
            <span className="chip border-[#EF4444]/40 bg-[#EF4444]/12 text-[#FCA5A5]">
              <AlertTriangle className="h-3 w-3" /> {rerouteAlerts.length} reroute alert
            </span>
          )}
          <button type="button" onClick={() => practiceNode(target)} className="btn btn-primary sweep-host">
            <Target className="h-3.5 w-3.5" />
            Practise this now
          </button>
        </div>
      </div>

      {/* What-If Exam Score Simulator — CBSE Blueprint ROI Optimizer */}
      <WhatIfSimulator
        api={api}
        onSimulated={handleSimulated}
        onViewMap={() => setFeature('map')}
        onPractice={practiceNode}
      />

      {/* three core student features */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div className="section-label">Student workspace · 3 features</div>
          <span className="mono text-[10px] text-slate-600">
            {state.studentName} · Flight Day {state.currentDay}
          </span>
        </div>

        <div className="glass flex flex-wrap items-stretch gap-1.5 p-1.5">
          {FEATURES.map((f, index) => {
            const active = feature === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeature(f.id)}
                className={`flex min-w-[160px] flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  active ? 'border-[#00F0FF]/45 bg-[#00F0FF]/10' : 'border-transparent hover:bg-white/[0.03]'
                }`}
              >
                <span
                  className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    active ? 'border-[#00F0FF]/40 bg-[#00F0FF]/12 text-[#00F0FF]' : 'border-white/10 text-slate-400'
                  }`}
                >
                  <f.Icon className="h-4 w-4" />
                  <span
                    className={`absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-extrabold ${
                      active ? 'border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#00F0FF]' : 'bd-1 sf-4 tx-3'
                    }`}
                  >
                    {index + 1}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className={`block text-[12.5px] font-bold ${active ? 'text-white' : 'text-slate-300'}`}>
                    {f.label}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">{f.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* feature 1 — syllabus map */}
      {feature === 'map' && (
        <div key="map" className="glass animate-fade-in p-4">
          <SectionHeading
            icon={<Brain className="h-4 w-4" />}
            title="Concept Dependency Graph"
            subtitle="CBSE Class 10 Physics · Electricity & Light — colour-coded live by the learner model"
            action={<span className="chip border-white/10 text-slate-400">click a node to inspect</span>}
          />
          <div className="mt-4">
            <ConceptGraph
              effective={effective}
              target={target}
              flash={flash}
              simulated={ghosts}
              onSelect={(id) => setOpenNode(id)}
            />
          </div>
        </div>
      )}

      {/* feature 2 — practice + reasoning X-Ray */}
      {feature === 'practice' && (
        <div key="practice" className="grid animate-fade-in grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PracticeStudio api={api} />
          </div>

          <div className="glass p-4">
            <SectionHeading
              icon={<ScanLine className="h-4 w-4" />}
              title="X-Ray Diagnosis Log"
              subtitle="most recent reasoning analyses"
            />
            <div className="mt-3 space-y-2">
              {recentXray.length === 0 ? (
                <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-[12px] text-slate-500">
                  No reasoning analysed yet. Every submission is scanned for the exact flawed mental model behind it.
                </p>
              ) : (
                recentXray.map((finding) => {
                  const concept = CONCEPT_MAP[finding.conceptId]
                  const correct = finding.optionCorrect
                  const tone = correct
                    ? finding.verdict === 'sound'
                      ? 'border-[#10B981]/30 bg-[#10B981]/[0.06]'
                      : 'border-[#F59E0B]/30 bg-[#F59E0B]/[0.06]'
                    : 'border-[#EF4444]/30 bg-[#EF4444]/[0.06]'
                  return (
                    <div key={finding.id} className={`rounded-xl border p-2.5 ${tone}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-slate-200">{concept.shortName}</span>
                        <span className="mono shrink-0 text-[10px] text-slate-500">day {finding.day}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] italic text-slate-400">“{finding.excerpt}”</p>
                      <div className="mono mt-1.5 flex items-center gap-2 text-[10px]">
                        <span className={correct ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                          {correct ? 'correct' : 'wrong'}
                        </span>
                        <span className="text-slate-600">{finding.verdict}</span>
                        {finding.misconceptionId && <span className="text-[#FCA5A5]">flaw tagged</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="section-label">How the X-Ray reads you</div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Pick the option, then write your reasoning. PrepPilots matches your words against the exact
                misconception triggers for {weakest.shortName} — so a lucky guess and a real understanding are
                never scored the same.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* feature 3 — revision radar */}
      {feature === 'revision' && (
        <div key="revision" className="grid animate-fade-in grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RetentionRadar retention={retention} onSimulateDays={() => api.simulateDays(3)} onPractice={practiceNode} />
          </div>

          <div className="glass p-4">
            <SectionHeading
              icon={<Radar className="h-4 w-4" />}
              title="Revision queue"
              subtitle={`${dueCount} node${dueCount === 1 ? '' : 's'} due right now`}
            />
            <div className="mt-3 space-y-2">
              {retention.map((row) => {
                const concept = CONCEPT_MAP[row.conceptId]
                const statusTone =
                  row.status === 'due'
                    ? 'border-[#F59E0B]/35 bg-[#F59E0B]/[0.06]'
                    : row.status === 'soon'
                      ? 'border-[#00F0FF]/25 bg-[#00F0FF]/[0.04]'
                      : 'border-white/[0.06] bg-white/[0.02]'
                return (
                  <div key={row.conceptId} className={`rounded-xl border p-2.5 ${statusTone}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-slate-200">{concept.shortName}</span>
                      <span className="mono shrink-0 text-[10px] text-slate-500">
                        {row.status === 'due' ? 'due now' : row.status === 'soon' ? 'due soon' : `in ${row.daysUntilDue}d`}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="mono text-[10px] text-slate-500">
                        retention {Math.round(row.retention * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => practiceNode(row.conceptId)}
                        className="text-[10px] font-bold text-[#00F0FF] transition hover:opacity-80"
                      >
                        Revise →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <NodeDrawer
        conceptId={openNode}
        nodes={state.nodes}
        effective={effective}
        day={state.currentDay}
        onClose={() => setOpenNode(null)}
        onPractice={practiceNode}
        onJump={(id) => setOpenNode(id)}
      />
    </div>
  )
}

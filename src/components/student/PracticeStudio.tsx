import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BookMarked,
  CheckCircle2,
  Gauge,
  Loader2,
  PenLine,
  RefreshCw,
  ScanLine,
  Send,
  Target,
  WifiOff,
} from 'lucide-react'
import { CONCEPT_MAP } from '../../data/concepts'
import { reasoningChips } from '../../lib/xray'
import { BAND_META, bandOf, pct } from '../../lib/mastery'
import type { PrepPilotsApi } from '../../state/usePrepPilots'
import type { Difficulty } from '../../types'
import { BandPill, Callout, SectionHeading } from '../Primitives'
import { RoughWorkAuditor } from './RoughWorkAuditor'
import { XRayCard } from './XRayCard'

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'Easy', label: 'Easy', hint: '< 45% mastery' },
  { id: 'Medium', label: 'Medium', hint: '45–75% mastery' },
  { id: 'Hard', label: 'Hard', hint: '> 75% mastery' },
]

interface PracticeStudioProps {
  api: PrepPilotsApi
}

/**
 * Module 4 + 5 — Targeted Question Studio with difficulty calibration and the
 * mandatory reasoning workflow that feeds the Reasoning X-Ray.
 */
export function PracticeStudio({ api }: PracticeStudioProps) {
  const { question, difficulty, calibrationNote, genStatus, lastResult, effective } = api
  const [selected, setSelected] = useState<number | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [phase, setPhase] = useState<'answering' | 'reviewed'>('answering')
  const [reasonTab, setReasonTab] = useState<'reasoning' | 'rough'>('reasoning')

  // reset the local interaction whenever a new question is loaded
  useEffect(() => {
    setSelected(null)
    setReasoning('')
    setPhase('answering')
  }, [question.id])

  const concept = CONCEPT_MAP[question.conceptId]
  const mastery = effective[question.conceptId]
  const chips = useMemo(() => reasoningChips(question), [question])
  const ready = selected !== null && reasoning.trim().length > 0

  const handleSubmit = () => {
    if (!ready || selected === null) return
    api.submitAnswer(question, selected, reasoning)
    setPhase('reviewed')
  }

  const handleNext = () => {
    api.clearResult()
    api.nextQuestion()
  }

  return (
    <div className="glass p-4">
      <SectionHeading
        icon={<Target className="h-4 w-4" />}
        title="Targeted Practice Studio"
        subtitle={`Auto-targeting weakest node → ${concept.name}`}
        action={
          <span className="chip border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
            <Target className="h-3 w-3" />
            {concept.shortName} · {pct(mastery)}
          </span>
        }
      />

      {phase === 'reviewed' && lastResult ? (
        <div className="mt-3.5">
          <XRayCard result={lastResult} onNext={handleNext} />
        </div>
      ) : (
        <div className="mt-3.5">
          {/* calibration bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Gauge className="h-3.5 w-3.5 text-[#00F0FF]" /> Calibrated difficulty
            </span>
            <div className="flex items-center gap-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => api.setDifficulty(d.id)}
                  title={d.hint}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                    difficulty === d.id
                      ? 'border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#bff9ff]'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <span className="mono ml-auto text-[10px] text-slate-500">{calibrationNote}</span>
          </div>

          {/* question card */}
          <div className="mt-3 rounded-2xl border border-white/[0.07] bg-[#070B13]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="mono chip border-white/10 text-slate-400">{concept.formula}</span>
                <BandPill mastery={mastery} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`chip ${
                    question.source === 'Generated Set'
                      ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/12 text-[#C4B5FD]'
                      : 'border-white/10 text-slate-400'
                  }`}
                >
                  <BookMarked className="h-3 w-3" />
                  {question.source}
                </span>
                <button
                  type="button"
                  onClick={() => api.requestFreshQuestion()}
                  disabled={genStatus === 'loading'}
                  className="btn sweep-host border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#C4B5FD] hover:text-white"
                >
                  {genStatus === 'loading' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Generate Fresh Question
                </button>
              </div>
            </div>

            {genStatus === 'offline' && (
              <div className="mt-2.5">
                <Callout tone="violet" icon={<WifiOff className="h-3.5 w-3.5" />} title="Offline set engaged">
                  The question service did not respond, so PrepPilots served an authentic NCERT item from the built-in
                  Class 10 Physics bank. Practice never stops.
                </Callout>
              </div>
            )}
            {genStatus === 'server' && (
              <div className="mt-2.5">
                <Callout tone="violet" icon={<RefreshCw className="h-3.5 w-3.5" />} title="Fresh question loaded">
                  A brand-new item was authored on demand for your calibrated level.
                </Callout>
              </div>
            )}

            <h3 className="text-balance mt-3.5 text-[15px] font-semibold leading-relaxed text-slate-100">
              {question.stem}
            </h3>

            <div className="mt-3.5 space-y-2">
              {question.options.map((option, index) => {
                const active = selected === index
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] transition ${
                      active
                        ? 'border-[#00F0FF]/60 bg-[#00F0FF]/10 text-white'
                        : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span
                      className={`mono inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${
                        active ? 'border-[#00F0FF]/60 bg-[#00F0FF]/20 text-[#00F0FF]' : 'border-white/10 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                )
              })}
            </div>

            {/* reasoning OR rough-work upload */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'reasoning', label: 'Show Your Reasoning', Icon: PenLine },
                    { id: 'rough', label: 'Snap / Upload Rough Work', Icon: ScanLine },
                  ] as const
                ).map((tab) => {
                  const active = reasonTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReasonTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition ${
                        active
                          ? 'border-[#00F0FF]/45 bg-[#00F0FF]/10 text-[#bff9ff]'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <tab.Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
                <span className="text-[10px] text-slate-600">
                  {reasonTab === 'reasoning'
                    ? 'the X-Ray reads your thinking, not just the option'
                    : 'OCR your handwritten steps — signed into the Learner Model'}
                </span>
              </div>

              {reasonTab === 'reasoning' ? (
                <div className="mt-2.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Show Your Reasoning / Why?
                    <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    rows={3}
                    placeholder="Explain which law/formula you applied and why your option follows from it."
                    className="field mt-1.5 resize-none"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Quick-fill:</span>
                    {chips.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setReasoning(chip.text)}
                        className={`chip chip-action ${
                          chip.kind === 'flawed'
                            ? 'border-[#EF4444]/30 text-[#FCA5A5]'
                            : chip.kind === 'sound'
                              ? 'border-[#10B981]/30 text-[#A7F3D0]'
                              : 'border-white/10'
                        }`}
                        title={chip.text}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2.5">
                  <RoughWorkAuditor api={api} />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                {selected === null
                  ? 'Select an option'
                  : reasoning.trim()
                    ? 'Ready for X-Ray analysis'
                    : reasonTab === 'rough'
                      ? 'Audit the flaw above, then type your reasoning to submit'
                      : 'Reasoning is mandatory'}
              </span>
              <button type="button" onClick={handleSubmit} disabled={!ready} className="btn btn-primary sweep-host px-5 py-2.5">
                {ready ? <Send className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit for X-Ray
              </button>
            </div>
          </div>
        </div>
      )}

      {/* quantum of evidence */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Activity className="h-3 w-3 text-[#00F0FF]" /> Weighted Elo/BKT engine
        </span>
        <span>K: Easy 0.22 · Medium 0.30 · Hard 0.38</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: BAND_META[bandOf(mastery)].hex }} />
          band {BAND_META[bandOf(mastery)].label}
        </span>
        <span className="ml-auto">Total answers logged: {api.state.totalAnswers}</span>
      </div>
    </div>
  )
}

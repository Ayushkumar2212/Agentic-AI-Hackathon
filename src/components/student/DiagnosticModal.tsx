import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, Gauge, Stethoscope, Target, X } from 'lucide-react'
import { CONCEPT_MAP } from '../../data/concepts'
import { reasoningChips } from '../../lib/xray'
import { pct } from '../../lib/mastery'
import type { ConceptId, Question } from '../../types'

interface DiagnosticModalProps {
  questions: Question[]
  onSubmit: (answers: { conceptId: ConceptId; correct: boolean }[]) => void
  onClose: () => void
  alreadyDone: boolean
  previousScore: number
}

/**
 * Module 1 — Pre-Flight Calibration.
 * A 6-question calibration quiz over the foundational nodes. Submitting seeds the
 * entire learner model (mastery estimate for every node in the graph).
 */
export function DiagnosticModal({ questions, onSubmit, onClose, alreadyDone, previousScore }: DiagnosticModalProps) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null))
  const [reasoning, setReasoning] = useState<string[]>(() => questions.map(() => ''))
  const [finished, setFinished] = useState(false)

  const question = questions[step]
  const chips = useMemo(() => reasoningChips(question), [question])
  const isLast = step === questions.length - 1
  const answered = selected[step] !== null && reasoning[step].trim().length > 0

  const score = useMemo(
    () => questions.reduce((sum, q, i) => sum + (selected[i] === q.correctIndex ? 1 : 0), 0),
    [questions, selected],
  )

  const submit = () => {
    onSubmit(questions.map((q, i) => ({ conceptId: q.conceptId, correct: selected[i] === q.correctIndex })))
    setFinished(true)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md animate-fade-in">
      <div className="glass-strong my-auto w-full max-w-2xl overflow-hidden animate-rise">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
              <Stethoscope className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Pre-Flight Calibration</h2>
              <p className="text-[11px] text-slate-500">
                Diagnostic · seeds mastery across all 9 concept nodes
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn border-white/10 px-2 py-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {finished ? (
          <div className="p-6 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]">
              <Gauge className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Learner Model Initialised</h3>
            <p className="mt-1.5 text-[13px] text-slate-400">
              Calibration score <span className="mono font-bold text-[#00F0FF]">{score}/{questions.length}</span> · mastery
              estimates have been written to all 9 nodes, and the lowest-mastery node is now your recommended target.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
              {questions.map((q, i) => {
                const correct = selected[i] === q.correctIndex
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-2.5 ${
                      correct ? 'border-[#10B981]/30 bg-[#10B981]/[0.07]' : 'border-[#EF4444]/30 bg-[#EF4444]/[0.07]'
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {CONCEPT_MAP[q.conceptId].shortName}
                    </div>
                    <div className={`mt-1 text-[12px] font-bold ${correct ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {correct ? 'On track' : 'Needs work'}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Target className="h-3.5 w-3.5 text-[#00F0FF]" />
              Personalised recommendations unlocked
            </div>
            <button type="button" onClick={onClose} className="btn btn-primary sweep-host mt-5 w-full py-2.5">
              <CheckCircle2 className="h-4 w-4" />
              Enter Prep Cockpit
            </button>
          </div>
        ) : (
          <>
            {/* progress dots */}
            <div className="flex items-center gap-1.5 px-4 pt-3">
              {questions.map((q, i) => (
                <span
                  key={q.id}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    i < step ? 'bg-[#10B981]' : i === step ? 'bg-[#00F0FF]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="p-4">
              {alreadyDone && step === 0 && (
                <div className="mb-3 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/[0.08] px-3 py-2 text-[11px] text-[#FCD9A0]">
                  You already calibrated at {pct(previousScore / questions.length)} accuracy — re-running will rewrite the
                  model from scratch.
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="section-label">
                  Question {step + 1} / {questions.length}
                </div>
                <span className="chip border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD]">
                  {CONCEPT_MAP[question.conceptId].shortName}
                </span>
              </div>

              <h3 className="text-balance mt-3 text-[15px] font-semibold leading-relaxed text-slate-100">{question.stem}</h3>

              <div className="mt-3.5 space-y-2">
                {question.options.map((option, index) => {
                  const active = selected[step] === index
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelected((prev) => prev.map((v, i) => (i === step ? index : v)))}
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

              {/* mandatory reasoning */}
              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Why? — show your reasoning
                  <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  value={reasoning[step]}
                  onChange={(e) => setReasoning((prev) => prev.map((v, i) => (i === step ? e.target.value : v)))}
                  rows={2}
                  placeholder="One line of Physics: which law or formula led you to this option?"
                  className="field mt-1.5 resize-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setReasoning((prev) => prev.map((v, i) => (i === step ? chip.text : v)))}
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
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] p-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="btn"
              >
                Back
              </button>
              {isLast ? (
                <button type="button" onClick={submit} disabled={!answered} className="btn btn-primary sweep-host px-5">
                  <Gauge className="h-4 w-4" />
                  Calibrate Learner Model
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
                  disabled={!answered}
                  className="btn btn-primary sweep-host px-5"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

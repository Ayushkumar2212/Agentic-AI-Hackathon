import { CheckCircle2, Lightbulb, ScanLine, Timer, XCircle, Zap } from 'lucide-react'
import { MISCONCEPTION_MAP } from '../../data/misconceptions'
import { VERDICT_META } from '../../lib/xray'
import type { SubmissionResult } from '../../types'
import { DeltaBadge } from '../Primitives'

const TONE = {
  good: { border: 'border-[#10B981]/35', bg: 'bg-[#10B981]/[0.07]', text: 'text-[#10B981]', chip: 'bg-[#10B981]/15 border-[#10B981]/40' },
  warn: { border: 'border-[#F59E0B]/35', bg: 'bg-[#F59E0B]/[0.07]', text: 'text-[#F59E0B]', chip: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' },
  bad: { border: 'border-[#EF4444]/35', bg: 'bg-[#EF4444]/[0.07]', text: 'text-[#EF4444]', chip: 'bg-[#EF4444]/15 border-[#EF4444]/40' },
  muted: { border: 'border-white/12', bg: 'bg-white/[0.03]', text: 'text-slate-400', chip: 'bg-white/[0.06] border-white/12' },
} as const

interface XRayCardProps {
  result: SubmissionResult
  onNext: () => void
}

/**
 * Module 5 — Misconception X-Ray Card.
 * Breaks down the exact flaw in the learner's written reasoning and pairs it with
 * a 30-second visual/formula micro-lesson.
 */
export function XRayCard({ result, onNext }: XRayCardProps) {
  const { xray, correct, delta } = result
  const verdictMeta = VERDICT_META[xray.verdict]
  const tone = TONE[verdictMeta.tone]
  const misconception = xray.misconceptionId ? MISCONCEPTION_MAP[xray.misconceptionId] : null

  return (
    <div className={`overflow-hidden rounded-2xl border ${tone.border} ${tone.bg} animate-rise`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${tone.chip} ${tone.text}`}>
            <ScanLine className="h-4 w-4" />
          </span>
          <div>
            <div className="section-label">Reasoning X-Ray</div>
            <div className={`text-[13px] font-bold ${tone.text}`}>{verdictMeta.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {correct ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#10B981]/40 bg-[#10B981]/12 px-2 py-1 text-[11px] font-bold text-[#10B981]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Correct option
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/12 px-2 py-1 text-[11px] font-bold text-[#EF4444]">
              <XCircle className="h-3.5 w-3.5" /> Wrong option
            </span>
          )}
          <DeltaBadge delta={delta} />
        </div>
      </div>

      <div className="p-4">
        <p className="text-[12px] leading-relaxed text-slate-300">{verdictMeta.blurb}</p>

        {/* the learner's own words */}
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#070B13]/70 p-3">
          <div className="section-label mb-1.5">Your reasoning</div>
          <p className="text-[12px] italic leading-relaxed text-slate-400">
            “{xray.excerpt || 'No reasoning was recorded.'}”
          </p>
          <div className="mono mt-2 flex items-center gap-2 text-[10px] text-slate-600">
            <span>{xray.excerpt.trim().split(/\s+/).filter(Boolean).length} words analysed</span>
            <span>·</span>
            <span>confidence {Math.round(xray.confidence * 100)}%</span>
            <span>·</span>
            <span>{xray.difficulty} level</span>
          </div>
        </div>

        {misconception && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="chip border-[#EF4444]/40 bg-[#EF4444]/12 text-[#FCA5A5]">{misconception.topic}</span>
              <span className="chip border-[#EF4444]/40 bg-[#EF4444]/12 text-[#FCA5A5]">misconception detected</span>
            </div>
            <h4 className="text-balance mt-2.5 text-[14px] font-bold text-[#FCA5A5]">{misconception.label}</h4>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/[0.06] p-3">
                <div className="section-label mb-1 text-[#FCA5A5]">The exact flaw</div>
                <p className="text-[12px] leading-relaxed text-slate-300">{misconception.flaw}</p>
              </div>
              <div className="rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.06] p-3">
                <div className="section-label mb-1 text-[#A7F3D0]">The correct frame</div>
                <p className="text-[12px] leading-relaxed text-slate-300">{misconception.correctFrame}</p>
              </div>
            </div>

            <div className="mono mt-2.5 flex items-center gap-2 rounded-xl border border-[#00F0FF]/25 bg-[#00F0FF]/[0.06] px-3 py-2 text-[13px] font-bold text-[#00F0FF]">
              <Zap className="h-4 w-4" />
              {misconception.formula}
            </div>

            {/* 30-second micro-lesson */}
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/35 bg-[#8B5CF6]/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]">
                  <Timer className="h-3 w-3" /> 30-second micro-lesson
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Lightbulb className="h-3 w-3 text-[#F59E0B]" /> fix this before the next numerical
                </span>
              </div>
              <ol className="space-y-2">
                {misconception.microLesson.map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="mono mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#8B5CF6]/35 bg-[#8B5CF6]/12 text-[10px] font-bold text-[#C4B5FD]">
                      {index + 1}
                    </span>
                    <span className="text-[12px] leading-relaxed text-slate-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {!misconception && xray.verdict === 'sound' && (
          <div className="mt-3 rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.06] p-3">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#A7F3D0]">
              <CheckCircle2 className="h-4 w-4" /> Clean reasoning — mastery credited in full
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              Your explanation matched the underlying law, so the learner model credited the node with the full
              difficulty-weighted gain.
            </p>
          </div>
        )}

        {!misconception && xray.verdict === 'thin' && (
          <div className="mt-3 rounded-xl border border-white/[0.1] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-slate-400">
            Your answer was recorded, but the model applied a reduced learning weight because no Physics reasoning was
            supplied. Write one line — the law you used and why — to earn full mastery credit.
          </div>
        )}

        <button type="button" onClick={onNext} className="btn btn-primary sweep-host mt-4 w-full py-2.5">
          <Zap className="h-4 w-4" />
          Next Calibrated Question
        </button>
      </div>
    </div>
  )
}

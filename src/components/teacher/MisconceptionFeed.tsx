import { useMemo, useState } from 'react'
import { Check, Copy, Download, FileText, ShieldAlert, Target, UserCheck, X } from 'lucide-react'
import {
  buildRemedialPlan,
  remedialPlanToText,
  type MisconceptionFeedRow,
  type RemedialPlan,
} from '../../lib/classModel'
import { CONCEPT_MAP } from '../../data/concepts'
import { pct } from '../../lib/mastery'
import type { ClassStudent, ConceptStat } from '../../types'
import { SectionHeading } from '../Primitives'

interface MisconceptionFeedProps {
  feed: MisconceptionFeedRow[]
  stats: ConceptStat[]
  students: ClassStudent[]
}

/**
 * Module 7.2 — Top Class Misconceptions Feed + "Generate Class Remedial Sheet".
 * Aggregates the reasoning errors detected across the cohort into a printable plan.
 */
export function MisconceptionFeed({ feed, stats, students }: MisconceptionFeedProps) {
  const [plan, setPlan] = useState<RemedialPlan | null>(null)
  const [copied, setCopied] = useState(false)

  const topFeed = useMemo(() => feed.slice(0, 8), [feed])

  const generate = () => {
    setCopied(false)
    setPlan(buildRemedialPlan(stats, feed, students))
  }

  const planText = useMemo(() => (plan ? remedialPlanToText(plan) : ''), [plan])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const download = () => {
    const blob = new Blob([planText], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'preppilots-class-remedial-sheet.md'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="glass flex flex-col p-4">
      <SectionHeading
        icon={<ShieldAlert className="h-4 w-4" />}
        title="Top Class Misconceptions Feed"
        subtitle="reasoning-level errors aggregated across the cohort"
        action={
          <button type="button" onClick={generate} className="btn btn-primary sweep-host">
            <FileText className="h-3.5 w-3.5" />
            Generate Class Remedial Sheet
          </button>
        }
      />

      <div className="mt-3.5 max-h-[380px] space-y-2 overflow-y-auto pr-1">
        {topFeed.length === 0 && (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-[12px] text-slate-500">
            No recurring reasoning errors detected across the class yet.
          </p>
        )}
        {topFeed.map((row, index) => {
          const concept = CONCEPT_MAP[row.conceptId]
          const studentsWithIt = Math.round(row.share * students.length)
          return (
            <div
              key={row.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-[#EF4444]/30 hover:bg-white/[0.04]"
            >
              <div className="flex items-start gap-2.5">
                <span className="mono mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#EF4444]/35 bg-[#EF4444]/12 text-[10px] font-bold text-[#FCA5A5]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[12px] font-bold text-slate-100">{row.label}</span>
                    {row.liveFlag && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-[#00F0FF]">
                        your student
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                    <span className="chip border-white/10 px-2 py-0">{row.topic}</span>
                    <span>{concept.shortName}</span>
                    <span className="mono">·</span>
                    <span className="mono text-[#FCA5A5]">{studentsWithIt}/{students.length} students</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="mono text-sm font-bold text-[#FCA5A5]">{pct(row.share)}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-600">of class</div>
                </div>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#EF4444] to-[#F59E0B]"
                  style={{ width: `${Math.max(6, row.share * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* remedial sheet modal */}
      {plan && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="glass-strong my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden animate-rise">
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-4">
              <div className="flex items-start gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Class Remedial Sheet — {plan.className}</h3>
                  <p className="text-[11px] text-slate-500">
                    {plan.generatedAt} · {plan.strength} students · {plan.touchpoints}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setPlan(null)} className="btn border-white/10 px-2 py-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="section-label mb-2 flex items-center gap-1.5">
                <Target className="h-3 w-3 text-[#00F0FF]" /> Part 1 — Bottleneck concept repair
              </div>
              <div className="space-y-3">
                {plan.sections.map((section, index) => (
                  <div key={section.conceptId} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-white">
                        {index + 1}. {section.name}
                      </span>
                      <span className="mono text-[11px] text-[#00F0FF]">{section.formula}</span>
                    </div>
                    <div className="mono mt-1 text-[10px] text-slate-500">
                      class avg {pct(section.classAverage)} · {Math.round(section.stuckRatio * 100)}% of the class below 50%
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                      <span className="font-semibold text-[#A7F3D0]">Reframe: </span>
                      {section.reframe}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {section.keyIdeas.map((idea) => (
                        <li key={idea} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#00F0FF]" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2.5 space-y-2">
                      {section.drills.map((drill, i) => (
                        <div key={drill.prompt} className="rounded-lg border border-white/[0.06] bg-[#070B13]/60 p-2.5">
                          <div className="text-[11px] font-semibold text-slate-200">
                            Q{i + 1}. {drill.prompt}
                          </div>
                          <div className="mono mt-1 text-[11px] text-[#A7F3D0]">Ans: {drill.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-label mb-2 mt-4 flex items-center gap-1.5">
                <UserCheck className="h-3 w-3 text-[#F59E0B]" /> Part 2 — Misconception de-brief (reasoning level)
              </div>
              <div className="space-y-2">
                {plan.misconceptionFixes.map((fix, index) => (
                  <div key={fix.id} className="rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/[0.06] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[#FCD9A0]">
                        {index + 1}. {fix.label}
                      </span>
                      <span className="mono shrink-0 text-[10px] font-bold text-[#F59E0B]">{fix.count} students</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{fix.correctFrame}</p>
                    <div className="mono mt-1 text-[11px] text-[#00F0FF]">{fix.formula}</div>
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-200">Homework: </span>
                attempt every drill above, then run a PrepPilots Pre-Flight Calibration to verify the mastery shift.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] p-4">
              <button type="button" onClick={copy} className="btn">
                {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy as Markdown'}
              </button>
              <button type="button" onClick={download} className="btn btn-primary sweep-host">
                <Download className="h-3.5 w-3.5" />
                Download Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

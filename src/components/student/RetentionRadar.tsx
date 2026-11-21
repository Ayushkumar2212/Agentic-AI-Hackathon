import { CalendarPlus, Clock, Radar, RefreshCw, Target } from 'lucide-react'
import { CONCEPT_MAP } from '../../data/concepts'
import { BAND_META, bandOf, pct } from '../../lib/mastery'
import type { RetentionRow } from '../../lib/mastery'
import { dueLabel, intervalLabel } from '../../lib/sm2'
import type { ConceptId } from '../../types'
import { SectionHeading } from '../Primitives'

interface RetentionRadarProps {
  retention: RetentionRow[]
  onSimulateDays: () => void
  onPractice: (id: ConceptId) => void
}

const STATUS_META = {
  due: { label: 'Due for Review', cls: 'border-[#EF4444]/40 bg-[#EF4444]/12 text-[#FCA5A5]' },
  soon: { label: 'Review Soon', cls: 'border-[#F59E0B]/40 bg-[#F59E0B]/12 text-[#FCD9A0]' },
  scheduled: { label: 'Scheduled', cls: 'border-[#10B981]/35 bg-[#10B981]/10 text-[#A7F3D0]' },
} as const

/**
 * Module 6 — Memory Retention Radar.
 * SM-2 spaced-repetition queue with live decay bars. "Simulate +3 Days" pushes the
 * clock so green nodes visibly decay toward amber "due" states.
 */
export function RetentionRadar({ retention, onSimulateDays, onPractice }: RetentionRadarProps) {
  const due = retention.filter((row) => row.status === 'due').length
  const soon = retention.filter((row) => row.status === 'soon').length
  const scheduled = retention.filter((row) => row.status === 'scheduled').length

  return (
    <div className="glass p-4">
      <SectionHeading
        icon={<Radar className="h-4 w-4" />}
        title="Memory Retention Radar"
        subtitle="SM-2 spaced repetition · decay monitored per node"
        action={
          <button type="button" onClick={onSimulateDays} className="btn sweep-host border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#FCD9A0]">
            <CalendarPlus className="h-3.5 w-3.5" />
            +3 Days
          </button>
        }
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/[0.07] px-2.5 py-2">
          <div className="mono text-lg font-bold text-[#EF4444]">{due}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Due now</div>
        </div>
        <div className="rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/[0.07] px-2.5 py-2">
          <div className="mono text-lg font-bold text-[#F59E0B]">{soon}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Review soon</div>
        </div>
        <div className="rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.07] px-2.5 py-2">
          <div className="mono text-lg font-bold text-[#10B981]">{scheduled}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Scheduled</div>
        </div>
      </div>

      <div className="mt-3.5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {retention.map((row) => {
          const concept = CONCEPT_MAP[row.conceptId]
          const status = STATUS_META[row.status]
          const band = BAND_META[bandOf(row.decayed)]
          const retentionRatio = Math.max(0, Math.min(1, row.retention))
          return (
            <div
              key={row.conceptId}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-[#00F0FF]/30 hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-slate-200">{concept.shortName}</span>
                <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.cls}`}>
                  {status.label}
                </span>
              </div>

              {/* decay bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${retentionRatio * 100}%`,
                    background: `linear-gradient(90deg, ${band.hex}, ${band.hex}cc)`,
                    boxShadow: `0 0 10px -2px ${band.hex}`,
                  }}
                />
              </div>

              <div className="mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1" style={{ color: band.hex }}>
                  <Clock className="h-3 w-3" /> {pct(row.decayed)} now
                </span>
                <span>peak {pct(row.mastery)}</span>
                <span className="inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> {intervalLabel(row.interval)} interval
                </span>
                <span>reps {row.reps}</span>
                <span className={row.daysUntilDue <= 0 ? 'text-[#EF4444]' : row.daysUntilDue <= 2 ? 'text-[#F59E0B]' : ''}>
                  {dueLabel(row.daysUntilDue)}
                </span>
                <button
                  type="button"
                  onClick={() => onPractice(row.conceptId)}
                  className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00F0FF] opacity-0 transition group-hover:opacity-100"
                >
                  <Target className="h-3 w-3" /> Review
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

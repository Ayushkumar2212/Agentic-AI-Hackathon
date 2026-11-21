import { AlertTriangle, Flame, Grid3x3 } from 'lucide-react'
import { CONCEPT_MAP } from '../../data/concepts'
import { bandOf, BAND_META, pct } from '../../lib/mastery'
import type { ClassStudent, ConceptStat } from '../../types'
import { SectionHeading } from '../Primitives'

interface MasteryHeatmapProps {
  students: ClassStudent[]
  stats: ConceptStat[]
  bottlenecks: ConceptStat[]
}

/**
 * Module 7.1 — Class-Wide Concept Mastery Heatmap.
 * Rows = the 9 concept nodes, columns = the 35-student cohort. Bottleneck concepts
 * (where > 40% of the class sits below 50%) are flagged and ranked.
 */
export function MasteryHeatmap({ students, stats, bottlenecks }: MasteryHeatmapProps) {
  const bottleneckIds = new Set(bottlenecks.map((b) => b.conceptId))

  return (
    <div className="glass p-4">
      <SectionHeading
        icon={<Grid3x3 className="h-4 w-4" />}
        title="Class-Wide Concept Mastery Heatmap"
        subtitle={`${students.length} students × 9 concepts · live roll #1 is the student in the Cockpit`}
        action={
          <span className="chip border-[#EF4444]/40 bg-[#EF4444]/12 text-[#FCA5A5]">
            <Flame className="h-3 w-3" />
            {bottlenecks.length} bottlenecks
          </span>
        }
      />

      {/* top 3 bottlenecks */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {bottlenecks.map((stat, index) => {
          const concept = CONCEPT_MAP[stat.conceptId]
          return (
            <div
              key={stat.conceptId}
              className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/[0.07] p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="section-label text-[#FCA5A5]">Bottleneck #{index + 1}</span>
                <span className="mono text-[11px] font-bold text-[#EF4444]">{Math.round(stat.stuckRatio * 100)}% stuck</span>
              </div>
              <div className="mt-1 text-[12px] font-bold text-white">{concept.shortName}</div>
              <div className="mono mt-0.5 text-[10px] text-slate-400">
                {concept.formula} · class avg {pct(stat.classAverage)}
              </div>
            </div>
          )
        })}
        {bottlenecks.length === 0 && (
          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/[0.07] p-2.5 sm:col-span-3">
            <div className="text-[12px] font-bold text-[#A7F3D0]">No concept crosses the 40%-stuck threshold right now.</div>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[720px]">
          {/* column headers = students */}
          <div className="flex items-end gap-[3px] pl-[209px]">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex h-6 w-[16px] shrink-0 items-end justify-center rounded-t-sm text-[7px] font-bold ${
                  student.isLive ? 'bg-[#00F0FF]/25 text-[#bff9ff]' : 'text-slate-600'
                }`}
                title={`Roll ${student.rollNo} · ${student.name}`}
              >
                {student.rollNo}
              </div>
            ))}
          </div>

          {stats
            .slice()
            .sort((a, b) => b.stuckRatio - a.stuckRatio)
            .map((stat) => {
              const concept = CONCEPT_MAP[stat.conceptId]
              const isBottleneck = bottleneckIds.has(stat.conceptId)
              return (
                <div key={stat.conceptId} className="mt-[3px] flex items-center gap-[3px]">
                  <div className="flex w-[165px] shrink-0 items-center gap-2 pr-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: isBottleneck ? '#EF4444' : BAND_META[bandOf(stat.classAverage)].hex,
                        boxShadow: `0 0 6px ${isBottleneck ? '#EF4444' : BAND_META[bandOf(stat.classAverage)].hex}`,
                      }}
                    />
                    <span className="truncate text-[11px] font-semibold text-slate-300" title={concept.name}>
                      {concept.shortName}
                    </span>
                    {isBottleneck && (
                      <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded border border-[#EF4444]/40 bg-[#EF4444]/12 px-1 py-px text-[8px] font-bold uppercase text-[#FCA5A5]">
                        <AlertTriangle className="h-2.5 w-2.5" /> stuck
                      </span>
                    )}
                  </div>
                  <span className="mono w-[34px] shrink-0 text-right text-[10px] text-slate-500">
                    {pct(stat.classAverage)}
                  </span>
                  <div className="flex items-center gap-[3px] pl-1">
                    {students.map((student) => {
                      const value = student.mastery[stat.conceptId]
                      const meta = BAND_META[bandOf(value)]
                      return (
                        <div
                          key={student.id}
                          className={`h-[20px] w-[16px] shrink-0 rounded-sm transition hover:scale-125 hover:ring-1 hover:ring-white/40 ${
                            student.isLive ? 'ring-1 ring-[#00F0FF]/70' : ''
                          }`}
                          style={{ background: meta.hex, opacity: 0.28 + value * 0.72 }}
                          title={`${student.name} — ${concept.shortName}: ${pct(value)} (${meta.label})`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

          <div className="mt-3 flex flex-wrap items-center gap-4 pl-[209px] text-[10px] text-slate-500">
            {(['weak', 'developing', 'mastered'] as const).map((band) => (
              <span key={band} className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: BAND_META[band].hex }} />
                {BAND_META[band].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm ring-1 ring-[#00F0FF]/70" /> live learner
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

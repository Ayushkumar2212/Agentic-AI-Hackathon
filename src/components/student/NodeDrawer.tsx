import { ArrowRight, BookOpen, GitBranch, Play, ShieldAlert, Target, X } from 'lucide-react'
import { CONCEPT_MAP } from '../../data/concepts'
import { MISCONCEPTION_MAP } from '../../data/misconceptions'
import { BAND_META, bandOf, pct, prerequisiteStatus } from '../../lib/mastery'
import type { ConceptId, NodeState } from '../../types'
import { BandPill, MasteryRing, ProgressBar } from '../Primitives'

interface NodeDrawerProps {
  conceptId: ConceptId | null
  nodes: Record<ConceptId, NodeState>
  effective: Record<ConceptId, number>
  day: number
  onClose: () => void
  onPractice: (id: ConceptId) => void
  onJump: (id: ConceptId) => void
}

/**
 * Node inspection panel — mastery, prerequisite links, live misconceptions and
 * a one-tap "Practice Node" trigger that retargets the practice engine.
 */
export function NodeDrawer({ conceptId, nodes, effective, day, onClose, onPractice, onJump }: NodeDrawerProps) {
  if (!conceptId) return null
  const concept = CONCEPT_MAP[conceptId]
  const node = nodes[conceptId]
  const mastery = effective[conceptId]
  const band = BAND_META[bandOf(mastery)]
  const prereqs = prerequisiteStatus(nodes, conceptId, day)

  const activeMisconceptions = Object.entries(node.misconceptions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[440px] flex-col border-l border-white/[0.08] bg-[#0B1120]/95 backdrop-blur-2xl animate-rise">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-4">
          <div className="flex items-start gap-3">
            <MasteryRing value={mastery} size={68} stroke={6} />
            <div>
              <div className="section-label">{concept.track} Lane · {concept.chapter}</div>
              <h3 className="text-balance mt-1 text-[15px] font-bold leading-tight text-white">{concept.name}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <BandPill mastery={mastery} />
                <span className="mono text-[11px] text-slate-500">
                  {node.attempts} attempt{node.attempts === 1 ? '' : 's'}
                  {node.attempts > 0 ? ` · ${Math.round((node.correctCount / node.attempts) * 100)}% acc` : ''}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn border-white/10 px-2 py-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <div className="section-label">Anchor formula</div>
            <div className="mono mt-1.5 text-lg font-bold neon-cyan-text">{concept.formula}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{concept.summary}</p>
          </div>

          <div className="mt-4">
            <div className="section-label mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" /> Must-know ideas
            </div>
            <ul className="space-y-1.5">
              {concept.keyIdeas.map((idea) => (
                <li key={idea} className="flex gap-2 text-[12px] leading-relaxed text-slate-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#00F0FF]" />
                  {idea}
                </li>
              ))}
            </ul>
          </div>

          {/* prerequisite links */}
          <div className="mt-5">
            <div className="section-label mb-2 flex items-center gap-1.5">
              <GitBranch className="h-3 w-3" /> Prerequisite links
            </div>
            {prereqs.length === 0 ? (
              <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-slate-500">
                Root concept of the {concept.track} lane — no prerequisites. This is where the dependency chain begins.
              </p>
            ) : (
              <div className="space-y-2">
                {prereqs.map((prereq) => {
                  const parent = CONCEPT_MAP[prereq.conceptId]
                  return (
                    <button
                      key={prereq.conceptId}
                      type="button"
                      onClick={() => onJump(prereq.conceptId)}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition hover:border-[#00F0FF]/40 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-200">
                          {parent.shortName}
                          <ArrowRight className="h-3 w-3 text-slate-500" />
                          <span className="mono text-slate-500">{parent.formula}</span>
                        </span>
                        <span
                          className={`mono rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            prereq.ready ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                          }`}
                        >
                          {pct(prereq.mastery)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={prereq.mastery} tone={prereq.ready ? 'emerald' : 'crimson'} height={4} />
                      </div>
                      {!prereq.ready && (
                        <div className="mt-1.5 text-[10px] font-semibold text-[#EF4444]">
                          Below the 60% readiness gate — retarget here first
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* active misconceptions */}
          <div className="mt-5">
            <div className="section-label mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3" /> Active misconceptions
            </div>
            {activeMisconceptions.length === 0 ? (
              <p className="rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.06] px-3 py-2 text-[12px] text-[#A7F3D0]">
                No reasoning flaw detected on this node yet. The X-Ray will tag one the moment your written reasoning slips.
              </p>
            ) : (
              <div className="space-y-2">
                {activeMisconceptions.map(([id, count]) => {
                  const meta = MISCONCEPTION_MAP[id]
                  return (
                    <div key={id} className="rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/[0.06] p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[12px] font-bold text-[#FCA5A5]">
                          {meta?.label ?? 'Unclassified reasoning gap'}
                        </span>
                        <span className="mono shrink-0 rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-bold text-[#FCA5A5]">
                          ×{count}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {meta?.flaw ?? 'A recurring reasoning gap was detected on this concept.'}
                      </p>
                      {meta?.formula && <div className="mono mt-1.5 text-[11px] text-[#00F0FF]">{meta.formula}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3 w-3 text-[#00F0FF]" />
              Target practice on this node
            </span>
            <span className="mono">
              {band.label} · {pct(mastery)}
            </span>
          </div>
          <button type="button" onClick={() => onPractice(conceptId)} className="btn btn-primary sweep-host w-full py-2.5">
            <Play className="h-4 w-4" />
            Practice Node
          </button>
        </div>
      </aside>
    </>
  )
}

import { useMemo } from 'react'
import { Zap, Lightbulb, Compass, TrendingUp } from 'lucide-react'
import { CONCEPTS, CONCEPT_MAP } from '../../data/concepts'
import { BAND_META, bandOf, pct } from '../../lib/mastery'
import type { ConceptId } from '../../types'
import { DeltaPop } from '../Primitives'

const CANVAS_W = 1000
const CANVAS_H = 560
const NODE_W = 168
const NODE_H = 92

interface ConceptGraphProps {
  effective: Record<ConceptId, number>
  target: ConceptId
  onSelect: (id: ConceptId) => void
  flash: { conceptId: ConceptId; delta: number; nonce: number } | null
  /** What-If ghost targets — rendered as dashed cyan rings over the live nodes */
  simulated?: Partial<Record<ConceptId, number>>
}

interface Edge {
  from: ConceptId
  to: ConceptId
  track: 'Electricity' | 'Optics'
}

/**
 * The Concept Dependency Graph — the syllabus map rendered as a directed acyclic
 * graph. Nodes are colour-coded live by the learner model (Red / Amber / Green).
 */
export function ConceptGraph({ effective, target, onSelect, flash, simulated }: ConceptGraphProps) {
  const edges = useMemo<Edge[]>(() => {
    const list: Edge[] = []
    for (const concept of CONCEPTS) {
      for (const prereq of concept.prerequisites) {
        list.push({ from: prereq, to: concept.id, track: concept.track })
      }
    }
    return list
  }, [])

  const flashNode = flash?.conceptId ?? null

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <div className="relative min-w-[900px]" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
          {/* edges */}
          <svg
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#00F0FF" fillOpacity="0.75" />
              </marker>
              <marker id="arrow-violet" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" fillOpacity="0.85" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const a = CONCEPT_MAP[edge.from]
              const b = CONCEPT_MAP[edge.to]
              const stroke = edge.track === 'Electricity' ? '#00F0FF' : '#8B5CF6'
              const marker = edge.track === 'Electricity' ? 'url(#arrow-cyan)' : 'url(#arrow-violet)'
              // trim the endpoints so the arrow lands on the node border, not its centre
              const dx = b.x - a.x
              const length = Math.hypot(dx, b.y - a.y) || 1
              const pad = NODE_W / 2 + 10
              const sx = a.x + (dx / length) * pad
              const ex = b.x - (dx / length) * pad
              const arrow = b.x - (dx / length) * (NODE_W / 2 - 2)
              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line
                    x1={sx}
                    y1={a.y}
                    x2={arrow}
                    y2={b.y}
                    stroke={stroke}
                    strokeOpacity="0.4"
                    strokeWidth="1.6"
                    markerEnd={marker}
                  />
                  <circle r="2.4" fill={stroke} fillOpacity="0.9">
                    <animateMotion
                      dur="3.4s"
                      repeatCount="indefinite"
                      path={`M ${sx} ${a.y} L ${ex} ${b.y}`}
                    />
                  </circle>
                </g>
              )
            })}
          </svg>

          {/* lane tags */}
          <div className="absolute left-0 top-[8%] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]/70">
            <Zap className="h-3.5 w-3.5" /> Circuits Lane
          </div>
          <div className="absolute bottom-[6%] left-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B5CF6]/80">
            <Lightbulb className="h-3.5 w-3.5" /> Ray Optics Lane
          </div>
          <div className="absolute -right-1 top-1/2 -rotate-90 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-600">
            Prerequisite flow →
          </div>

          {/* nodes */}
          {CONCEPTS.map((concept) => {
            const mastery = effective[concept.id]
            const band = bandOf(mastery)
            const meta = BAND_META[band]
            const isTarget = concept.id === target
            const ghostTarget = simulated?.[concept.id]
            const isGhost = ghostTarget !== undefined && Math.abs(ghostTarget - mastery) > 0.005
            return (
              <button
                key={concept.id}
                type="button"
                onClick={() => onSelect(concept.id)}
                className={`group absolute flex flex-col items-start gap-1 rounded-2xl border bg-[#0B1120]/85 p-3 text-left backdrop-blur-md transition duration-300 hover:-translate-y-0.5 ${meta.border} ${meta.glow} ${
                  isTarget ? 'ring-1 ring-[#00F0FF]/60' : ''
                }`}
                style={{
                  width: NODE_W,
                  height: NODE_H,
                  left: `${(concept.x / CANVAS_W) * 100}%`,
                  top: `${(concept.y / CANVAS_H) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${concept.name} — ${pct(mastery)} mastery`}
              >
                {flashNode === concept.id && flash && <DeltaPop delta={flash.delta} nonce={flash.nonce} />}
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold leading-tight text-white">
                    {concept.track === 'Electricity' ? (
                      <Zap className="h-3 w-3 shrink-0 text-[#00F0FF]" />
                    ) : (
                      <Lightbulb className="h-3 w-3 shrink-0 text-[#8B5CF6]" />
                    )}
                    {concept.shortName}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: meta.hex, boxShadow: `0 0 8px ${meta.hex}` }}
                  />
                </div>

                <span className="mono w-full truncate text-[10px] text-slate-400">{concept.formula}</span>

                <div className="mt-auto flex w-full items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct(mastery)}`, background: meta.hex, boxShadow: `0 0 8px ${meta.hex}` }}
                    />
                  </div>
                  <span className="mono text-[11px] font-bold" style={{ color: meta.hex }}>
                    {pct(mastery)}
                  </span>
                </div>

                {isTarget && (
                  <span className="absolute -top-2 right-2 inline-flex items-center gap-1 rounded-full border border-[#00F0FF]/50 bg-[#090D16] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#00F0FF]">
                    <Compass className="h-2.5 w-2.5" /> target
                  </span>
                )}

                {/* What-If ghost ring — dashed cyan preview of the simulated target */}
                {isGhost && (
                  <span className="ghost-ring pointer-events-none absolute -inset-1 rounded-2xl border-2 border-dashed border-[#00F0FF]/75" />
                )}
                {isGhost && (
                  <span className="pointer-events-none absolute -top-2 left-2 inline-flex items-center gap-1 rounded-full border border-[#00F0FF]/50 bg-[#090D16] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#00F0FF]">
                    <TrendingUp className="h-2.5 w-2.5" /> ghost {pct(ghostTarget)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 px-1 text-[10px] text-slate-500">
        {(['weak', 'developing', 'mastered'] as const).map((band) => (
          <span key={band} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META[band].hex }} />
            {BAND_META[band].label}
            <span className="mono text-slate-600">
              {band === 'weak' ? '(<50%)' : band === 'developing' ? '(50–79%)' : '(≥80%)'}
            </span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-[#00F0FF]/60" /> Electricity
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-[#8B5CF6]/70" /> Optics
        </span>
        {simulated && Object.keys(simulated).length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[#00F0FF]">
            <span className="h-2.5 w-2.5 rounded-sm border-2 border-dashed border-[#00F0FF]/70" /> What-If ghost target
          </span>
        )}
      </div>
    </div>
  )
}

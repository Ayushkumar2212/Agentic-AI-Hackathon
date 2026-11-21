import type { ReactNode } from 'react'
import { BAND_META, bandOf, clamp } from '../lib/mastery'
import type { MasteryBand } from '../types'

/* ------------------------------------------------------------------ */
/* Mastery ring — animated circular gauge used across every module     */
/* ------------------------------------------------------------------ */

interface MasteryRingProps {
  value: number // 0..1
  size?: number
  stroke?: number
  label?: string
  sublabel?: string
  /** force a colour instead of the band colour */
  tone?: MasteryBand
  className?: string
}

export function MasteryRing({
  value,
  size = 72,
  stroke = 7,
  label,
  sublabel,
  tone,
  className = '',
}: MasteryRingProps) {
  const safe = clamp(value)
  const band = tone ?? bandOf(safe)
  const meta = BAND_META[band]
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safe)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={meta.hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1), stroke 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-[15px] font-bold text-white">{label ?? `${Math.round(safe * 100)}%`}</span>
        {sublabel && <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">{sublabel}</span>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Band pill                                                           */
/* ------------------------------------------------------------------ */

export function BandPill({ mastery, className = '' }: { mastery: number; className?: string }) {
  const meta = BAND_META[bandOf(mastery)]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.border} ${meta.text} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.hex, boxShadow: `0 0 8px ${meta.hex}` }} />
      {meta.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Delta indicator (+14% / -16%)                                       */
/* ------------------------------------------------------------------ */

export function DeltaBadge({ delta, size = 'md' }: { delta: number; size?: 'sm' | 'md' | 'lg' }) {
  const positive = delta >= 0
  const sizes = {
    sm: 'text-[11px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-base px-2.5 py-1',
  } as const
  return (
    <span
      className={`mono inline-flex items-center gap-0.5 rounded-lg border font-bold ${sizes[size]} ${
        positive
          ? 'border-[#10B981]/45 bg-[#10B981]/12 text-[#10B981]'
          : 'border-[#EF4444]/45 bg-[#EF4444]/12 text-[#EF4444]'
      }`}
    >
      {positive ? '▲' : '▼'} {positive ? '+' : ''}
      {Math.round(delta * 100)}%
    </span>
  )
}

/** Floating "+14%" pop that rises out of a node after an answer. */
export function DeltaPop({ delta, nonce }: { delta: number; nonce: number }) {
  return (
    <span
      key={nonce}
      className={`mono pointer-events-none absolute left-1/2 top-0 z-30 text-sm font-extrabold animate-float-up ${
        delta >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
      }`}
      style={{ textShadow: '0 0 12px currentColor' }}
    >
      {delta >= 0 ? '+' : ''}
      {Math.round(delta * 100)}%
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

interface StatTileProps {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: string
  accent?: 'cyan' | 'emerald' | 'amber' | 'crimson' | 'violet'
  className?: string
}

const ACCENTS = {
  cyan: { text: 'text-[#00F0FF]', bg: 'bg-[#00F0FF]/10', border: 'border-[#00F0FF]/30', hex: '#00F0FF' },
  emerald: { text: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/30', hex: '#10B981' },
  amber: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', hex: '#F59E0B' },
  crimson: { text: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/30', hex: '#EF4444' },
  violet: { text: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/30', hex: '#8B5CF6' },
} as const

export function StatTile({ icon, label, value, hint, accent = 'cyan', className = '' }: StatTileProps) {
  const a = ACCENTS[accent]
  return (
    <div className={`glass card-hover p-3.5 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${a.border} ${a.bg} ${a.text}`}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      </div>
      <div className="mono mt-2.5 text-xl font-bold text-white">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                        */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  tone = 'cyan',
  height = 6,
  className = '',
}: {
  value: number
  tone?: 'cyan' | 'emerald' | 'amber' | 'crimson' | 'violet'
  height?: number
  className?: string
}) {
  const color = ACCENTS[tone].hex
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamp(value) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamp(value) * 100}%`,
          background: `linear-gradient(90deg, ${color}, #5EF2FF)`,
          boxShadow: `0 0 12px -2px ${color}`,
          transition: 'width 700ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  icon,
  title,
  subtitle,
  action,
  className = '',
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#00F0FF]/25 bg-[#00F0FF]/10 text-[#00F0FF]">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Empty / callout                                                     */
/* ------------------------------------------------------------------ */

export function Callout({
  tone = 'cyan',
  icon,
  title,
  children,
  className = '',
}: {
  tone?: 'cyan' | 'emerald' | 'amber' | 'crimson' | 'violet'
  icon?: ReactNode
  title?: string
  children?: ReactNode
  className?: string
}) {
  const a = ACCENTS[tone]
  return (
    <div className={`rounded-2xl border ${a.border} ${a.bg} p-3.5 ${className}`}>
      <div className="flex gap-2.5">
        {icon && <span className={`mt-0.5 shrink-0 ${a.text}`}>{icon}</span>}
        <div className="min-w-0">
          {title && <div className={`text-[12px] font-bold ${a.text}`}>{title}</div>}
          {children && <div className="mt-1 text-[12px] leading-relaxed text-slate-300">{children}</div>}
        </div>
      </div>
    </div>
  )
}

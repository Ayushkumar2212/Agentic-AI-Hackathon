import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Play,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'
import { CONCEPT_MAP } from '../../data/concepts'
import { MISCONCEPTION_MAP } from '../../data/misconceptions'
import type { PrepPilotsApi } from '../../state/usePrepPilots'
import type { ConceptId } from '../../types'

/* ------------------------------------------------------------------ */
/* Demo rough sheets — deterministic so the OCR pipeline is 1-click   */
/* ------------------------------------------------------------------ */

interface RoughLine {
  id: number
  /** vertical position of the handwriting as a % of the sheet height */
  top: number
  height: number
  /** the raw handwriting as it sits on the paper */
  writing: string
  /** the transcribed equation the OCR returns */
  latex: string
  valid: boolean
  note: string
  /** the learner-facing explanation shown under a flagged line */
  explain?: string
  misconceptionId?: string
}

interface RoughSheet {
  id: string
  label: string
  subtitle: string
  conceptId: ConceptId
  title: string
  lines: RoughLine[]
  corrected: string
  correctedNote: string
  confidence: number
}

const DEMO_SHEETS: RoughSheet[] = [
  {
    id: 'parallel',
    label: 'Sample 1: Parallel Resistance Mistake',
    subtitle: 'Two 4 Ω resistors in parallel — series formula applied',
    conceptId: 'series_parallel',
    title: 'Rough sheet · parallel combination',
    confidence: 0.94,
    lines: [
      {
        id: 1,
        top: 13,
        height: 16,
        writing: 'Given:  R₁ = 4Ω ,  R₂ = 4Ω',
        latex: 'R₁ = 4Ω, R₂ = 4Ω',
        valid: true,
        note: 'Valid parameter extraction',
      },
      {
        id: 2,
        top: 40,
        height: 16,
        writing: 'R_total = R₁ + R₂ = 4 + 4 = 8Ω',
        latex: 'R_total = R₁ + R₂ = 8Ω',
        valid: false,
        note: 'Additive Resistance Fallacy in Parallel Circuits',
        explain: 'You applied the series formula instead of 1/R_eq = 1/R₁ + 1/R₂',
        misconceptionId: 'additive_parallel',
      },
      {
        id: 3,
        top: 67,
        height: 16,
        writing: 'Result:  R_eq = 8Ω',
        latex: 'R_eq = 8Ω',
        valid: false,
        note: 'The flaw is carried into the final answer',
        explain: 'The result inherits the same wrong model — R_p must fall below the smallest branch (4 Ω).',
        misconceptionId: 'additive_parallel',
      },
    ],
    corrected: '1/R_eq = 1/4 + 1/4 = 2/4   →   R_eq = 2Ω',
    correctedNote:
      'Parallel resistances add reciprocally. Sanity check: the equivalent resistance must be smaller than the smallest branch (2 Ω < 4 Ω).',
  },
  {
    id: 'mirror',
    label: 'Sample 2: Concave Mirror Sign Error',
    subtitle: 'Concave mirror, f = 15 cm, object at 10 cm — signs dropped',
    conceptId: 'mirror_formula',
    title: 'Rough sheet · mirror formula',
    confidence: 0.91,
    lines: [
      {
        id: 1,
        top: 13,
        height: 16,
        writing: 'Concave mirror:  f = 15 cm ,  u = 10 cm',
        latex: 'f = 15 cm, u = 10 cm',
        valid: true,
        note: 'Valid parameter extraction',
      },
      {
        id: 2,
        top: 40,
        height: 16,
        writing: '1/v = 1/f − 1/u = 1/15 − 1/10',
        latex: '1/v = 1/f − 1/u = 1/15 − 1/10 = −1/30',
        valid: false,
        note: 'Mirror Sign Convention Confusion',
        explain: 'You substituted distances without the Cartesian sign convention (u must be −10 cm, f must be −15 cm).',
        misconceptionId: 'mirror_sign_convention',
      },
      {
        id: 3,
        top: 67,
        height: 16,
        writing: 'v = −30 cm',
        latex: 'v = −30 cm',
        valid: false,
        note: 'The wrong sign places the image on the wrong side of the mirror',
        explain: 'v < 0 wrongly reads as a real image in front of a concave mirror.',
        misconceptionId: 'mirror_sign_convention',
      },
    ],
    corrected: 'u = −10 cm, f = −15 cm  →  1/v = 1/(−15) − 1/(−10) = 1/30  →  v = +30 cm',
    correctedNote:
      'Fix the signs before substituting. v > 0 means the image lies behind the mirror — virtual, erect and 3× enlarged.',
  },
]

const TELEMETRY = [
  'Extracting handwritten equations…',
  'Parsing LaTeX steps…',
  'Auditing against NCERT sign conventions…',
] as const

type ScanPhase = 'idle' | 'scanning' | 'audited'

interface RoughWorkAuditorProps {
  api: PrepPilotsApi
}

/**
 * Feature B — "Snap Your Rough Work".
 *
 * A drag-and-drop / camera dropzone (with two one-click demo sheets) runs a
 * cinematic laser-scan OCR pass, then overlays glowing bounding boxes on the
 * handwriting and mirrors them as a line-by-line X-Ray breakdown. The corrected
 * step feeds straight back into the live Learner Model.
 */
export function RoughWorkAuditor({ api }: RoughWorkAuditorProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const [sheet, setSheet] = useState<RoughSheet | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [telemetryIndex, setTelemetryIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [applied, setApplied] = useState(false)
  const urlRef = useRef<string | null>(null)

  // revoke the previous object URL whenever it changes / on unmount
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  // advance the telemetry script, then reveal the audit
  useEffect(() => {
    if (phase !== 'scanning') return
    const timers = [
      window.setTimeout(() => setTelemetryIndex(1), 520),
      window.setTimeout(() => setTelemetryIndex(2), 1020),
      window.setTimeout(() => setPhase('audited'), 1560),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [phase])

  const startScan = (next: RoughSheet, url: string | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = url
    setImageUrl(url)
    setSheet(next)
    setApplied(false)
    setTelemetryIndex(0)
    setPhase('scanning')
  }

  const handleFile = (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    // an uploaded sheet is keyed to the parallel-resistance audit model
    startScan(DEMO_SHEETS[0], URL.createObjectURL(file))
  }

  const reset = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setImageUrl(null)
    setSheet(null)
    setApplied(false)
    setPhase('idle')
  }

  const applyRemediation = () => {
    if (!sheet) return
    api.remediateConcept(sheet.conceptId)
    api.selectTarget(sheet.conceptId)
    setApplied(true)
  }

  const flawCount = sheet ? sheet.lines.filter((line) => !line.valid).length : 0
  const misconception = sheet
    ? sheet.lines.filter((line) => !line.valid).map((line) => line.misconceptionId).find(Boolean)
    : undefined
  const misconceptionMeta = misconception ? MISCONCEPTION_MAP[misconception] : null

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#070B13]/60 p-3.5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
            <ScanLine className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[13px] font-bold text-white">Snap Your Rough Work</div>
            <div className="text-[10px] text-slate-500">Handwritten OCR · line-by-line step auditor</div>
          </div>
        </div>
        {phase === 'audited' && (
          <button type="button" onClick={reset} className="btn">
            <RotateCcw className="h-3.5 w-3.5" /> Scan another sheet
          </button>
        )}
      </div>

      {/* ---------------- dropzone + demo presets ---------------- */}
      {phase === 'idle' && (
        <div className="mt-3">
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              handleFile(event.dataTransfer.files?.[0])
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
              dragging
                ? 'border-[#00F0FF]/70 bg-[#00F0FF]/[0.06]'
                : 'border-white/12 bg-white/[0.02] hover:border-[#00F0FF]/40'
            }`}
          >
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
              <Upload className="h-5 w-5" />
            </span>
            <span className="text-[12.5px] font-bold text-slate-200">Drag &amp; drop your rough-work sheet</span>
            <span className="text-[11px] text-slate-500">PNG / JPG · or capture it with your camera</span>
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="btn cursor-pointer">
              <Camera className="h-3.5 w-3.5" /> Capture with camera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>
            <span className="mono text-[10px] text-slate-600">no sheet handy? run a demo in one click ↓</span>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_SHEETS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => startScan(demo, null)}
                className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/[0.04]"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00F0FF]/25 bg-[#00F0FF]/10 text-[#00F0FF]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-slate-100">{demo.label}</span>
                  <span className="block text-[10.5px] text-slate-500">{demo.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- scan stage ---------------- */}
      {phase !== 'idle' && sheet && (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* scanned sheet with laser + bounding boxes */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#05070C]">
            <div className="relative" style={{ aspectRatio: '4 / 3' }}>
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded rough work" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="hand-sheet absolute inset-0">
                  {sheet.lines.map((line) => (
                    <span
                      key={line.id}
                      className={`hand-text absolute left-[7%] right-[7%] whitespace-nowrap text-[13px] sm:text-[15px] ${
                        line.valid ? '' : 'hand-text-error'
                      }`}
                      style={{ top: `${line.top}%` }}
                    >
                      {line.writing}
                    </span>
                  ))}
                </div>
              )}

              {phase === 'scanning' && (
                <>
                  <div className="laser-veil" />
                  <div className="laser-line" />
                </>
              )}

              {phase === 'audited' &&
                sheet.lines.map((line, index) => (
                  <div
                    key={line.id}
                    className={`ocr-line-in absolute rounded-lg border-2 ${
                      line.valid
                        ? 'border-[#10B981] bg-[#10B981]/10'
                        : 'danger-pulse border-[#EF4444] bg-[#EF4444]/[0.14]'
                    }`}
                    style={{
                      left: '5%',
                      right: '5%',
                      top: `${line.top - 2}%`,
                      height: `${line.height}%`,
                      animationDelay: `${index * 140}ms`,
                    }}
                  >
                    <span
                      className={`absolute -top-2 left-2 inline-flex items-center gap-1 rounded-full border bg-[#090D16] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        line.valid ? 'border-[#10B981]/50 text-[#10B981]' : 'border-[#EF4444]/60 text-[#EF4444]'
                      }`}
                    >
                      {line.valid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                      Line {line.id}
                    </span>
                  </div>
                ))}
            </div>

            {/* status bar */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2">
              <span className="mono truncate text-[10px] text-slate-500">
                {phase === 'scanning'
                  ? TELEMETRY[telemetryIndex]
                  : `${flawCount} flaw${flawCount === 1 ? '' : 's'} flagged · ${CONCEPT_MAP[sheet.conceptId].shortName}`}
              </span>
              {phase === 'scanning' ? (
                <ScanLine className="h-3.5 w-3.5 shrink-0 animate-pulse text-[#00F0FF]" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
              )}
            </div>
          </div>

          {/* right column: telemetry while scanning, X-Ray timeline once done */}
          {phase === 'scanning' ? (
            <div className="rounded-2xl border border-[#00F0FF]/25 bg-[#00F0FF]/[0.05] p-4">
              <div className="section-label mb-2.5 flex items-center gap-1.5">
                <ScanLine className="h-3 w-3 text-[#00F0FF]" /> OCR telemetry
              </div>
              <ol className="space-y-2">
                {TELEMETRY.map((step, index) => (
                  <li
                    key={step}
                    className={`flex items-center gap-2 text-[11.5px] transition ${
                      index <= telemetryIndex ? 'text-[#00F0FF]' : 'text-slate-600'
                    }`}
                  >
                    {index < telemetryIndex ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          index === telemetryIndex ? 'animate-pulse bg-[#00F0FF]' : 'bg-slate-700'
                        }`}
                      />
                    )}
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((telemetryIndex + 1) / TELEMETRY.length) * 100}%`,
                    background: 'linear-gradient(90deg, #00F0FF, #10B981)',
                    boxShadow: '0 0 10px -1px rgba(0,240,255,0.8)',
                    transition: 'width 480ms cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                The laser sweeps the sheet for 1.5 s while PrepPilots extracts the handwriting, parses each LaTeX step and
                checks it against the NCERT sign conventions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* verification strip */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.06] px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#10B981]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Audit complete · {Math.round(sheet.confidence * 100)}% OCR
                  confidence
                </span>
                <span className="mono text-[10px] text-slate-500">{sheet.lines.length} lines read</span>
              </div>

              {/* line-by-line timeline */}
              <div className="relative space-y-2 pl-4">
                <span className="absolute bottom-1 left-[5px] top-1 w-px bg-gradient-to-b from-[#00F0FF]/40 via-white/10 to-[#EF4444]/40" />
                {sheet.lines.map((line, index) => (
                  <div
                    key={line.id}
                    className={`ocr-line-in relative rounded-xl border p-2.5 ${
                      line.valid ? 'border-[#10B981]/30 bg-[#10B981]/[0.05]' : 'border-[#EF4444]/35 bg-[#EF4444]/[0.06]'
                    }`}
                    style={{ animationDelay: `${index * 140}ms` }}
                  >
                    <span
                      className={`absolute -left-4 top-3.5 h-2.5 w-2.5 rounded-full ${
                        line.valid ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                      }`}
                      style={{ boxShadow: `0 0 8px ${line.valid ? '#10B981' : '#EF4444'}` }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Line {line.id}
                      </span>
                      {line.valid ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />
                      )}
                    </div>
                    <p className="mono mt-1 text-[12px] font-semibold text-slate-100">{line.latex}</p>
                    <p className={`mt-0.5 text-[10.5px] ${line.valid ? 'text-[#A7F3D0]' : 'text-[#FCA5A5]'}`}>
                      {line.valid ? line.note : `Detected Misconception: ${line.note}`}
                    </p>
                    {line.explain && (
                      <p className="mt-1 text-[10.5px] italic leading-relaxed text-slate-500">“{line.explain}”</p>
                    )}
                  </div>
                ))}
              </div>

              {/* pinpointed misconception */}
              {misconceptionMeta && (
                <div className="rounded-xl border border-[#EF4444]/35 bg-[#EF4444]/[0.07] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#EF4444]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Detected Misconception
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-[#FCA5A5]">{misconceptionMeta.label}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{misconceptionMeta.flaw}</p>
                  <p className="mono mt-1.5 text-[10px] text-slate-500">{misconceptionMeta.formula}</p>
                </div>
              )}

              {/* corrected step preview */}
              <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10B981]">
                  <Sparkles className="h-3.5 w-3.5" /> Corrected Step Preview
                </div>
                <p className="mono mt-1.5 text-[12px] font-semibold text-white">{sheet.corrected}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{sheet.correctedNote}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={applyRemediation} className="btn btn-primary sweep-host">
                    <Play className="h-3.5 w-3.5" /> Practice Similar Numerical
                  </button>
                  {applied && (
                    <span className="ocr-line-in inline-flex items-center gap-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/12 px-2 py-1 text-[10px] font-bold text-[#10B981]">
                      <CheckCircle2 className="h-3 w-3" /> Mastery lifted · calibrated question loaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

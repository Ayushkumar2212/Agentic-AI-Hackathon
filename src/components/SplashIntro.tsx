import { useEffect, useState } from 'react'
import { PrepPilotsMark } from './Logo'

interface SplashIntroProps {
  /** called once the intro finishes and the portal chooser should appear */
  onFinish: () => void
}

const INTRO_MS = 5000

/**
 * Cinematic opening — the Pre-Flight roll-out.
 * Only the PrepPilots name is shown, with an animated aura + scan line, for 5 s.
 */
export function SplashIntro({ onFinish }: SplashIntroProps) {
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const started = performance.now()
    let frame = 0
    const tick = () => {
      const ratio = Math.min(1, (performance.now() - started) / INTRO_MS)
      setProgress(ratio)
      if (ratio < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setExiting(true)
        window.setTimeout(onFinish, 600)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [onFinish])

  const reveal = Math.min(1, progress / 0.22) // name lockup settles in the first ~1.1 s

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
        exiting ? 'pointer-events-none scale-[1.03] opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* ambient backdrop */}
      <div className="grid-backdrop absolute inset-0" />
      <div
        className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.16), transparent 68%)' }}
      />
      <div className="radar-sweep absolute inset-0 overflow-hidden opacity-50" />

      {/* the name — the only thing on screen */}
      <div className="relative flex flex-col items-center px-6 text-center">
        <span
          className="relative mb-9 inline-flex items-center justify-center"
          style={{
            opacity: reveal,
            transform: `scale(${0.86 + reveal * 0.14})`,
            transition: 'opacity 600ms ease, transform 900ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <span className="absolute h-44 w-44 rounded-full bg-[#00F0FF]/20 blur-3xl animate-drift" />
          <span className="absolute h-32 w-32 rounded-full border border-[#00F0FF]/25 animate-pulse-ring" />
          <span className="absolute h-24 w-24 rounded-full border border-[#10B981]/25 animate-pulse-ring [animation-delay:600ms]" />
          <PrepPilotsMark
            size={120}
            animated
            className="relative drop-shadow-[0_0_40px_rgba(0,240,255,0.6)]"
          />
        </span>

        <h1
          className="text-balance text-6xl font-extrabold tracking-tight sm:text-7xl"
          style={{
            color: 'var(--tx-1)',
            opacity: reveal,
            transform: `translateY(${(1 - reveal) * 18}px)`,
            transition: 'opacity 700ms ease 120ms, transform 900ms cubic-bezier(0.22,1,0.36,1) 120ms',
          }}
        >
          Prep<span className="neon-cyan-text">Pilots</span>
        </h1>

        {/* the single, quiet progress thread under the name */}
        <div className="mt-12 h-[3px] w-[240px] max-w-[70vw] overflow-hidden rounded-full" style={{ background: 'var(--track)' }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#5EF2FF] to-[#00F0FF]"
            style={{
              width: `${progress * 100}%`,
              boxShadow: '0 0 18px -1px rgba(0,240,255,0.95)',
              transition: 'width 80ms linear',
            }}
          />
        </div>
      </div>
    </div>
  )
}

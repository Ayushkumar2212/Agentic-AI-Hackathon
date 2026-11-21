import { GraduationCap, Radar, ArrowRight, Plane, Sparkles } from 'lucide-react'
import { PrepPilotsLogo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import type { Role } from '../lib/auth'
import type { Theme } from '../lib/theme'

interface PortalSelectProps {
  onChoose: (role: Role) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

const PORTALS: {
  role: Role
  title: string
  subtitle: string
  blurb: string
  bullets: string[]
  Icon: typeof GraduationCap
  accent: string
  ring: string
  glow: string
  tag: string
}[] = [
  {
    role: 'student',
    title: 'Student Portal',
    subtitle: 'Prep Cockpit',
    tag: 'For Learners',
    blurb: 'Your adaptive study deck — map the syllabus, practise calibrated questions and revise on time.',
    bullets: ['Concept dependency graph', 'Targeted practice + reasoning review', 'Spaced-repetition revision radar'],
    Icon: GraduationCap,
    accent: '#00F0FF',
    ring: 'rgba(0,240,255,0.35)',
    glow: '0 24px 60px -30px rgba(0, 240, 255, 0.9)',
  },
  {
    role: 'admin',
    title: 'Admin Portal',
    subtitle: 'Air Traffic Control',
    tag: 'For Educators',
    blurb: 'The class-wide control room — track mastery heat, bottleneck concepts and misconduct-free remediation.',
    bullets: ['Live class mastery heatmap', 'Misconception feed + remedial sheets', 'Student roster & risk tracking'],
    Icon: Radar,
    accent: '#8B5CF6',
    ring: 'rgba(139,92,246,0.4)',
    glow: '0 24px 60px -30px rgba(139, 92, 246, 0.9)',
  },
]

const HEADING_WORDS = ['How', 'are', 'you', 'boarding', 'today?']

/** Second screen — pick the portal you want to enter. */
export function PortalSelect({ onChoose, theme, onThemeChange }: PortalSelectProps) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* animated ambient orbs */}
      <div
        className="orb"
        style={{
          top: '-120px',
          left: '-80px',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(0,240,255,0.45), transparent 70%)',
          animationDelay: '0s',
        }}
      />
      <div
        className="orb"
        style={{
          top: '40%',
          right: '-120px',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)',
          animationDelay: '-6s',
        }}
      />
      <div
        className="orb"
        style={{
          bottom: '-160px',
          left: '30%',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)',
          animationDelay: '-11s',
        }}
      />

      <div className="grid-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-7">
        {/* top bar */}
        <div className="flex items-center justify-between gap-4">
          <PrepPilotsLogo size={38} subtitle="Adaptive Exam Prep" />
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-10">
          {/* runway chip with flying plane */}
          <span
            className="chip mb-6 overflow-hidden"
            style={{ color: 'var(--tx-3)' }}
          >
            <Plane className="plane-fly h-3 w-3" style={{ color: '#00F0FF' }} />
            Choose your runway
          </span>

          {/* heading with per-word reveal */}
          <h1
            className="text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
            style={{ color: 'var(--tx-1)' }}
          >
            {HEADING_WORDS.map((word, i) => (
              <span
                key={word}
                className="word-rise"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                {word}
                {i < HEADING_WORDS.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </h1>

          <p
            className="mt-4 max-w-xl text-balance text-center text-[13px] leading-relaxed"
            style={{ color: 'var(--tx-3)', animation: 'fade-in 0.6s ease-out 0.6s both' }}
          >
            PrepPilots keeps a separate cockpit for learners and a separate control tower for educators. Pick a portal to
            continue — you can log in or create a new account right after.
          </p>

          {/* portal cards */}
          <div className="relative mt-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            {PORTALS.map((portal, idx) => (
              <button
                key={portal.role}
                type="button"
                onClick={() => onChoose(portal.role)}
                className="portal-card group relative"
                style={{ animationDelay: `${idx * 120}ms`, '--accent': portal.accent } as React.CSSProperties}
              >
                <div
                  className="portal-card-inner glass card-hover sweep-host flex h-full flex-col items-start gap-4 rounded-[22px] p-6 text-left"
                  style={{ borderColor: 'var(--glass-bd)' }}
                >
                  {/* icon badge with floating glow */}
                  <span
                    className="badge-float relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border transition group-hover:scale-110"
                    style={{
                      borderColor: portal.ring,
                      background: `${portal.accent}1f`,
                      color: portal.accent,
                      boxShadow: `0 0 30px -8px ${portal.accent}`,
                    }}
                  >
                    <portal.Icon className="h-7 w-7" />
                    <span
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 20px ${portal.accent}40` }}
                    />
                  </span>

                  {/* tag + title */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="section-label" style={{ color: portal.accent }}>
                        {portal.subtitle}
                      </div>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: portal.accent, background: `${portal.accent}14` }}
                      >
                        {portal.tag}
                      </span>
                    </div>
                    <h2
                      className="mt-1 text-xl font-extrabold tracking-tight transition-colors"
                      style={{ color: 'var(--tx-1)' }}
                    >
                      {portal.title}
                    </h2>
                  </div>

                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--tx-3)' }}>
                    {portal.blurb}
                  </p>

                  {/* bullet list */}
                  <ul className="mt-1 w-full space-y-2">
                    {portal.bullets.map((bullet, i) => (
                      <li
                        key={bullet}
                        className="flex items-center gap-2.5 text-[12px] transition-all duration-300"
                        style={{
                          color: 'var(--tx-2)',
                          animation: `portal-in 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                          animationDelay: `${400 + idx * 120 + i * 80}ms`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150"
                          style={{ background: portal.accent, boxShadow: `0 0 8px ${portal.accent}` }}
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  {/* CTA with sliding arrow */}
                  <span
                    className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold transition"
                    style={{ color: portal.accent }}
                  >
                    Enter {portal.title}
                    <ArrowRight className="portal-arrow h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}

            {/* connecting runway line (desktop only) */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-px w-12 -translate-x-1/2 -translate-y-1/2 md:block">
              <div className="runway-line h-full w-full" />
            </div>
          </div>

          {/* trust strip */}
          <div
            className="mt-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--tx-4)', animation: 'fade-in 0.6s ease-out 0.8s both' }}
          >
            <Sparkles className="h-3 w-3" style={{ color: '#F59E0B' }} />
            <span>CBSE / NCERT Class 10 Physics</span>
            <span className="h-1 w-1 rounded-full" style={{ background: 'var(--tx-4)' }} />
            <span>Electricity &amp; Light</span>
            <span className="h-1 w-1 rounded-full" style={{ background: 'var(--tx-4)' }} />
            <span>BKT + SM-2 Engine</span>
          </div>
        </div>
      </div>
    </div>
  )
}

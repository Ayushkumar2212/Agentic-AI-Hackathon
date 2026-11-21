import { GraduationCap, Radar, ArrowRight, Plane } from 'lucide-react'
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
}[] = [
  {
    role: 'student',
    title: 'Student Portal',
    subtitle: 'Prep Cockpit',
    blurb: 'Your adaptive study deck — map the syllabus, practise calibrated questions and revise on time.',
    bullets: ['Concept dependency graph', 'Targeted practice + reasoning review', 'Spaced-repetition revision radar'],
    Icon: GraduationCap,
    accent: '#00F0FF',
    ring: 'rgba(0,240,255,0.35)',
  },
  {
    role: 'admin',
    title: 'Admin Portal',
    subtitle: 'Air Traffic Control',
    blurb: 'The class-wide control room — track mastery heat, bottleneck concepts and misconduct-free remediation.',
    bullets: ['Live class mastery heatmap', 'Misconception feed + remedial sheets', 'Student roster & risk tracking'],
    Icon: Radar,
    accent: '#8B5CF6',
    ring: 'rgba(139,92,246,0.4)',
  },
]

/** Second screen — pick the portal you want to enter. */
export function PortalSelect({ onChoose, theme, onThemeChange }: PortalSelectProps) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="grid-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-7">
        <div className="flex items-center justify-between gap-4">
          <PrepPilotsLogo size={38} subtitle="Adaptive Exam Prep" />
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <span className="chip mb-5" style={{ color: 'var(--tx-3)' }}>
            <Plane className="h-3 w-3 -rotate-45 text-[#00F0FF]" />
            Choose your runway
          </span>

          <h1 className="text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--tx-1)' }}>
            How are you boarding today?
          </h1>
          <p className="mt-3 max-w-xl text-balance text-center text-[13px] leading-relaxed" style={{ color: 'var(--tx-3)' }}>
            PrepPilots keeps a separate cockpit for learners and a separate control tower for educators. Pick a portal to
            continue — you can log in or create a new account right after.
          </p>

          <div className="mt-9 grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            {PORTALS.map((portal) => (
              <button
                key={portal.role}
                type="button"
                onClick={() => onChoose(portal.role)}
                className="group glass card-hover flex flex-col items-start gap-3 p-6 text-left"
                style={{ borderColor: 'var(--glass-bd)' }}
              >
                <span
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border transition group-hover:scale-105"
                  style={{ borderColor: portal.ring, background: `${portal.accent}1f`, color: portal.accent }}
                >
                  <portal.Icon className="h-7 w-7" />
                </span>

                <div>
                  <div className="section-label" style={{ color: portal.accent }}>
                    {portal.subtitle}
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight" style={{ color: 'var(--tx-1)' }}>
                    {portal.title}
                  </h2>
                </div>

                <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--tx-3)' }}>
                  {portal.blurb}
                </p>

                <ul className="mt-1 space-y-1.5">
                  {portal.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--tx-2)' }}>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: portal.accent }} />
                      {bullet}
                    </li>
                  ))}
                </ul>

                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold transition group-hover:gap-2.5"
                  style={{ color: portal.accent }}
                >
                  Enter {portal.title}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--tx-4)' }}>
          CBSE / NCERT Class 10 Physics · Electricity &amp; Light
        </p>
      </div>
    </div>
  )
}

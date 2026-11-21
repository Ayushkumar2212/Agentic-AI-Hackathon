import { CalendarPlus, GraduationCap, LogOut, PlaneTakeoff, Radar, RotateCcw, Stethoscope, UserRound } from 'lucide-react'
import { PrepPilotsLogo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import type { Prediction } from '../lib/mastery'
import type { Theme } from '../lib/theme'
import { initials, type AuthUser, type Role } from '../lib/auth'

interface TopNavProps {
  role: Role
  user: AuthUser
  onDiagnostic: () => void
  onSimulateDays: () => void
  onReset: () => void
  onProfile: () => void
  onLogout: () => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  prediction: Prediction
  day: number
  diagnosticDone: boolean
  dueCount: number
}

/**
 * PrepPilots flight deck navigation.
 * Live Predicted Score · Simulate +3 Days · Pre-Flight Diagnostic · profile · theme.
 */
export function TopNav({
  role,
  user,
  onDiagnostic,
  onSimulateDays,
  onReset,
  onProfile,
  onLogout,
  theme,
  onThemeChange,
  prediction,
  day,
  diagnosticDone,
  dueCount,
}: TopNavProps) {
  const isStudent = role === 'student'
  const accent = isStudent ? '#00F0FF' : '#8B5CF6'
  const gradeTone =
    prediction.percent >= 80
      ? 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10'
      : prediction.percent >= 50
        ? 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10'
        : 'text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10'

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-nav)' }}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:px-6">
        <PrepPilotsLogo size={34} subtitle={isStudent ? 'Prep Cockpit' : 'Air Traffic Control'} />

        <span
          className="hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider sm:inline-flex"
          style={{ borderColor: `${accent}44`, background: `${accent}14`, color: accent }}
        >
          {isStudent ? <GraduationCap className="h-3.5 w-3.5" /> : <Radar className="h-3.5 w-3.5" />}
          {isStudent ? 'Student Portal' : 'Admin Portal'}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className="mono hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold md:inline-flex"
            style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-1)', color: 'var(--tx-3)' }}
          >
            <PlaneTakeoff className="h-3.5 w-3.5 text-[#00F0FF]" />
            Flight Day {day}
            {dueCount > 0 && <span className="ml-1 text-[#F59E0B]">· {dueCount} due</span>}
          </span>

          <button
            type="button"
            onClick={onSimulateDays}
            className="btn sweep-host border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#FCD9A0] hover:border-[#F59E0B]/60 hover:bg-[#F59E0B]/15 hover:text-[#FFE9C7]"
            title="Advance the spaced-repetition clock by 3 days"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Simulate +3 Days</span>
          </button>

          <button
            type="button"
            onClick={onDiagnostic}
            className={`btn sweep-host ${diagnosticDone ? '' : 'btn-primary'}`}
            title="Run the 6-question Pre-Flight Calibration"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pre-Flight Diagnostic</span>
          </button>

          <div
            className={`mono flex items-center gap-2 rounded-xl border px-3 py-1.5 ${gradeTone}`}
            title="Live predicted board score from the weighted learner model"
          >
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.16em] opacity-80 lg:inline">
              Predicted
            </span>
            <span className="text-sm font-extrabold">{prediction.percent}%</span>
            <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-bold">Gr {prediction.grade}</span>
          </div>

          <ThemeToggle theme={theme} onChange={onThemeChange} className="hidden sm:inline-flex" />

          <button
            type="button"
            onClick={onProfile}
            className="btn gap-2 px-2 sm:px-2.5"
            title="Open profile"
          >
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg border text-[10px] font-extrabold"
              style={{ borderColor: `${accent}55`, background: `${accent}1f`, color: accent }}
            >
              {initials(user.profile.fullName || user.email)}
            </span>
            <span className="hidden max-w-[110px] truncate text-[11px] font-semibold lg:inline" style={{ color: 'var(--tx-2)' }}>
              {user.profile.fullName || user.email}
            </span>
            <UserRound className="h-3.5 w-3.5 lg:hidden" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="btn px-2"
            title="Reset the learner model and start a fresh flight"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="btn px-2 hover:text-[#EF4444]"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}

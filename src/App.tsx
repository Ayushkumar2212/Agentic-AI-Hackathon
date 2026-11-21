import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, Plane, Radar, ShieldAlert, X } from 'lucide-react'
import { CONCEPT_MAP } from './data/concepts'
import { pct } from './lib/mastery'
import { usePrepPilots } from './state/usePrepPilots'
import { SplashIntro } from './components/SplashIntro'
import { PortalSelect } from './components/PortalSelect'
import { AuthPanel } from './components/AuthPanel'
import { ProfilePanel } from './components/ProfilePanel'
import { TopNav } from './components/TopNav'
import { StudentCockpit } from './components/student/StudentCockpit'
import { DiagnosticModal } from './components/student/DiagnosticModal'
import { TeacherATC } from './components/teacher/TeacherATC'
import { applyTheme, loadTheme, saveTheme, type Theme } from './lib/theme'
import { clearSession, ensureSeedUsers, type AuthUser, type Role } from './lib/auth'

/**
 * PrepPilots — Adaptive Exam Prep Tutor with a Live Learner Model.
 *
 * Flow: 5-second name-only intro → portal chooser → login / sign-up → the portal.
 * Student Portal = Prep Cockpit · Admin Portal = Air Traffic Control.
 */

type Phase = 'splash' | 'portal' | 'auth' | 'app'

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = loadTheme()
    applyTheme(initial)
    return initial
  })
  const [phase, setPhase] = useState<Phase>('splash')
  const [role, setRole] = useState<Role>('student')
  const [user, setUser] = useState<AuthUser | null>(null)

  // one-time boot: make sure the demo accounts exist
  useEffect(() => {
    ensureSeedUsers()
  }, [])

  const changeTheme = useCallback((next: Theme) => {
    applyTheme(next)
    saveTheme(next)
    setTheme(next)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setUser(null)
    setRole('student')
    setPhase('portal')
  }, [])

  return (
    <>
      {phase === 'splash' && <SplashIntro onFinish={() => setPhase('portal')} />}

      {phase === 'portal' && (
        <PortalSelect
          theme={theme}
          onThemeChange={changeTheme}
          onChoose={(chosen) => {
            setRole(chosen)
            setPhase('auth')
          }}
        />
      )}

      {phase === 'auth' && (
        <AuthPanel
          role={role}
          theme={theme}
          onThemeChange={changeTheme}
          onBack={() => setPhase('portal')}
          onAuthenticated={(authed) => {
            setUser(authed)
            setRole(authed.role)
            setPhase('app')
          }}
        />
      )}

      {phase === 'app' && user && (
        <PortalShell
          key={user.id}
          user={user}
          theme={theme}
          onThemeChange={changeTheme}
          onUserChange={setUser}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Authenticated shell — Prep Cockpit (student) or Air Traffic Control */
/* ------------------------------------------------------------------ */

interface PortalShellProps {
  user: AuthUser
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onUserChange: (user: AuthUser) => void
  onLogout: () => void
}

function PortalShell({ user, theme, onThemeChange, onUserChange, onLogout }: PortalShellProps) {
  const role = user.role
  const api = usePrepPilots({
    learnerId: user.id,
    identity: {
      name: user.profile.fullName || user.email,
      grade: user.profile.gradeClass || 'Class 10',
    },
  })

  const [diagnosticOpen, setDiagnosticOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // brand-new student flight → go straight into Pre-Flight Calibration
  useEffect(() => {
    if (role === 'student' && !api.state.diagnosticDone && api.state.totalAnswers === 0) {
      setDiagnosticOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeReroute = role === 'student' ? (api.rerouteAlerts[0] ?? null) : null

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="grid-backdrop pointer-events-none fixed inset-0 opacity-70" />

      <div className="relative animate-fade-in">
        <TopNav
          role={role}
          user={user}
          onDiagnostic={() => setDiagnosticOpen(true)}
          onSimulateDays={() => api.simulateDays(3)}
          onReset={() => {
            api.resetProgress()
            setDiagnosticOpen(true)
          }}
          onProfile={() => setProfileOpen(true)}
          onLogout={onLogout}
          theme={theme}
          onThemeChange={onThemeChange}
          prediction={api.prediction}
          day={api.day}
          diagnosticDone={api.state.diagnosticDone}
          dueCount={api.dueCount}
        />

        <main className="mx-auto max-w-[1400px] px-4 py-4 lg:px-6">
          <div key={role} className="animate-rise">
            {role === 'student' ? <StudentCockpit api={api} /> : <TeacherATC api={api} />}
          </div>
        </main>

        <footer className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 pb-8 pt-2 text-[10px] text-slate-600 lg:px-6">
          <span className="inline-flex items-center gap-1.5">
            <Plane className="h-3 w-3 -rotate-45 text-[#00F0FF]" />
            PrepPilots · Adaptive Exam Prep Tutor with a Live Learner Model
          </span>
          <span className="mono">
            CBSE / NCERT Class 10 Physics · Electricity &amp; Light · BKT + SM-2 engine
          </span>
        </footer>
      </div>

      {/* Prerequisite Reroute Alert — prominent, actionable */}
      {activeReroute && (
        <div className="fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4">
          <div className="glass-strong w-full max-w-2xl overflow-hidden border-[#EF4444]/40 animate-rise">
            <div className="flex items-start gap-3 p-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/12 text-[#EF4444]">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#FCA5A5]">Prerequisite Reroute Alert</span>
                  <span className="chip border-[#EF4444]/40 bg-[#EF4444]/12 px-2 py-0 text-[9px] font-bold uppercase tracking-wider text-[#FCA5A5]">
                    {activeReroute.failStreak} consecutive misses
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300">{activeReroute.message}</p>
                <div className="mono mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-[#EF4444]" />
                    {CONCEPT_MAP[activeReroute.failingConceptId].shortName} at {pct(activeReroute.failingMastery)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeftRight className="h-3 w-3 text-[#F59E0B]" />
                    root {CONCEPT_MAP[activeReroute.prerequisiteId].shortName} at {pct(activeReroute.prerequisiteMastery)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      api.selectTarget(activeReroute.prerequisiteId)
                      api.dismissReroute(activeReroute.id)
                    }}
                    className="btn btn-danger sweep-host"
                  >
                    <Radar className="h-3.5 w-3.5" />
                    Reroute to {CONCEPT_MAP[activeReroute.prerequisiteId].shortName}
                  </button>
                  <button type="button" onClick={() => api.dismissReroute(activeReroute.id)} className="btn">
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => api.dismissReroute(activeReroute.id)}
                className="btn border-white/10 px-2 py-1 text-slate-500 hover:text-white"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <ProfilePanel user={user} onClose={() => setProfileOpen(false)} onUpdated={onUserChange} />
      )}

      {diagnosticOpen && (
        <DiagnosticModal
          questions={api.diagnosticQuestions}
          alreadyDone={api.state.diagnosticDone}
          previousScore={api.state.diagnosticScore}
          onSubmit={(answers) => api.submitDiagnostic(answers)}
          onClose={() => setDiagnosticOpen(false)}
        />
      )}
    </div>
  )
}

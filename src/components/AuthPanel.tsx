import { useState } from 'react'
import { AlertCircle, ArrowLeft, GraduationCap, LogIn, Radar, ShieldCheck, UserPlus } from 'lucide-react'
import { PrepPilotsLogo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import {
  emptyProfile,
  isEmailValid,
  logIn,
  signUp,
  type AuthUser,
  type Profile,
  type Role,
} from '../lib/auth'
import type { Theme } from '../lib/theme'

interface AuthPanelProps {
  role: Role
  onBack: () => void
  onAuthenticated: (user: AuthUser) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

type Mode = 'login' | 'signup'

const STUDENT_FIELDS: { key: keyof Profile; label: string; placeholder: string; type?: string }[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'e.g. Aarav Sharma' },
  { key: 'phone', label: 'Mobile number', placeholder: '+91 98765 43210' },
  { key: 'city', label: 'City', placeholder: 'e.g. Pune' },
  { key: 'school', label: 'School', placeholder: 'e.g. Delhi Public School' },
  { key: 'gradeClass', label: 'Class', placeholder: 'Class 10' },
  { key: 'section', label: 'Section', placeholder: 'A' },
]

const ADMIN_FIELDS: { key: keyof Profile; label: string; placeholder: string; type?: string }[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'e.g. Meera Iyer' },
  { key: 'phone', label: 'Contact number', placeholder: '+91 90040 55667' },
  { key: 'city', label: 'City', placeholder: 'e.g. Bengaluru' },
  { key: 'school', label: 'Institution', placeholder: 'e.g. Delhi Public School' },
  { key: 'designation', label: 'Designation', placeholder: 'Subject Teacher / HOD' },
  { key: 'subject', label: 'Subject', placeholder: 'Physics' },
  { key: 'experienceYears', label: 'Years of experience', placeholder: 'e.g. 8' },
  { key: 'employeeId', label: 'Employee / Staff ID', placeholder: 'e.g. DPS-PHY-014' },
]

/** Login + registration for both portals, collecting every profile detail up front. */
export function AuthPanel({ role, onBack, onAuthenticated, theme, onThemeChange }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [profile, setProfile] = useState<Profile>(emptyProfile())
  const [error, setError] = useState<string | null>(null)

  const isStudent = role === 'student'
  const fields = isStudent ? STUDENT_FIELDS : ADMIN_FIELDS
  const PortalIcon = isStudent ? GraduationCap : Radar
  const accent = isStudent ? '#00F0FF' : '#8B5CF6'

  const setField = (key: keyof Profile, value: string) => setProfile((prev) => ({ ...prev, [key]: value }))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (mode === 'login') {
      const result = logIn({ role, email, password })
      if (!result.ok) return setError(result.error)
      onAuthenticated(result.user)
      return
    }

    if (!isEmailValid(email)) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    if (!profile.fullName.trim()) return setError('Full name is required.')

    const result = signUp({ role, email, password, profile })
    if (!result.ok) return setError(result.error)
    onAuthenticated(result.user)
  }

  const fillDemo = () => {
    if (isStudent) {
      setEmail('aarav@preppilots.in')
      setPassword('prep1234')
    } else {
      setEmail('meera@preppilots.in')
      setPassword('prep1234')
    }
    setMode('login')
    setError(null)
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="grid-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-7">
        <div className="flex items-center justify-between gap-4">
          <PrepPilotsLogo size={36} subtitle={isStudent ? 'Student Portal' : 'Admin Portal'} />
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr]">
            {/* portal banner */}
            <div className="glass hidden flex-col justify-between p-7 lg:flex">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition hover:opacity-80"
                style={{ color: 'var(--tx-3)' }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change portal
              </button>

              <div className="mt-8">
                <span
                  className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border"
                  style={{ borderColor: `${accent}55`, background: `${accent}1f`, color: accent }}
                >
                  <PortalIcon className="h-8 w-8" />
                </span>
                <h1 className="mt-5 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--tx-1)' }}>
                  {isStudent ? 'Student Portal' : 'Admin Portal'}
                </h1>
                <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--tx-3)' }}>
                  {isStudent
                    ? 'Sign in to resume your flight plan, or register a fresh account to start calibration from scratch.'
                    : 'Sign in to open the control tower, or register a staff account to monitor class-wide mastery.'}
                </p>

                <div className="mt-6 space-y-2.5">
                  {(isStudent
                    ? ['Progress is saved per account', 'Personal profile & target exam', 'Resume anywhere, anytime']
                    : ['Class-wide analytics', 'Remedial sheet generation', 'Staff profile & institution details']
                  ).map((line) => (
                    <div key={line} className="flex items-center gap-2.5 text-[12.5px]" style={{ color: 'var(--tx-2)' }}>
                      <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: accent }} />
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mono mt-8 rounded-xl border p-3 text-[11px]" style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-1)', color: 'var(--tx-3)' }}>
                <div className="font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>
                  Demo account
                </div>
                <div className="mt-1">{isStudent ? 'aarav@preppilots.in' : 'meera@preppilots.in'} · prep1234</div>
                <button type="button" onClick={fillDemo} className="mt-2 underline decoration-dotted">
                  Autofill credentials
                </button>
              </div>
            </div>

            {/* form card */}
            <div className="glass p-6 sm:p-7">
              <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-1)' }}>
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m)
                      setError(null)
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition ${
                      mode === m ? 'bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_0_1px_rgba(0,240,255,0.35)]' : ''
                    }`}
                    style={mode === m ? undefined : { color: 'var(--tx-3)' }}
                  >
                    {m === 'login' ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {m === 'login' ? 'Log in' : 'Create account'}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-5 space-y-3.5">
                {mode === 'signup' && (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {fields.slice(0, 2).map((field) => (
                      <Field
                        key={field.key}
                        field={field}
                        value={profile[field.key]}
                        onChange={(v) => setField(field.key, v)}
                      />
                    ))}
                  </div>
                )}

                <Field
                  field={{ key: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' }}
                  value={email}
                  onChange={setEmail}
                />

                {mode === 'signup' && (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {fields.slice(2).map((field) => (
                      <Field
                        key={field.key}
                        field={field}
                        value={profile[field.key]}
                        onChange={(v) => setField(field.key, v)}
                      />
                    ))}
                  </div>
                )}

                <div className={mode === 'signup' ? 'grid grid-cols-1 gap-3.5 sm:grid-cols-2' : ''}>
                  <Field
                    field={{ key: 'password', label: 'Password', placeholder: 'At least 6 characters', type: 'password' }}
                    value={password}
                    onChange={setPassword}
                  />
                  {mode === 'signup' && (
                    <Field
                      field={{ key: 'confirm', label: 'Confirm password', placeholder: 'Re-enter password', type: 'password' }}
                      value={confirm}
                      onChange={setConfirm}
                    />
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#EF4444]/35 bg-[#EF4444]/[0.07] px-3 py-2.5 text-[12px] text-[#EF4444]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary sweep-host w-full py-2.5 text-[13px]">
                  {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {mode === 'login' ? 'Log in to portal' : 'Create account & continue'}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="w-full text-center text-[11px] font-semibold transition hover:opacity-80 lg:hidden"
                  style={{ color: 'var(--tx-3)' }}
                >
                  ← Change portal
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; placeholder: string; type?: string }
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>
        {field.label}
      </span>
      <input
        type={field.type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="field mt-1.5"
      />
    </label>
  )
}

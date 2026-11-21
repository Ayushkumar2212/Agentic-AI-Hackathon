import { useState } from 'react'
import { BadgeCheck, CalendarDays, GraduationCap, IdCard, Mail, MapPin, Phone, Radar, Save, X } from 'lucide-react'
import { initials, updateProfile, type AuthUser, type Profile } from '../lib/auth'

interface ProfilePanelProps {
  user: AuthUser
  onClose: () => void
  onUpdated: (user: AuthUser) => void
}

const COMMON: { key: keyof Profile; label: string; placeholder: string; icon?: typeof Mail }[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'Your name', icon: BadgeCheck },
  { key: 'phone', label: 'Phone', placeholder: '+91 …', icon: Phone },
  { key: 'city', label: 'City', placeholder: 'Your city', icon: MapPin },
  { key: 'school', label: 'School / Institution', placeholder: 'Institution name' },
]

const STUDENT_EXTRA: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'board', label: 'Board', placeholder: 'CBSE / ICSE / State' },
  { key: 'gradeClass', label: 'Class', placeholder: 'Class 10' },
  { key: 'section', label: 'Section', placeholder: 'A' },
  { key: 'targetExam', label: 'Target exam', placeholder: 'CBSE Class 10 Board' },
]

const ADMIN_EXTRA: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'designation', label: 'Designation', placeholder: 'Subject Teacher / HOD' },
  { key: 'subject', label: 'Subject', placeholder: 'Physics' },
  { key: 'experienceYears', label: 'Experience (years)', placeholder: '8' },
  { key: 'employeeId', label: 'Employee / Staff ID', placeholder: 'DPS-PHY-014' },
]

const dateFmt = (stamp: number) =>
  new Date(stamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

/** Profile section — every detail captured at sign-up, editable and persisted. */
export function ProfilePanel({ user, onClose, onUpdated }: ProfilePanelProps) {
  const [draft, setDraft] = useState<Profile>(user.profile)
  const [saved, setSaved] = useState(false)

  const isStudent = user.role === 'student'
  const extras = isStudent ? STUDENT_EXTRA : ADMIN_EXTRA
  const PortalIcon = isStudent ? GraduationCap : Radar
  const accent = isStudent ? '#00F0FF' : '#8B5CF6'

  const set = (key: keyof Profile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const save = () => {
    const updated = updateProfile(user.id, draft)
    if (updated) {
      onUpdated(updated)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] animate-fade-in bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-[520px] flex-col border-l animate-rise backdrop-blur-2xl"
        style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-4)' }}
      >
        <div className="flex items-center justify-between gap-3 border-b p-4" style={{ borderColor: 'var(--bd-1)' }}>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-[15px] font-extrabold"
              style={{ borderColor: `${accent}55`, background: `${accent}1f`, color: accent }}
            >
              {initials(user.profile.fullName || user.email)}
            </span>
            <div>
              <div className="section-label flex items-center gap-1.5">
                <PortalIcon className="h-3 w-3" /> {isStudent ? 'Student' : 'Admin'} profile
              </div>
              <div className="text-[15px] font-bold" style={{ color: 'var(--tx-1)' }}>
                {user.profile.fullName || 'Unnamed account'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn px-2 py-1" aria-label="Close profile">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* account meta */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <MetaTile icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email} />
            <MetaTile
              icon={<IdCard className="h-3.5 w-3.5" />}
              label={isStudent ? 'Roll / Student ID' : 'Staff ID'}
              value={(isStudent ? draft.employeeId : draft.employeeId) || user.id}
            />
            <MetaTile icon={<CalendarDays className="h-3.5 w-3.5" />} label="Member since" value={dateFmt(user.createdAt)} />
            <MetaTile icon={<CalendarDays className="h-3.5 w-3.5" />} label="Last login" value={dateFmt(user.lastLoginAt)} />
          </div>

          {/* editable details */}
          <div>
            <div className="section-label mb-2">Personal details</div>
            <div className="space-y-3">
              {COMMON.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>
                    {field.label}
                  </span>
                  <input
                    value={draft[field.key]}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="field mt-1.5"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label mb-2">{isStudent ? 'Academic details' : 'Professional details'}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {extras.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>
                    {field.label}
                  </span>
                  <input
                    value={draft[field.key]}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="field mt-1.5"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t p-4" style={{ borderColor: 'var(--bd-1)' }}>
          <button type="button" onClick={save} className="btn btn-primary sweep-host flex-1 py-2.5">
            <Save className="h-4 w-4" />
            Save profile
          </button>
          <span
            className={`text-[11px] font-semibold transition ${saved ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: '#10B981' }}
          >
            Saved ✓
          </span>
        </div>
      </aside>
    </>
  )
}

function MetaTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-2.5" style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-1)' }}>
      <div className="section-label flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="mono mt-1 truncate text-[12px] font-semibold" style={{ color: 'var(--tx-2)' }}>
        {value}
      </div>
    </div>
  )
}

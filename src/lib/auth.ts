/**
 * PrepPilots local authentication store.
 *
 * Demo-grade, offline-first auth: accounts + session live in localStorage so the
 * whole product works with zero backend. Passwords are stored as a one-way hash
 * (never in plain text) — this is a demo hash, not a production KDF.
 */

export type Role = 'student' | 'admin'

export interface Profile {
  fullName: string
  phone: string
  city: string
  /** student */
  board: string
  gradeClass: string
  section: string
  school: string
  targetExam: string
  /** admin */
  designation: string
  subject: string
  experienceYears: string
  employeeId: string
}

export interface AuthUser {
  id: string
  role: Role
  email: string
  passwordHash: string
  createdAt: number
  lastLoginAt: number
  profile: Profile
}

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string }

const USERS_KEY = 'preppilots.users.v1'
const SESSION_KEY = 'preppilots.session.v1'

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** Deterministic one-way hash — demo only, kept synchronous for simplicity. */
function hashPassword(password: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x1000193
  const salted = `preppilots::${password}`
  for (let i = 0; i < salted.length; i += 1) {
    const code = salted.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0
  }
  return `${h1.toString(16)}${h2.toString(16)}`
}

function uid(): string {
  return `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function emptyProfile(): Profile {
  return {
    fullName: '',
    phone: '',
    city: '',
    board: 'CBSE',
    gradeClass: 'Class 10',
    section: 'A',
    school: '',
    targetExam: 'CBSE Class 10 Board',
    designation: 'Subject Teacher',
    subject: 'Physics',
    experienceYears: '',
    employeeId: '',
  }
}

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/* ------------------------------------------------------------------ */
/* persistence                                                         */
/* ------------------------------------------------------------------ */

export function loadUsers(): AuthUser[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((u): u is AuthUser => !!u && typeof (u as AuthUser).email === 'string')
  } catch {
    return []
  }
}

function saveUsers(users: AuthUser[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* ignore */
  }
}

export function findByEmail(email: string): AuthUser | undefined {
  const needle = email.trim().toLowerCase()
  return loadUsers().find((u) => u.email.toLowerCase() === needle)
}

export function getUser(id: string): AuthUser | undefined {
  return loadUsers().find((u) => u.id === id)
}

/* ------------------------------------------------------------------ */
/* session                                                             */
/* ------------------------------------------------------------------ */

export function getSession(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    return getUser(id) ?? null
  } catch {
    return null
  }
}

export function setSession(userId: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SESSION_KEY, userId)
  } catch {
    /* ignore */
  }
}

export function clearSession(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* mutations                                                           */
/* ------------------------------------------------------------------ */

export interface SignUpInput {
  role: Role
  email: string
  password: string
  profile: Profile
}

export function signUp(input: SignUpInput): AuthResult {
  const email = input.email.trim().toLowerCase()
  if (!isEmailValid(email)) return { ok: false, error: 'Enter a valid email address.' }
  if (input.password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
  if (!input.profile.fullName.trim()) return { ok: false, error: 'Full name is required.' }
  if (findByEmail(email)) return { ok: false, error: 'An account with this email already exists.' }

  const user: AuthUser = {
    id: uid(),
    role: input.role,
    email,
    passwordHash: hashPassword(input.password),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    profile: { ...emptyProfile(), ...input.profile, fullName: input.profile.fullName.trim() },
  }
  saveUsers([...loadUsers(), user])
  setSession(user.id)
  return { ok: true, user }
}

export interface LogInInput {
  role: Role
  email: string
  password: string
}

export function logIn(input: LogInInput): AuthResult {
  const user = findByEmail(input.email)
  if (!user) return { ok: false, error: 'No account found for this email. Create one first.' }
  if (user.role !== input.role) {
    return {
      ok: false,
      error: `This email is registered as a ${user.role} account. Switch to the ${user.role} portal.`,
    }
  }
  if (user.passwordHash !== hashPassword(input.password)) return { ok: false, error: 'Incorrect password.' }

  const updated: AuthUser = { ...user, lastLoginAt: Date.now() }
  saveUsers(loadUsers().map((u) => (u.id === user.id ? updated : u)))
  setSession(user.id)
  return { ok: true, user: updated }
}

export function updateProfile(userId: string, patch: Partial<Profile>): AuthUser | null {
  const users = loadUsers()
  const existing = users.find((u) => u.id === userId)
  if (!existing) return null
  const updated: AuthUser = { ...existing, profile: { ...existing.profile, ...patch } }
  saveUsers(users.map((u) => (u.id === userId ? updated : u)))
  return updated
}

/** A couple of ready-made accounts so the portals can be explored instantly. */
export function ensureSeedUsers(): void {
  const users = loadUsers()
  if (users.some((u) => u.email === 'aarav@preppilots.in')) return
  const now = Date.now()
  const seeds: AuthUser[] = [
    {
      id: 'seed_student',
      role: 'student',
      email: 'aarav@preppilots.in',
      passwordHash: hashPassword('prep1234'),
      createdAt: now,
      lastLoginAt: now,
      profile: {
        ...emptyProfile(),
        fullName: 'Aarav Sharma',
        phone: '+91 98200 11223',
        city: 'Pune',
        board: 'CBSE',
        gradeClass: 'Class 10',
        section: 'A',
        school: 'Delhi Public School, Pune',
        targetExam: 'CBSE Class 10 Board',
      },
    },
    {
      id: 'seed_admin',
      role: 'admin',
      email: 'meera@preppilots.in',
      passwordHash: hashPassword('prep1234'),
      createdAt: now,
      lastLoginAt: now,
      profile: {
        ...emptyProfile(),
        fullName: 'Meera Iyer',
        phone: '+91 90040 55667',
        city: 'Bengaluru',
        school: 'Delhi Public School, Pune',
        designation: 'Head of Department',
        subject: 'Physics',
        experienceYears: '11',
        employeeId: 'DPS-PHY-014',
      },
    },
  ]
  saveUsers([...users, ...seeds.filter((s) => !users.some((u) => u.email === s.email))])
}

/** Most recently active student account — used as the "live learner" for the admin board. */
export function latestStudent(): AuthUser | null {
  const students = loadUsers()
    .filter((u) => u.role === 'student')
    .sort((a, b) => b.lastLoginAt - a.lastLoginAt)
  return students[0] ?? null
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'PP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

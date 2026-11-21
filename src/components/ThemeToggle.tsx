import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../lib/theme'

interface ThemeToggleProps {
  theme: Theme
  onChange: (theme: Theme) => void
  className?: string
}

/** Dark / Light switch — flips the whole app between the two token sets. */
export function ThemeToggle({ theme, onChange, className = '' }: ThemeToggleProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border p-1 ${className}`}
      style={{ borderColor: 'var(--bd-1)', background: 'var(--sf-1)' }}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => onChange('dark')}
        aria-pressed={theme === 'dark'}
        title="Dark mode"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
          theme === 'dark' ? 'bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_0_1px_rgba(0,240,255,0.35)]' : ''
        }`}
        style={theme === 'dark' ? undefined : { color: 'var(--tx-3)' }}
      >
        <Moon className="h-3.5 w-3.5" />
        Dark
      </button>
      <button
        type="button"
        onClick={() => onChange('light')}
        aria-pressed={theme === 'light'}
        title="Light mode"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
          theme === 'light' ? 'bg-[#F59E0B]/18 text-[#B45309] shadow-[0_0_0_1px_rgba(245,158,11,0.4)]' : ''
        }`}
        style={theme === 'light' ? undefined : { color: 'var(--tx-3)' }}
      >
        <Sun className="h-3.5 w-3.5" />
        Light
      </button>
    </div>
  )
}

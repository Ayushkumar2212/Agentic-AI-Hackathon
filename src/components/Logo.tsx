interface LogoProps {
  size?: number
  /** animate the orbiting aura + compass needle */
  animated?: boolean
  className?: string
}

/**
 * PrepPilots mark — a compass rose fused with a paper-plane nose,
 * ringed by a glowing cyan aura. Pure SVG so it stays crisp at any size.
 */
export function PrepPilotsMark({ size = 34, animated = false, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pp-wing" x1="8" y1="40" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="0.45" stopColor="#5EF2FF" />
          <stop offset="1" stopColor="#00F0FF" />
        </linearGradient>
        <filter id="pp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer aura ring */}
      <circle
        cx="24"
        cy="24"
        r="20.5"
        stroke="#00F0FF"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="3 7"
        className={animated ? 'origin-center animate-[spin_14s_linear_infinite]' : ''}
        style={{ transformOrigin: '24px 24px' }}
      />
      <circle cx="24" cy="24" r="16.5" stroke="#00F0FF" strokeOpacity="0.16" strokeWidth="1" />

      {/* tick marks */}
      <g stroke="#00F0FF" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round">
        <line x1="24" y1="4.5" x2="24" y2="8" />
        <line x1="24" y1="40" x2="24" y2="43.5" />
        <line x1="4.5" y1="24" x2="8" y2="24" />
        <line x1="40" y1="24" x2="43.5" y2="24" />
      </g>

      {/* paper-plane / compass needle */}
      <g filter="url(#pp-glow)">
        <path d="M8 39 L40 7 L33 41 L23.5 30 Z" fill="url(#pp-wing)" fillOpacity="0.95" />
        <path d="M23.5 30 L40 7 L26.8 26.4 Z" fill="#04121A" fillOpacity="0.55" />
        <path
          d="M10.5 36.2 L21.5 28.6"
          stroke="#04121A"
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

interface WordmarkProps {
  size?: number
  animated?: boolean
  subtitle?: string
  className?: string
}

/** Logo + glowing wordmark lock-up used in the nav and splash. */
export function PrepPilotsLogo({ size = 34, animated = false, subtitle, className = '' }: WordmarkProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex shrink-0 items-center justify-center">
        {animated && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#00F0FF]/25 blur-xl animate-drift" />
            <span className="absolute -inset-3 rounded-full border border-[#00F0FF]/25 animate-pulse-ring" />
          </>
        )}
        <PrepPilotsMark size={size} animated={animated} className="relative drop-shadow-[0_0_14px_rgba(0,240,255,0.55)]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-extrabold tracking-tight text-white">
          Prep<span className="neon-cyan-text">Pilots</span>
        </span>
        {subtitle && (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {subtitle}
          </span>
        )}
      </span>
    </div>
  )
}

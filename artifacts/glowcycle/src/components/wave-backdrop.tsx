type WaveBackdropProps = {
  className?: string;
};

const styles = `
@keyframes glow-wave-drift-a {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(18px, -10px, 0) scale(1.012); }
}

@keyframes glow-wave-drift-b {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-14px, 12px, 0) scale(1.01); }
}

@keyframes glow-wave-drift-c {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(12px, 6px, 0) scale(1.008); }
}

@keyframes glow-wave-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -1800; }
}

@media (prefers-reduced-motion: reduce) {
  .glow-wave-layer,
  .glow-wave-path {
    animation: none !important;
  }
}
`;

export function WaveBackdrop({ className = "" }: WaveBackdropProps) {
  return (
    <div aria-hidden className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="glow-wave-soft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f7c6d4" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#d9829b" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#800020" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="glow-wave-burgundy" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#800020" stopOpacity="0.56" />
            <stop offset="100%" stopColor="#f4aebe" stopOpacity="0.24" />
          </linearGradient>
          <linearGradient id="glow-wave-pink" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ff9fbd" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#f7c6d4" stopOpacity="0.48" />
          </linearGradient>
          <radialGradient id="glow-wave-wash" cx="50%" cy="44%" r="38%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="62%" stopColor="#fff5f8" stopOpacity="0.66" />
            <stop offset="100%" stopColor="#fff5f8" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-wave-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <rect width="1440" height="900" fill="url(#glow-wave-wash)" />
        <circle cx="190" cy="140" r="220" fill="#ffbad0" fillOpacity="0.22" filter="url(#glow-wave-blur)" />
        <circle cx="1240" cy="220" r="250" fill="#800020" fillOpacity="0.12" filter="url(#glow-wave-blur)" />
        <circle cx="520" cy="790" r="260" fill="#ffc8da" fillOpacity="0.18" filter="url(#glow-wave-blur)" />

        <g className="glow-wave-layer" style={{ animation: "glow-wave-drift-a 28s ease-in-out infinite" }}>
          <path
            className="glow-wave-path"
            d="M-60 214 C 120 150, 240 118, 382 146 S 650 256, 800 178 S 1080 42, 1490 174"
            fill="none"
            stroke="url(#glow-wave-soft)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="18 22"
            style={{ animation: "glow-wave-flow 30s linear infinite" }}
          />
        </g>

        <g className="glow-wave-layer" style={{ animation: "glow-wave-drift-b 32s ease-in-out infinite" }}>
          <path
            className="glow-wave-path"
            d="M-80 452 C 100 380, 250 320, 392 356 S 680 520, 840 436 S 1110 272, 1510 340"
            fill="none"
            stroke="url(#glow-wave-burgundy)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 26"
            style={{ animation: "glow-wave-flow 34s linear infinite reverse" }}
          />
        </g>

        <g className="glow-wave-layer" style={{ animation: "glow-wave-drift-c 30s ease-in-out infinite" }}>
          <path
            className="glow-wave-path"
            d="M50 760 C 210 682, 332 624, 474 648 S 750 758, 930 696 S 1170 548, 1490 610"
            fill="none"
            stroke="url(#glow-wave-pink)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="12 24"
            style={{ animation: "glow-wave-flow 38s linear infinite" }}
          />
        </g>
      </svg>

      <style>{styles}</style>
    </div>
  );
}

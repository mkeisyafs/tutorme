const RobotLogo = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 150 150"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="pencil-stroke">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    {/* Washi Tape Accent */}
    <rect x="52" y="6" width="46" height="18" fill="#fde047" opacity="0.85" transform="rotate(-8 75 15)" />
    
    <g transform="translate(15, 20)">
      {/* Bot Head */}
      <rect x="25" y="35" width="70" height="62" rx="20" fill="#60a5fa" stroke="#1e3a8a" strokeWidth="4.5" filter="url(#pencil-stroke)" />
      {/* Pencil Cap */}
      <polygon points="60,8 72,35 48,35" fill="#f472b6" stroke="#1e3a8a" strokeWidth="4" filter="url(#pencil-stroke)"/>
      <circle cx="60" cy="6" r="5" fill="#fde047" />
      {/* Eyes & Catchlights */}
      <circle cx="46" cy="60" r="6" fill="#1e3a8a" />
      <circle cx="74" cy="60" r="6" fill="#1e3a8a" />
      <circle cx="48" cy="58" r="2" fill="#ffffff" />
      <circle cx="76" cy="58" r="2" fill="#ffffff" />
      {/* Smile */}
      <path d="M 49,76 Q 60,84 71,76" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="38" cy="68" r="4.5" fill="#f472b6" opacity="0.75"/>
      <circle cx="82" cy="68" r="4.5" fill="#f472b6" opacity="0.75"/>
      {/* Sparkle */}
      <path d="M 104,18 L 106,23 L 111,25 L 106,27 L 104,32 L 102,27 L 97,25 L 102,23 Z" fill="#fde047" stroke="#1e3a8a" strokeWidth="1.5" />
    </g>
  </svg>
);

export default RobotLogo;

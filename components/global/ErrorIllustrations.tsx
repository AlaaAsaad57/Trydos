"use client";

// General Error Illustration
export function GeneralErrorIllustration({
  className = "w-48 h-48",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fee2e2" />
          <stop offset="100%" stopColor="#fecaca" />
        </linearGradient>
        <linearGradient id="deviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="90"
        fill="url(#errorGradient)"
        opacity="0.3"
      />

      {/* Computer/Device */}
      <rect
        x="60"
        y="75"
        width="80"
        height="50"
        rx="4"
        fill="url(#deviceGradient)"
        stroke="#6b7280"
        strokeWidth="2"
      />
      <rect x="65" y="80" width="70" height="35" rx="2" fill="#374151" />

      {/* Error X mark on screen */}
      <path
        d="M75 90 L85 100 M85 90 L75 100 M105 90 L115 100 M115 90 L105 100"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Device stand */}
      <rect x="90" y="125" width="20" height="8" fill="#6b7280" />
      <rect x="80" y="133" width="40" height="4" rx="2" fill="#6b7280" />

      {/* Floating error icons */}
      <circle cx="45" cy="60" r="6" fill="#ef4444" opacity="0.6">
        <animate
          attributeName="cy"
          values="60;50;60"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="155" cy="70" r="4" fill="#f97316" opacity="0.6">
        <animate
          attributeName="cy"
          values="70;60;70"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="40" cy="140" r="5" fill="#ef4444" opacity="0.4">
        <animate
          attributeName="cy"
          values="140;130;140"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Warning triangle */}
      <path d="M150 130 L160 150 L140 150 Z" fill="#f59e0b" opacity="0.7" />
      <circle cx="150" cy="142" r="2" fill="#ffffff" />
      <rect x="149" y="136" width="2" height="4" fill="#ffffff" />
    </svg>
  );
}

// Network/Connection Error Illustration
export function NetworkErrorIllustration({
  className = "w-48 h-48",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="networkGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="90"
        fill="url(#networkGradient)"
        opacity="0.3"
      />

      {/* Central device */}
      <rect x="85" y="85" width="30" height="30" rx="6" fill="#3b82f6" />
      <circle cx="100" cy="100" r="5" fill="#ffffff" />

      {/* Connection lines (broken) */}
      <g
        stroke="#6b7280"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="5,5"
      >
        <path d="M70 70 L85 85">
          <animate
            attributeName="stroke-dashoffset"
            values="0;10;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M130 70 L115 85">
          <animate
            attributeName="stroke-dashoffset"
            values="0;10;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M70 130 L85 115">
          <animate
            attributeName="stroke-dashoffset"
            values="0;10;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M130 130 L115 115">
          <animate
            attributeName="stroke-dashoffset"
            values="0;10;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Network nodes */}
      <circle cx="60" cy="60" r="8" fill="#64748b" opacity="0.6" />
      <circle cx="140" cy="60" r="8" fill="#64748b" opacity="0.6" />
      <circle cx="60" cy="140" r="8" fill="#64748b" opacity="0.6" />
      <circle cx="140" cy="140" r="8" fill="#64748b" opacity="0.6" />

      {/* WiFi signal (disconnected) */}
      <path
        d="M45 45 Q55 35 65 45"
        stroke="#ef4444"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M48 48 Q55 42 62 48"
        stroke="#ef4444"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />

      {/* Disconnection X */}
      <path
        d="M50 50 L60 60 M60 50 L50 60"
        stroke="#ef4444"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

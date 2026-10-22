import React from "react";

/**
 * The icons the XD file does not draw: the composer's plus, camera,
 * microphone, send and close marks, and the little pencil of the edit bar.
 *
 * Drawn in the chat boards' own manner — a thin round line, like the 26 px
 * phone and video marks of the conversation's header — so they sit with the
 * cut icons. `color` is the line's colour; the size is in px.
 */
const line = (size: number, color: string, width = 1.7) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "block shrink-0 pointer-events-none",
});

export function PlusIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CameraIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color)}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.1-1.7c.3-.4.7-.6 1.2-.6h3.2c.5 0 .9.2 1.2.6L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  );
}

export function MicIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color)}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3M9.5 20.5h5" />
    </svg>
  );
}

export function SendIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color, 1.9)}>
      <path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5" />
    </svg>
  );
}

export function CloseIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color)}>
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

/** The red dot that beats while a voice message is recorded. */
export function RecordDot({ color }: { color: string }) {
  return (
    <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true" className="block shrink-0">
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  );
}

/** The sheet of paper on a file message's card, in the call cards' 18 px box. */
export function FileIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color, 1.6)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

/** The pin over the map of a location message. */
export function PinIcon({ size = 30, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block shrink-0 pointer-events-none"
    >
      <path
        d="M12 2.5a7 7 0 0 0-7 7c0 5.1 6.2 11.3 6.5 11.6a.7.7 0 0 0 1 0C12.8 20.8 19 14.6 19 9.5a7 7 0 0 0-7-7Z"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.6" fill="#FFFFFF" />
    </svg>
  );
}

/** The arrow out of a box: "Open in Maps". */
export function OpenIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color, 1.8)}>
      <path d="M14 4h6v6M20 4l-9 9M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6H11" />
    </svg>
  );
}

/** The small "‹" before "Slide to cancel". */
export function ChevronLeftIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg {...line(size, color, 2)}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

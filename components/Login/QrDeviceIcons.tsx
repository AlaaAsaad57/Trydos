// Small brand icons for the QR approve sheets (components/Login/QrDeviceDetails).
// Plain SVG with flat colours and no gradients, so two copies on one page never
// share an element id. Every icon is decorative: the name sits next to it.
import type { ReactNode } from "react";

type IconProps = { kind: string };

export type BrowserKind = "chrome" | "safari" | "edge" | "firefox" | "samsung" | "opera" | "web";
export type SystemKind = "apple" | "android" | "windows" | "device";

/** The icon for a browser name from the user agent, such as "Mobile Safari". */
export function browserKind(name: string): BrowserKind {
  const n = name.toLowerCase();
  if (n.includes("edge")) return "edge";
  if (n.includes("samsung")) return "samsung";
  if (n.includes("opera")) return "opera";
  if (n.includes("firefox")) return "firefox";
  if (n.includes("chrom")) return "chrome";
  if (n.includes("safari")) return "safari";
  return "web";
}

/**
 * The icon for a system name ("iOS", "Mac OS", "Android", "Windows"), an app
 * platform ("ios", "android") or a device name ("Alaa's iPhone").
 */
export function systemKind(name: string): SystemKind {
  const n = name.toLowerCase();
  if (/\b(ios|ipados|mac ?os|macos|iphone|ipad|macbook)\b/.test(n)) return "apple";
  if (/\b(android|galaxy|pixel)\b/.test(n)) return "android";
  if (n.includes("windows")) return "windows";
  return "device";
}

const svg = (kind: string, children: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-icon={kind}>
    {children}
  </svg>
);

export function BrowserIcon({ kind }: IconProps) {
  switch (kind) {
    case "chrome":
      return svg(
        kind,
        <>
          <path d="M12 12 2.47 6.5A11 11 0 0 1 21.53 6.5Z" fill="#EA4335" />
          <path d="M12 12 21.53 6.5A11 11 0 0 1 12 23Z" fill="#FBBC05" />
          <path d="M12 12 12 23A11 11 0 0 1 2.47 6.5Z" fill="#34A853" />
          <circle cx="12" cy="12" r="5.2" fill="#fff" />
          <circle cx="12" cy="12" r="4.1" fill="#4285F4" />
        </>,
      );
    case "safari":
      return svg(
        kind,
        <>
          <circle cx="12" cy="12" r="11" fill="#1A8CFF" />
          <circle cx="12" cy="12" r="8.6" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.7" />
          <path d="M17.3 6.7 13.4 13.4 10.6 10.6Z" fill="#FF3B30" />
          <path d="M6.7 17.3 10.6 10.6 13.4 13.4Z" fill="#fff" />
        </>,
      );
    case "edge":
      return svg(
        kind,
        <>
          <circle cx="12" cy="12" r="11" fill="#0C83D9" />
          <path
            d="M5 15.5c1.2 3.6 5.8 5.6 9.7 4.3 2-.7 3.6-2 4.5-3.6-2.6 1.5-6.3 1.4-8.3-.6-1.6-1.6-1.4-4 .6-5 2.1-1 5.2-.2 6 2.1.5-3.6-2.6-6.6-6.5-6.4C7.3 6.5 4.2 10.4 5 15.5Z"
            fill="#4AC367"
          />
        </>,
      );
    case "firefox":
      return svg(
        kind,
        <>
          <circle cx="12" cy="12" r="11" fill="#FF7139" />
          <circle cx="12.6" cy="13" r="6.4" fill="#7542E5" />
          <path d="M6.2 9.4c1-2.6 3.6-4.2 6.4-4-1.6.8-2.5 2-2.6 3.4-1.4-.4-2.8-.2-3.8.6Z" fill="#FFBD4F" />
        </>,
      );
    case "samsung":
      return svg(
        kind,
        <>
          <circle cx="12" cy="12" r="11" fill="#7A7DFF" />
          <circle cx="12" cy="12" r="4.4" fill="#fff" />
          <ellipse
            cx="12"
            cy="12"
            rx="8.4"
            ry="3"
            fill="none"
            stroke="#fff"
            strokeWidth="1.4"
            transform="rotate(-25 12 12)"
          />
        </>,
      );
    case "opera":
      return svg(
        kind,
        <>
          <circle cx="12" cy="12" r="11" fill="#FF1B2D" />
          <ellipse cx="12" cy="12" rx="4.2" ry="7.4" fill="#fff" />
        </>,
      );
    default:
      return svg(
        "web",
        <g fill="none" stroke="#6B6B6B" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18" />
        </g>,
      );
  }
}

export function SystemIcon({ kind }: IconProps) {
  switch (kind) {
    case "apple":
      return svg(
        kind,
        <path
          fill="#1D1D1D"
          d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09ZM15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.71-.69 3.56-1.7"
        />,
      );
    case "android":
      return svg(
        kind,
        <>
          <path d="M2.5 19a9.5 9.5 0 0 1 19 0Z" fill="#3DDC84" />
          <path d="M6.8 11.6 4.6 7.8M17.2 11.6l2.2-3.8" stroke="#3DDC84" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8.3" cy="15.2" r="1.15" fill="#fff" />
          <circle cx="15.7" cy="15.2" r="1.15" fill="#fff" />
        </>,
      );
    case "windows":
      return svg(
        kind,
        <g fill="#0078D4">
          <rect x="3" y="3" width="8.5" height="8.5" />
          <rect x="12.5" y="3" width="8.5" height="8.5" />
          <rect x="3" y="12.5" width="8.5" height="8.5" />
          <rect x="12.5" y="12.5" width="8.5" height="8.5" />
        </g>,
      );
    default:
      return svg(
        "device",
        <g fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M12 16v4M8 20h8" />
        </g>,
      );
  }
}

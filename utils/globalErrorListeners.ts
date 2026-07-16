import auth from "../services/auth";
import { LogError } from "./functions";

// Last-resort capture for uncaught client errors. Next/Sentry auto-capture these
// for Sentry, but they never reach the backend `mobile_error_log` — so without
// this the affected users can't be simulated from the /simulateUser dashboard.
// Routing them through LogError sends them to BOTH Sentry and the backend (with
// the user's tokens), making every uncaught client error simulatable.

let installed = false;

// Messages that are noise or originate from the logging path itself. Logging
// any of these would risk an infinite loop once `unhandledrejection` is hooked.
const SKIP_SUBSTRINGS = [
  "/api/internal/mobile-error-log",
  "mobile_error_log",
  "ResizeObserver loop",
  "Script error",
  "signal is aborted without reason",
  "Fetch is aborted",
  "The user aborted a request.",
  "Failed to fetch",
  "Load failed",
];

// De-dupe identical messages fired in a short window (error storms / loops).
const recent = new Map<string, number>();
const DEDUPE_WINDOW_MS = 2000;

const shouldSkip = (message: string): boolean => {
  if (!message) return true;
  if (SKIP_SUBSTRINGS.some((s) => message.includes(s))) return true;

  const now = Date.now();
  const last = recent.get(message);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return true;
  recent.set(message, now);
  // Keep the map small.
  if (recent.size > 50) {
    for (const [key, ts] of recent) {
      if (now - ts > DEDUPE_WINDOW_MS) recent.delete(key);
    }
  }
  return false;
};

const getLocale = (): { country?: string; language?: string } => {
  try {
    const [country, language] = (
      window.location.pathname.split("/")[1] || ""
    ).split("-");
    return { country, language };
  } catch {
    return {};
  }
};

const report = (
  scenario: "window-onerror" | "unhandledrejection",
  message: string,
  stack?: string,
) => {
  if (shouldSkip(message)) return;
  const { country, language } = getLocale();
  // LogError is hardened to never throw; still guard the call site.
  try {
    LogError({
      type: "front-end-exception",
      scenario,
      message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      user_id: auth.UserID?.(),
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      country,
      language,
    });
  } catch {
    // best-effort
  }
};

export const installGlobalErrorListeners = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    const err = event.error;
    const message =
      (err instanceof Error ? err.message : undefined) ||
      event.message ||
      "Unknown window error";
    const stack = err instanceof Error ? err.stack : undefined;
    report("window-onerror", message, stack);
  });

  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : (() => {
                try {
                  return JSON.stringify(reason);
                } catch {
                  return String(reason);
                }
              })();
      const stack = reason instanceof Error ? reason.stack : undefined;
      report("unhandledrejection", message || "Unhandled promise rejection", stack);
    },
  );
};

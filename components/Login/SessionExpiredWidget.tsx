"use client";

import React, { useCallback } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

/**
 * Session-expired prompt for a previously verified shopper whose refresh
 * failed. By the time this renders, /api/auth/expire has already nuked the
 * dead session and registered a fresh guest — the app is usable behind the
 * prompt. Styled after the notification-allowance widget
 * (components/global/NotificationWidget.tsx).
 *
 * Login → hands off to the phone-verify widget (setShouldAuthinticated(true));
 * parked 401 requests keep waiting because the marker stays truthy.
 * Continue as Guest → cancels the re-auth wait and reloads so the UI drops the
 * stale logged-in state and renders the fresh guest session.
 */
function SessionExpiredWidget() {
  const { language, setShouldAuthinticated, setReAuthResult } = useAppStore();

  // Same seller detection the phone-verify widget's dismiss uses: a guest
  // can't stay on the seller dashboard, so both buttons behave differently.
  const isSeller =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/seller");

  const handleLogin = useCallback(() => {
    // reAuthResult stays "pending" — the OTP widget owns the outcome now. The
    // "seller" marker keeps its seller semantics (cancel redirects home).
    setShouldAuthinticated(isSeller ? "seller" : true);
  }, [setShouldAuthinticated, isSeller]);

  const handleContinueAsGuest = useCallback(() => {
    setReAuthResult("cancelled");
    setShouldAuthinticated(false);
    // Server state already moved to the fresh guest (expire nuked the old
    // session). A guest has no business on the seller dashboard — send them
    // to the storefront; elsewhere reload so server-rendered content stops
    // showing the old account — same teardown the phone-verify widget's
    // dismiss performs.
    if (isSeller) {
      window.location.href = "/";
      return;
    }
    window.location.reload();
  }, [setReAuthResult, setShouldAuthinticated, isSeller]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") handleContinueAsGuest();
    },
    [handleContinueAsGuest],
  );

  return (
    <div
      role="dialog"
      aria-label={translateFunction("Your session has expired", language)}
      aria-live="polite"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="fixed flex justify-center items-center top-0 z-9999999999 w-full backdrop-brightness-75 left-0 right-0 mx-auto h-dvh pointer-events-auto"
    >
      <div className="group w-[min(92vw,28rem)] sm:w-md regular rounded-2xl bg-white shadow-xl ring-1 ring-black/5 border border-zinc-100 px-4 py-4 sm:px-5 sm:py-5 transition-all duration-300">
        <div className="flex-col items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5d5d5d"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M16 11l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-zinc-900 text-base font-semibold tracking-tight mt-3">
              {translateFunction("Your session has expired", language)}
            </h3>
            <p className="mt-1 text-sm text-zinc-700">
              {translateFunction(
                "Please login again to get back to your account, or continue browsing as a guest.",
                language,
              )}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleLogin}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-[#1d1d1d] bg-[#ff6464] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
                aria-label={translateFunction("Login", language)}
              >
                {translateFunction("Login", language)}
              </button>
              <button
                onClick={handleContinueAsGuest}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
                aria-label={translateFunction("Continue as Guest", language)}
              >
                {translateFunction("Continue as Guest", language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiredWidget;

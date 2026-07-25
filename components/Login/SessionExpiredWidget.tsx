"use client";

import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

/**
 * Session-expired prompt for a previously verified shopper whose refresh
 * failed. By the time this renders, /api/auth/expire has already nuked the
 * dead session and registered a fresh guest — the app is usable behind the
 * prompt. Portaled to <body> (same as ConfirmMobilePhoneWidget) so it layers
 * above every surface, including other modals.
 *
 * Login → hands off to the phone-verify widget ("expired-login" marker, or
 * "seller" on the dashboard); parked 401 requests keep waiting because the
 * marker stays truthy. Continue as Guest → cancels the re-auth wait and
 * reloads (redirects home on seller routes) so the UI drops the stale
 * logged-in state and renders the fresh guest session.
 */
function SessionExpiredWidget() {
  const { language, setShouldAuthinticated, setReAuthResult } = useAppStore();

  // Same seller detection the phone-verify widget's dismiss uses: a guest
  // can't stay on the seller dashboard, so both buttons behave differently.
  const isSeller =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/seller");

  const handleLogin = useCallback(() => {
    // reAuthResult stays "pending" — the OTP widget owns the outcome now.
    // Dismissing that widget hard-reloads (seller routes redirect home
    // instead; success keeps the normal finalise path — never reload on
    // success).
    setShouldAuthinticated(isSeller ? "seller" : "expired-login");
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

  return createPortal(
    <div
      role="dialog"
      aria-label={translateFunction("Your session has expired", language)}
      aria-live="polite"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[9999999999999999] flex items-center justify-center bg-[#00000066] backdrop-blur-sm pointer-events-auto"
    >
      <div className="w-[min(92vw,30rem)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 px-6 py-8 sm:px-5 sm:py-6 flex flex-col items-center text-center transition-all duration-300">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#ff6464]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff6464"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M16 11l2 2 4-4" />
          </svg>
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">
          {translateFunction("Your session has expired", language)}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
          {translateFunction(
            "Please login again to get back to your account, or continue browsing as a guest.",
            language,
          )}
        </p>
        <div className="mt-7 w-full flex items-center gap-3 sm:flex-col">
          <button
            onClick={handleLogin}
            className="flex-1 sm:w-full inline-flex  items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold text-white bg-[#ff6464] hover:brightness-105 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
            aria-label={translateFunction("Login", language)}
          >
            {translateFunction("Login", language)}
          </button>
          <button
            onClick={handleContinueAsGuest}
            className="flex-1 sm:w-full inline-flex items-center justify-center rounded-2xl px-4 py-3 text-base font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98] transition"
            aria-label={translateFunction("Continue as Guest", language)}
          >
            {translateFunction("Continue as Guest", language)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default SessionExpiredWidget;

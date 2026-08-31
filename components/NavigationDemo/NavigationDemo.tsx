"use client";

import React from "react";
import BottomNav from "./BottomNav";

/**
 * A scrollable page, only so the bar has something to sit on top of and
 * something to react to. The bar itself is BottomNav.tsx.
 */
export default function NavigationDemo() {
  return (
    <div className="min-h-screen w-full bg-[#0b0b0d]">
      <div className="mx-auto w-full max-w-[560px] pb-[160px]">
        <p className="px-5 py-4 text-center text-[12px] leading-relaxed text-white/45">
          Scroll down — the bar scales down into its own centre. Scroll up — it
          scales back. Press the bar and it pulses once. Press and slide
          across it without lifting to move the indicator.
        </p>

        {Array.from({ length: 12 }).map((_, i) => (
          <section key={i} className="mb-2">
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="h-9 w-9 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(from ${i * 47}deg,#ff3d77,#ffb03c,#12c2e9,#7b2ff7,#ff3d77)`,
                }}
              />
              <p className="text-[13px] font-semibold text-white">seller_{i + 1}</p>
            </div>

            <div
              className="h-[420px] w-full"
              style={{
                background:
                  i % 3 === 0
                    ? `linear-gradient(${(i * 53) % 360}deg,#101418,#2a3a4a 45%,#0d1117)`
                    : i % 3 === 1
                      ? `linear-gradient(${(i * 71) % 360}deg,#ff9a3c,#ff3d77 40%,#7b2ff7 75%,#12c2e9)`
                      : `linear-gradient(${(i * 31) % 360}deg,#f7f7f7,#e6e9ef 50%,#ffffff)`,
              }}
            />

            <p className="px-4 py-3 text-[13px] leading-relaxed text-white/70">
              <span className="font-semibold text-white">seller_{i + 1}</span>{" "}
              Live in 2 hours — new drop, limited pieces.
            </p>
          </section>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

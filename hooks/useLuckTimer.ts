"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "store";
import { computeSecondsLeft, isRedeemed } from "utils/luck";

interface UseLuckTimerOpts {
  isLuck: boolean;
  /** false when the card is off-screen; the hook also folds in tab-hidden
   *  and in-app navigation. Defaults to true (always-visible surfaces). */
  visible?: boolean;
}

/**
 * Single source of truth for one product's luck countdown.
 * - starts (or rehydrates) the window on mount when `isLuck` and not redeemed
 * - pauses on navigation / tab-hidden / off-screen, resumes from remaining
 * - expires exactly once when the countdown reaches 0 while running
 */
export function useLuckTimer(
  id: string | number,
  { isLuck, visible = true }: UseLuckTimerOpts,
): { luckActive: boolean; secondsLeft: number } {
  const k = String(id);
  const timer = useAppStore((s) => s.luckByProduct[k]);
  const isNavigating = useAppStore((s) => s.isNavigating);
  const startLuck = useAppStore((s) => s.startLuck);
  const pauseLuck = useAppStore((s) => s.pauseLuck);
  const resumeLuck = useAppStore((s) => s.resumeLuck);
  const expireLuck = useAppStore((s) => s.expireLuck);

  const [tabHidden, setTabHidden] = useState(false);
  // The countdown is driven by this reactive `now` clock, resampled once per
  // second while running. It MUST be React state, not a render-time
  // `Date.now()` call: React Compiler (reactCompiler: true) cannot see
  // `Date.now()` as reactive, so it memoises `secondsLeft` on `timer` alone and
  // the displayed value freezes until `timer`'s identity next changes (only on
  // pause/resume). Keying the clock in state makes each tick a tracked change.
  const [now, setNow] = useState(() => Date.now());

  // Start / rehydrate the window once, for luck products only.
  useEffect(() => {
    if (isLuck && id != null && !isRedeemed(id)) startLuck(id);
  }, [id, isLuck, startLuck]);

  // Track tab visibility.
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const paused = Boolean(isNavigating) || tabHidden || visible === false;

  // Drive pause/resume from the single gate.
  useEffect(() => {
    if (!isLuck || !timer || timer.expired) return;
    if (paused) pauseLuck(id);
    else resumeLuck(id);
  }, [paused, isLuck, timer?.expired, id, pauseLuck, resumeLuck]);

  // 1-second tick, only while actively running. `now` is resampled the instant
  // the timer (re)starts/resumes, alongside the fresh deadlineTs, so there is
  // no frame where secondsLeft is inflated by the paused duration.
  const running = Boolean(timer && !timer.expired && timer.deadlineTs != null);
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [running]);

  const secondsLeft = computeSecondsLeft(timer, now);

  // Expire exactly once when a running countdown hits 0.
  useEffect(() => {
    if (running && secondsLeft <= 0 && timer && !timer.expired) {
      expireLuck(id);
    }
  }, [running, secondsLeft, timer?.expired, id, expireLuck]);

  const luckActive = Boolean(isLuck) && !(timer?.expired ?? false);
  return { luckActive, secondsLeft };
}

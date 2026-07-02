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
  // `tick` is only a re-render trigger; the displayed value is computed from a
  // live clock below so a resumed/re-shown timer never paints a stale value.
  const [, setTick] = useState(0);

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

  // 1-second re-render cadence, only while actively running.
  const running = Boolean(timer && !timer.expired && timer.deadlineTs != null);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 1000);
    return () => clearInterval(iv);
  }, [running]);

  // Read the clock at render time (not a cached `now` state): on resume the
  // fresh deadlineTs and the clock are sampled together, so there is no frame
  // where secondsLeft is inflated by the paused duration.
  const secondsLeft = computeSecondsLeft(timer, Date.now());

  // Expire exactly once when a running countdown hits 0.
  useEffect(() => {
    if (running && secondsLeft <= 0 && timer && !timer.expired) {
      expireLuck(id);
    }
  }, [running, secondsLeft, timer?.expired, id, expireLuck]);

  const luckActive = Boolean(isLuck) && !(timer?.expired ?? false);
  return { luckActive, secondsLeft };
}

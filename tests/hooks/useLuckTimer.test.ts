import { describe, expect, it, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLuckTimer } from "hooks/useLuckTimer";
import { useAppStore } from "store";

describe("useLuckTimer hook", () => {
  beforeEach(() => {
    useAppStore.setState({
      luckByProduct: {},
      isNavigating: false,
    });
  });

  it("returns luckActive false when isLuck parameter is false", () => {
    const { result } = renderHook(() => useLuckTimer(101, { isLuck: false }));
    expect(result.current.luckActive, "luckActive should be false when product is not luck").toBe(false);
  });

  it("initializes luck timer on mount when isLuck is true", () => {
    const { result } = renderHook(() => useLuckTimer(101, { isLuck: true }));
    expect(result.current.luckActive, "luckActive should be true for initialized luck product").toBe(true);
  });

  it("pauses timer when visible is false or isNavigating is true in store", () => {
    renderHook(() => useLuckTimer(101, { isLuck: true, visible: false }));
    const timerState = useAppStore.getState().luckByProduct["101"];
    expect(timerState?.deadlineTs, "deadlineTs should be null when paused via visible=false").toBeNull();
  });

  it("expires timer when expired flag is set in store", () => {
    useAppStore.getState().startLuck(101, 300);
    useAppStore.getState().expireLuck(101);

    const { result } = renderHook(() => useLuckTimer(101, { isLuck: true }));
    expect(result.current.luckActive, "luckActive should be false after expiration").toBe(false);
  });
});

describe("useLuckTimer — the countdown reaching zero", () => {
  it("expires the product once its running countdown hits zero", async () => {
    const { vi } = await import("vitest");
    const { act } = await import("@testing-library/react");
    vi.useFakeTimers();
    try {
      useAppStore.setState({ luckByProduct: {}, isNavigating: false } as any);
      useAppStore.getState().startLuck(202, 2);
      const { result } = renderHook(() => useLuckTimer(202, { isLuck: true }));
      expect(result.current.luckActive, "the luck product did not start active").toBe(true);
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      expect(useAppStore.getState().luckByProduct["202"]?.expired, "the countdown did not expire at zero").toBe(true);
      expect(result.current.luckActive, "an expired luck product still shows as active").toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

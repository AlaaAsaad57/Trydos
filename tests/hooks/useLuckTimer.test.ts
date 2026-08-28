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

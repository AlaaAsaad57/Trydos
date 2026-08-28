import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsTouchDevice } from "hooks/useIsTouchDevice";

describe("useIsTouchDevice hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false on standard desktop non-touch screens with window width > 768", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(navigator, "maxTouchPoints", { writable: true, configurable: true, value: 0 });
    delete (window as any).ontouchstart;

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current, "desktop non-touch screen should return false").toBe(false);
  });

  it("returns true on small screens (width <= 768)", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current, "small screen <= 768 should return true").toBe(true);
  });

  it("returns true when pointer is coarse (touch device)", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current, "coarse pointer match should return true").toBe(true);
  });
});

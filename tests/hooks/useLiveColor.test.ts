import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLiveParam, useLiveColor } from "hooks/useLiveColor";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("color=red&size=L"),
}));

describe("useLiveColor & useLiveParam hooks", () => {
  it("extracts query search param from URL when present", () => {
    const { result } = renderHook(() => useLiveParam("size", "M"));
    expect(result.current, "should return 'L' from query params").toBe("L");
  });

  it("falls back to server value when query param is absent", () => {
    const { result } = renderHook(() => useLiveParam("brand", "Nike"));
    expect(result.current, "should fall back to server default 'Nike'").toBe("Nike");
  });

  it("useLiveColor returns live color query param", () => {
    const { result } = renderHook(() => useLiveColor("blue"));
    expect(result.current, "should return 'red' from color search param").toBe("red");
  });
});

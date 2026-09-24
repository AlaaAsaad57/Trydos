// utils/usePhoneInput.tsx — the phone field on the profile form. It keeps the
// typed prefix (+, 0 or 00), cuts the digits to the country's length, and says
// whether the number is complete for that country.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePhoneInput } from "utils/usePhoneInput";

/** Pick the country from the leading digits, the way the form does. */
const getCountry = (raw: string) => {
  if (raw.startsWith("963")) return { iso2: "SY" };
  if (raw.startsWith("961")) return { iso2: "lb" };
  if (raw.startsWith("964")) return { iso2: "iq" };
  if (raw.startsWith("90")) return { iso2: "tr" };
  return null;
};

describe("usePhoneInput", () => {
  it.each([
    ["+963912345678", "963912345678", true, 12],
    ["0096391234567", "96391234567", false, 12],
    ["96171234567", "96171234567", true, 12],
    ["9647701234567", "9647701234567", true, 13],
    ["905551234567", "905551234567", true, 12],
    ["0441234567890", "441234567890", true, 13],
    ["12345", "12345", false, 13],
  ])("reads %s as %s (complete: %s, max %s)", (typed, digits, valid, maxLen) => {
    const { result } = renderHook(() => usePhoneInput({ initial: typed, getCountry }));
    expect(
      [result.current.modifiedValue, result.current.valid, result.current.maxLen],
      `the phone "${typed}" was read wrongly`,
    ).toEqual([digits, valid, maxLen]);
  });

  it("keeps the typed prefix and cuts the digits to the country's length", () => {
    const { result } = renderHook(() => usePhoneInput({ getCountry }));
    act(() => result.current.setValue("+963 912-345-678999"));
    expect(result.current.value, "the prefix was lost or the digits were not cut").toBe("+963912345678");
    expect(result.current.data, "the normalized digits are wrong").toBe("963912345678");
    act(() => result.current.setValue("abc"));
    expect(result.current.value, "letters were kept").toBe("");
  });

  it("follows a new initial value from outside", () => {
    const { result, rerender } = renderHook(({ initial }) => usePhoneInput({ initial, getCountry }), {
      initialProps: { initial: "" },
    });
    rerender({ initial: "00905551234567999" });
    expect(result.current.value, "the new initial value was not taken and cut").toBe("00905551234567");
  });
});

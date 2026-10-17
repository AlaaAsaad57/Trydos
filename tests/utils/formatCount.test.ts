import { describe, expect, it } from "vitest";

import { formatCount } from "utils/formatCount";

describe("showing a big count in short form (formatCount)", () => {
  it("shows a count under 1,000 as it is", () => {
    expect(formatCount(0), "zero should stay 0").toBe("0");
    expect(formatCount(7), "7 should stay 7").toBe("7");
    expect(formatCount(999), "999 should stay 999").toBe("999");
  });

  it("shows thousands with K and one decimal", () => {
    expect(formatCount(1000), "1,000 should show as 1K, with no .0").toBe("1K");
    expect(formatCount(1250), "1,250 should show as 1.2K").toBe("1.2K");
    expect(formatCount(10000), "10,000 should show as 10K").toBe("10K");
    expect(formatCount(123456), "123,456 should show as 123.4K").toBe("123.4K");
  });

  it("rounds down, so a count never looks bigger than it is", () => {
    expect(formatCount(1999), "1,999 should show as 1.9K, not 2K").toBe("1.9K");
    expect(formatCount(999999), "999,999 should show as 999.9K, not 1000K").toBe("999.9K");
    expect(formatCount(1999999), "1,999,999 should show as 1.9M, not 2M").toBe("1.9M");
  });

  it("shows millions with M and billions with B", () => {
    expect(formatCount(1000000), "1,000,000 should show as 1M").toBe("1M");
    expect(formatCount(2500000), "2,500,000 should show as 2.5M").toBe("2.5M");
    expect(formatCount(1000000000), "1,000,000,000 should show as 1B").toBe("1B");
    expect(formatCount(3700000000), "3,700,000,000 should show as 3.7B").toBe("3.7B");
  });

  it("uses the Arabic letters in Arabic, the same as the prices do", () => {
    expect(formatCount(1200, "ar"), "Arabic thousands use أ").toBe("1.2أ");
    expect(formatCount(1200000, "ar"), "Arabic millions use م").toBe("1.2م");
    expect(formatCount(1200000000, "ar"), "Arabic billions use مليار").toBe("1.2مليار");
  });

  it("uses the Latin letters in Turkish and Kurdish", () => {
    expect(formatCount(1200, "tr"), "Turkish thousands use K").toBe("1.2K");
    expect(formatCount(1200, "ku"), "Kurdish thousands use K").toBe("1.2K");
  });

  it("accepts a count that the backend sent as text", () => {
    expect(formatCount("15300"), 'the text "15300" should show as 15.3K').toBe("15.3K");
  });

  it("shows 0 for a missing or broken count instead of NaN", () => {
    expect(formatCount(undefined), "a missing count should show 0").toBe("0");
    expect(formatCount(null), "a null count should show 0").toBe("0");
    expect(formatCount("abc"), "a count that is not a number should show 0").toBe("0");
  });
});

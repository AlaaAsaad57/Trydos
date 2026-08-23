import { describe, expect, it } from "vitest";

import { formatPhoneInternational } from "utils/formatPhone";

describe("formatting a phone number for display (formatPhoneInternational)", () => {
  it("formats a Syrian number in E.123 groups", () => {
    expect(formatPhoneInternational("+963937288307")).toBe("+963 937 288 307");
  });

  it("formats a Turkish number in E.123 groups", () => {
    expect(formatPhoneInternational("+905528002000")).toBe("+90 552 800 2000");
  });

  it("formats a Lebanese number in E.123 groups", () => {
    expect(formatPhoneInternational("+96170123456")).toBe("+961 70 123 456");
  });

  it("formats an Iraqi number in E.123 groups", () => {
    expect(formatPhoneInternational("+9647501234567")).toBe("+964 750 123 4567");
  });

  it("strips formatting characters and re-groups the digits", () => {
    expect(formatPhoneInternational("+90 (552) 800-20-00")).toBe(
      "+90 552 800 2000",
    );
  });

  it("accepts a number given as a numeric value", () => {
    expect(formatPhoneInternational(963937288307)).toBe("+963 937 288 307");
  });

  it("falls back to +<digits> when the dial code is not recognised", () => {
    expect(formatPhoneInternational("+9991234567890")).toBe("+9991234567890");
  });

  it("formats an Emirati number in E.123 groups", () => {
    expect(formatPhoneInternational("+971501234567")).toBe("+971 50 123 4567");
  });

  it("groups a known country that has no grouping of its own in threes", () => {
    // +44 is a known dial code, but there is no `gb` entry in NATIONAL_GROUPS,
    // so the generic grouper runs and merges the short trailing group back.
    expect(formatPhoneInternational("+447911123456")).toBe("+44 791 112 3456");
  });

  it("returns the dial code alone when there is nothing after it", () => {
    // 1242 is itself a dial code and clears the four-digit floor, so the
    // "matched, but no national number" path is a real one.
    expect(formatPhoneInternational("1242")).toBe("+1242");
  });

  it("returns an empty string for an empty value", () => {
    expect(formatPhoneInternational("")).toBe("");
    expect(formatPhoneInternational(null)).toBe("");
    expect(formatPhoneInternational(undefined)).toBe("");
  });

  it("returns an empty string for fewer than four digits", () => {
    expect(formatPhoneInternational("+963")).toBe("");
    expect(formatPhoneInternational("123")).toBe("");
  });

  it("formats four digits, so short junk comes back looking like a number", () => {
    // Four digits is the only floor. "1234" starts with the US dial code, so a
    // PIN typed into a phone field is rendered rather than rejected.
    expect(formatPhoneInternational("1234")).toBe("+1 234");
  });

  it("adds the international prefix when the number is given without one", () => {
    expect(formatPhoneInternational("963937288307")).toBe("+963 937 288 307");
  });

  it("leaves a leading national zero in place, matching the current behaviour", () => {
    // The helper strips non-digits but does not remove a leading zero, so the
    // dial code is not found at the front. This documents today's behaviour; if
    // national zeros should be dropped, change the helper and this test.
    expect(formatPhoneInternational("0963937288307")).toBe("+0963937288307");
  });

  it("keeps only the leading plus and drops one typed in the middle", () => {
    expect(formatPhoneInternational("+90+5551234567")).toBe("+90 555 123 4567");
  });
});

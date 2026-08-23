import { describe, expect, it } from "vitest";

import { isValidPhone } from "utils/phone";

describe("deciding whether a phone number looks verified (isValidPhone)", () => {
  it("accepts a normal international number", () => {
    expect(isValidPhone("+963937288307")).toBe(true);
  });

  it("accepts a number with spaces, dashes and a plus", () => {
    expect(isValidPhone("+90 552 800 20 00")).toBe(true);
  });

  it("accepts a number given as a numeric value", () => {
    expect(isValidPhone(905528002000)).toBe(true);
  });

  it("rejects an empty value", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
  });

  it("rejects a string with no digits", () => {
    expect(isValidPhone("not-a-phone")).toBe(false);
  });

  it("rejects the sentinel values people type before a country code", () => {
    // A lone "0" or "00" is not a real number.
    expect(isValidPhone("0")).toBe(false);
    expect(isValidPhone("00")).toBe(false);
    expect(isValidPhone("0000")).toBe(false);
  });

  it("rejects a number that is too short", () => {
    expect(isValidPhone("12345")).toBe(false);
  });

  it("rejects a number that is too long", () => {
    expect(isValidPhone("1234567890123456")).toBe(false);
  });

  it("holds the 10-to-15-digit range at both ends", () => {
    // The exact edges, so an off-by-one in the length check cannot slip past.
    expect(isValidPhone("123456789")).toBe(false); // 9
    expect(isValidPhone("1234567890")).toBe(true); // 10
    expect(isValidPhone("123456789012345")).toBe(true); // 15
  });

  it("rejects a number made only of formatting characters", () => {
    expect(isValidPhone("+-() ")).toBe(false);
  });
});

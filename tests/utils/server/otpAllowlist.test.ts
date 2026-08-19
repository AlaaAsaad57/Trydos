// @vitest-environment node
//
// The OTP test-number allowlist — the one list that turns our rate limiter off,
// and only for the numbers written in it.
//
// WHAT THIS FILE IS REALLY GUARDING
// Two failures matter here and they point in opposite directions.
//   • Too narrow: the list is written by a person into an environment variable,
//     so it will arrive with a `+`, with spaces, with a stray space after a
//     comma. If any of those stop it matching, the exemption silently does
//     nothing and the testers it exists for stay locked out — with no error to
//     tell anyone why.
//   • Too wide: an empty or unset value must exempt NOBODY. That is the value
//     production runs on, so a bug there is the limiter quietly switched off for
//     everyone.
// Both directions are asserted, and the "off" case is asserted more than once
// because it is the dangerous one.
//
// The module keeps a parsed copy of the list, so the last block checks it
// follows a changed value rather than answering from the first one it ever saw.
// Nothing here is stood in: the module reads the environment and compares
// strings, and there is nothing else in it to stand in for.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isAllowlistedTestPhone } from "utils/server/otpAllowlist";

/** Reserved, non-routable numbers — never real ones. */
const LISTED = "+999000000001";
const NOT_LISTED = "+999000000002";

beforeEach(() => {
  vi.stubEnv("OTP_TEST_PHONES", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("when the list names a number", () => {
  it.each([
    ["exactly as configured", "999000000001", "999000000001"],
    ["with a leading plus in the list", "+999000000001", "999000000001"],
    ["with a leading plus in the number", "999000000001", "+999000000001"],
    ["punctuated in the list", "+999 (000) 000-001", "999000000001"],
    ["punctuated in the number", "999000000001", "+999 (000) 000-001"],
    ["one entry among several", "999000000002,999000000001", "+999000000001"],
    ["with untidy separators", " 999000000002 , +999-000-000-001 ", LISTED],
  ])("recognises it %s", (_case, configured, phone) => {
    vi.stubEnv("OTP_TEST_PHONES", configured);

    expect(isAllowlistedTestPhone(phone)).toBe(true);
  });
});

describe("when the list does not name a number", () => {
  it("does not recognise a number that is simply not in it", () => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001,999000000003");

    expect(isAllowlistedTestPhone(NOT_LISTED)).toBe(false);
  });

  // The digits have to match end to end. A prefix or a longer number that
  // happens to contain a listed one is a different phone.
  it.each([
    ["a longer number containing it", "9990000000011"],
    ["a prefix of it", "999000000"],
  ])("does not recognise %s", (_case, phone) => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001");

    expect(isAllowlistedTestPhone(phone)).toBe(false);
  });
});

describe("when there is no list", () => {
  // This is what production runs on. Every one of these has to be "no", or the
  // limiter is off for everybody.
  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["only separators", ",,, ,"],
    ["only punctuation", "+-() "],
  ])("exempts nobody — %s", (_case, configured) => {
    if (configured === undefined) {
      vi.stubEnv("OTP_TEST_PHONES", undefined as unknown as string);
    } else {
      vi.stubEnv("OTP_TEST_PHONES", configured);
    }

    expect(isAllowlistedTestPhone(LISTED)).toBe(false);
    expect(isAllowlistedTestPhone(NOT_LISTED)).toBe(false);
  });

  it("says no to an empty number, whatever the list holds", () => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001");

    expect(isAllowlistedTestPhone("")).toBe(false);
    expect(isAllowlistedTestPhone("+++ () --")).toBe(false);
  });
});

describe("when the list changes", () => {
  // The parsed copy is kept per value, not per process. If it were kept per
  // process, a number removed from the list would stay exempt until the server
  // restarted — and the test above would still pass, because it only ever reads
  // one value.
  it("follows the new value rather than the first one it read", () => {
    vi.stubEnv("OTP_TEST_PHONES", "999000000001");
    expect(isAllowlistedTestPhone(LISTED)).toBe(true);

    vi.stubEnv("OTP_TEST_PHONES", "999000000002");
    expect(isAllowlistedTestPhone(LISTED)).toBe(false);
    expect(isAllowlistedTestPhone(NOT_LISTED)).toBe(true);

    vi.stubEnv("OTP_TEST_PHONES", "");
    expect(isAllowlistedTestPhone(NOT_LISTED)).toBe(false);
  });
});

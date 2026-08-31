// The `[lang]` URL segment, and whether it is one this app actually serves.
//
// The bug this file was written for: nothing under app/(client)/[lang] checked
// the segment at all. proxy.ts does validate the locale pair, but its `missing:`
// clause skips RSC, prefetch and Server Action requests, so a request for
// /zz-qq/... reached the segment directly and rendered.
//
// Today that only wastes a render. Once Cache Components is used on these
// routes the segment becomes part of the cache key, so an unchecked segment is
// an unbounded number of cache entries a stranger can create.
//
// The country is checked by shape, not against a list, on purpose: proxy.ts
// reads the real country list from the backend at runtime, so a hardcoded list
// here would 404 a country the moment the backend adds one. Two lowercase
// letters bounds the key space without ever refusing a real country.

import { describe, expect, it } from "vitest";

import { isSupportedLocaleSegment } from "utils/locale";

describe("isSupportedLocaleSegment", () => {
  it.each(["sy-en", "gb-en", "tr-ar", "iq-ku", "lb-tr"])(
    "accepts %s, a locale the app serves today",
    (segment) => {
      expect(
        isSupportedLocaleSegment(segment),
        `${segment} is a real locale of this app and was refused, so every page ` +
          `under it would 404`,
      ).toBe(true);
    },
  );

  it("accepts a country the backend could add tomorrow", () => {
    expect(
      isSupportedLocaleSegment("jo-ar"),
      "a two-letter country the hardcoded lists do not mention was refused; " +
        "proxy.ts reads its country list from the backend, so this would 404 a " +
        "real country the day it is added",
    ).toBe(true);
  });

  it("refuses a language the app has no translations for", () => {
    expect(
      isSupportedLocaleSegment("sy-de"),
      "a language outside en/ar/tr/ku was accepted, so it would become its own " +
        "cache key while rendering English",
    ).toBe(false);
  });

  it("refuses the unknown locale that reaches the segment past the proxy", () => {
    expect(
      isSupportedLocaleSegment("zz-qq"),
      "/zz-qq/ is the exact request that skips proxy.ts validation on an RSC " +
        "or prefetch navigation, and it was accepted",
    ).toBe(false);
  });

  it.each(["syria-en", "s-en", "SY-EN", "sy_en", "sy-en-extra", "sy-"])(
    "refuses the malformed segment %s",
    (segment) => {
      expect(
        isSupportedLocaleSegment(segment),
        `${segment} is not a locale this app ever writes, and it was accepted`,
      ).toBe(false);
    },
  );

  it("refuses a segment carrying attacker text", () => {
    expect(
      isSupportedLocaleSegment("<script>alert(1)</script>-en"),
      "a segment holding markup was accepted, so it would reach the render and " +
        "the cache key",
    ).toBe(false);
  });

  it.each([["", "an empty string"], [null, "null"], [undefined, "undefined"]])(
    "refuses %s (%s)",
    (segment) => {
      expect(
        isSupportedLocaleSegment(segment as unknown),
        "a missing segment was accepted instead of refused",
      ).toBe(false);
    },
  );
});

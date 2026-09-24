// @vitest-environment node
//
// utils/server/index.tsx — the server-only translator and the date and label
// helpers that use it. These run during a server render, where the client
// translator would still be loading and would hand back English.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ar from "public/translations/translations.ar.js";

import {
  countryNameFromIso,
  formatTime,
  madeInText,
  ShowDayStr,
  translateFunction,
} from "utils/server";

describe("translateFunction (server)", () => {
  it("reads the key from the language table, and falls back to the key", () => {
    expect(translateFunction("Made In {country}", "ar"), "the Arabic entry was not used").toBe(
      (ar as any)["Made In {country}"],
    );
    expect(translateFunction("no such key", "ar"), "a missing key did not fall back").toBe("no such key");
    expect(translateFunction("Made In {country}", "en"), "English did not use the key itself").toBe(
      "Made In {country}",
    );
  });
});

describe("countryNameFromIso and madeInText", () => {
  it("has no label without a country", () => {
    expect(countryNameFromIso(undefined), "a missing code got a name").toBeNull();
    expect(madeInText(undefined), "a missing code got a label").toBeNull();
  });

  it("puts the localized country name into the translated template", () => {
    const name = countryNameFromIso("TR", "ar");
    expect(name, "Turkey has no Arabic name").toBeTruthy();
    expect(madeInText("TR", "ar"), "the Arabic label is wrong").toBe(
      (ar as any)["Made In {country}"].replace("{country}", name),
    );
    expect(madeInText("TR"), "the default English label is wrong").toBe(
      `Made In ${countryNameFromIso("TR", "en")}`,
    );
  });

  it("uses the upper-case code when the code has no name", () => {
    expect(countryNameFromIso("qq", "en"), "an unknown code was not kept").toBe("QQ");
  });
});

describe("formatTime (server)", () => {
  const NOW = new Date("2026-08-16T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says Today or Yesterday with the time", () => {
    expect(formatTime("2026-08-16T12:00:00", "en"), "today is wrong").toMatch(/^Today \| \d{2}:\d{2}:\d{2}$/);
    const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatTime(yesterday, "en"), "yesterday is wrong").toMatch(/^Yesterday \| /);
  });

  it("writes day and month for a later day this year", () => {
    const later = new Date("2026-10-05T12:00:00Z");
    expect(formatTime("2026-10-05T12:00:00Z", "en"), "the later-date format is wrong").toBe(
      `${later.getDate()} October`,
    );
  });

  it("writes the full date for anything older, and survives a value that is not text", () => {
    expect(formatTime("2020-03-04T09:30:00Z", "en"), "the full date is wrong").toMatch(
      /^\d{2}\/\d{2}\/2020 \| \d{2}:\d{2}:\d{2}$/,
    );
    expect(formatTime(undefined as any, "en"), "a missing value threw or read as a date").toContain("NaN");
  });

  // Same fault as the client copy in utils/tinyUtils.tsx (BUG-utils-2).
  it("BUG-utils-2: reads a timestamp that carries a +hh:mm offset", () => {
    expect(
      formatTime("2020-03-04T09:30:00+03:00", "en"),
      "a valid offset timestamp came out as NaN, because the retry adds the same 'Z' again",
    ).toMatch(/^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2}:\d{2}$/);
  });
});

describe("ShowDayStr (server)", () => {
  it("names the weekday in the given language", () => {
    expect(ShowDayStr(1, "en"), "Monday is wrong").toBe("Monday");
    expect(ShowDayStr(0, "ar"), "Sunday was not looked up in Arabic").toBe(
      translateFunction("Sunday", "ar"),
    );
  });
});

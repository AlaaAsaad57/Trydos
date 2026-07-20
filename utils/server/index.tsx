import ar from "public/translations/translations.ar.js";
import ku from "public/translations/translations.ku.js";
import tr from "public/translations/translations.tr.js";

// This module statically bundles all three translation tables (~400KB raw) so
// server components can translate synchronously. It must therefore never be
// imported from client-graph code — client components import the pure helpers
// from utils/server/helpers (or utils/server/country) instead, and translate
// via the async-cached client translateFunction in utils/functions.
export * from "./helpers";
export * from "./country";

import { countryNameFromIso } from "./country";

const translations = { ar, ku, tr };

export function translateFunction(key: string, language: string) {
  return translations[language]?.[key] || key;
}

// Build the localized "Made In <country>" label. Country name is localized and
// inserted into a per-language template so word order stays correct (e.g. tr/ku
// place the country first).
export function madeInText(iso?: string, language = "en"): string {
  const country = countryNameFromIso(iso, language);
  if (!country) return null;
  return translateFunction("Made In {country}", language).replace(
    "{country}",
    country,
  );
}

export const formatTime = (timeString: string, language) => {
  const MONTH_NAMES = [
    translateFunction("January", language),
    translateFunction("February", language),
    translateFunction("March", language),
    translateFunction("April", language),
    translateFunction("May", language),
    translateFunction("June", language),
    translateFunction("July", language),
    translateFunction("August", language),
    translateFunction("September", language),
    translateFunction("October", language),
    translateFunction("November", language),
    translateFunction("December", language),
  ];
  const timeStr = typeof timeString === "string" ? timeString : String(timeString ?? "");
  let date = !timeStr.includes("Z")
    ? new Date(timeStr + "Z")
    : new Date(timeStr);
  if (isNaN(date?.getTime())) {
    date = new Date(timeString + "Z");
  }
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const timeFormat = `${hours}:${minutes}:${seconds}`;

  if (date.toDateString() === today.toDateString()) {
    return `Today | ${timeFormat}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday | ${timeFormat}`;
  }

  const isSameYear = date.getFullYear() === today.getFullYear();
  const isNewerThanToday = date > today;

  if (isSameYear && isNewerThanToday) {
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    return `${day} ${monthName}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year} | ${timeFormat}`;
};

// Server-side weekday name. Mirrors utils/tinyUtils.ShowDayStr but resolves the
// translation synchronously via the server translateFunction (statically
// imported translations), so it never falls back to English during RSC render.
export const ShowDayStr = (index: number, language: string) => {
  const days = [
    translateFunction("Sunday", language),
    translateFunction("Monday", language),
    translateFunction("Tuesday", language),
    translateFunction("Wednesday", language),
    translateFunction("Thursday", language),
    translateFunction("Friday", language),
    translateFunction("Saturday", language),
  ];
  return days[index];
};

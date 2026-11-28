import type { XdIconName } from "../DemoApp/xdIcons";

/**
 * The flag a country row shows (OQ-5 of Stage 7e, UI-MIGRATION-PLAN.md).
 *
 * The design's own row flags exist for four countries only. Syria's is
 * `flagSyRow`: the files draw Syria with the Turkish flag, so its row flag was
 * drawn in the same style. Any other country shows its standard flag from
 * `public/icons/flag`.
 *
 * Real screens use this, so it lives outside the `/demo` data files (S7e-6).
 */
const DESIGN_FLAGS: Readonly<Record<string, XdIconName>> = {
  tr: "flagTr",
  sy: "flagSyRow",
  iq: "flagIq",
  lb: "flagLb",
};

export type CountryFlag = { flag?: XdIconName; flagSrc?: string };

/** `flag` for a country of the design's set, else `flagSrc`; nothing for an empty code. */
export function countryFlag(iso: string | null | undefined): CountryFlag {
  const code = (iso ?? "").trim().toLowerCase();
  if (!code) return {};
  const flag = DESIGN_FLAGS[code];
  return flag ? { flag } : { flagSrc: `/icons/flag/${code}.svg` };
}

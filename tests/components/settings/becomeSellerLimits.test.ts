// @vitest-environment node
//
// BUG-2 — the inline length limits did not match the backend's.
//
// `MAX_LENGTH_FIELDS` in `BecomeSellerModal.tsx` carries a comment saying it
// mirrors the backend's vendor-request validation, "so we surface the same
// limit inline before submit instead of after a 422".
//
// It did not mirror it. The backend also caps `location_name` at 10, and that
// field was missing from the map — so a seller typing a longer location name
// got no inline warning, filled the whole form, pressed submit, and was handed
// a raw 422 from the server.
//
// Measured against staging on 2026-09-19:
//   POST /shop/vendor-requests -> 422
//   "The location name field must not be greater than 10 characters."
//
// **Why this is a source-text check.** The map is a module-level constant in a
// large `"use client"` component that pulls in the store, the router, toasts
// and the media uploader. Rendering the whole modal to read one table would
// test all of that instead, and would still not say which field is missing.
// The claim here is about the table itself, so the table is what is read.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/** Every field the backend caps at 10 characters on a vendor request. Each one
 *  was learned from the backend refusing it by name. */
const CAPPED_BY_THE_BACKEND = [
  "f_name",
  "l_name",
  "shop_name",
  "location_name",
];

const mapSource = (): string => {
  const source = readFileSync(
    resolve(process.cwd(), "components/settings/BecomeSellerModal.tsx"),
    "utf8",
  );
  const start = source.indexOf("const MAX_LENGTH_FIELDS");
  expect(
    start,
    "BecomeSellerModal no longer declares MAX_LENGTH_FIELDS, so the inline length limits have moved or gone and this check is reading nothing",
  ).toBeGreaterThan(-1);

  const end = source.indexOf("};", start);
  return source.slice(start, end);
};

describe("the become-a-seller form's length limits", () => {
  it.each(CAPPED_BY_THE_BACKEND)("caps %s inline, like the backend", (field) => {
    expect(
      new RegExp(String.raw`${field}\s*:\s*10`).test(mapSource()),
      `the backend refuses a vendor request whose "${field}" is over 10 characters, and the form does not warn about it first — so the seller fills the whole form, submits, and is handed a raw 422`,
    ).toBe(true);
  });

  it("does not cap a field the backend leaves alone", () => {
    // The control. A map that capped everything at 10 would pass every check
    // above while refusing addresses the backend accepts.
    expect(
      new RegExp(String.raw`shop_address\s*:\s*10`).test(mapSource()),
      "the form caps shop_address at 10 characters, which the backend does not — a seller cannot enter a real address",
    ).toBe(false);
  });
});

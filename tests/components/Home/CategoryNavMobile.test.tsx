// Where does a tile in the categories bar send the shopper?
//
// D-13 moved the category view from `/{lang}?mainCategory={slug}` to
// `/{lang}/categories/{slug}`, and D-14 says the old address is NOT redirected.
// So a tile that still builds the old address does not just take a slower
// route — it lands on the plain home page and the category filter silently does
// nothing.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CategoryNavMobile from "components/Home/CategoryNavMobile";

const renderTile = (props: Record<string, unknown> = {}) =>
  render(
    <CategoryNavMobile
      name="Shoes"
      icon="icon.svg"
      outline="outline.svg"
      myKey="1"
      slug="shoes"
      active={false}
      params={{ lang: "sy-en" }}
      mainCategory=""
      {...props}
    />,
  );

describe("a tile in the categories bar", () => {
  it("links to the category route, not the old query address", () => {
    renderTile();

    expect(
      screen.getByRole("link").getAttribute("href"),
      "the categories bar still points at /{lang}?mainCategory={slug}. That address is not redirected (D-14), so the shopper lands on the plain home page and the category is never applied",
    ).toBe("/sy-en/categories/shoes");
  });

  it("keeps the locale it was given", () => {
    renderTile({ params: { lang: "lb-ar" }, slug: "bags" });

    expect(
      screen.getByRole("link").getAttribute("href"),
      "the tile dropped or rewrote the locale, so the shopper would leave their own country and language",
    ).toBe("/lb-ar/categories/bags");
  });

  it("sends the shopper back to the home page when its own category is already open", () => {
    // Tapping the open category is how a shopper clears the filter. That is
    // existing behaviour and it must survive the move to the new route.
    renderTile({ mainCategory: "shoes" });

    expect(
      screen.getByRole("link").getAttribute("href"),
      "tapping the category that is already open no longer clears the filter",
    ).toBe("/sy-en");
  });
});

// One guard for the whole app, because the categories bar was not the only
// place that built the old address — the "category created" notification did
// too, and nothing pointed at the new route at all.
describe("nothing in the app builds the old category address", () => {
  it("has no component left that links to ?mainCategory=", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join, resolve, sep } = await import("node:path");

    const ROOT = resolve(__dirname, "../../..");
    const offenders: string[] = [];

    const descend = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = join(directory, entry.name);
        if (entry.isDirectory()) {
          descend(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;

        // Comments are stripped first. Three files explain the move in prose
        // and name the old address while doing it; counting those would make
        // the guard impossible to keep green without deleting the explanation.
        const source = readFileSync(full, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|\s)\/\/.*$/gm, "$1");

        // A link, not a mention. `mainCategory` is still a legitimate PROP name
        // passed between components; what must not survive is the address.
        for (const line of source.split(/\r?\n/)) {
          if (/[`"'][^`"']*\?mainCategory=/.test(line))
            offenders.push(full.slice(ROOT.length + 1).split(sep).join("/"));
        }
      }
    };

    for (const folder of ["components", "app"]) descend(join(ROOT, folder));

    expect(
      [...new Set(offenders)],
      "these files still build the old `?mainCategory=` address. It is not redirected (D-14), so every one of them lands the shopper on the plain home page with no category applied",
    ).toEqual([]);

    // The self-check: prove the scan really reads files and really matches.
    // Without this an empty result could mean "nothing found" or "nothing read".
    expect(
      statSync(join(ROOT, "components/Home/CategoryNavMobile.tsx")).isFile(),
      "the scan is looking in the wrong place — the categories bar is not where this test thinks it is",
    ).toBe(true);
    expect(
      /[`"'][^`"']*\?mainCategory=/.test('href={`/${lang}?mainCategory=${slug}`}'),
      "the pattern no longer matches the address it is meant to catch, so a clean result proves nothing",
    ).toBe(true);
  });
});

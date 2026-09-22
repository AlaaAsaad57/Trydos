// Every push we show must carry a grouping `tag`, so a new card replaces the
// old one instead of stacking.
//
// Why this matters: the backend pushes to the `market` topic, and a burst of
// pushes used to leave one card per message in the user's notification centre.
// Browsers read that as spam, and so do users. The chat branch of the worker
// already grouped per conversation (`chat-<id>`); `MARKET_TAG_RULES` does the
// same for the eleven `market` types.
//
// The worker is `public/firebase-messaging-sw.js`. Nothing imports it — the
// browser loads it as a classic service worker script, so there is no module to
// import here. Instead we slice the rules block out of the file and evaluate
// just that, which is why a syntax error anywhere else in the worker does not
// reach this test. The narrow slice is the point: it keeps the test about the
// tag table and nothing else.
//
// What a failure here means: somebody added a `market` type to the worker and
// gave it no tag rule (that type is then untagged and stacks again), or changed
// a rule's scope. A scope change is the dangerous one — dropping `product_slug`
// from a product alert makes an alert about one product silently delete the
// alert about another.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type MarketBody = Record<string, unknown>;
type BuildMarketTag = (body: MarketBody) => string | null;

function loadBuildMarketTag(): BuildMarketTag {
  const source = readFileSync(
    join(process.cwd(), "public/firebase-messaging-sw.js"),
    "utf8",
  );
  const start = source.indexOf("const MARKET_TAG_RULES");
  const end = source.indexOf("messaging.onBackgroundMessage");
  expect(
    start,
    "public/firebase-messaging-sw.js no longer declares MARKET_TAG_RULES — the tag table was renamed or deleted",
  ).toBeGreaterThan(-1);
  expect(
    end,
    "public/firebase-messaging-sw.js no longer calls messaging.onBackgroundMessage — this test cannot find the end of the tag block",
  ).toBeGreaterThan(start);
  const block = source.slice(start, end);
  return new Function(`${block}\nreturn buildMarketTag;`)() as BuildMarketTag;
}

const buildMarketTag = loadBuildMarketTag();

describe("market notification tags", () => {
  // One row per `market` type the worker handles. Adding a type to the worker
  // without adding it here leaves the type untagged in production.
  const cases: Array<[string, MarketBody, string]> = [
    ["boutique created", { type: "boutique created" }, "market-boutique-created"],
    ["category created", { type: "category created" }, "market-category-created"],
    ["product cart expiration", { type: "product cart expiration" }, "market-cart-expiration"],
    ["product hurry up", { type: "product hurry up now" }, "market-cart-hurry-up"],
    ["product availability", { type: "product availability", product_slug: "p-1" }, "market-availability-p-1"],
    ["product discount", { type: "product discount", product_slug: "p-2" }, "market-discount-p-2"],
    ["product comment", { type: "product comment", product_slug: "p-3" }, "market-comment-p-3"],
    ["product before stock out", { type: "product before stock out", product_slug: "p-4" }, "market-before-stock-out-p-4"],
    ["product when change in price", { type: "product when change in price", product_slug: "p-5" }, "market-price-change-p-5"],
    ["order placed", { type: "order placed", order_group_id: 77 }, "market-order-placed-77"],
    ["order status changed", { type: "order status changed to shipped", order_group_id: 88 }, "market-order-status-88"],
  ];

  it.each(cases)(
    'the "%s" push is tagged',
    (type, body, expected) => {
      expect(
        buildMarketTag(body),
        `the "${type}" push carries no grouping tag, so every one of them stacks as its own card`,
      ).toBe(expected);
    },
  );

  it("keeps one card per product, so two product alerts never delete each other", () => {
    const shirt = buildMarketTag({ type: "product availability", product_slug: "shirt" });
    const shoes = buildMarketTag({ type: "product availability", product_slug: "shoes" });
    expect(
      shoes,
      `two products share the tag "${shirt}" — the alert the user asked for on one product is wiped out by the other`,
    ).not.toBe(shirt);
  });

  it("keeps one card per order, so two orders never delete each other", () => {
    const first = buildMarketTag({ type: "order status changed to shipped", order_group_id: 1 });
    const second = buildMarketTag({ type: "order status changed to shipped", order_group_id: 2 });
    expect(
      second,
      `two orders share the tag "${first}" — an update about one order wipes out the update about the other`,
    ).not.toBe(first);
  });

  it("collapses repeated boutique broadcasts into one card", () => {
    const first = buildMarketTag({ type: "boutique created", boutique_slug: "x" });
    const second = buildMarketTag({ type: "boutique created", boutique_slug: "y" });
    expect(
      second,
      "two boutique broadcasts got different tags, so a marketing burst still stacks one card per message",
    ).toBe(first);
  });

  it("leaves an unknown type untagged rather than guessing a tag", () => {
    expect(
      buildMarketTag({ type: "a type the backend added later" }),
      "an unknown type was given a tag — sharing one tag would make two unrelated notifications delete each other",
    ).toBeNull();
  });

  it("leaves a payload with no type untagged", () => {
    expect(
      buildMarketTag({}),
      "a payload with no type was given a tag, which would group it with every other typeless payload",
    ).toBeNull();
  });
});

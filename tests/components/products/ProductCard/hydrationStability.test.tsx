// The same card, the same props, two different moments — the markup must not
// change.
//
// WHY THIS IS THE RIGHT INVARIANT
//
// `ProductCard` is a client component that is also rendered on the server. Its
// markup is therefore produced twice: once by the server, and once again in the
// browser when React hydrates it. Those two renders never happen in the same
// millisecond. Anything the card reads from the clock during render will differ
// between them, React calls that a hydration mismatch, and it answers by
// throwing the whole subtree away and rebuilding it on the client.
//
// Measured on a production build before the fix: the featured row disappeared
// for 733ms on every home page load (skeleton at 445ms, nothing at 846ms,
// products at 1579ms), the boutiques section jumped up 884px and back down
// again, and the browser console carried React error #418 — "the server
// rendered HTML didn't match the client... this tree will be regenerated".
//
// So the test does not look at a countdown value. It renders the card at two
// moments a second apart and compares the markup, which is exactly the
// comparison React makes.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductCard from "components/products/ProductCard";
import { buildListingProduct } from "../../../fixtures/product";

// A deal that is still running, so the card renders its countdown. A card with
// no deal has nothing to read the clock for and could never show this bug.
const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const product = buildListingProduct({
  flash_deal_end_date: TOMORROW,
  flash_deal_price: 60,
} as never);

// `renderToStaticMarkup`, not `render`. This has to be the SERVER render: the
// markup produced before any effect has run, because that is the markup React
// compares against when it hydrates. Testing Library's `render` flushes effects
// first, so it would show the settled client state and hide the very difference
// this test exists to catch.
const renderAt = (isoTime: string) => {
  vi.setSystemTime(new Date(isoTime));
  return renderToStaticMarkup(
    <ProductCard
      product={product}
      currency={{ code: "USD", rate: 1 }}
      country="sy"
      language="en"
      sliders={false}
    />,
  );
};

// jsdom has no IntersectionObserver, and both the card and the flash banner
// build one on mount. Without this the test goes red on a missing browser API,
// which would say nothing about the bug it is here to catch.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

describe("a product card rendered at two different moments", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", NoopObserver);
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("produces the same markup one second later", () => {
    const first = renderAt("2026-09-01T10:00:00.000Z");
    const second = renderAt("2026-09-01T10:00:01.000Z");

    expect(
      second,
      "the card's markup changed between two renders one second apart. The server and the browser never render in the same millisecond, so React sees this as a hydration mismatch and rebuilds the whole row — which is the featured section vanishing for most of a second on every page load",
    ).toBe(first);
  });

  it("produces the same markup a minute later", () => {
    // A minute, because a cached entry is up to 60 seconds old (cacheLife
    // "homepage"). Anything the card reads from the clock is that stale by the
    // time a browser hydrates it.
    const first = renderAt("2026-09-01T10:00:00.000Z");
    const second = renderAt("2026-09-01T10:01:00.000Z");

    expect(
      second,
      "the card's markup changed between two renders a minute apart, which is the age a cached home page entry can reach",
    ).toBe(first);
  });

  it("still renders the card, so the comparison is not between two empty strings", () => {
    // The positive control. Two identical empty renders would pass the checks
    // above while proving nothing at all.
    const html = renderAt("2026-09-01T10:00:00.000Z");

    expect(
      html.length,
      `the card rendered ${html.length} characters, so there is nothing for the comparison above to compare`,
    ).toBeGreaterThan(200);
  });
});

// Hydrate the server markup and let React itself say whether it matched. The
// two-render comparison above catches a clock read; this is meant to catch ANY
// difference between what the server writes and what the browser's first
// render produces — a store rehydrated from storage, a `window` check, a media
// query.
//
// HONEST LABEL: this one is a REGRESSION GUARD, not the test that confirmed the
// bug. It was green before the fix as well as after, so it never covered it.
// The confirming test is "produces the same markup one second later" above,
// which was seen red first.
//
// It also does not yet reproduce the mismatch that is still visible in a real
// browser on /sy-en. That one needs the real store, the real cookies and a real
// product, none of which this isolated render has. Until it does, a pass here
// is not evidence that the page is clean — the browser measurement is.
describe("hydrating the server markup of a product card", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", NoopObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not report a mismatch", async () => {
    const { hydrateRoot } = await import("react-dom/client");
    const { act } = await import("react");

    const card = (
      <ProductCard
        product={product}
        currency={{ code: "USD", rate: 1 }}
        country="sy"
        language="en"
        sliders={false}
      />
    );

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(card);
    document.body.appendChild(container);

    const complaints: string[] = [];
    const realError = console.error;
    console.error = (...args: unknown[]) => {
      complaints.push(args.map(String).join(" "));
    };

    try {
      await act(async () => {
        hydrateRoot(container, card);
      });
    } finally {
      console.error = realError;
    }

    const mismatches = complaints.filter((c) =>
      /hydrat|did not match|server rendered/i.test(c),
    );

    expect(
      mismatches.join("\n").slice(0, 2000),
      "React reported a hydration mismatch on a product card. It answers one by throwing the whole row away and rebuilding it, which is the featured section vanishing on every page load",
    ).toBe("");
  });
});

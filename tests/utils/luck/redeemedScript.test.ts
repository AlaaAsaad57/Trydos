import { describe, it, expect } from "vitest";
import {
  hideRedeemedLuck,
  REDEEMED_LUCK_SCRIPT,
  LUCK_BADGE_MARKER,
} from "utils/luck/redeemedScript";

function pageWith(ids: (string | number)[]) {
  document.body.innerHTML = ids
    .map((id) => `<span data-luck-badge="${id}" class="flex">lucky</span>`)
    .join("");
  return document;
}

const cookieFor = (entries: { id: string | number }[]) =>
  encodeURIComponent(JSON.stringify(entries));

describe("hideRedeemedLuck", () => {
  it("hides the badge of a product this browser already redeemed", () => {
    const doc = pageWith([10, 20]);
    hideRedeemedLuck(doc, cookieFor([{ id: 10 }]));

    expect(
      doc.querySelector('[data-luck-badge="10"]')?.getAttribute("hidden"),
      "the badge of an already-redeemed product is still showing, so the shopper is offered a luck price they cannot take",
    ).not.toBeNull();
  });

  it("takes the badge out of the layout, not only out of the accessibility tree", () => {
    const doc = pageWith([10]);
    hideRedeemedLuck(doc, cookieFor([{ id: 10 }]));

    expect(
      (doc.querySelector('[data-luck-badge="10"]') as HTMLElement).style.display,
      "the badge carries a Tailwind `flex` class, and an author `display:flex` beats the browser's own rule for the `hidden` attribute — so the attribute alone leaves the badge on screen",
    ).toBe("none");
  });

  it("leaves a badge the shopper has not redeemed alone", () => {
    const doc = pageWith([10, 20]);
    hideRedeemedLuck(doc, cookieFor([{ id: 10 }]));

    expect(
      doc.querySelector('[data-luck-badge="20"]')?.getAttribute("hidden"),
      "a badge the shopper never redeemed was hidden, so a live luck offer disappeared",
    ).toBeNull();
  });

  it("matches a numeric id against a string id", () => {
    const doc = pageWith([10]);
    hideRedeemedLuck(doc, cookieFor([{ id: "10" }]));

    expect(
      doc.querySelector('[data-luck-badge="10"]')?.getAttribute("hidden"),
      "the cookie stored the id as text and the markup as a number, and they did not match — so redeemed products keep showing their badge",
    ).not.toBeNull();
  });

  it("hides nothing when there is no cookie", () => {
    const doc = pageWith([10, 20]);
    const hidden = hideRedeemedLuck(doc, "");

    expect(
      hidden,
      "badges were hidden for a shopper with no redemption record at all",
    ).toBe(0);
  });

  it("hides nothing when the cookie is not readable", () => {
    const doc = pageWith([10, 20]);
    const hidden = hideRedeemedLuck(doc, "%7Bnot json");

    expect(
      hidden,
      "an unreadable cookie hid badges instead of being ignored; a corrupt cookie must never remove a live offer",
    ).toBe(0);
  });

  it("survives a cookie that holds something other than a list", () => {
    const doc = pageWith([10]);

    expect(
      () => hideRedeemedLuck(doc, encodeURIComponent('{"id":10}')),
      "a cookie holding an object instead of a list threw, and this script runs before paint — a throw there blanks the page",
    ).not.toThrow();
  });

  it("reports how many badges it hid", () => {
    const doc = pageWith([10, 20, 30]);

    expect(
      hideRedeemedLuck(doc, cookieFor([{ id: 10 }, { id: 30 }])),
      "the count of hidden badges is wrong, so the browser proof in step 8 cannot tell a working script from one that selected nothing",
    ).toBe(2);
  });
});

describe("REDEEMED_LUCK_SCRIPT", () => {
  it("can never close the <script> element that carries it", () => {
    expect(
      /<\/script/i.test(REDEEMED_LUCK_SCRIPT),
      "the inline script contains the sequence that ends a <script> element, so the browser would stop parsing it and treat the rest as page markup",
    ).toBe(false);
  });

  it("parses as JavaScript", () => {
    expect(
      () => new Function(REDEEMED_LUCK_SCRIPT),
      "the inline script does not parse, so it throws on every page in the app before anything is drawn",
    ).not.toThrow();
  });

  it("names the cookie it reads", () => {
    expect(
      REDEEMED_LUCK_SCRIPT.includes("redemed_ids"),
      "the inline script does not name the redeemed-products cookie, so it reads nothing and hides nothing",
    ).toBe(true);
  });

  it("hides a redeemed badge when it is run as the browser runs it", () => {
    // The function form is tested above. This runs the STRING form — the thing
    // the page actually carries — including its own cookie read, because a
    // wrapper that reads the wrong cookie name would leave every test above
    // green while the feature does nothing on the site.
    document.cookie = `redemed_ids=${encodeURIComponent(
      JSON.stringify([{ id: 10 }]),
    )}; path=/`;
    pageWith([10, 20]);

    new Function(REDEEMED_LUCK_SCRIPT)();

    expect(
      (document.querySelector('[data-luck-badge="10"]') as HTMLElement).style
        .display,
      "running the inline script left a redeemed badge on screen, so the script and the function it is built from do not agree",
    ).toBe("none");
    expect(
      (document.querySelector('[data-luck-badge="20"]') as HTMLElement).style
        .display,
      "running the inline script hid a badge the shopper never redeemed",
    ).toBe("");

    document.cookie = "redemed_ids=; max-age=0; path=/";
  });

  it("selects the same attribute the markup carries", () => {
    expect(
      REDEEMED_LUCK_SCRIPT.includes(LUCK_BADGE_MARKER),
      "the inline script and the badge markup disagree about the attribute name, so the script selects no elements and the feature silently does nothing",
    ).toBe(true);
  });
});

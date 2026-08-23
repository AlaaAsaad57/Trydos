// Where a guest lands — country and language, decided by `proxy.ts`.
//
// Four things decide the address a guest ends up on, and they do not all carry
// the same weight:
//
//   1. the locale already in the address,
//   2. the country and language saved from an earlier visit (cookies),
//   3. the country the platform says the request came from,
//   4. the languages the browser asks for.
//
// A saved country beats a detected one, because it is a choice the visitor made
// and detection is a guess. A country the app does not serve falls back to the
// default one and asks. These cases pin that order down.
//
// They read redirects rather than rendered pages, on purpose — every decision
// here is made before a page exists. See `actions/locale.ts`.
//
// These are the one place a spec builds an address, and the README's rule
// against it still stands everywhere else. Here the address **is** the subject:
// a case about what the app does with `/tr-en` cannot ask a helper to find that
// address for it. The country in it is still never hard-coded — it comes from
// the app's own picker.
//
// **On the overlap with `tests/proxy.test.ts`.** That file already checks these
// branches by calling `proxy()` directly with a made-up request. These cases do
// not replace it and do not try to: they prove the branch is reached at all when
// a real Next server runs, which a unit test cannot — the matcher, the header
// names, the redirect statuses and the cookies all have to be right for anything
// here to pass.

import { expect, test } from "./fixtures";
import { arriveAsGuest, pickCountries } from "./actions/locale";

// Written as a browser sends them, weights and all, because that is what the
// app parses. Neither list contains English: a language the app knows must be
// picked because it is asked for, not because English happened to be missing.
const ARABIC_BROWSER = "ar-IQ,ar;q=0.9";
const UNSUPPORTED_BROWSER = "fr-FR,fr;q=0.9,de;q=0.8";

// A crawler. `proxy.ts` keeps a list of names it treats as one; Googlebot is the
// one whose behaviour actually costs money when it is wrong.
const CRAWLER =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

// Used wherever a case is about the address and not about what is on it. The
// home page builds its sections from the search backend; a plain page does not,
// so these cases stay about routing even when staging is slow.
const PLAIN_PAGE = "/about";

test.describe("where a guest lands", () => {
  test("a guest from a country we serve goes straight there", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    const arrival = await arriveAsGuest({ fromCountry: served[0] });

    expect(arrival.country).toBe(served[0]);
    expect(
      arrival.askedToPickCountry,
      "asked a visitor to pick a country we already knew",
    ).toBe(false);
  });

  test("a guest from a country we do not serve is asked to pick one", async ({
    page,
  }) => {
    const { foreign } = await pickCountries(page);
    test.skip(!foreign, "every candidate country is now served");

    const arrival = await arriveAsGuest({ fromCountry: foreign });

    // Not "which country" — the default is the app's to change. What matters is
    // that it did not pretend to serve one it does not, and that it asked.
    expect(arrival.country).not.toBe(foreign);
    expect(arrival.askedToPickCountry).toBe(true);
  });

  test("a browser asking for a language we have gets it", async ({ page }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    const arrival = await arriveAsGuest({
      fromCountry: served[0],
      browserLanguages: ARABIC_BROWSER,
    });

    expect(arrival.language).toBe("ar");
    expect(arrival.country, "the language answer moved the country").toBe(
      served[0],
    );
  });

  test("a browser asking for a language we do not have gets English", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    const arrival = await arriveAsGuest({
      fromCountry: served[0],
      browserLanguages: UNSUPPORTED_BROWSER,
    });

    expect(arrival.language).toBe("en");
    expect(arrival.country).toBe(served[0]);
  });

  test("a saved country beats the country the visitor is in", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [saved, travellingIn] = served;

    // Someone who chose a country, then opened the site from somewhere else.
    // Their choice stands: guessing from an IP address would undo it every time
    // they travel or use a VPN.
    const arrival = await arriveAsGuest({
      fromCountry: travellingIn,
      saved: { country: saved, language: "en" },
    });

    expect(arrival.country).toBe(saved);
    expect(arrival.askedToPickCountry).toBe(false);
  });

  test("an address for a different country than the saved one asks which to keep", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [saved, inAddress] = served;

    // A shared link is the everyday case: someone saved Iraq, a friend sends
    // them a Turkish address. The app must not silently switch their country,
    // and must not silently ignore the link either — so it asks.
    const arrival = await arriveAsGuest({
      path: `/${inAddress}-en`,
      saved: { country: saved, language: "en" },
    });

    expect(arrival.hops, "the app switched country without asking").toHaveLength(
      1,
    );
    expect(arrival.countryConflict).toEqual({ inAddress, saved });
  });

  test("an address with no country falls back to the saved one, keeping the path", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // A path a person could really have bookmarked before the locale prefix
    // existed, or typed by hand.
    const arrival = await arriveAsGuest({
      path: "/about",
      saved: { country: served[0], language: "ar" },
    });

    expect(arrival.country).toBe(served[0]);
    expect(arrival.language).toBe("ar");
    expect(arrival.askedToPickCountry).toBe(false);
    expect(
      arrival.url.pathname,
      "the page they asked for was dropped on the way",
    ).toBe(`/${served[0]}-ar/about`);
  });

  test("a hyphenated address with no country keeps its path too", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // The case above passes on any path without a hyphen. `/privacy-policy` has
    // one, which is what a pair like `gb-en` has, and it used to be read as
    // country "privacy" plus language "policy" — the segment was then taken off
    // as a prefix and the visitor arrived at the home page. It is the address on
    // app stores and in payment paperwork, so it cannot be a redirect to home.
    const arrival = await arriveAsGuest({
      path: "/privacy-policy",
      saved: { country: served[0], language: "ar" },
    });

    expect(arrival.country).toBe(served[0]);
    expect(arrival.language).toBe("ar");
    expect(
      arrival.url.pathname,
      "the page they asked for was dropped on the way",
    ).toBe(`/${served[0]}-ar/privacy-policy`);
  });
});

test.describe("an address the app can serve as it is", () => {
  test("an address matching the saved country and language is served untouched", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    const arrival = await arriveAsGuest({
      path: `/${served[0]}-en${PLAIN_PAGE}`,
      saved: { country: served[0], language: "en" },
    });

    expect(
      arrival.hops,
      "bounced a visitor who was already in the right place",
    ).toEqual([]);
    expect(arrival.status).toBe(200);
    // And it does not write the cookies again. They already say this, and a
    // `Set-Cookie` on every page view is noise.
    expect(arrival.savedAfter.country).toBe("");
  });

  test("a valid address with nothing saved is served, and the choice is saved", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // Someone opening a shared link, having never been here before.
    const arrival = await arriveAsGuest({
      path: `/${served[0]}-ar${PLAIN_PAGE}`,
    });

    expect(arrival.hops).toEqual([]);
    expect(arrival.status).toBe(200);
    expect(arrival.savedAfter).toEqual({ country: served[0], language: "ar" });
  });

  test("an address already carrying the pick-a-country marker is served, not bounced again", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // This is the address the picker is shown on. Bouncing it again would be a
    // loop the visitor could never get out of.
    const arrival = await arriveAsGuest({
      path: `/${served[0]}-en${PLAIN_PAGE}?no-country=true`,
    });

    expect(arrival.hops).toEqual([]);
    expect(arrival.status).toBe(200);
    expect(arrival.savedAfter).toEqual({ country: served[0], language: "en" });
  });

  test("an address already carrying the country-change marker is served, not bounced again", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [saved, inAddress] = served;

    // The address the country-change case bounces to. The disagreement is still
    // real, so the rule that produced it must not fire a second time.
    const arrival = await arriveAsGuest({
      path: `/${inAddress}-en${PLAIN_PAGE}?changed-country=${inAddress},${saved}`,
      saved: { country: saved, language: "en" },
    });

    expect(arrival.hops).toEqual([]);
    expect(arrival.status).toBe(200);
  });
});

test.describe("saved values that are only half there", () => {
  test("a saved country with no saved language is ignored", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [half, detected] = served;

    // Half a saved pair must not half-apply. Either it is a complete choice or
    // it is not a choice at all, and detection decides.
    const arrival = await arriveAsGuest({
      saved: { country: half },
      fromCountry: detected,
    });

    expect(arrival.country).toBe(detected);
  });

  test("a global address with a saved country but no saved language still goes to that country", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // `gb` is the global bucket — "we do not know where you are" — not a
    // market, and the app shows the country picker on every gb address. So
    // someone who has already chosen a country must not be left on one.
    //
    // Everywhere else half a saved pair counts for nothing, and that is right:
    // a country with no language decides only half a locale. Here it decides
    // all of it, because the address already carries the language. Without
    // this, losing one cookie stranded a visitor on the global address with the
    // picker in front of them and a country already chosen.
    //
    // The address says Arabic, so Arabic is what they keep — this would pass
    // just as well against a version that reset everyone to English.
    const arrival = await arriveAsGuest({
      path: `/gb-ar${PLAIN_PAGE}`,
      saved: { country: served[0] },
    });

    expect(arrival.hops).toHaveLength(1);
    expect(arrival.country).toBe(served[0]);
    expect(arrival.language, "the language they were reading was not kept").toBe(
      "ar",
    );
    // And the half-set state heals: the language is written back too.
    expect(arrival.savedAfter).toEqual({ country: served[0], language: "ar" });
  });

  test("a gb address with a different saved country goes to the saved country", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // gb is the default, which means it is also where everyone lands when
    // detection fails. Someone who has already chosen must not be left there.
    const arrival = await arriveAsGuest({
      path: `/gb-en${PLAIN_PAGE}`,
      saved: { country: served[0], language: "en" },
    });

    expect(arrival.hops).toHaveLength(1);
    expect(arrival.country).toBe(served[0]);
    expect(arrival.savedAfter).toEqual({ country: served[0], language: "en" });
  });
});

test.describe("crawlers", () => {
  test("a crawler on a valid address is served it, and given no cookies", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    const arrival = await arriveAsGuest({
      path: `/${served[0]}-en${PLAIN_PAGE}`,
      userAgent: CRAWLER,
    });

    expect(arrival.hops).toEqual([]);
    expect(arrival.status).toBe(200);
    // Cookies are how a person is remembered. A crawler has no session to
    // remember, and a `Set-Cookie` on an indexed page is a caching problem.
    expect(arrival.savedAfter).toEqual({ country: "", language: "" });
  });

  test("a crawler with no country in the address gets a permanent redirect to one", async () => {
    const arrival = await arriveAsGuest({ userAgent: CRAWLER });

    // Permanent, not temporary: a crawler remembers this answer, so a 307 here
    // would have it ask again forever.
    expect(arrival.hops[0]?.status).toBe(308);
    expect(arrival.country).not.toBe("");
    expect(arrival.language).not.toBe("");
  });

  test("a crawler is never asked to pick a country", async ({ page }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [saved, inAddress] = served;

    // The same disagreement that asks a person. A crawler cannot answer a
    // popup, so indexing that page would index the popup.
    const arrival = await arriveAsGuest({
      path: `/${inAddress}-en${PLAIN_PAGE}`,
      saved: { country: saved, language: "en" },
      userAgent: CRAWLER,
    });

    expect(arrival.countryConflict).toBeNull();
    expect(arrival.askedToPickCountry).toBe(false);
    expect(arrival.hops).toEqual([]);
  });
});

test.describe("answering the country picker", () => {
  test("the answer is remembered, and the next visit is not asked", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [chosen, elsewhere] = served;

    // What the picker sends (`utils/PopupCountry.tsx`): the chosen pair in the
    // address, the choice already written to cookies, and a marker saying "this
    // is an answer, not a guess".
    const answering = await arriveAsGuest({
      path: `/${chosen}-en?_bypass=popup-selection`,
      saved: { country: chosen, language: "en" },
    });

    expect(answering.savedAfter).toEqual({ country: chosen, language: "en" });

    // The whole point of answering: it sticks, even from somewhere else.
    const nextVisit = await arriveAsGuest({
      saved: answering.savedAfter,
      fromCountry: elsewhere,
    });

    expect(nextVisit.country).toBe(chosen);
    expect(nextVisit.askedToPickCountry).toBe(false);
  });

  test("an answer arriving with other query values still remembers the choice", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // A leftover value on the address used to mean the answer came back as a
    // fresh redirect carrying no cookies, so the choice was lost and the picker
    // asked again. See the note at proxy.ts:428.
    const arrival = await arriveAsGuest({
      path: `/${served[0]}-en${PLAIN_PAGE}?_bypass=popup-selection&page=2`,
      saved: { country: served[0], language: "en" },
    });

    expect(arrival.savedAfter).toEqual({ country: served[0], language: "en" });
    expect(arrival.url.searchParams.get("_bypass")).toBeNull();
    expect(
      arrival.url.searchParams.get("page"),
      "the rest of the address was thrown away",
    ).toBe("2");
  });

  test("an answer with no country in the address still lands on a proper address", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // Without a pair in the address there is no answer to save, so skipping the
    // rules would strand the visitor on an address with no country at all.
    const arrival = await arriveAsGuest({
      path: `${PLAIN_PAGE}?_bypass=popup-selection`,
      saved: { country: served[0], language: "en" },
    });

    expect(arrival.country).toBe(served[0]);
    expect(arrival.url.pathname).toBe(`/${served[0]}-en${PLAIN_PAGE}`);
  });
});

test.describe("when the app has bounced too many times", () => {
  test("it stops on a default address and asks, rather than looping", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // Saved values that would normally decide the answer. Past the limit they
    // are set aside — the point is to stop, not to be right.
    const arrival = await arriveAsGuest({
      saved: { country: served[0], language: "en" },
      bouncedAlready: 3,
    });

    expect(arrival.country).not.toBe(served[0]);
    expect(arrival.askedToPickCountry).toBe(true);
  });

  test("a bounce within the limit still behaves normally", async ({ page }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // Without this, the case above would also pass on an app that had simply
    // given up on every request.
    const arrival = await arriveAsGuest({
      saved: { country: served[0], language: "en" },
      bouncedAlready: 1,
    });

    expect(arrival.country).toBe(served[0]);
    expect(arrival.askedToPickCountry).toBe(false);
  });

  test("the timestamp marker is dropped on the way to a redirect", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [saved, inAddress] = served;

    // The picker adds `_t` to defeat caching. It must not survive onto the
    // address the visitor is left looking at.
    const arrival = await arriveAsGuest({
      path: `/${inAddress}-en${PLAIN_PAGE}?_t=1700000000`,
      saved: { country: saved, language: "en" },
    });

    expect(arrival.countryConflict).toEqual({ inAddress, saved });
    expect(arrival.url.searchParams.get("_t")).toBeNull();
  });
});

test.describe("addresses the locale rules must not touch", () => {
  test("robots.txt is served as text, never locale-redirected", async () => {
    const arrival = await arriveAsGuest({ path: "/robots.txt" });

    expect(
      arrival.hops,
      "a crawler asking for robots.txt was redirected",
    ).toEqual([]);
    expect(arrival.status).toBe(200);
    expect(arrival.contentType).toBe("text/plain");
  });

  test("the site sitemap is served as XML", async () => {
    const arrival = await arriveAsGuest({ path: "/sitemap.xml" });

    expect(arrival.hops).toEqual([]);
    expect(arrival.status).toBe(200);
    expect(arrival.contentType).toContain("xml");
  });

  test("a sitemap under a country prefix is served as XML even when the saved country disagrees", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 2, "the app offers only one country to test with");

    const [saved, inAddress] = served;

    // The exact case proxy.ts:278 exists for. This address is not excluded by
    // the matcher, so without that bypass a crawler asking for a sitemap gets
    // the country-change redirect instead of the XML.
    const arrival = await arriveAsGuest({
      path: `/${inAddress}-en/sitemap.xml`,
      saved: { country: saved, language: "en" },
    });

    expect(
      arrival.hops,
      "a sitemap was sent through the country rules",
    ).toEqual([]);
    expect(arrival.status).toBe(200);
    expect(arrival.contentType).toContain("xml");
  });

  test("an address written in capitals is permanently redirected to lower case", async ({
    page,
  }) => {
    const { served } = await pickCountries(page);
    test.skip(served.length < 1, "the app offers no country to test with");

    // One page reachable at two addresses is a duplicate as far as a search
    // engine is concerned, so this redirect is permanent.
    const arrival = await arriveAsGuest({
      path: `/${served[0].toUpperCase()}-EN${PLAIN_PAGE}`,
    });

    expect(arrival.hops[0]?.status).toBe(308);
    expect(arrival.url.pathname).toBe(`/${served[0]}-en${PLAIN_PAGE}`);
  });
});

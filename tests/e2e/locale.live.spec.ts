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

import { expect, test } from "./fixtures";
import { arriveAsGuest, pickCountries } from "./actions/locale";

// Written as a browser sends them, weights and all, because that is what the
// app parses. Neither list contains English: a language the app knows must be
// picked because it is asked for, not because English happened to be missing.
const ARABIC_BROWSER = "ar-IQ,ar;q=0.9";
const UNSUPPORTED_BROWSER = "fr-FR,fr;q=0.9,de;q=0.8";

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
});

// Tests for `proxy.ts` — the file Next runs on every request. It picks the
// language and the country, then either lets the request through or sends the
// visitor to an address that carries a `<country>-<language>` prefix.
//
// Why the tests live here and not next to the file: `proxy.ts` is a sensitive
// path — it carries the routing every request goes through. We keep files that
// are not runtime code out of it, so the test goes in the `tests/` mirror
// instead. See docs/testing/UNIT_TESTING.md.
//
// How these tests work: they drive the proxy the way Next does — build a
// request, call the exported function, then read the status, the address in the
// `location` header, and the cookies on the response. Every helper inside
// `proxy.ts` is private, so this is the only way in, and it is also the right
// one: it pins the behaviour a visitor gets, not the shape of the code.
//
// Two things this file has to control, because the proxy remembers things
// between calls:
//
//   1. **A fresh copy for every test.** `loadProxy()` calls `vi.resetModules()`
//      first, so each test starts with an empty country cache and an unset
//      "already fetching" flag. Without it, the first test would fill the cache
//      and the ones after it would quietly test the cache instead of the
//      built-in fallback list.
//   2. **A fake network.** The proxy starts a country lookup in the background
//      and never waits for it. `makeMockFetch` stands in for the global `fetch`,
//      imports nothing, and writes down every call — so a test proves the lookup
//      by *reading the recorded calls*, not by waiting for a failure. The proxy
//      swallows errors from that lookup on purpose, so a failure would never
//      surface on its own.
//
// The settings are pinned here with `vi.stubEnv` rather than added to
// `vitest.config.mts`, because that file is shared: a value added there would be
// handed to every other test file in the suite, including ones written later
// that never asked for it.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonReply, makeMockFetch } from "./mocks/mockFetch";

// The one static import of the proxy in this file. Every test that exercises
// behaviour loads its own fresh copy through `loadProxy()`; this one reads
// `config`, which is a build-time export that no setting and no request can
// change. It is read here, at module scope, so the AC-11 cases at the bottom can
// be named per path instead of hidden inside one loop.
import { config as shippedConfig } from "../middleware";

/** The address the tests pretend the site is served from. */
const ORIGIN = "https://trydos.test";

/** The country list the proxy falls back to when it has nothing cached. */
const FALLBACK_COUNTRIES = ["sy", "lb", "tr", "iq"];

/** The cookie lifetime the proxy uses when nothing overrides it: one year. */
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

let net: ReturnType<typeof makeMockFetch>;

/**
 * Load a fresh copy of the proxy.
 *
 * Order matters: anything the proxy reads at load time — the cookie lifetime is
 * the one that bites — has to be pinned *before* this runs, or the test quietly
 * proves nothing.
 */
async function loadProxy() {
  vi.resetModules();
  const loaded = await import("../middleware");
  // The file follows Next's `middleware.ts` convention (see the note at the top
  // of it for why it is not `proxy.ts`), but every test below calls the entry
  // point `proxy` — the name this app has always used for it. Alias it once
  // here rather than renaming it in a hundred places.
  return { ...loaded, proxy: loaded.middleware };
}

/**
 * Build a request the way a browser would send one.
 *
 * `headers` covers the user agent, the browser's language preference, the
 * country the request appears to come from, the referring site and the bounce
 * count. `cookies` is written into a single `cookie` header, which is how a real
 * request carries them.
 *
 * This builder stays local to this file. The shared kit has no request builder,
 * and one ticket's need does not justify adding one.
 */
function makeRequest(
  path: string,
  options: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {},
): NextRequest {
  const headers = new Headers(options.headers ?? {});

  if (options.cookies) {
    headers.set(
      "cookie",
      Object.entries(options.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join("; "),
    );
  }

  return new NextRequest(new URL(path, ORIGIN), { headers });
}

/** Read one cookie off the response, or `undefined` when it is not there. */
function cookieOn(response: any, name: string) {
  return response.cookies.get(name);
}

/** The address a redirect points at, without the origin in front of it. */
function redirectTarget(response: any): string {
  const location = response.headers.get("location");
  if (!location) throw new Error("the response carries no location header");
  return location.replace(ORIGIN, "");
}

beforeEach(() => {
  // Pinned per test, and undone after each one, so every test gets them.
  //
  // The first two are settings the shared list in `vitest.config.mts` does not
  // carry. The third one it *does* carry — it is repeated here so the
  // preconnect-header test below cannot break because another ticket changed a
  // shared value.
  //
  // Every address is obviously fake. Never paste a real backend address from a
  // `.env` file into a test: it would put an internal hostname in the repository
  // and in the pull request.
  vi.stubEnv("BACKEND_URL", "https://example.com");
  vi.stubEnv("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL", "https://example.com");

  // `main` carries a pre-launch gate at the top of `proxy()` that 307s every
  // path to the logo page (see the STAGING GATE block in proxy.ts). It would
  // return before a single line the rest of this file is about. Switching it off
  // is what the setting is for, and on `develop` there is no gate to switch, so
  // this line is a no-op there.
  //
  // It buys the storefront tests below, and nothing else: the gate's own
  // behaviour is not covered here, and cannot be — its other half is the
  // `config.matcher`, which is a static export and answers to no setting. That
  // half is asserted in AC-11 at the bottom of this file.
  vi.stubEnv("STAGING_GATE", "off");

  // No replies are queued, so the background country lookup is recorded and then
  // fails — which is exactly what the proxy expects, and it falls back to its
  // built-in list. A test that wants the lookup to succeed queues a reply itself.
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// AC-1, AC-2 — which language the visitor gets
// ---------------------------------------------------------------------------

describe("choosing the language (AC-1, AC-2)", () => {
  it.each(["en", "ar", "tr", "ku"])(
    "keeps %s when the address already names it",
    async (language) => {
      const { proxy } = await loadProxy();

      const response = await proxy(makeRequest(`/gb-${language}/shop`));

      expect(response.status).toBe(200);
      expect(cookieOn(response, "lang")?.value).toBe(language);
    },
  );

  it("refuses a language it does not support and falls back to English", async () => {
    const { proxy } = await loadProxy();

    // `fr` is not one of the four, so the pair is not valid and the visitor is
    // sent to a default address instead of being let through.
    const response = await proxy(makeRequest("/gb-fr/shop"));

    expect(response.status).toBe(307);
    expect(redirectTarget(response)).toContain("/gb-en/");
  });

  it("uses the browser's stated preference when the address has no language", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        headers: { "accept-language": "ar-SA,ar;q=0.9,en;q=0.8" },
      }),
    );

    expect(redirectTarget(response)).toBe("/gb-ar/shop?no-country=true");
  });

  it("falls back to English when no preference is sent at all", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/shop"));

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });

  it("falls back to English when the preference names only unsupported languages", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        headers: { "accept-language": "de-DE,de;q=0.9,fr;q=0.8" },
      }),
    );

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });
});

// ---------------------------------------------------------------------------
// AC-3 — which country the visitor gets, and in which order
// ---------------------------------------------------------------------------

describe("choosing the country (AC-3)", () => {
  it("accepts a supported country whatever letter case the saved values arrive in", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { cookies: { country: "TR", lang: "TR" } }),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop");
  });

  it("accepts a supported country whatever letter case the request's own country arrives in", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { headers: { "x-vercel-ip-country": "TR" } }),
    );

    expect(redirectTarget(response)).toBe("/tr-en/shop");
  });

  it("prefers the saved country over the one the request appears to come from", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        cookies: { country: "tr", lang: "tr" },
        headers: { "x-vercel-ip-country": "lb" },
      }),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop");
  });

  it("prefers the country the request comes from over the default", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { headers: { "x-vercel-ip-country": "lb" } }),
    );

    // The country came from the request, so this is not a "no country" case.
    expect(redirectTarget(response)).toBe("/lb-en/shop");
  });

  it("refuses a saved country it does not support and uses the default gb", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { cookies: { country: "zz", lang: "tr" } }),
    );

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });

  it("ignores the saved pair when the saved language is not supported", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { cookies: { country: "tr", lang: "zz" } }),
    );

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });

  it("reads the language from the `language` cookie when `lang` is missing", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { cookies: { country: "tr", language: "tr" } }),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop");
  });

  it.each(FALLBACK_COUNTRIES)(
    "treats %s from the built-in fallback list as supported",
    async (country) => {
      const { proxy } = await loadProxy();

      const response = await proxy(makeRequest(`/${country}-en/shop`));

      expect(response.status).toBe(200);
      expect(cookieOn(response, "country")?.value).toBe(country);
    },
  );
});

// ---------------------------------------------------------------------------
// AC-4 — pass straight through, or redirect
// ---------------------------------------------------------------------------

describe("passing through or redirecting (AC-4)", () => {
  it("lets a request with a valid pair through untouched", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/gb-en/shop"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("puts the pair in front of the path and keeps the rest of the address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/shop/shoes?x=1&y=2"));

    expect(redirectTarget(response)).toBe(
      "/gb-en/shop/shoes?x=1&y=2&no-country=true",
    );
  });

  it("handles the site root, where there is no path to keep", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/"));

    expect(redirectTarget(response)).toBe("/gb-en?no-country=true");
  });

  it.each(["/xx-en/shop", "/gb-fr/shop"])(
    "swaps a locale-shaped prefix it does not support for the default, without doubling it (%s)",
    async (path) => {
      const { proxy } = await loadProxy();

      // The prefix looks like a pair but names a country or a language that is
      // not supported. It is taken off and the default is put in front — once.
      const response = await proxy(makeRequest(path));

      expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
    },
  );

  it.each([
    ["/privacy-policy", "/gb-en/privacy-policy?no-country=true"],
    ["/terms-of-service", "/gb-en/terms-of-service?no-country=true"],
    ["/gift-cards/buy", "/gb-en/gift-cards/buy?no-country=true"],
  ])(
    "keeps a hyphenated path that only looks like a pair (%s)",
    async (path, target) => {
      const { proxy } = await loadProxy();

      // "privacy-policy" is one hyphen, like "gb-en" is. Reading it as a pair
      // took country "privacy" and language "policy", then stripped the whole
      // segment as a prefix — so the page was dropped and the visitor arrived
      // at the home page. A pair is two letters on each side of the hyphen.
      const response = await proxy(makeRequest(path));

      expect(redirectTarget(response)).toBe(target);
    },
  );

  it("sends a returning visitor from the site root to their saved locale", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/", { cookies: { country: "tr", lang: "tr" } }),
    );

    // No trailing slash: the root has no path to keep.
    expect(redirectTarget(response)).toBe("/tr-tr");
  });

  it("swaps an unsupported prefix that has nothing after it", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/xx-en"));

    expect(redirectTarget(response)).toBe("/gb-en?no-country=true");
  });

  it("swaps an unsupported prefix written in capitals", async () => {
    const { proxy } = await loadProxy();

    // The old code matched the prefix by text, which missed the capitals and
    // left them in the address: /gb-en/XX-EN/shop.
    const response = await proxy(makeRequest("/XX-EN/shop"));

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });

  it("does not double the prefix when the bounce limit is reached either", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/xx-en/shop", { headers: { "x-redirect-count": "3" } }),
    );

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });

  // The file contains no `NextResponse.rewrite` call, so there is nothing to
  // assert about one. Every path through it ends in either a pass-through or a
  // redirect. This is written down rather than left silent, because the roadmap
  // says "rewrite and redirect rules" and that wording is wrong.
  it("never rewrites — every answer is a pass-through or a redirect", async () => {
    const { proxy } = await loadProxy();

    const responses = await Promise.all(
      ["/gb-en/shop", "/shop", "/", "/sitemap.xml"].map((path) =>
        proxy(makeRequest(path)),
      ),
    );

    for (const response of responses) {
      expect([200, 307, 308]).toContain(response.status);
      // A rewrite would name an internal address in this header. None does.
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// AC-5 — the country-change marker, and the gb case
// ---------------------------------------------------------------------------

describe("when the saved country differs from the address (AC-5)", () => {
  it("raises the country-change marker naming both countries instead of switching silently", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/lb-en/shop", { cookies: { country: "tr", lang: "tr" } }),
    );

    // The address keeps its own country; the marker names the address country
    // first and the saved one second, so the page can ask the visitor.
    expect(redirectTarget(response)).toBe(
      "/lb-en/shop?changed-country=lb%2Ctr",
    );
    expect(response.headers.get("x-redirect-count")).toBe("1");
  });

  it("sends the visitor to the saved country when the address says gb", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", { cookies: { country: "tr", lang: "tr" } }),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop");
    // The saved values travel with the redirect, so they are not lost on the way.
    expect(cookieOn(response, "country")?.value).toBe("tr");
    expect(cookieOn(response, "lang")?.value).toBe("tr");
  });

  it("handles the locale root with a trailing slash", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/", { cookies: { country: "tr", lang: "tr" } }),
    );

    // The path after the pair is empty, so only the pair is left. The trailing
    // slash the visitor typed is kept.
    expect(redirectTarget(response)).toBe("/tr-tr/");
  });

  it("lets the request through once the country-change marker is already on the address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/lb-en/shop?changed-country=lb,tr", {
        cookies: { country: "tr", lang: "tr" },
      }),
    );

    // No second bounce: the page shows the question, and the address wins.
    expect(response.status).toBe(200);
    expect(cookieOn(response, "country")?.value).toBe("lb");
  });
});

// ---------------------------------------------------------------------------
// AC-6 — the bounce limit
// ---------------------------------------------------------------------------

describe("the bounce limit (AC-6)", () => {
  it("stops bouncing after the allowed number and lands on a default address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        // Above the limit of 2, so the rule that would normally bounce again
        // gives up and settles on a default.
        headers: { "x-redirect-count": "3" },
        cookies: { country: "tr", lang: "tr" },
      }),
    );

    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });

  it("lands on a bare default address when the bounce limit is reached at the site root", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/", { headers: { "x-redirect-count": "3" } }),
    );

    expect(redirectTarget(response)).toBe("/gb-en?no-country=true");
  });

  it("still bounces while the count is within the limit", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        headers: { "x-redirect-count": "2" },
        cookies: { country: "tr", lang: "tr" },
      }),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop");
  });
});

// ---------------------------------------------------------------------------
// AC-7 — crawlers
// ---------------------------------------------------------------------------

describe("crawlers (AC-7)", () => {
  const CRAWLERS = [
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0)",
    "facebookexternalhit/1.1",
    "Twitterbot/1.0",
    "LinkedInBot/1.0",
  ];

  it.each(CRAWLERS)("lets %s through when the address already has a valid pair", async (agent) => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", { headers: { "user-agent": agent } }),
    );

    expect(response.status).toBe(200);
  });

  it("gives a crawler without a pair a permanent redirect to one", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { headers: { "user-agent": "Googlebot/2.1" } }),
    );

    // 308 is permanent, so the crawler records the locale address as the real one.
    expect(response.status).toBe(308);
    expect(redirectTarget(response)).toBe("/gb-en/shop");
  });

  it("never adds a country-change or no-country marker for a crawler", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        headers: { "user-agent": "Googlebot/2.1" },
        // A saved country that disagrees would send a person to a marker; a
        // crawler must never see one, because it would index the wrong address.
        cookies: { country: "tr", lang: "tr" },
      }),
    );

    const target = redirectTarget(response);
    expect(target).not.toContain("changed-country");
    expect(target).not.toContain("no-country");
  });

  it("writes no locale cookies for a crawler", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", { headers: { "user-agent": "Googlebot/2.1" } }),
    );

    expect(response.cookies.getAll()).toHaveLength(0);
  });

  it("sends a crawler asking for the site root to a locale address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/", { headers: { "user-agent": "Googlebot/2.1" } }),
    );

    expect(response.status).toBe(308);
    expect(redirectTarget(response)).toBe("/gb-en");
  });

  it("sends a crawler on an unsupported prefix to a supported address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/xx-en/shop", { headers: { "user-agent": "Googlebot/2.1" } }),
    );

    expect(response.status).toBe(308);
    expect(redirectTarget(response)).toBe("/gb-en/shop");
  });

  it("treats an ordinary browser as a person, not a crawler", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        },
      }),
    );

    expect(response.status).toBe(307);
    expect(redirectTarget(response)).toContain("no-country=true");
  });
});

// ---------------------------------------------------------------------------
// AC-8 — every cookie the proxy writes, and the choice behind each one
// ---------------------------------------------------------------------------

describe("the cookies the proxy leaves behind (AC-8)", () => {
  it("writes the three locale cookies so the browser can read them", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/sy-ar/shop"));

    for (const name of ["country", "lang", "language"]) {
      const cookie = cookieOn(response, name);
      // Readable by page scripts on purpose: the app picks its language from
      // these on the client.
      expect(cookie?.httpOnly).toBe(false);
      expect(cookie?.path).toBe("/");
      expect(cookie?.secure).toBe(true);
      expect(cookie?.sameSite).toBe("lax");
      expect(cookie?.maxAge).toBe(ONE_YEAR_IN_SECONDS);
    }

    expect(cookieOn(response, "country")?.value).toBe("sy");
    expect(cookieOn(response, "lang")?.value).toBe("ar");
    expect(cookieOn(response, "language")?.value).toBe("ar");
  });

  it("writes the visitor's IP address so page scripts cannot read it", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/gb-en/shop"));

    // The IP is personal data. Server code still reads it; page scripts must not.
    expect(cookieOn(response, "userIP")?.httpOnly).toBe(true);
  });

  it("saves the IP the request really came from", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", { headers: { "x-real-ip": "203.0.113.5" } }),
    );

    expect(cookieOn(response, "userIP")?.value).toBe("203.0.113.5");
  });

  it("does not write the IP again when it has not changed", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", {
        headers: { "x-real-ip": "203.0.113.5" },
        cookies: { userIP: "203.0.113.5" },
      }),
    );

    expect(cookieOn(response, "userIP")).toBeUndefined();
  });

  it("does not write the locale cookies again when they already match the address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", { cookies: { country: "gb", lang: "en" } }),
    );

    expect(response.status).toBe(200);
    expect(cookieOn(response, "country")).toBeUndefined();
    expect(cookieOn(response, "lang")).toBeUndefined();
  });

  it("saves the language from the address when only the language differs from the saved one", async () => {
    const { proxy } = await loadProxy();

    // Same country, different language: the address wins and is saved. This is
    // how a visitor switches language by changing the address.
    const response = await proxy(
      makeRequest("/tr-ar/shop", { cookies: { country: "tr", lang: "en" } }),
    );

    expect(response.status).toBe(200);
    expect(cookieOn(response, "lang")?.value).toBe("ar");
    expect(cookieOn(response, "country")?.value).toBe("tr");
  });

  it("saves the referring site when the visit really came from somewhere else", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", {
        headers: { referer: "https://google.com/search" },
      }),
    );

    expect(cookieOn(response, "referer")?.value).toBe(
      "https://google.com/search",
    );
    expect(cookieOn(response, "referer")?.httpOnly).toBe(false);
  });

  it("does not save the referring site when the visit came from this same site", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", {
        headers: { referer: `${ORIGIN}/gb-en/home` },
      }),
    );

    expect(cookieOn(response, "referer")).toBeUndefined();
  });

  it("saves the referring site anyway when the visit carries a campaign marker", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop?utm_source=newsletter", {
        headers: { referer: `${ORIGIN}/gb-en/home` },
      }),
    );

    expect(cookieOn(response, "referer")?.value).toBe(`${ORIGIN}/gb-en/home`);
  });

  it("clears the logout marker on a real page render", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop", { cookies: { "LOGOUT-GUARD": "1" } }),
    );

    // Cleared by writing it empty, which is how a cookie is removed.
    expect(cookieOn(response, "LOGOUT-GUARD")?.value).toBe("");
  });

  it("keeps the logout marker on a redirect hop", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/shop", { cookies: { "LOGOUT-GUARD": "1" } }),
    );

    // The protection has to hold until the reload actually lands, so a hop on
    // the way there must not drop it.
    expect(response.status).toBe(307);
    expect(cookieOn(response, "LOGOUT-GUARD")).toBeUndefined();
  });

  it("takes the cookie lifetime from the setting when one is given", async () => {
    // Pinned before the proxy is loaded on purpose: the lifetime is read once
    // when the file loads. Pin it afterwards and this test proves nothing.
    vi.stubEnv("DEFAULT_COOKIE_MAX_AGE", "60");
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/gb-en/shop"));

    expect(cookieOn(response, "country")?.maxAge).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// The country popup — the markers it uses, and the way out of it
// ---------------------------------------------------------------------------

describe("the country popup markers", () => {
  it("shows the popup instead of redirecting when the no-country marker is on the address", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/tr-tr/shop?no-country=true"));

    // The page renders and asks the visitor; the address is left alone.
    expect(response.status).toBe(200);
    expect(cookieOn(response, "country")?.value).toBe("tr");
    expect(cookieOn(response, "lang")?.value).toBe("tr");
  });

  it("drops the timestamp marker on its way to a redirect", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/gb-en/shop?_t=123456", {
        cookies: { country: "tr", lang: "tr" },
      }),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop");
  });

  it("takes the visitor's choice and stops asking", async () => {
    const { proxy } = await loadProxy();

    // `_bypass=popup-selection` is what the popup sends when the visitor has
    // picked. The choice in the address is saved and every marker is cleared.
    const response = await proxy(
      makeRequest("/tr-tr/shop?_bypass=popup-selection&no-country=true"),
    );

    expect(response.status).toBe(200);
    expect(cookieOn(response, "country")?.value).toBe("tr");
    expect(cookieOn(response, "lang")?.value).toBe("tr");
  });

  it("puts the visitor on a proper address when the choice arrives with no pair", async () => {
    const { proxy } = await loadProxy();

    // There is no pair in the address, so there is no choice to save. Skipping
    // the checks here would leave the visitor on an address with no locale at
    // all, so the normal rules run instead and give them one.
    const response = await proxy(makeRequest("/shop?_bypass=popup-selection"));

    expect(response.status).toBe(307);
    expect(redirectTarget(response)).toBe(
      "/gb-en/shop?_bypass=popup-selection&no-country=true",
    );
  });

  it("honours the choice on the next hop, once the address has a pair", async () => {
    const { proxy } = await loadProxy();

    // The address the test above redirects to. The visitor is not stranded: the
    // second hop has a pair, so the choice is saved and the markers cleared.
    const response = await proxy(
      makeRequest("/gb-en/shop?_bypass=popup-selection&no-country=true"),
    );

    expect(response.status).toBe(200);
    expect(cookieOn(response, "country")?.value).toBe("gb");
    expect(cookieOn(response, "lang")?.value).toBe("en");
  });

  it("redirects to the cleaned address when other query values are left", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(
      makeRequest("/tr-tr/shop?_bypass=popup-selection&changed-country=tr,lb&page=2"),
    );

    expect(redirectTarget(response)).toBe("/tr-tr/shop?page=2");
    // The choice travels with the redirect. It used to be written only on the
    // pass-through response, so it was lost here and the popup asked again.
    expect(cookieOn(response, "country")?.value).toBe("tr");
    expect(cookieOn(response, "lang")?.value).toBe("tr");
  });
});

// ---------------------------------------------------------------------------
// AC-9 — the sitemap files
// ---------------------------------------------------------------------------

describe("sitemap addresses (AC-9)", () => {
  it.each([
    "/sitemap.xml",
    "/sitemap-products.xml",
    "/lb-en/sitemap.xml",
    "/gb-en/sitemap-products.xml",
  ])("lets %s through untouched so a crawler gets the raw file", async (path) => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest(path));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    // Not even a cookie: the answer must be the file and nothing else.
    expect(response.cookies.getAll()).toHaveLength(0);
  });

  it("still lets a sitemap through when the saved country disagrees with the address", async () => {
    const { proxy } = await loadProxy();

    // A person would be bounced to a country-change marker here. A crawler
    // asking for XML must not be.
    const response = await proxy(
      makeRequest("/lb-en/sitemap.xml", {
        cookies: { country: "tr", lang: "tr" },
      }),
    );

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// AC-10 — the robots address, and the lower-case redirect
//
// Three of the behaviours this group covers were found while the tests were
// first written and have since been corrected in `proxy.ts`. The tests now pin
// the corrected behaviour, and each one says what it used to do, so a return of
// the old behaviour is obvious rather than silent.
// ---------------------------------------------------------------------------

describe("the robots address and the lower-case redirect (AC-10)", () => {
  it("does not hijack a page whose name merely contains the word robots", async () => {
    const { proxy } = await loadProxy();

    // It used to: the check was `includes("/robots")`, so a real page called
    // /gb-en/robots-guide was sent to the robots file. It is an exact match now.
    const response = await proxy(makeRequest("/gb-en/robots-guide"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["/robots.txt", "/robots"])(
    "still sends %s itself to the robots file",
    async (path) => {
      const { proxy } = await loadProxy();

      // The matcher already keeps these away from the proxy, so this is only a
      // safety net for the day that list changes.
      const response = await proxy(makeRequest(path));

      expect(redirectTarget(response)).toBe("/robots.txt");
    },
  );

  it("permanently redirects a pair with a capital letter to the lower-case form", async () => {
    const { proxy } = await loadProxy();

    // 308 is permanent, so the lower-case address is the one that gets recorded.
    const response = await proxy(makeRequest("/GB-EN/shop"));

    expect(response.status).toBe(308);
    expect(redirectTarget(response)).toBe("/gb-en/shop");
  });

  it("does not put the connection-warming headers on that redirect", async () => {
    const { proxy } = await loadProxy();

    // These headers tell a browser to open connections early for a page it is
    // about to render. A redirect renders nothing, so it used to be waste. The
    // browser now gets them on the real page it lands on instead.
    const response = await proxy(makeRequest("/GB-EN/shop"));

    expect(response.status).toBe(308);
    expect(response.headers.get("Link")).toBeNull();
  });

  it("still puts the connection-warming headers on a real page", async () => {
    const { proxy } = await loadProxy();

    const response = await proxy(makeRequest("/gb-en/shop"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Link")).toContain('rel="preconnect"');
  });
});

// ---------------------------------------------------------------------------
// AC-11 — which paths the proxy runs on
// ---------------------------------------------------------------------------

describe("the paths the proxy runs on (AC-11)", () => {
  // Two matchers exist in this repository, and they are opposites on purpose.
  //
  //   `develop` ships the storefront matcher. The proxy handles page requests
  //   and stays off /api, the sitemaps and the static folders, which serve
  //   themselves.
  //
  //   `main` ships the staging-gate matcher. Pre-launch every path must reach
  //   the gate and 307 to "/", so it excludes only what the logo page needs to
  //   render. /api and the static folders are deliberately *in* — leaving them
  //   out is the leak the gate was written to close.
  //
  // Both lists are written out in full below, and the matcher the branch
  // actually exports decides which one applies. Neither list is ever shortened
  // to fit the other: whichever matcher ships, every path in its own list is
  // checked. The exact text of the setting is deliberately not asserted — a
  // harmless edit to it would break the test for no reason. What matters is
  // which paths are in and which are out.
  const STOREFRONT = {
    name: "the storefront matcher",
    runsOn: ["/", "/gb-en/shop", "/gb-en/product/123", "/checkout"],
    staysOutOf: [
      "/api/auth/login",
      "/_next/static/chunk.js",
      "/_next/image",
      "/sitemap.xml",
      "/robots.txt",
      "/favicon.ico",
      "/images/logo.png",
      "/translations/translations.ar.js",
    ],
  };

  const STAGING_GATE = {
    name: "the staging-gate matcher",
    runsOn: [
      "/",
      "/gb-en/shop",
      "/gb-en/product/123",
      "/checkout",
      // The four the storefront matcher lets past, and the gate must not.
      "/api/auth/login",
      "/sitemap.xml",
      "/images/logo.png",
      "/translations/translations.ar.js",
    ],
    staysOutOf: [
      "/_next/static/chunk.js",
      "/_next/image",
      "/icons/Logo.svg",
      "/robots.txt",
      "/favicon.ico",
    ],
  };

  const entry = shippedConfig.matcher[0] as string | { source: string };
  const source = typeof entry === "string" ? entry : entry.source;
  const expected = typeof entry === "string" ? STAGING_GATE : STOREFRONT;

  function pathIsHandled(path: string) {
    return new RegExp(`^${source}$`).test(path);
  }

  it.each(expected.runsOn)("runs on %s", (path) => {
    expect(
      pathIsHandled(path),
      `${expected.name} has to run on ${path}, and does not`,
    ).toBe(true);
  });

  it.each(expected.staysOutOf)("stays out of %s", (path) => {
    expect(
      pathIsHandled(path),
      `${expected.name} has to stay off ${path}, and runs on it`,
    ).toBe(false);
  });

  it("skips a request the router made in the background", async () => {
    const { config } = await loadProxy();
    const shippedEntry = config.matcher[0] as
      | string
      | { missing?: { key: string }[] };

    if (typeof shippedEntry === "string") {
      // The staging-gate matcher carries no `missing:` clause, on purpose: a
      // prefetch and a server action have to reach the gate like anything else.
      // That clause letting them past was the second half of the leak.
      expect(
        (shippedEntry as unknown as { missing?: unknown }).missing,
        "the staging-gate matcher must let nothing skip the proxy, so it carries no `missing:` clause",
      ).toBeUndefined();
      return;
    }

    // The proxy only runs when these headers are missing, so a prefetch or a
    // server action never triggers a locale redirect.
    expect(
      shippedEntry.missing?.map((e) => e.key),
      "the storefront matcher no longer lets prefetches and server actions past the proxy",
    ).toEqual([
      "purpose",
      "next-router-prefetch",
      "next-action",
      "next-router-state-tree",
    ]);
  });
});

// ---------------------------------------------------------------------------
// AC-12, AC-13 — nothing real is contacted, and the order tests run in makes no
// difference
// ---------------------------------------------------------------------------

describe("what leaves the process, and what is remembered (AC-12, AC-13)", () => {
  it("starts the country lookup in the background and nothing else", async () => {
    const { proxy } = await loadProxy();

    await proxy(makeRequest("/gb-en/shop"));

    // Proved by reading the recorded calls, not by waiting for a failure: the
    // proxy swallows errors from this lookup, so a real one would never show up.
    expect(net.callCount).toBe(1);
    expect(net.calls[0].url).toBe("https://example.com/countries");
    expect(net.calls[0].method).toBe("GET");
    expect(net.calls[0].headers.country).toBe("sy");
  });

  it("sends the country the request came from with the lookup", async () => {
    const { proxy } = await loadProxy();

    await proxy(
      makeRequest("/gb-en/shop", { headers: { "x-vercel-ip-country": "lb" } }),
    );

    expect(net.calls[0].headers.country).toBe("lb");
  });

  it("keeps working when the lookup fails, using the built-in fallback list", async () => {
    const { proxy } = await loadProxy();

    // No reply was queued, so the lookup fails. The visitor must not notice.
    const response = await proxy(makeRequest("/lb-en/shop"));

    expect(response.status).toBe(200);
  });

  it("keeps the built-in list when the lookup answers with an error", async () => {
    const { proxy } = await loadProxy();
    net.queueReply(jsonReply({ message: "server error" }, 500));

    await proxy(makeRequest("/gb-en/shop"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Nothing was remembered, so `eg` is still an unknown country.
    const second = await proxy(makeRequest("/eg-en/shop"));
    expect(redirectTarget(second)).toBe("/gb-en/shop?no-country=true");
  });

  it("keeps the built-in list when the lookup answers without a countries list", async () => {
    const { proxy } = await loadProxy();
    // A reply in an unexpected shape must not break routing.
    net.queueReply(jsonReply({ data: {} }));

    await proxy(makeRequest("/gb-en/shop"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const second = await proxy(makeRequest("/eg-en/shop"));
    expect(redirectTarget(second)).toBe("/gb-en/shop?no-country=true");
  });

  it("remembers the answer within one loaded copy and asks only once", async () => {
    const { proxy } = await loadProxy();
    net.queueReply(
      jsonReply({ data: { countries: [{ iso: "eg" }, { iso: "jo" }] } }),
    );

    // First call: `eg` is not in the built-in list yet, and the lookup is started.
    await proxy(makeRequest("/eg-en/shop"));
    // Let the background lookup finish before asking again.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const second = await proxy(makeRequest("/eg-en/shop"));

    expect(second.status).toBe(200);
    expect(net.callCount).toBe(1);
  });

  it("forgets everything between tests, so the test before this one changed nothing", async () => {
    const { proxy } = await loadProxy();

    // The test above taught its own copy that `eg` is a real country. This one
    // loads a fresh copy, so `eg` is unknown again. Without the reset, this test
    // would pass or fail depending on the order the tests ran in.
    const response = await proxy(makeRequest("/eg-en/shop"));

    expect(response.status).toBe(307);
    expect(redirectTarget(response)).toBe("/gb-en/shop?no-country=true");
  });
});

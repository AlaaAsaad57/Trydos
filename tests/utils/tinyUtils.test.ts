// The small shared helpers, driven directly.
//
// This file is imported by 115 others, and one of its functions — GetImageUrl —
// is called from 219 places. Nothing here had a test, so a change to any of them
// was silently a change to every product card, address line and filter link in
// the app. That reach is the reason these are worth pinning, not their size.
//
// Picked by how often each one is actually called, biggest first. The ones left
// out either ask the browser for a permission (requestPermissions) or render
// (FlagIcon) — those belong with the tests that stand a browser or a network up,
// not here. (`fetchCountries` was left out because nothing in the app called it;
// it has since been deleted.)
//
// `getCurrency` is here even though it makes a request, because the request
// itself is stood in and what is being pinned is the shape it reads back: which
// of two reply shapes holds the exchange rate every price on the site is
// converted with.
//
// Several tests below say what the code used to do before it was fixed. That
// sentence is the point of them: it turns a regression into the same failure
// message somebody has already read once.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The translator is stood in, and it wraps every word it is asked for in
// brackets. The real one hands back the English key whenever the page is not in
// another language, so "this word was translated" and "this word was written in
// English and never translated" come out identical — and telling those two
// apart is exactly what the date tests below are for. The brackets make the
// difference visible in the result itself.
//
// Do not import "utils/functions" into this file. Importing it before
// "utils/tinyUtils" resolves the module under a second name and the stand-in
// stops reaching the code under test, with no error to say so.
//
// The error reporter is stood in beside it. The real one reads the store and
// the cookies and hands the fault to the reporting service, none of which a
// test wants; the currency tests below assert on whether it was reached.
//
// Its spy is built with `vi.hoisted` rather than imported back, for the reason
// in the paragraph above: importing "utils/functions" here is what breaks the
// stand-in. `vi.hoisted` hands the same function to the factory and to the
// tests without anyone importing the module.
const logErrorSpy = vi.hoisted(() => vi.fn());

vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    translateFunction: vi.fn((key: string) => `[${key}]`),
    LogError: logErrorSpy,
  };
});

// The request helper is stood in whole, so nothing here reaches a network. See
// tests/mocks/fetchData.ts. The stand-in has to be pulled in inside the factory:
// vi.mock is lifted above the imports, so a name imported below is not ready yet
// when this runs.
vi.mock("utils/fetchData", async () => {
  const { makeFetchDataMock } = await import("../mocks/fetchData");
  return makeFetchDataMock();
});

import { fetchData } from "utils/fetchData";
import { GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";
import {
  buildParamsFromFilters,
  DetectScreen,
  DisableScroll,
  EnableScroll,
  findVariation,
  formatTime,
  formatTimeForAddress,
  getCurrency,
  GetAddressString,
  GetImageUrl,
  getFirstLetterLang,
  getReferralSource,
  getVideoUrl,
  isGuestName,
  isSameColor,
  pollinateInput,
  sanitizePhone,
  ShowDayStr,
} from "utils/tinyUtils";

// Set in vitest.config.ts for the whole unit project.
const MEDIA = "https://example.com";

describe("building a picture address (GetImageUrl)", () => {
  it("leaves a full address alone", () => {
    const url = "https://cdn.example.com/a.jpg";
    expect(GetImageUrl(url)).toBe(url);
  });

  it("puts the media address in front of a bare path", () => {
    // What the gateway sends: no leading slash.
    expect(GetImageUrl("customers/profile/a.jpg")).toBe(
      `${MEDIA}/customers/profile/a.jpg`,
    );
  });

  it("does not double the slash when the path already has one", () => {
    expect(GetImageUrl("/customers/profile/a.jpg")).toBe(
      `${MEDIA}/customers/profile/a.jpg`,
    );
  });

  it("hands back nothing when it was given nothing", () => {
    // 219 call sites, and plenty of them pass a field that may be absent. It has
    // to stay absent rather than becoming the media address on its own, which
    // would be a request for a picture that cannot exist.
    expect(GetImageUrl(undefined)).toBeUndefined();
    expect(GetImageUrl(null)).toBeNull();
    expect(GetImageUrl("")).toBe("");
  });

  it("hands back anything that is not text unchanged", () => {
    expect(GetImageUrl(42)).toBe(42);
  });

  it("takes an upload record's own path as final when it names the media server", () => {
    const record = { file_path: "https://media_server.example.com/a.jpg" };
    expect(GetImageUrl(record)).toBe(record.file_path);
  });

  it("adds the missing slash to an upload record's path as well", () => {
    // This route used to join the host and the path with nothing between them,
    // while the plain-text route above added the slash. Both behave the same
    // way now, so it no longer matters which shape a picture arrives in.
    expect(GetImageUrl({ file_path: "products/a.jpg" })).toBe(
      `${MEDIA}/products/a.jpg`,
    );
    expect(GetImageUrl({ file_path: "/products/a.jpg" })).toBe(
      `${MEDIA}/products/a.jpg`,
    );
  });
});

describe("building a filter link (buildParamsFromFilters)", () => {
  it("gives nothing back when nothing is chosen", () => {
    expect(buildParamsFromFilters({})).toEqual([]);
    expect(buildParamsFromFilters({ brands: [] })).toEqual([]);
  });

  it("always uses the same order, whatever order the choices came in", () => {
    // The link is the page address, so two people choosing the same filters in a
    // different order have to land on the same address — otherwise they are two
    // pages to cache, and two pages for search engines to see as duplicates.
    const params = buildParamsFromFilters({
      prices: ["10-20"],
      brands: ["nike"],
      boutiques: ["shop-a"],
    });
    expect(params).toEqual([
      "boutiques",
      "shop-a",
      "brands",
      "nike",
      "prices",
      "10-20",
    ]);
  });

  it("joins several choices of the same kind with commas", () => {
    expect(buildParamsFromFilters({ sizes: ["s", "m", "l"] })).toEqual([
      "sizes",
      "s,m,l",
    ]);
  });

  it("drops the hash from colours so the address stays readable", () => {
    // A "#" in an address starts the part browsers never send to the server.
    expect(buildParamsFromFilters({ colors: ["#ff0000", "00ff00"] })).toEqual([
      "colors",
      "ff0000,00ff00",
    ]);
  });
});

describe("writing an address out (GetAddressString)", () => {
  it("joins the parts it was given with bars", () => {
    expect(
      GetAddressString({
        country: "Turkey",
        province: "Istanbul",
        city: "Kadikoy",
        town: "Moda",
        street: "Bahar",
        building: "12",
      }),
    ).toBe("Turkey | Istanbul | Kadikoy | Moda | Bahar | 12");
  });

  it("skips the parts that were never filled in", () => {
    expect(GetAddressString({ province: "Istanbul", city: "Kadikoy" })).toBe(
      "Istanbul | Kadikoy",
    );
  });

  it("treats the word 'null' as an empty part, not as a place name", () => {
    // The backend sends the text "null" for a missing part, and printing it on
    // an order would look like a broken address to the shopper.
    expect(
      GetAddressString({ province: "Istanbul", city: "null", town: "Moda" }),
    ).toBe("Istanbul | Moda");
  });

  it("leaves no gap when a part in the middle is missing", () => {
    // This used to print "Turkey |  | Kadikoy", because the country carried a
    // bar after it and the city carried one before it, and nothing filled the
    // space between.
    expect(GetAddressString({ country: "Turkey", city: "Kadikoy" })).toBe(
      "Turkey | Kadikoy",
    );
  });

  it("does not start the line with a bar when the first parts are missing", () => {
    expect(GetAddressString({ city: "Kadikoy" })).toBe("Kadikoy");
  });

  it("gives an empty line back when there is no address at all", () => {
    expect(GetAddressString(undefined)).toBe("");
    expect(GetAddressString({})).toBe("");
  });
});

describe("spotting a guest account (isGuestName)", () => {
  it("knows the three names a guest can carry", () => {
    // The third is a misspelling that exists in stored data, so it has to keep
    // being recognised — dropping it would show real shoppers the guest prompt.
    expect(isGuestName("guest")).toBe(true);
    expect(isGuestName("verified_guest")).toBe(true);
    expect(isGuestName("verfied_guest")).toBe(true);
  });

  it("ignores capitals and spaces around the name", () => {
    expect(isGuestName("  Guest  ")).toBe(true);
    expect(isGuestName("VERIFIED_GUEST")).toBe(true);
  });

  it("does not mistake a real name for a guest", () => {
    expect(isGuestName("Ada")).toBe(false);
    expect(isGuestName("guest user")).toBe(false);
    expect(isGuestName(undefined)).toBe(false);
    expect(isGuestName("")).toBe(false);
  });
});

describe("tidying a typed phone number (sanitizePhone)", () => {
  it("removes the spacing people type", () => {
    expect(sanitizePhone("+90 (555) 111-22-33")).toBe("+905551112233");
  });

  it("keeps a leading plus and only that one", () => {
    expect(sanitizePhone("+90+555")).toBe("+90555");
  });

  it("does not invent a plus that was not typed", () => {
    expect(sanitizePhone("0555 111 22 33")).toBe("05551112233");
    // A plus typed in the middle is not a country code, so it goes.
    expect(sanitizePhone("555+111")).toBe("555111");
  });

  it("gives an empty result for text with no digits", () => {
    expect(sanitizePhone("abc")).toBe("");
  });
});

describe("choosing which way text runs (getFirstLetterLang)", () => {
  it("reads Arabic and Kurdish text right to left", () => {
    expect(getFirstLetterLang("مرحبا")).toBe("right");
    expect(getFirstLetterLang("سڵاو")).toBe("right");
  });

  it("reads Latin text left to right", () => {
    expect(getFirstLetterLang("Hello")).toBe("left");
    expect(getFirstLetterLang("Merhaba")).toBe("left");
  });

  it("ignores spaces before the first letter", () => {
    expect(getFirstLetterLang("   مرحبا")).toBe("right");
  });

  it("falls back to left to right when there is no text", () => {
    expect(getFirstLetterLang("")).toBe("left");
    expect(getFirstLetterLang(undefined as any)).toBe("left");
  });
});

describe("naming where a visitor came from (getReferralSource)", () => {
  it("says 'direct' when there is no previous page", () => {
    expect(getReferralSource(null)).toBe("direct");
    expect(getReferralSource("")).toBe("direct");
  });

  it("names the social sites it knows", () => {
    expect(getReferralSource("https://www.facebook.com/somepage")).toBe(
      "facebook",
    );
    expect(getReferralSource("https://INSTAGRAM.com/p/1")).toBe("instagram");
  });

  it("names X only for X itself", () => {
    expect(getReferralSource("https://x.com/someone/status/1")).toBe("twitter/X");
    expect(getReferralSource("https://www.twitter.com/someone")).toBe("twitter/X");
    expect(getReferralSource("https://t.co/abc")).toBe("twitter-shortlink");
  });

  it("does not mistake an ordinary address for X", () => {
    // The check used to look for the single letter "x" anywhere in the address,
    // so every one of these counted as social traffic that never happened.
    expect(getReferralSource("https://example.com")).toBe("other");
    expect(getReferralSource("https://mystore.xyz")).toBe("other");
    expect(getReferralSource("https://box.com")).toBe("other");
    expect(getReferralSource("https://tiktok.com")).toBe("tiktok");
  });

  it("says 'other' for a site it does not know", () => {
    expect(getReferralSource("https://google.com")).toBe("other");
  });
});

describe("matching a colour (isSameColor)", () => {
  it("matches two names ignoring capitals and spaces", () => {
    expect(isSameColor("Red", " red ")).toBe(true);
  });

  it("matches a plain name against a full colour record", () => {
    expect(isSameColor("red", { color_name: "Red", color_option: "r1" })).toBe(
      true,
    );
    expect(isSameColor("r1", { color_name: "Red", color_option: "r1" })).toBe(
      true,
    );
  });

  it("says no when either side is missing", () => {
    expect(isSameColor(null, "red")).toBe(false);
    expect(isSameColor("red", undefined)).toBe(false);
  });

  it("says no for two different colours", () => {
    expect(isSameColor("red", "blue")).toBe(false);
  });
});

describe("finding the chosen product option (findVariation)", () => {
  const colors = [{ color_name: "Red", color_option: "r1" }];
  const sizes = ["S", "M"];
  const variations = [
    { type: "r1-M", qty: 3 },
    { type: "r1", qty: 1 },
    { type: "M", qty: 7 },
  ];

  it("finds the one matching both a colour and a size", () => {
    expect(findVariation(variations, colors, sizes, "Red", "M")).toEqual({
      type: "r1-M",
      qty: 3,
    });
  });

  it("finds it by colour alone when no size was chosen", () => {
    expect(findVariation(variations, colors, sizes, "Red", null)).toEqual({
      type: "r1",
      qty: 1,
    });
  });

  it("finds it by size alone when no colour was chosen", () => {
    expect(findVariation(variations, colors, sizes, null, "M")).toEqual({
      type: "M",
      qty: 7,
    });
  });

  it("gives nothing back when nothing was chosen", () => {
    expect(findVariation(variations, colors, sizes, null, null)).toBeNull();
  });

  it("gives nothing back when the choice has no matching option", () => {
    expect(findVariation(variations, colors, sizes, "Red", "S")).toBeNull();
  });
});

describe("cleaning typed input (pollinateInput)", () => {
  it("removes the characters that could carry a command", () => {
    expect(pollinateInput("<script>alert(1)</script>")).toBe("scriptalert1/script");
  });

  it("cuts anything longer than ninety characters", () => {
    expect(pollinateInput("a".repeat(200))).toHaveLength(90);
  });

  it("leaves ordinary words alone", () => {
    expect(pollinateInput("blue summer dress")).toBe("blue summer dress");
  });

  it("gives an empty result for anything that is not text", () => {
    expect(pollinateInput(null as any)).toBe("");
    expect(pollinateInput(5 as any)).toBe("");
  });
});

describe("locking the page behind an overlay (DisableScroll, EnableScroll)", () => {
  beforeEach(() => {
    document.documentElement.style.overflow = "";
    document.documentElement.scrollTop = 0;
  });

  it("stops the page moving and sends it to the top", () => {
    document.documentElement.scrollTop = 500;
    DisableScroll();
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.documentElement.scrollTop).toBe(0);
  });

  it("can stop the page moving without sending it to the top", () => {
    // The cart opens over the page the shopper is reading, so it must not lose
    // their place.
    document.documentElement.scrollTop = 500;
    DisableScroll(true);
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.documentElement.scrollTop).toBe(500);
  });

  it("lets the page move again", () => {
    DisableScroll();
    EnableScroll();
    expect(document.documentElement.style.overflow).toBe("initial");
  });
});

describe("naming the screen for analytics (DetectScreen)", () => {
  const go = (path: string, search = "") =>
    window.history.pushState({}, "", `${path}${search}`);

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("names the settings screen", () => {
    go("/en/setting/profile");
    expect(DetectScreen()).toBe(GA_GLOBAL_SCREEN.SETTINGS_SCREEN);
  });

  it("names the basket whenever it is open, whatever page is behind it", () => {
    // The basket is a panel over the current page, so the address still says
    // products — the open flag has to win, and it is checked before the rest.
    go("/en/products/a-dress", "?cart=true");
    expect(DetectScreen()).toBe(GA_GLOBAL_SCREEN.CART_SCREEN);
  });

  it("names the product screen", () => {
    go("/en/products/a-dress");
    expect(DetectScreen()).toBe(GA_GLOBAL_SCREEN.PRODUCT_SCREEN);
  });

  it("names the boutique screen rather than the general filters one", () => {
    go("/en/filters/boutique/shop-a");
    expect(DetectScreen()).toBe(GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN);
  });

  it("names the filters screen", () => {
    go("/en/filters/brands/nike");
    expect(DetectScreen()).toBe(GA_GLOBAL_SCREEN.FILTERS_SCREEN);
  });

  it("falls back to the home screen for anything else", () => {
    go("/en");
    expect(DetectScreen()).toBe(GA_GLOBAL_SCREEN.HOME_SCREEN);
  });
});

describe("building a video address (getVideoUrl)", () => {
  it("adds the media address, the folder and the file type", () => {
    expect(getVideoUrl("clip")).toBe(`${MEDIA}/product/videos/clip.mp4`);
  });

  it("does not add the file type twice", () => {
    expect(getVideoUrl("clip.mp4")).toBe(`${MEDIA}/product/videos/clip.mp4`);
  });

  it("does not double the slash when the name has one", () => {
    expect(getVideoUrl("/clip")).toBe(`${MEDIA}/product/videos/clip.mp4`);
  });

  it("leaves an already-hosted address exactly as it is", () => {
    // The rebuild exists to insert picture-quality settings, but that list is
    // empty, so it used to insert nothing but an extra slash. With nothing to
    // add, the address is returned untouched.
    const hosted = "https://cdn.example.com/video/upload/v1/clip.mp4";
    expect(getVideoUrl(hosted)).toBe(hosted);
  });
});

describe("writing a time a shopper can read (formatTime)", () => {
  // A fixed instant, so "today" and "yesterday" cannot drift with the clock.
  const NOW = new Date("2026-08-16T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says today for a time from today", () => {
    expect(formatTime("2026-08-16T12:00:00Z")).toMatch(
      /^\[Today\] \| \d{2}:\d{2}:\d{2}$/,
    );
  });

  it("says yesterday for a time from the day before", () => {
    const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
    expect(formatTime(yesterday.toISOString())).toMatch(
      /^\[Yesterday\] \| \d{2}:\d{2}:\d{2}$/,
    );
  });

  it("writes the full date for anything older", () => {
    expect(formatTime("2020-03-04T09:30:00Z")).toMatch(
      /^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2}:\d{2}$/,
    );
  });

  it("reads a time with no zone marker as universal time", () => {
    // The backend sends times without a marker. Reading them as the shopper's
    // own zone would shift every order time by the size of their offset.
    expect(formatTime("2026-08-16T12:00:00")).toBe(
      formatTime("2026-08-16T12:00:00Z"),
    );
  });

  it("takes Today from the translator rather than writing it in English", () => {
    // These two were the only words in the result written as plain English,
    // while every month name beside them went through the translator. An Arabic
    // shopper read an Arabic page with "Today" on their notifications. The
    // brackets are the stand-in translator's mark: no brackets, no lookup.
    expect(formatTime("2026-08-16T12:00:00Z")).toContain("[Today]");
  });

  it("takes Yesterday from the translator too", () => {
    const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
    expect(formatTime(yesterday.toISOString())).toContain("[Yesterday]");
  });

  it("does the same on the address screens, in the language it is handed", () => {
    expect(formatTimeForAddress(new Date(NOW).toISOString(), "ar")).toContain(
      "[Today]",
    );
  });

  it("reads a bare timestamp as universal time, unlike the address version", () => {
    // Confirmed as intended, and pinned so neither drifts into the other:
    // formatTime is fed universal times with no marker and forces the marker
    // on, while formatTimeForAddress is fed local times and reads them as
    // local. The two look alike, so the difference has to be written down.
    const pad = (n: number) => n.toString().padStart(2, "0");
    const readAsLocal = new Date("2026-08-16T09:30:00");
    expect(formatTimeForAddress("2026-08-16T09:30:00")).toContain(
      `${pad(readAsLocal.getHours())}:${pad(readAsLocal.getMinutes())}`,
    );

    const readAsUniversal = new Date("2026-08-16T09:30:00Z");
    expect(formatTime("2026-08-16T09:30:00")).toContain(
      `${pad(readAsUniversal.getHours())}:${pad(readAsUniversal.getMinutes())}`,
    );
  });
});

describe("reading the currency back (getCurrency)", () => {
  // Everything a shopper sees a price in comes from this one object: the symbol
  // in front of the number and the rate the number was converted with. It is
  // read out of a reply that has had two different shapes over time, and the
  // wrong branch does not fail — it hands back an object with no rate, and every
  // price on the page quietly becomes the unconverted one.
  const CURRENCY = { code: "USD", symbol: "$", exchange_rate: 1.25 };

  afterEach(() => {
    logErrorSpy.mockClear();
    vi.mocked(fetchData).mockClear();
  });

  it("asks the market backend for the currency, by name", () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      data: { currency: CURRENCY },
    } as any);

    return getCurrency({ callback: () => {} }).then(() => {
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/mobile/home/currency",
          method: "GET",
          server: "market",
          reqTitle: REQUESTS_DATA.CURRENCY_REQUEST,
        }),
      );
    });
  });

  it("unwraps the currency from inside the reply", async () => {
    // The current address nests the fields under data.currency.
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      data: { currency: CURRENCY },
    } as any);

    const callback = vi.fn();
    await expect(getCurrency({ callback })).resolves.toEqual(CURRENCY);
    expect(callback).toHaveBeenCalledWith({ currency: CURRENCY, res: {} });
  });

  it("still reads the older flat reply, where the fields sit at the top", async () => {
    // The legacy address returned them flat. Reading the nested branch on this
    // shape would hand back nothing, and no rate means every price is shown
    // unconverted.
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      data: CURRENCY,
    } as any);

    await expect(getCurrency({ callback: vi.fn() })).resolves.toEqual(CURRENCY);
  });

  it("falls back to the flat shape when the nested one is empty", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      data: { currency: null, ...CURRENCY },
    } as any);

    await expect(getCurrency({ callback: vi.fn() })).resolves.toMatchObject({
      exchange_rate: 1.25,
    });
  });

  it("hands back nothing, and reports, when the backend refuses", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      message: "no currency for you",
    } as any);

    const callback = vi.fn();
    await expect(getCurrency({ callback })).resolves.toBeNull();
    // The caller is still told, with nothing, so a screen waiting on it stops
    // waiting rather than hanging.
    expect(callback).toHaveBeenCalledWith({ currency: null, res: {} });
    expect(logErrorSpy).toHaveBeenCalled();
  });

  it("does not throw when the request itself fails", async () => {
    // This runs while a product page is loading. A raised error here would take
    // the page down over a currency lookup.
    vi.mocked(fetchData).mockRejectedValueOnce(new Error("network is gone"));

    const callback = vi.fn();
    await expect(getCurrency({ callback })).resolves.toBeNull();
    expect(callback).toHaveBeenCalledWith({ currency: null, res: {} });
  });

  it("treats a reply that succeeded but carried no currency as a failure", () => {
    // A success with no body used to fall through: nothing was reported and the
    // caller was handed undefined, where every other failure path reports and
    // hands back null. Both paths out of this function agree now.
    vi.mocked(fetchData).mockResolvedValueOnce({ success: true } as any);

    const callback = vi.fn();
    return getCurrency({ callback }).then((currency) => {
      expect(currency).toBeNull();
      expect(callback).toHaveBeenCalledWith({ currency: null, res: {} });
      expect(logErrorSpy).toHaveBeenCalled();
    });
  });
});

describe("naming a day of the week (ShowDayStr)", () => {
  it("counts from Sunday, the way the backend does", () => {
    // The backend sends 0 for Sunday. Counting from Monday instead would move
    // every opening hour a boutique has set by one day.
    expect(ShowDayStr(0, "en")).toBe("[Sunday]");
    expect(ShowDayStr(6, "en")).toBe("[Saturday]");
  });

  it("gives nothing back for a day number that does not exist", () => {
    expect(ShowDayStr(7, "en")).toBeUndefined();
  });
});

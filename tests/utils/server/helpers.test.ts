// The shared helpers behind pictures, prices and filter links.
//
// This file imports nothing at all, and almost every function in it is a plain
// input-to-output rule. That is what makes it worth pinning: it sits under the
// product cards, the basket totals, the listing filters and the page addresses,
// so a change here reaches most of what a shopper sees, and nothing was
// checking any of it.
//
// Picked over the other untested helpers because it is the largest block of
// pure logic in the app and the one with the widest reach. The picture and
// price rules are the ones a mistake shows up in immediately.
//
// Five tests here originally pinned defects the file had (a lost slash in two
// picture routes, "NaNM" before the currency loaded, a doubled slash in a video
// address, and a throw when the options were left out). All five were fixed
// afterwards, and each of those tests now asserts the repaired behaviour and
// says what it used to do — so a regression reads as the same failure again.

import { describe, expect, it, vi } from "vitest";

import {
  buildOgImageUrl,
  buildParamsFromFilters,
  combineCategoriesWithRelated,
  configureImageForBoutique,
  convertTextToXFormat,
  getBrandIconImageUrl,
  getConfiguredImage,
  GetImageUrl,
  getRobotsConfig,
  getThumb,
  getUrlofProduct,
  getVideoUrl,
  HandleIsActive,
  isIndexingAllowed,
  NormalizeSearchParamsForSearchRequest,
  parseFiltersFromParams,
  parseNumberArray,
  pollinateInput,
  RoundPrice,
  stripHtml,
} from "utils/server/helpers";

// The media address the test settings hand every helper here.
const MEDIA = "https://example.com";

describe("preparing a picture for a slot (getConfiguredImage)", () => {
  it("asks the media server for the height the slot needs", () => {
    expect(
      getConfiguredImage({
        src: "https://media.example.com/image/upload/v1/a.jpg",
        height: 194,
      }),
    ).toBe(
      "https://media.example.com/image/upload/h_194,c_pad,b_auto/f_auto/q_auto:good/fl_lossy/so_0/v1/a.jpg",
    );
  });

  it("asks for a width as well when the slot has one", () => {
    expect(
      getConfiguredImage({
        src: "https://media.example.com/image/upload/v1/a.jpg",
        height: 194,
        width: 300,
      }),
    ).toContain("h_194,w_300,c_pad,b_auto");
  });

  it("pads to a fixed width when the slot asks to be padded", () => {
    expect(
      getConfiguredImage({
        src: "https://media.example.com/image/upload/v1/a.jpg",
        height: 194,
        c_pad: true,
      }),
    ).toContain("h_194,w_800,c_pad/");
  });

  it("keeps the slash before the version for an upload record too", () => {
    // The two shapes used to cut the address at different points — "/upload" for
    // text and "/upload/" for a record — so a record came back with the version
    // glued to the end of the settings ("…/so_0v1/a.jpg"). One rule now serves
    // both, and the same picture gives the same address whichever shape it
    // arrives in.
    const expected =
      "https://media_server.example.com/image/upload/h_100,c_pad,b_auto/f_auto/q_auto:good/fl_lossy/so_0/v1/a.jpg";
    expect(
      getConfiguredImage({
        src: { file_path: "https://media_server.example.com/image/upload/v1/a.jpg" },
        height: 100,
      }),
    ).toBe(expected);
    expect(
      getConfiguredImage({
        src: "https://media_server.example.com/image/upload/v1/a.jpg",
        height: 100,
      }),
    ).toBe(expected);
  });

  it("leaves an upload record from anywhere else alone", () => {
    expect(
      getConfiguredImage({ src: { file_path: "/plain/a.jpg" }, height: 100 }),
    ).toBe("/plain/a.jpg");
  });

  it("gives an empty picture back when it was given nothing", () => {
    expect(getConfiguredImage({ src: null, height: 100 })).toBe("");
  });
});

describe("building a picture address (GetImageUrl)", () => {
  it("leaves a full address alone", () => {
    expect(GetImageUrl("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
  });

  it("puts the media address in front of a bare path", () => {
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
    expect(GetImageUrl(null)).toBeNull();
  });

  it("takes an upload record's own path as final when it names the media server", () => {
    expect(
      GetImageUrl({ file_path: "https://media_server.example.com/a.jpg" }),
    ).toBe("https://media_server.example.com/a.jpg");
  });

  it("adds the missing slash to an upload record's path as well", () => {
    // This route used to glue a path with no leading slash straight onto the
    // media address ("…example.comcustomers/a.jpg" — a picture that cannot
    // load), while the text route added the slash. Both join the same way now.
    expect(GetImageUrl({ file_path: "customers/a.jpg" })).toBe(
      `${MEDIA}/customers/a.jpg`,
    );
    expect(GetImageUrl({ file_path: "/customers/a.jpg" })).toBe(
      `${MEDIA}/customers/a.jpg`,
    );
  });
});

describe("preparing the wide pictures (configureImageForBoutique, buildOgImageUrl)", () => {
  it("asks for the boutique banner at its own width", () => {
    expect(
      configureImageForBoutique("https://media.example.com/image/upload/v1/a.jpg"),
    ).toBe(
      "https://media.example.com/image/upload/w_1356,c_pad,b_auto/f_auto/q_auto:best/fl_lossy/so_0/v1/a.jpg",
    );
  });

  it("gives an empty banner back when there is no picture", () => {
    expect(configureImageForBoutique("")).toBe("");
  });

  it("sizes the sharing picture to what the social sites expect", () => {
    expect(
      buildOgImageUrl("https://media.ramaaz.dev/image/upload/v1/a.jpg"),
    ).toBe(
      "https://media.ramaaz.dev/image/upload/w_1200,h_630,c_pad/f_jpg/q_90/v1/a.jpg",
    );
  });

  it("moves a sharing picture off the internal host onto the public one", () => {
    expect(
      buildOgImageUrl("https://media_server.ramaaz.dev/image/upload/v1/a.jpg"),
    ).toContain("https://media.ramaaz.dev/");
  });

  it("leaves a sharing picture alone when it is not on the media server", () => {
    expect(buildOgImageUrl("https://other.example.com/a.jpg")).toBe(
      "https://other.example.com/a.jpg",
    );
  });

  it("gives nothing back when there is no sharing picture", () => {
    expect(buildOgImageUrl(null)).toBeNull();
    expect(buildOgImageUrl(undefined)).toBeNull();
  });
});

describe("building a brand logo address (getBrandIconImageUrl)", () => {
  it("fits the logo into the small default box", () => {
    expect(
      getBrandIconImageUrl({
        file_path: "https://media_server.example.com/image/upload/v1/i.png",
      }),
    ).toBe(
      "https://media_server.example.com/image/upload/w_60,h_30,c_fit,f_auto,q_auto:good/v1/i.png",
    );
  });

  it("uses the box the caller asks for instead", () => {
    expect(
      getBrandIconImageUrl(
        { file_path: "https://media_server.example.com/image/upload/v1/i.png" },
        { width: 120, height: 90 },
      ),
    ).toContain("w_120,h_90,c_fit");
  });

  it("leaves a logo hosted anywhere else exactly as it is", () => {
    expect(getBrandIconImageUrl("https://other.example.com/i.png")).toBe(
      "https://other.example.com/i.png",
    );
  });

  it("gives an empty address back when there is no logo", () => {
    expect(getBrandIconImageUrl(null)).toBe("");
  });
});

describe("showing a price (RoundPrice)", () => {
  it("converts into the shopper's currency", () => {
    expect(
      RoundPrice({ num: 10.5, rate: 2, points: 2, returnNumber: true }),
    ).toBe(21);
  });

  it("multiplies without the usual decimal drift", () => {
    // 0.1 * 0.2 in ordinary arithmetic gives 0.020000000000000004.
    expect(
      RoundPrice({ num: 0.1, rate: 0.2, points: 1, returnNumber: true }),
    ).toBe(0.02);
  });

  it("always rounds a fraction of a penny up, never down", () => {
    expect(
      RoundPrice({ num: 10.001, rate: 1, points: 2, returnNumber: true }),
    ).toBe(10.01);
  });

  it("leaves the rate out when none was given", () => {
    expect(RoundPrice({ num: 12.5, points: 2, returnNumber: true })).toBe(12.5);
  });

  it("writes an ordinary price out in full", () => {
    expect(RoundPrice({ num: 1234, rate: 1, points: 2 })).toBe(1234);
  });

  it("writes a free item as zero", () => {
    expect(RoundPrice({ num: 0, rate: 1, points: 2 })).toBe("0");
  });

  it("shortens a price in the hundreds of thousands to thousands", () => {
    expect(RoundPrice({ num: 150000, rate: 1, points: 2 })).toBe("150K");
  });

  it("shortens a price in the millions to millions", () => {
    expect(RoundPrice({ num: 1000000, rate: 1, points: 2 })).toBe("1M");
  });

  it("uses the Arabic short forms on the Arabic site", () => {
    expect(RoundPrice({ num: 150000, rate: 1, points: 2, language: "ar" })).toBe(
      "150أ",
    );
    expect(
      RoundPrice({ num: 1000000, rate: 1, points: 2, language: "ar" }),
    ).toBe("1م");
  });

  it("still shows a price when the currency has not loaded yet", () => {
    // Callers pass `points: currency?.decimal_digits`, which is undefined until
    // the currency request lands. That used to make the rounding factor NaN and
    // the shopper was shown "NaNM" while the page was still loading. Zero
    // decimals is the fallback, matching the client-side sibling.
    expect(RoundPrice({ num: 25, rate: 1 })).toBe(25);
    expect(RoundPrice({ num: 25.4, rate: 1 })).toBe(26);
  });
});

describe("building a video address (getVideoUrl)", () => {
  it("adds the media address, the folder and the file type", () => {
    expect(getVideoUrl("clip", {})).toBe(
      `${MEDIA}/product/videos/clip.mp4?`,
    );
  });

  it("does not add the file type twice", () => {
    expect(getVideoUrl("clip.mp4", {})).toBe(`${MEDIA}/product/videos/clip.mp4?`);
  });

  it("does not double the slash when the name has one", () => {
    expect(getVideoUrl("/clip.mp4", {})).toBe(`${MEDIA}/product/videos/clip.mp4?`);
  });

  it("asks for the short preview when the caller wants one", () => {
    expect(getVideoUrl("clip", { end: 5 })).toBe(
      `${MEDIA}/product/videos/clip.mp4?target=preview`,
    );
  });

  it("gives an empty address back when there is no video", () => {
    expect(getVideoUrl("", {})).toBe("");
  });

  it("leaves an already-hosted video exactly as it is", () => {
    // Nothing is ever put in the transformation list, so an empty settings block
    // used to be inserted anyway and the address came back with a doubled slash.
    // With nothing to add, the address is returned untouched.
    const hosted = "https://media.example.com/video/upload/v123/a.mp4";
    expect(getVideoUrl(hosted, {})).toBe(hosted);
  });

  it("works when the caller gives no options at all", () => {
    // The options are optional in the signature and were read as if they were
    // not, so leaving them out threw. Every caller passes them today, which is
    // the only reason it never fired.
    expect(getVideoUrl("clip")).toBe(`${MEDIA}/product/videos/clip.mp4?`);
  });
});

describe("building a product page address (getUrlofProduct)", () => {
  it("points at the product on the right country and language site", () => {
    expect(getUrlofProduct(undefined, "en", "gb", "blue-shirt")).toBe(
      "/gb-en/products/blue-shirt",
    );
  });

  it("carries the chosen colour so the page opens on it", () => {
    expect(getUrlofProduct("Sky Blue", "ar", "tr", "blue-shirt")).toBe(
      "/tr-ar/products/blue-shirt?color=Sky%20Blue",
    );
  });
});

describe("reading the filters out of an address (parseFiltersFromParams)", () => {
  it("gives nothing back when the address carries no filters", () => {
    expect(parseFiltersFromParams([])).toEqual({});
    expect(parseFiltersFromParams(undefined)).toEqual({});
  });

  it("splits a list of choices on the commas", () => {
    expect(parseFiltersFromParams(["categories", "shoes,bags"])).toEqual({
      categories: ["shoes", "bags"],
    });
  });

  it("puts the hash back on colours so they can be matched", () => {
    expect(parseFiltersFromParams(["colors", "ff0000,00ff00"])).toEqual({
      colors: ["#ff0000", "#00ff00"],
    });
  });

  it("does not add a second hash to a colour that already has one", () => {
    expect(parseFiltersFromParams(["colors", "%23ff0000"])).toEqual({
      colors: ["#ff0000"],
    });
  });

  it("keeps a search phrase whole rather than splitting it", () => {
    expect(parseFiltersFromParams(["search", "red running shoes"])).toEqual({
      search_text: ["red running shoes"],
    });
  });

  it("skips a part of the address it does not recognise", () => {
    expect(parseFiltersFromParams(["junk", "value", "brands", "nike"])).toEqual({
      brands: ["nike"],
    });
  });

  it("ignores a filter name with no choices after it", () => {
    expect(parseFiltersFromParams(["brands"])).toEqual({});
  });

  it("folds the related categories into the ordinary ones, without repeats", () => {
    expect(
      parseFiltersFromParams(["categories", "shoes", "related_categories", "bags,shoes"]),
    ).toEqual({ categories: ["shoes", "bags"] });
  });
});

describe("reading numbers out of an address (parseNumberArray)", () => {
  it("reads a plain list of numbers", () => {
    expect(parseNumberArray("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("drops anything in the list that is not a number", () => {
    expect(parseNumberArray("1, x, 3")).toEqual([1, 3]);
  });

  it("gives an empty list back when there is nothing to read", () => {
    expect(parseNumberArray(null)).toEqual([]);
    expect(parseNumberArray("")).toEqual([]);
  });
});

describe("turning a search address into a search request (NormalizeSearchParamsForSearchRequest)", () => {
  const normalize = (searchParams: any, extra: any = {}) =>
    NormalizeSearchParamsForSearchRequest({
      searchParams,
      isFeatured: false,
      isFlashDeal: false,
      ...extra,
    });

  it("asks for nothing extra when the address carries nothing", () => {
    expect(normalize({})).toEqual({});
  });

  it("reads the chosen categories", () => {
    expect(normalize({ category_slugs: '["shoes","bags"]' })).toEqual({
      categories: ["shoes", "bags"],
    });
  });

  it("adds the related categories to the chosen ones, without repeats", () => {
    expect(
      normalize({
        category_slugs: '["shoes"]',
        related_category_slugs: '["bags","shoes"]',
      }),
    ).toEqual({ categories: ["shoes", "bags"] });
  });

  it("reads the chosen boutiques, brands, colours and tags", () => {
    expect(
      normalize({
        boutique_slugs: '["shop-a"]',
        brand_slugs: '["nike"]',
        colors: '["#ff0000"]',
        tags_names: '["summer"]',
      }),
    ).toEqual({
      boutiques: ["shop-a"],
      brands: ["nike"],
      colors: ["#ff0000"],
      tags_names: ["summer"],
    });
  });

  it("reads a price band written as one number to another", () => {
    expect(normalize({ price: "10-50" })).toEqual({
      priceRange: [10, 50],
      prices: [10, 50],
    });
  });

  it("turns on the flash deals when the address asks for them", () => {
    expect(normalize({ flash_deal: "true" })).toEqual({ flashdeal: true });
  });

  it("turns on the flash deals when the page itself is the flash deals page", () => {
    expect(normalize({}, { isFlashDeal: true })).toEqual({ flashdeal: true });
  });

  it("strips the quotes off a search phrase", () => {
    expect(normalize({ search_text: '"red shoes"' })).toEqual({
      search_text: "red shoes",
    });
  });

  it("reads the chosen sizes out of the attributes", () => {
    expect(
      normalize({ attributes: '[{"name":"size","options":["S","M"]}]' }),
    ).toEqual({ sizes: ["S", "M"] });
  });

  it("asks only for the featured products on the featured page", () => {
    expect(normalize({}, { isFeatured: true })).toEqual({ featured: true });
  });
});

describe("whether search engines may list the site (isIndexingAllowed, getRobotsConfig)", () => {
  const productionRobots = { index: true, follow: true };

  it("keeps the site out of search results unless it is turned on", () => {
    expect(isIndexingAllowed()).toBe(false);
    expect(getRobotsConfig(productionRobots)).toEqual({
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    });
  });

  it("lets search engines in once it is turned on", () => {
    vi.stubEnv("NEXT_PUBLIC_ALLOW_INDEXING", "true");
    expect(isIndexingAllowed()).toBe(true);
    expect(getRobotsConfig(productionRobots)).toBe(productionRobots);
    vi.unstubAllEnvs();
  });
});

describe("building a filter link (buildParamsFromFilters, HandleIsActive)", () => {
  it("gives nothing back when nothing is chosen", () => {
    expect(buildParamsFromFilters({})).toEqual([]);
  });

  it("always uses the same order, whatever order the choices came in", () => {
    expect(
      buildParamsFromFilters({ sizes: ["m"], boutiques: ["shop-a"], brands: ["nike"] }),
    ).toEqual(["boutiques", "shop-a", "brands", "nike", "sizes", "m"]);
  });

  it("joins several choices of the same kind with commas", () => {
    expect(buildParamsFromFilters({ categories: ["shoes", "bags"] })).toEqual([
      "categories",
      "shoes,bags",
    ]);
  });

  it("drops the hash from colours so the address stays readable", () => {
    expect(buildParamsFromFilters({ colors: ["#ff0000", "00ff00"] })).toEqual([
      "colors",
      "ff0000,00ff00",
    ]);
  });

  it("marks a filter as chosen only when it is in the list", () => {
    expect(HandleIsActive({ values: ["shoes"], item: "shoes" })).toBe(true);
    expect(HandleIsActive({ values: ["shoes"], item: "bags" })).toBe(false);
    expect(HandleIsActive({ values: undefined, item: "shoes" })).toBeUndefined();
  });
});

describe("cleaning typed input (pollinateInput)", () => {
  it("removes the characters that could carry a command", () => {
    expect(pollinateInput("<script>alert(1)</script>")).toBe("scriptalert1/script");
  });

  it("cuts anything longer than ninety characters", () => {
    expect(pollinateInput("a".repeat(120))).toHaveLength(90);
  });

  it("gives an empty result for anything that is not text", () => {
    expect(pollinateInput(null as any)).toBe("");
  });
});

describe("showing the related categories alongside the ordinary ones", () => {
  const categories = [{ slug: "shoes", childes: [{ slug: "boots", childes: [] }] }];

  it("changes nothing when there are no related categories", () => {
    expect(combineCategoriesWithRelated(categories, [])).toBe(categories);
  });

  it("adds the related ones at the end and marks them as related", () => {
    const result = combineCategoriesWithRelated(categories, [
      { slug: "bags", childes: [{ slug: "totes", childes: [] }] },
    ]);
    expect(result).toHaveLength(2);
    expect(result[1].is_related_category).toBe(true);
    expect(result[1].childes[0].is_related_category).toBe(true);
  });

  it("keeps a category that appears on both lists rather than hiding one", () => {
    const result = combineCategoriesWithRelated(categories, [
      { slug: "shoes", childes: [] },
    ]);
    expect(result).toHaveLength(2);
  });
});

describe("tidying text for display (stripHtml, getThumb, convertTextToXFormat)", () => {
  it("removes the formatting tags from a description", () => {
    expect(stripHtml("<p>Soft <b>cotton</b> shirt</p>")).toBe("Soft cotton shirt");
  });

  it("gives an empty description back when there is none", () => {
    expect(stripHtml("")).toBe("");
  });

  it("asks the media server for a small thumbnail", () => {
    expect(getThumb("https://media.example.com/image/upload/v1/a.jpg", false)).toBe(
      "https://media.example.com/image/upload/h_194/f_webp/q_100/v1/a.jpg",
    );
  });

  it("gives nothing back when there is no picture to shrink", () => {
    expect(getThumb(undefined, false)).toBeUndefined();
  });

  it("hides a name behind crosses but keeps its shape", () => {
    expect(convertTextToXFormat("John Doe")).toBe("Jxxx Dxx");
  });

  it("gives an empty result when there is no name to hide", () => {
    expect(convertTextToXFormat("")).toBe("");
  });
});

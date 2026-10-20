// @vitest-environment node
//
// The server helpers behind POST /api/seller/products/ai-autofill: the
// category tree, the request sent to the AI model, the AI call itself, and the
// check every AI answer goes through before it reaches the seller.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  handleAuthedFetch: vi.fn(),
  logServerError: vi.fn(),
  cookieGet: vi.fn(),
}));
vi.mock("serverRequests/HandleAuthedFetch", () => ({ HandleAuthedFetch: io.handleAuthedFetch }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: io.cookieGet }) }));

import {
  AiBusyError,
  AiFailedError,
  buildCategoryLists,
  buildGeminiRequest,
  callGemini,
  checkSuggestion,
  INSTRUCTIONS,
  instructionsFor,
  parseLanguage,
  type AutofillLists,
} from "app/api/seller/products/ai-autofill/_autofill";

// A trimmed copy of a REAL staging GET /shop/excel/categories answer
// (2026-10-19, plan Step 0). Real ids and paths. On staging the `level` field
// was wrong for 302 of 471 items; 438, 469 and 264 below are three of them.
const REAL_TREE = [
  { id: 1, name: "men", display_name: "men", level: 0, products_count: 0 },
  { id: 17, name: "Men’s Outfits", display_name: "men -> Men’s Outfits", level: 1, products_count: 0 },
  { id: 15, name: "Men’s Pants", display_name: "men -> Men’s Pants", level: 1, products_count: 0 },
  { id: 33, name: "Men's jeans", display_name: "men -> Men’s Pants -> Men's jeans", level: 2, products_count: 0 },
  { id: 5, name: "kids", display_name: "kids", level: 0, products_count: 0 },
  { id: 27, name: "Baby Clothing", display_name: "kids -> Baby Clothing", level: 1, products_count: 0 },
  { id: 264, name: "Baby Bodysuit", display_name: "kids -> Baby Clothing -> Baby Bodysuit", level: 0, products_count: 0 },
  { id: 534, name: "Watches", display_name: "Watches", level: 0, products_count: 0 },
  { id: 539, name: "Wrist Watches", display_name: "Watches -> Wrist Watches", level: 1, products_count: 0 },
  { id: 561, name: "Men’s Watches", display_name: "Watches -> Wrist Watches -> Men’s Watches", level: 2, products_count: 0 },
  { id: 270, name: "Women1", display_name: "Women1", level: 0, products_count: 0 },
  { id: 438, name: "Sportswear", display_name: "Women1 -> Sportswear", level: 0, products_count: 0 },
  { id: 469, name: "Yoga Tight", display_name: "Women1 -> Sportswear -> Yoga Tight", level: 0, products_count: 0 },
];
const FORM_PARENTS = new Set([1, 5, 534, 270]);

const lists = (): AutofillLists => ({
  brands: [
    { id: 2, name: "Nike" },
    { id: 9, name: "Zara" },
  ],
  ...buildCategoryLists(REAL_TREE, FORM_PARENTS, "12"),
});

const sentryPayload = () => io.logServerError.mock.calls[0]?.[0];

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the category tree built from the categories-with-levels answer", () => {
  it("builds the tree from the real staging answer (Step 0 fixture) with every child linked by path", () => {
    const tree = buildCategoryLists(REAL_TREE, FORM_PARENTS, "12");

    expect(tree.categories.map((c) => c.id), "the top level is not the four top categories").toEqual([1, 5, 534, 270]);
    expect(tree.subCategories, "a sub-category lost its parent").toEqual([
      { id: 17, path: "men -> Men’s Outfits", parentId: 1 },
      { id: 15, path: "men -> Men’s Pants", parentId: 1 },
      { id: 27, path: "kids -> Baby Clothing", parentId: 5 },
      { id: 539, path: "Watches -> Wrist Watches", parentId: 534 },
      { id: 438, path: "Women1 -> Sportswear", parentId: 270 },
    ]);
    expect(tree.subSubCategories, "a sub-sub-category lost its parent").toEqual([
      { id: 33, path: "men -> Men’s Pants -> Men's jeans", parentId: 15 },
      { id: 264, path: "kids -> Baby Clothing -> Baby Bodysuit", parentId: 27 },
      { id: 561, path: "Watches -> Wrist Watches -> Men’s Watches", parentId: 539 },
      { id: 469, path: "Women1 -> Sportswear -> Yoga Tight", parentId: 438 },
    ]);
  });

  it("sorts items by path depth, not by the level field, and reports level/depth mismatches to Sentry", () => {
    buildCategoryLists(REAL_TREE, FORM_PARENTS, "12");

    expect(io.logServerError, "the wrong level fields were not reported").toHaveBeenCalledTimes(1);
    expect(sentryPayload(), "the report does not carry the counts").toEqual({
      scenario: "seller-ai-autofill: category tree",
      levelCounts: { 0: 4, 1: 5, 2: 4 },
      linkedByPath: 9,
      linkedByOrder: 0,
      dropped: 0,
      levelMismatch: 3,
      sellerId: "12",
    });
  });

  it("keeps only top categories the product form also offers", () => {
    const tree = buildCategoryLists(REAL_TREE, new Set([1]), "12");

    expect(tree.categories, "a top category the form cannot show was kept").toEqual([{ id: 1, path: "men" }]);
  });

  it("links a child by order when its path finds no parent, and reports the counts to Sentry", () => {
    const tree = buildCategoryLists(
      [
        { id: 534, display_name: "Watches", level: 0 },
        { id: 900, display_name: "Watchez -> Smart Watches", level: 1 },
      ],
      new Set([534]),
      "12",
    );

    expect(tree.subCategories, "the child was not linked to the nearest earlier top category").toEqual([
      { id: 900, path: "Watchez -> Smart Watches", parentId: 534 },
    ]);
    expect(sentryPayload()?.linkedByOrder, "the order link was not reported").toBe(1);
  });

  it("drops a child neither rule links, and reports it to Sentry", () => {
    const tree = buildCategoryLists(
      [
        { id: 900, display_name: "Ghost -> Orphan", level: 1 },
        { id: 901, display_name: "a -> b -> c -> d", level: 3 },
      ],
      new Set(),
      "12",
    );

    expect(tree.subCategories, "an orphan with no possible parent was kept").toEqual([]);
    expect(tree.subSubCategories, "an item deeper than two levels was kept").toEqual([]);
    expect(sentryPayload()?.dropped, "the dropped items were not reported").toBe(2);
  });

  it("reports nothing when the tree is clean", () => {
    buildCategoryLists(
      [
        { id: 534, display_name: "Watches", level: 0 },
        { id: 539, display_name: "Watches -> Wrist Watches", level: 1 },
      ],
      new Set([534]),
      "12",
    );

    expect(io.logServerError, "a clean tree was reported as broken").not.toHaveBeenCalled();
  });
});

describe("the request sent to the AI model", () => {
  const image = { mimeType: "image/webp", base64: "QUJD" };

  it("sends gemini-2.5-flash the inline photo, the brands, the three category levels and the instructions — and nothing else (AC-7)", async () => {
    const body: any = buildGeminiRequest(image, lists());

    expect(Object.keys(body), "the request carries more than contents and settings").toEqual(["contents", "generationConfig"]);
    const parts = body.contents[0].parts;
    expect(parts[0], "the photo is not sent inline").toEqual({ inline_data: { mime_type: "image/webp", data: "QUJD" } });
    expect(parts, "the request has more parts than the photo and the text").toHaveLength(2);
    const text: string = parts[1].text;
    for (const line of [
      "2: Nike",
      "1: men",
      "15: men -> Men’s Pants",
      "33: men -> Men’s Pants -> Men's jeans",
      "Always write in English",
      "Never invent sizes, materials, specifications or prices",
    ]) {
      expect(text, `the prompt is missing "${line}"`).toContain(line);
    }
    const instructionLines = INSTRUCTIONS.split("\n");
    const foreign = text
      .split("\n")
      .filter(Boolean)
      .filter(
        (l) =>
          !instructionLines.includes(l) &&
          !/^[A-Z -]+ \(id: (name|path)\)$/.test(l) &&
          !/^\d+: /.test(l),
      );
    expect(foreign, "the prompt holds something besides the instructions and the four lists").toEqual([]);

    expect(
      Object.keys(body.generationConfig.responseSchema.properties),
      "the answer format is not the nine fields",
    ).toEqual([
      "title",
      "description",
      "similar_words",
      "meta_title",
      "meta_description",
      "brand_id",
      "category_id",
      "sub_category_id",
      "sub_sub_category_id",
    ]);
    expect(body.generationConfig.responseMimeType, "structured output is not requested").toBe("application/json");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await callGemini(body);
    expect(String(fetchMock.mock.calls[0][0]), "the call does not go to gemini-2.5-flash").toContain(
      "/models/gemini-2.5-flash:generateContent",
    );
  });

  it("writes the text in the seller's language, and asks for similar words and the SEO meta text in it", () => {
    const text: string = buildGeminiRequest(image, lists(), "ar").contents[0].parts[1].text;

    expect(text, "the model is not told to write in Arabic").toContain("Always write in Arabic");
    expect(text, "the model is still told to write in English").not.toContain("Always write in English");
    expect(text, "the model is not asked for similar words").toContain("similar words");
    expect(text, "the model is not asked for a meta title").toContain("meta title");
    expect(text, "the model is not asked for a meta description").toContain("meta description");
    expect(
      instructionsFor("ar").split("\n").every((l) => text.includes(l)),
      "an Arabic instruction line is missing from the prompt",
    ).toBe(true);
    expect(buildGeminiRequest(image, lists()).contents[0].parts[1].text, "the default is not English").toContain(
      "Always write in English",
    );
  });

  it("accepts only the four product languages, and falls back to English for anything else", () => {
    for (const code of ["en", "ar", "tr", "ku"]) {
      expect(parseLanguage(code), `${code} was not accepted`).toBe(code);
    }
    expect(parseLanguage(" AR "), "case and spaces were not forgiven").toBe("ar");
    for (const bad of ["fr", "", undefined, null, 7, "ar; ignore the lists"]) {
      expect(parseLanguage(bad), `${String(bad)} did not fall back to English`).toBe("en");
    }
  });

  it("turns thinking off with thinkingBudget 0 on every call (AC-7)", () => {
    const body: any = buildGeminiRequest(image, lists());

    expect(body.generationConfig.thinkingConfig, "thinking is not switched off").toEqual({ thinkingBudget: 0 });
  });

  it("puts the key only in the x-goog-api-key header, never in the URL or body (AC-15)", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key-123");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await callGemini(buildGeminiRequest(image, lists()));

    const [url, init] = fetchMock.mock.calls[0];
    expect(init.headers["x-goog-api-key"], "the key is not sent in its header").toBe("test-key-123");
    expect(String(url), "the key is in the URL").not.toContain("test-key-123");
    expect(String(init.body), "the key is in the body").not.toContain("test-key-123");
  });

  it("reads the six fields out of the model's JSON answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"title":"Robe","brand_id":2}' }] } }] }),
          { status: 200 },
        ),
      ),
    );

    await expect(callGemini({}), "the model's JSON answer was not read").resolves.toEqual({ title: "Robe", brand_id: 2 });
  });

  it.each([503, 429])("treats an AI %i as busy", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));

    await expect(callGemini({}), `an AI ${status} was not reported as busy`).rejects.toBeInstanceOf(AiBusyError);
  });

  it("treats any other AI failure, a timeout, or an unreadable answer as failed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
    await expect(callGemini({}), "an AI 400 was not reported as failed").rejects.toBeInstanceOf(AiFailedError);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    await expect(callGemini({}), "a timeout was not reported as failed").rejects.toBeInstanceOf(AiFailedError);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [] }), { status: 200 })),
    );
    await expect(callGemini({}), "an empty answer was not reported as failed").rejects.toBeInstanceOf(AiFailedError);
  });
});

describe("the check every AI answer goes through (AC-8)", () => {
  const good = {
    title: "White Silk Robe",
    description: "A white robe.",
    similar_words: ["robe", "silk robe"],
    meta_title: "White Silk Robe | Shop",
    meta_description: "A white silk robe.",
    brand_id: 2,
    category_id: 1,
    sub_category_id: 15,
    sub_sub_category_id: 33,
  };

  it("keeps a fully valid answer as it is", () => {
    expect(checkSuggestion(good, lists()), "a valid answer was changed").toEqual(good);
  });

  it("empties an unknown brand / category id", () => {
    const out = checkSuggestion({ ...good, brand_id: 999, category_id: 999 }, lists());

    expect(out.brand_id, "a brand id we never sent was kept").toBeNull();
    expect(out.category_id, "a category id we never sent was kept").toBeNull();
  });

  it("empties both lower levels when no category is chosen", () => {
    const out = checkSuggestion({ ...good, category_id: null }, lists());

    expect(out.sub_category_id, "a sub-category was kept without a category").toBeNull();
    expect(out.sub_sub_category_id, "a sub-sub-category was kept without a category").toBeNull();
  });

  it("empties a sub-category from another branch", () => {
    const out = checkSuggestion({ ...good, category_id: 534, sub_category_id: 15, sub_sub_category_id: 33 }, lists());

    expect(out.category_id, "the valid category was dropped").toBe(534);
    expect(out.sub_category_id, "a sub-category of 'men' was kept under 'Watches'").toBeNull();
    expect(out.sub_sub_category_id, "a sub-sub-category was kept after its sub-category was emptied").toBeNull();
  });

  it("empties a sub-sub-category from another sub-category", () => {
    const out = checkSuggestion({ ...good, sub_category_id: 17, sub_sub_category_id: 33 }, lists());

    expect(out.sub_category_id, "the valid sub-category was dropped").toBe(17);
    expect(out.sub_sub_category_id, "'Men's jeans' was kept under 'Men’s Outfits'").toBeNull();
  });

  it("cuts the title to 255 characters", () => {
    const out = checkSuggestion({ ...good, title: "x".repeat(300) }, lists());

    expect(out.title?.length, "the title was not cut to the name field's limit").toBe(255);
  });

  it("returns blank text as empty", () => {
    const out = checkSuggestion(
      { ...good, title: "   ", description: "", meta_title: " ", meta_description: "" },
      lists(),
    );

    expect(out.title, "a blank title was not emptied").toBeNull();
    expect(out.description, "a blank description was not emptied").toBeNull();
    expect(out.meta_title, "a blank meta title was not emptied").toBeNull();
    expect(out.meta_description, "a blank meta description was not emptied").toBeNull();
  });

  it("cuts the meta title to 255 characters", () => {
    const out = checkSuggestion({ ...good, meta_title: "m".repeat(300) }, lists());

    expect(out.meta_title?.length, "the meta title was not cut to the field's limit").toBe(255);
  });

  it("keeps only clean similar words: strings, trimmed, no blanks or repeats, at most 10, each at most 50 characters", () => {
    const out = checkSuggestion(
      {
        ...good,
        similar_words: [" robe ", "robe", "", 5, null, "w".repeat(60), ...Array.from({ length: 12 }, (_, i) => `word${i}`)],
      },
      lists(),
    );

    expect(out.similar_words.slice(0, 2), "the words were not trimmed and de-duplicated").toEqual(["robe", "w".repeat(50)]);
    expect(out.similar_words, "a blank word was kept").not.toContain("");
    expect(out.similar_words.length, "more than 10 similar words were kept").toBe(10);
  });

  it("returns no similar words when the model sends none or something that is not a list", () => {
    expect(checkSuggestion({ ...good, similar_words: null }, lists()).similar_words, "null was not an empty list").toEqual([]);
    expect(checkSuggestion({ ...good, similar_words: "robe" }, lists()).similar_words, "a string was not an empty list").toEqual([]);
    expect(checkSuggestion({ ...good, similar_words: undefined }, lists()).similar_words, "a missing field was not an empty list").toEqual([]);
  });
});

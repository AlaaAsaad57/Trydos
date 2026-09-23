// @vitest-environment node
//
// The home main-categories JSON route (mobile / external callers).
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCategories = vi.fn();
vi.mock("@/services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getCategories = getCategories;
  },
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/home/mainCategories/route";

const request = (headers: Record<string, string> = {}) =>
  new NextRequest("https://trydos.test/api/home/mainCategories", { headers });

const category = (id: number, lang: string) => ({
  id,
  name: `c${id}-${lang}`,
  slug: `c${id}`,
  flat_photo_path: "f",
  outline_photo_path: "o",
  fill_photo_path: "p",
  language_code: lang.toUpperCase(),
});

beforeEach(() => {
  vi.clearAllMocks();
  getCategories.mockResolvedValue({
    hits: {
      hits: [
        { _source: { custom_categories: [category(1, "en"), category(1, "ar")] } },
        { _source: { custom_categories: [category(1, "en")] } },
        { _source: { custom_categories: [category(2, "ar")] } },
        { _source: {} },
      ],
    },
  });
});

describe("the home main-categories route", () => {
  it("returns each category once, in the asked language, without the language field", async () => {
    const response = await GET(request({ country: "iq", lang: "ar" }));

    expect(getCategories, "Elasticsearch was not asked for the country's categories").toHaveBeenCalledWith({
      country: "iq",
      size: 4000,
    });
    await expect(response.json(), "the categories were not de-duplicated and shaped").resolves.toEqual({
      data: {
        mainCategories: [
          { id: 1, name: "c1-ar", slug: "c1", flat_photo_path: "f", outline_photo_path: "o", fill_photo_path: "p" },
          { id: 2, name: "c2-ar", slug: "c2", flat_photo_path: "f", outline_photo_path: "o", fill_photo_path: "p" },
        ],
      },
    });
  });

  it("uses Syria and English when no header is sent", async () => {
    const response = await GET(request());

    expect(getCategories.mock.calls[0][0].country, "the default country is not Syria").toBe("sy");
    const body = await response.json();
    expect(
      body.data.mainCategories.map((c: any) => c.name),
      "the default language is not English",
    ).toEqual(["c1-en"]);
  });

  it("refuses a blank language header", async () => {
    const response = await GET(request({ language: " " }));

    expect(response.status, "a blank language header was accepted").toBe(400);
  });

  it("answers 500 and reports when Elasticsearch throws", async () => {
    getCategories.mockRejectedValue(new Error("es down"));

    const response = await GET(request());

    expect(response.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect(LogServerError, "the Elasticsearch failure was not reported").toHaveBeenCalled();
  });
});

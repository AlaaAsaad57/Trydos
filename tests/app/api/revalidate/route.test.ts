// @vitest-environment node
//
// The cache-revalidation route: drops the page and data caches.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => revalidatePath(...a),
  revalidateTag: (...a: unknown[]) => revalidateTag(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/revalidate/route";

const request = (query = "") => new NextRequest(`https://trydos.test/api/revalidate${query}`);

beforeEach(() => vi.clearAllMocks());

describe("the revalidate route", () => {
  it("drops only the stories cache for value=stories", async () => {
    const response = await GET(request("?value=stories"));

    expect(revalidateTag, "the stories cache was not dropped").toHaveBeenCalledWith("stories", "max");
    expect(revalidatePath, "a page cache was dropped for a stories-only request").not.toHaveBeenCalled();
    await expect(response.json(), "the answer did not say it revalidated").resolves.toEqual({
      revalidated: "true",
      error: null,
    });
  });

  it("drops every page and data cache otherwise", async () => {
    const response = await GET(request());

    for (const path of ["/products", "/categories", "/filters", "/featured", "/flashDeals"]) {
      expect(revalidatePath, `the ${path} page cache was not dropped`).toHaveBeenCalledWith(path);
    }
    for (const tag of ["home", "listing", "product-details", "languages", "countries"]) {
      expect(revalidateTag, `the ${tag} data cache was not dropped`).toHaveBeenCalledWith(tag, "max");
    }
    expect(response.headers.get("cache-control"), "the answer may be cached").toContain("no-store");
  });

  it("answers with the error when a revalidation throws", async () => {
    revalidateTag.mockImplementationOnce(() => {
      throw new Error("no store");
    });

    const response = await GET(request("?value=stories"));

    await expect(response.json(), "the error was not passed back").resolves.toEqual({
      revalidated: "false",
      error: "no store",
    });
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });

  it("turns a thrown value that is not an Error into text", async () => {
    revalidateTag.mockImplementationOnce(() => {
      throw "plain";
    });

    const body = await (await GET(request("?value=stories"))).json();

    expect(body.error, "a thrown string was not passed back as text").toBe("plain");
  });
});

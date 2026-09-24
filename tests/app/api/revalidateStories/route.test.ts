// @vitest-environment node
//
// The stories revalidation route: drops the stories data cache.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...a: unknown[]) => revalidateTag(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/revalidateStories/route";

const request = () => new NextRequest("https://trydos.test/api/revalidateStories?value=x");

beforeEach(() => vi.clearAllMocks());

describe("the stories revalidation route", () => {
  it("drops the stories cache", async () => {
    const response = await GET(request());

    expect(revalidateTag, "the stories cache was not dropped").toHaveBeenCalledWith("stories", "max");
    await expect(response.json(), "the answer did not say it revalidated").resolves.toEqual({
      revalidated: "true",
      error: null,
    });
  });

  it("answers with the error, as text, when the revalidation throws", async () => {
    revalidateTag.mockImplementationOnce(() => {
      throw new Error("no store");
    });
    const failed = await (await GET(request())).json();
    expect(failed, "the error was not passed back").toEqual({ revalidated: "false", error: "no store" });

    revalidateTag.mockImplementationOnce(() => {
      throw "plain";
    });
    expect((await (await GET(request())).json()).error, "a thrown string was not passed back").toBe("plain");
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });
});

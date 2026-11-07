// @vitest-environment node
//
// The search-history route: where the token comes from, what each failure
// answers, and that the owner is always the verified user.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  verify: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  log: vi.fn(),
  rateLimit: vi.fn(),
  logServerError: vi.fn(),
}));
vi.mock("services/elastic/searchHistory", () => ({
  verifySearchHistoryUser: io.verify,
  listSearchHistory: io.list,
  removeSearchHistory: io.remove,
  logSearchHistoryWord: io.log,
}));
vi.mock("serverRequests/radis", () => ({ fixedWindowRateLimit: io.rateLimit }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import { DELETE, GET, OPTIONS, POST } from "app/api/search/history/route";

const URL_ = "https://trydos.test/api/search/history";
const bearer = { authorization: "Bearer tok" };

const getRequest = (headers: Record<string, string> = bearer, query = "") =>
  new NextRequest(`${URL_}${query}`, { headers });

const deleteRequest = (body: unknown, headers: Record<string, string> = bearer) =>
  new NextRequest(URL_, { method: "DELETE", headers, body: JSON.stringify(body) });

const postRequest = (body: unknown, headers: Record<string, string> = bearer) =>
  new NextRequest(URL_, { method: "POST", headers, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  io.verify.mockResolvedValue({ status: "verified", userId: 77 });
  io.list.mockResolvedValue(["shoes"]);
  io.remove.mockResolvedValue(undefined);
  io.log.mockResolvedValue(undefined);
  io.rateLimit.mockResolvedValue({ allowed: true, ttl: 0 });
});

describe("where the token comes from", () => {
  it("answers a preflight with 204", () => {
    expect(OPTIONS().status, "the preflight did not answer 204").toBe(204);
  });

  it("takes the mobile token from the Authorization header", async () => {
    await GET(getRequest());

    expect(io.verify, "the header token was not the one checked").toHaveBeenCalledWith("tok");
  });

  it("takes the web token from the MARKET-TOKEN cookie", async () => {
    await GET(getRequest({ cookie: "MARKET-TOKEN=cookie-tok" }));

    expect(io.verify, "the cookie token was not the one checked").toHaveBeenCalledWith("cookie-tok");
  });

  it("refuses a call with no token, and reads nothing", async () => {
    const response = await GET(getRequest({}));

    expect(response.status, "a call with no token was not refused with 401").toBe(401);
    expect(io.list, "the search log was read with no token").not.toHaveBeenCalled();
  });
});

describe("what a failed check answers", () => {
  it("answers 401 to an expired token, so the caller refreshes and retries", async () => {
    io.verify.mockResolvedValue({ status: "expired" });

    const response = await GET(getRequest());

    expect(response.status, "an expired token did not answer 401").toBe(401);
    expect(io.list, "the search log was read with an expired token").not.toHaveBeenCalled();
  });

  it("answers 503, never 401, when the core backend could not check the token", async () => {
    io.verify.mockResolvedValue({ status: "unavailable" });

    const response = await GET(getRequest());

    expect(response.status, "a core backend failure would make the caller spend its refresh token").toBe(503);
  });

  it("answers 503 and reports it when the search backend fails", async () => {
    io.list.mockRejectedValue(new Error("search down"));

    const response = await GET(getRequest());

    expect(response.status, "a search backend failure did not answer 503").toBe(503);
    expect(
      io.logServerError.mock.calls[0]?.[0]?.scenario,
      "the search backend failure was not reported",
    ).toBe("search history read failed in Elasticsearch");
  });

  it("answers 429 over the limit, on a bucket of the verified user", async () => {
    io.rateLimit.mockResolvedValue({ allowed: false, ttl: 9 });

    const response = await GET(getRequest());

    expect(response.status, "the read limit did not answer 429").toBe(429);
    expect(io.rateLimit.mock.calls[0][0], "the limit does not belong to the verified user").toBe(
      "search:history:rl:read:77",
    );
    expect(io.list, "the search log was read over the limit").not.toHaveBeenCalled();
  });
});

describe("GET", () => {
  it("gives back the words of the verified user, whatever id the request names", async () => {
    const response = await GET(getRequest(bearer, "?user_id=5"));

    expect(io.list, "an id from the request was used as the owner").toHaveBeenCalledWith(77);
    expect(await response.json(), "the words did not reach the caller").toEqual({
      success: true,
      data: { terms: ["shoes"] },
    });
  });
});

describe("POST", () => {
  it("logs the word for the verified user, whatever id the body names", async () => {
    const response = await POST(postRequest({ term: " shoes ", products_count: 4, user_id: 5 }));

    expect(response.status, "logging a word did not succeed").toBe(200);
    expect(io.log, "the word was not logged for the verified user").toHaveBeenCalledWith(77, "shoes", 4);
  });

  it("logs a count of 0 when the request has no usable count", async () => {
    await POST(postRequest({ term: "shoes", products_count: "many" }));

    expect(io.log, "a bad count reached the log").toHaveBeenCalledWith(77, "shoes", 0);
  });

  it("refuses a missing word and a word longer than the log can show", async () => {
    for (const body of [{}, { term: "   " }, { term: "x".repeat(257) }]) {
      const response = await POST(postRequest(body));

      expect(response.status, `the word in ${JSON.stringify(body).slice(0, 40)} was not refused`).toBe(400);
    }
    expect(io.log, "a refused word was logged").not.toHaveBeenCalled();
  });

  it("answers 401 to an expired token and logs nothing", async () => {
    io.verify.mockResolvedValue({ status: "expired" });

    const response = await POST(postRequest({ term: "shoes" }));

    expect(response.status, "an expired token did not answer 401").toBe(401);
    expect(io.log, "a word was logged with an expired token").not.toHaveBeenCalled();
  });

  it("uses its own limit, so logging cannot block removing a word", async () => {
    await POST(postRequest({ term: "shoes" }));

    expect(io.rateLimit, "logging did not use its own limit").toHaveBeenCalledWith(
      "search:history:rl:log:77",
      30,
      60,
    );
  });
});

describe("DELETE", () => {
  it("removes one word for the verified user, whatever id the body names", async () => {
    const response = await DELETE(deleteRequest({ term: " shoes ", user_id: 5 }));

    expect(response.status, "removing a word did not succeed").toBe(200);
    expect(io.remove, "the word was not removed for the verified user").toHaveBeenCalledWith(77, "shoes");
  });

  it("clears everything only when all is exactly true", async () => {
    await DELETE(deleteRequest({ all: true }));

    expect(io.remove, "Clear All did not clear the verified user's words").toHaveBeenCalledWith(77, undefined);
  });

  it("refuses an empty request, so it can never clear the history by accident", async () => {
    for (const body of [{}, { term: "   " }, { all: "true" }]) {
      const response = await DELETE(deleteRequest(body));

      expect(response.status, `the body ${JSON.stringify(body)} was not refused`).toBe(400);
    }
    expect(io.remove, "an empty request removed words").not.toHaveBeenCalled();
  });

  it("uses the stricter write limit", async () => {
    await DELETE(deleteRequest({ term: "shoes" }));

    expect(io.rateLimit, "a removal did not use the write limit").toHaveBeenCalledWith(
      "search:history:rl:write:77",
      20,
      60,
    );
  });
});

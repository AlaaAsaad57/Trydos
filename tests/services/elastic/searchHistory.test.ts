// @vitest-environment node
//
// The search-history reads and removals, and the check of who is asking.
// The core backend and Elasticsearch are replaced. What matters here is that
// each query carries the owner, and that an expired token and a broken backend
// stay two different answers.
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  search: vi.fn(),
  updateByQuery: vi.fn(),
  logSearchTerm: vi.fn(),
  logServerError: vi.fn(),
}));
vi.mock("services/elastic/helpers", () => ({ logSearchTerm: io.logSearchTerm }));
vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: { search: io.search, updateByQuery: io.updateByQuery },
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import {
  listSearchHistory,
  logSearchHistoryWord,
  removeSearchHistory,
  verifySearchHistoryUser,
} from "services/elastic/searchHistory";

const coreAnswers = (status: number, body: unknown = {}) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  process.env.BACKEND_URL = "https://core.test";
});

describe("verifySearchHistoryUser (the core backend names the owner)", () => {
  it("asks the core backend with the caller's token and takes the id from the answer", async () => {
    coreAnswers(200, { data: { customer_info: { id: 77 } } });

    const identity = await verifySearchHistoryUser("tok");

    const [url, init] = (fetch as any).mock.calls[0];
    expect(url, "the check did not go to the core backend's customer info").toBe(
      "https://core.test/customer/info",
    );
    expect(init.headers.Authorization, "the caller's token was not sent to the core backend").toBe("Bearer tok");
    expect(identity, "the id from the core backend was not used").toEqual({ status: "verified", userId: 77 });
  });

  it("calls a 401 from the core backend expired, so the caller refreshes", async () => {
    coreAnswers(401);

    expect(await verifySearchHistoryUser("old"), "an expired token was not reported as expired").toEqual({
      status: "expired",
    });
  });

  it("never calls a core backend failure expired, so no refresh token is spent on it", async () => {
    coreAnswers(500);

    expect(await verifySearchHistoryUser("tok"), "a 500 from the core backend was not 'unavailable'").toEqual({
      status: "unavailable",
    });
  });

  it("fails closed when the core backend answers with no usable id", async () => {
    coreAnswers(200, { data: { customer_info: {} } });

    expect(await verifySearchHistoryUser("tok"), "an answer with no id still produced an owner").toEqual({
      status: "unavailable",
    });
  });

  it("reports an unreachable core backend, and does not call the token expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    expect(await verifySearchHistoryUser("tok"), "a network failure was not 'unavailable'").toEqual({
      status: "unavailable",
    });
    expect(
      io.logServerError.mock.calls[0]?.[0]?.scenario,
      "the unreachable core backend was not reported",
    ).toBe("verifySearchHistoryUser could not reach the core backend");
  });
});

describe("listSearchHistory (the search backend)", () => {
  it("reads only this shopper's rows, newest first, each word once", async () => {
    io.search.mockResolvedValue({ hits: { hits: [] } });

    await listSearchHistory(77);

    const params = io.search.mock.calls[0][0];
    expect(params.query.bool.filter, "the read is not limited to this shopper").toContainEqual({
      term: { user_id: 77 },
    });
    expect(params.collapse, "the same word from two devices would show twice").toEqual({
      field: "search_term.keyword",
    });
    expect(params.sort, "the newest word does not come first").toEqual([{ timestamp: { order: "desc" } }]);
    expect(params.query.bool.must_not, "a word the shopper removed would still show").toContainEqual({
      term: { is_deleted: true },
    });
  });

  it("gives back the words and skips a row with no word", async () => {
    io.search.mockResolvedValue({
      hits: {
        hits: [
          { _source: { search_term: "red dress" } },
          { _source: {} },
          { _source: { search_term: "shoes" } },
        ],
      },
    });

    expect(await listSearchHistory(77), "the words were not read from the rows").toEqual(["red dress", "shoes"]);
  });
});

describe("logSearchHistoryWord (the search backend)", () => {
  it("writes the word under the verified user, with the count of results", async () => {
    await logSearchHistoryWord(77, "shoes", 4);

    expect(io.logSearchTerm, "the word did not reach the search log").toHaveBeenCalledWith(
      expect.objectContaining({ searchText: "shoes", userData: { id: 77 }, productsCount: 4 }),
    );
  });
});

describe("removeSearchHistory (the search backend)", () => {
  beforeEach(() => io.updateByQuery.mockResolvedValue({ updated: 1 }));

  it("flags one word on this shopper's rows only, and keeps the rows", async () => {
    await removeSearchHistory(77, "shoes");

    const params = io.updateByQuery.mock.calls[0][0];
    expect(params.script.source, "the rows were not flagged is_deleted").toContain("is_deleted = true");
    expect(params.query.bool.filter, "the removal could touch another shopper's rows").toContainEqual({
      term: { user_id: 77 },
    });
    expect(params.query.bool.filter, "the removal is not limited to the word").toContainEqual({
      term: { "search_term.keyword": "shoes" },
    });
    expect(params.refresh, "the next read could still show the removed word").toBe(true);
  });

  it("flags all of this shopper's rows, and only theirs", async () => {
    await removeSearchHistory(77);

    expect(
      io.updateByQuery.mock.calls[0][0].query.bool.filter,
      "Clear All must filter on the owner and nothing else",
    ).toEqual([{ term: { user_id: 77 } }]);
  });
});

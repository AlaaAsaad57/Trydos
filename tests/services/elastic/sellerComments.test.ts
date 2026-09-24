// @vitest-environment node
//
// The seller-dashboard comments layer (services/elastic/sellerComments.ts).
//
// Every action goes through one gate before it touches the comments index:
//   1. who is asking   — the market backend's shop list for the caller's token
//                        (cached in Redis, with a stale copy for outages)
//   2. which shop      — the caller must be a member of the shop it names
//   3. what it may do  — SUPER_ADMIN or the one permission the action needs
//   4. how often       — a per-shop, per-session rate limit
// Only then does the action read or write Elasticsearch, and every query carries
// the verified shop id as its owner filter.
//
// The market backend, Redis, the cookie reader and Elasticsearch are all
// replaced. Nothing here reaches a real server.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cacheSpies } from "tests/mocks/serverRequests";

const io = vi.hoisted(() => ({
  search: vi.fn(),
  updateByQuery: vi.fn(),
  mget: vi.fn(),
  handleAuthedFetch: vi.fn(),
  getCookieServer: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: io.search,
    updateByQuery: io.updateByQuery,
    mget: io.mget,
  },
  elasticSearchComment: {},
}));
vi.mock("serverRequests/HandleAuthedFetch", () => ({
  HandleAuthedFetch: io.handleAuthedFetch,
}));
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: io.getCookieServer,
}));
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: io.logServerError,
}));

import {
  deleteReply,
  editReply,
  getSellerComments,
  getSellerProductsSocial,
  replyToComment,
} from "services/elastic/sellerComments";

/** The market backend's answer for a caller who is a member of shop 7. */
const memberOf = (permissions: string[] | undefined, shopName = "Acme") => ({
  data: { success: true, data: [{ seller_id: 7, shop_name: shopName, permissions }] },
});

const scenarios = () =>
  io.logServerError.mock.calls.map((call: any[]) => call[0]?.scenario);

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  io.search.mockReset();
  io.updateByQuery.mockReset();
  io.mget.mockReset();
  io.handleAuthedFetch.mockReset();
  io.getCookieServer.mockReset();
  io.getCookieServer.mockResolvedValue("cookie-session");
  cacheSpies.RedisGet.mockReset();
  cacheSpies.RedisGet.mockResolvedValue(null);
  cacheSpies.fixedWindowRateLimit.mockReset();
  cacheSpies.fixedWindowRateLimit.mockResolvedValue({ allowed: true, remaining: 1 } as any);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("the access gate", () => {
  it("refuses a request that names no shop, before asking anybody", async () => {
    const result = await getSellerComments({ sellerId: "  ", isReview: false });

    expect(result, "a request with no shop id was not refused").toEqual({
      success: false,
      message: "Missing shop identifier.",
    });
    expect(io.handleAuthedFetch, "the market backend was asked about no shop").not.toHaveBeenCalled();
  });

  it("refuses when the market backend refuses the token and no stale copy exists", async () => {
    io.handleAuthedFetch.mockResolvedValue({ isError: true, status: 401 });

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result, "a refused token still got through the gate").toEqual({
      success: false,
      message: "Unable to verify permissions.",
    });
  });

  it("falls back to the stale shop list while the market backend is failing", async () => {
    io.handleAuthedFetch.mockResolvedValue({ status: 503, data: null });
    cacheSpies.RedisGet.mockImplementation((async (key: string) =>
      key.includes(":stale:")
        ? [{ seller_id: 7, shop_name: "Acme", permissions: ["READ_COMMENTS"] }]
        : null) as any);
    io.search.mockResolvedValue({ hits: { hits: [], total: 0 } });

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result.success, "the stale shop list was not used during the outage").toBe(true);
  });

  it("uses the fresh cached shop list without asking the market backend", async () => {
    cacheSpies.RedisGet.mockResolvedValue([
      { seller_id: 7, shop_name: "Acme", permissions: ["SUPER_ADMIN"] },
    ] as any);
    io.search.mockResolvedValue({ hits: { hits: [], total: { value: 0 } } });

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result.success, "a super admin from the cached list was refused").toBe(true);
    expect(io.handleAuthedFetch, "the market backend was asked despite a fresh cache").not.toHaveBeenCalled();
  });

  it("stores a fresh shop list in both caches after asking the market backend", async () => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(["READ_COMMENTS"]));
    io.search.mockResolvedValue({ hits: { hits: [], total: 0 } });

    await getSellerComments({ sellerId: "7", isReview: false });

    const keys = cacheSpies.RedisSet.mock.calls.map((call: any[]) => call[0]);
    expect(
      keys.some((k: string) => k.startsWith("seller:perms:") && !k.includes(":stale:")),
      "the fresh shop list was not cached",
    ).toBe(true);
    expect(
      keys.some((k: string) => k.startsWith("seller:perms:stale:")),
      "the stale fallback copy was not cached",
    ).toBe(true);
  });

  it("refuses a shop the caller is not a member of", async () => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(["SUPER_ADMIN"]));

    const result = await getSellerComments({ sellerId: "8", isReview: false });

    expect(result, "a caller reached another seller's shop").toEqual({
      success: false,
      message: "Not authorized for this shop.",
    });
  });

  it("refuses a member without the permission the action needs", async () => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(undefined));

    const result = await replyToComment({ sellerId: "7", commentId: "c1", replyText: "hi" });

    expect(result, "a member with no permissions could reply").toEqual({
      success: false,
      message: "You do not have permission for this action.",
    });
  });

  it("accepts a bare list of shops from the market backend", async () => {
    io.handleAuthedFetch.mockResolvedValue({
      data: [{ seller_id: 7, permissions: ["READ_COMMENTS"] }],
    });
    io.search.mockResolvedValue({ hits: { hits: [], total: 0 } });

    expect(
      (await getSellerComments({ sellerId: "7", isReview: false })).success,
      "a bare list of shops was not read",
    ).toBe(true);
  });

  it("treats a body with no shop list as no shops", async () => {
    io.handleAuthedFetch.mockResolvedValue({ data: { success: true } });

    expect(
      await getSellerComments({ sellerId: "7", isReview: false }),
      "a body with no shops still granted access",
    ).toEqual({ success: false, message: "Not authorized for this shop." });
  });

  it("refuses, and reports it, when the permission lookup throws", async () => {
    io.handleAuthedFetch.mockRejectedValue(new Error("socket hang up"));

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result.success, "a failed permission lookup let the request through").toBe(false);
    expect(scenarios(), "the failed permission lookup was not reported").toContain(
      "fetchShopsFromGo: permissions fetch failed",
    );
  });

  it("reports a non-error throw from the permission lookup as text", async () => {
    io.handleAuthedFetch.mockRejectedValue("plain failure");

    await getSellerComments({ sellerId: "7", isReview: false });

    expect(
      io.logServerError.mock.calls[0]?.[0]?.error,
      "a thrown string was not reported as its text",
    ).toBe("plain failure");
  });

  it("uses the anonymous identity when there is no session cookie", async () => {
    io.getCookieServer.mockResolvedValue(undefined);
    io.handleAuthedFetch.mockResolvedValue({ status: 401 });

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result.success, "a caller with no session got through").toBe(false);
  });

  it("slows a caller down past the rate limit", async () => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(["READ_COMMENTS"]));
    cacheSpies.fixedWindowRateLimit.mockResolvedValue({ allowed: false, remaining: 0, ttl: 42 } as any);

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result, "the rate limit did not stop the caller").toEqual({
      success: false,
      message: "Too many requests. Try again in 42s.",
    });
    expect(
      (cacheSpies.fixedWindowRateLimit.mock.calls as any[])[0]?.[0],
      "a read was counted in the write bucket",
    ).toMatch(/^seller:cmt:rl:read:7:/);
  });
});

describe("the phone app's token (the Authorization header path)", () => {
  it("asks the market backend with the app's own token and never reads the cookie", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ seller_id: 7, permissions: ["READ_COMMENTS"] }] }),
    });
    io.search.mockResolvedValue({ hits: { hits: [], total: 0 } });

    const result = await getSellerComments({ sellerId: "7", isReview: false, authToken: " app-token " });

    expect(result.success, "the app's token was not accepted").toBe(true);
    expect(
      fetchMock.mock.calls[0]?.[1]?.headers?.Authorization,
      "the app's token was not sent as a bearer token",
    ).toBe("Bearer  app-token ");
    expect(io.getCookieServer, "the cookie was read although the app sent a token").not.toHaveBeenCalled();
  });

  it("fails closed when the market backend refuses the app's token", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    const result = await getSellerComments({ sellerId: "7", isReview: false, authToken: "bad" });

    expect(result, "a refused app token got through").toEqual({
      success: false,
      message: "Unable to verify permissions.",
    });
  });

  it("fails closed when the market backend answers something that is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("not json");
      },
    });

    const result = await getSellerComments({ sellerId: "7", isReview: false, authToken: "t" });

    expect(result, "an unreadable permissions answer granted access").toEqual({
      success: false,
      message: "Not authorized for this shop.",
    });
  });
});

describe("listing the shop's comments and reviews (getSellerComments)", () => {
  beforeEach(() => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(["READ_COMMENTS"]));
  });

  it("lists FAQ comments with their reaction counts, scoped to the verified shop", async () => {
    io.search
      .mockResolvedValueOnce({
        hits: {
          total: { value: 12 },
          hits: [
            {
              _id: "doc-1",
              _source: {
                comment_id: "c1",
                product_id: "p1",
                text: "Is it cotton?",
                has_reply: true,
                seller_reply: "Yes",
              },
            },
            { _id: "doc-2", _source: undefined },
          ],
        },
      })
      .mockResolvedValueOnce({
        aggregations: {
          by_target: {
            buckets: [
              { key: "c1", doc_count: 3 },
              { key: "c1-seller_reply", doc_count: 1 },
            ],
          },
        },
      });

    const result: any = await getSellerComments({ sellerId: "7", isReview: false, page: 2, pageSize: 5 });

    expect(result.success, "the comment list failed").toBe(true);
    const sent = io.search.mock.calls[0][0];
    expect(sent.query.bool.filter, "the query was not scoped to the verified shop").toEqual([
      { term: { owner_id: "7" } },
      { term: { owner_type: "seller" } },
      { term: { is_review: false } },
    ]);
    expect(sent.from, "page 2 of 5 did not start at the sixth comment").toBe(5);
    expect(sent.collapse, "FAQ comments were collapsed by order line").toBeUndefined();
    expect(result.data.comments[0], "the first comment is wrong").toMatchObject({
      comment_id: "c1",
      text: "Is it cotton?",
      has_reply: true,
      total_likes: 3,
      reply_total_likes: 1,
    });
    expect(result.data.comments[1], "a hit with no source did not fall back to its id").toMatchObject({
      comment_id: "doc-2",
      text: "",
      has_reply: false,
      total_likes: 0,
      reply_total_likes: 0,
    });
    expect(result.data.meta, "the paging details are wrong").toEqual({
      current_page: 2,
      per_page: 5,
      total: 12,
      last_page: 3,
      has_more_pages: true,
    });
  });

  it("collapses reviews to one per order line and counts the distinct lines", async () => {
    io.search.mockResolvedValueOnce({
      hits: { total: 9, hits: [] },
      aggregations: { collapsed_total: { value: 4 } },
    });

    const result: any = await getSellerComments({ sellerId: "7", isReview: true });

    const sent = io.search.mock.calls[0][0];
    expect(sent.collapse, "reviews were not collapsed by order line").toEqual({
      field: "order_details_id",
    });
    expect(result.data.meta.total, "the review total counted duplicate documents").toBe(4);
    expect(result.data.comments, "an empty page did not list nothing").toEqual([]);
  });

  it("falls back to the raw total when the distinct count is missing", async () => {
    io.search.mockResolvedValueOnce({ hits: { total: 9, hits: [] } });

    const result: any = await getSellerComments({ sellerId: "7", isReview: true, pageSize: 500 });

    expect(result.data.meta.total, "the raw review total was not used").toBe(9);
    expect(result.data.meta.per_page, "the page size was not capped at 50").toBe(50);
  });

  it("gives zero reactions, and reports it, when the reaction count fails", async () => {
    io.search
      .mockResolvedValueOnce({
        hits: { total: 1, hits: [{ _source: { comment_id: "c1", has_reply: false } }] },
      })
      .mockRejectedValueOnce(new Error("reactions down"));

    const result: any = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result.data.comments[0].total_likes, "a failed reaction count was not zero").toBe(0);
    expect(scenarios(), "the failed reaction count was not reported").toContain(
      "attachReactionCounts: elastic agg failed",
    );
  });

  it("reads no counts when the reaction answer has no buckets", async () => {
    io.search
      .mockResolvedValueOnce({
        hits: { hits: [{ _source: { comment_id: "c1", has_reply: true } }] },
      })
      .mockResolvedValueOnce({});

    const result: any = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result.data.comments[0], "missing reaction buckets were not zero").toMatchObject({
      total_likes: 0,
      reply_total_likes: 0,
    });
    expect(result.data.meta.total, "a missing total was not zero").toBe(0);
  });

  it("refuses a page past the search window without asking Elasticsearch", async () => {
    const result = await getSellerComments({ sellerId: "7", isReview: false, page: 1001, pageSize: 10 });

    expect(result, "a page past 10 000 results was sent to Elasticsearch").toEqual({
      success: false,
      message: "Pagination limit reached.",
    });
    expect(io.search, "Elasticsearch was asked for a page it would refuse").not.toHaveBeenCalled();
  });

  it("answers a failure, and reports it, when the comment search fails", async () => {
    io.search.mockRejectedValue("index gone");

    const result = await getSellerComments({ sellerId: "7", isReview: false });

    expect(result, "a failed comment search was not reported to the caller").toEqual({
      success: false,
      message: "Failed to load comments.",
    });
    expect(scenarios(), "the failed comment search was not reported").toContain(
      "getSellerComments: elastic search failed",
    );
  });
});

describe("replying to a comment (replyToComment / editReply)", () => {
  beforeEach(() => {
    io.handleAuthedFetch.mockResolvedValue(
      memberOf(["REPLY_COMMENT", "EDIT_REPLY"], "Acme Shop"),
    );
  });

  it("stores the reply without its markup, only on this shop's comment", async () => {
    io.updateByQuery.mockResolvedValue({ updated: 1 });

    const result = await replyToComment({
      sellerId: "7",
      commentId: " c1 ",
      replyText: "  <b>Yes</b>, it is cotton ",
    });

    expect(result, "the reply was not saved").toEqual({
      success: true,
      data: { comment_id: "c1", seller_reply: "Yes, it is cotton" },
    });
    const sent = io.updateByQuery.mock.calls[0][0];
    expect(sent.query.bool.filter, "the update was not limited to this shop's comment").toEqual([
      { term: { comment_id: "c1" } },
      { term: { owner_id: "7" } },
      { term: { owner_type: "seller" } },
    ]);
    expect(sent.script.params.seller_name, "the reply did not carry the verified shop name").toBe(
      "Acme Shop",
    );
    expect(
      (cacheSpies.fixedWindowRateLimit.mock.calls as any[])[0]?.[0],
      "a reply was not counted in the write bucket",
    ).toMatch(/^seller:cmt:rl:write:7:/);
  });

  it("edits a reply through the same path", async () => {
    io.updateByQuery.mockResolvedValue({ updated: 1 });

    const result = await editReply({ sellerId: "7", commentId: "c1", replyText: "Updated" });

    expect(result, "the edit was not saved").toEqual({
      success: true,
      data: { comment_id: "c1", seller_reply: "Updated" },
    });
  });

  it("refuses an empty, too long or non-text reply", async () => {
    const empty = await replyToComment({ sellerId: "7", commentId: "c1", replyText: "<i></i>" });
    const long = await replyToComment({ sellerId: "7", commentId: "c1", replyText: "a".repeat(1001) });
    const notText = await replyToComment({ sellerId: "7", commentId: "c1", replyText: 5 as any });

    for (const [label, result] of [
      ["an empty", empty],
      ["a too long", long],
      ["a non-text", notText],
    ] as const) {
      expect(result, `${label} reply was not refused`).toEqual({
        success: false,
        message: "Invalid reply text.",
      });
    }
    expect(io.updateByQuery, "an invalid reply reached Elasticsearch").not.toHaveBeenCalled();
  });

  it("refuses a reply with no comment id", async () => {
    const result = await replyToComment({ sellerId: "7", commentId: undefined as any, replyText: "hi" });

    expect(result, "a reply with no comment id was not refused").toEqual({
      success: false,
      message: "Missing comment id.",
    });
  });

  it("says so when the comment is not this shop's or does not exist", async () => {
    io.updateByQuery.mockResolvedValue({});

    const result = await replyToComment({ sellerId: "7", commentId: "other", replyText: "hi" });

    expect(result, "a reply to another shop's comment looked saved").toEqual({
      success: false,
      message: "Comment not found or not permitted.",
    });
  });

  it("answers a failure, and reports it, when the update fails", async () => {
    io.updateByQuery.mockRejectedValue(new Error("write refused"));

    const result = await replyToComment({ sellerId: "7", commentId: "c1", replyText: "hi" });

    expect(result, "a failed reply looked saved").toEqual({
      success: false,
      message: "Failed to save reply.",
    });
    expect(scenarios(), "the failed reply was not reported").toContain(
      "upsertReply: elastic update failed",
    );
  });

  it("reports a non-error throw from the update as text", async () => {
    io.updateByQuery.mockRejectedValue("write refused");

    await replyToComment({ sellerId: "7", commentId: "c1", replyText: "hi" });

    expect(io.logServerError.mock.calls[0]?.[0]?.error, "a thrown string was not reported").toBe(
      "write refused",
    );
  });
});

describe("removing a reply (deleteReply)", () => {
  beforeEach(() => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(["DELETE_REPLY"]));
  });

  it("removes the reply from this shop's comment", async () => {
    io.updateByQuery.mockResolvedValue({ updated: 1 });

    const result = await deleteReply({ sellerId: "7", commentId: "c1" });

    expect(result, "the reply was not removed").toEqual({ success: true, data: { comment_id: "c1" } });
    expect(
      io.updateByQuery.mock.calls[0][0].script.source,
      "the delete script does not clear the reply",
    ).toContain("ctx._source.has_reply = false");
  });

  it("refuses a delete with no comment id", async () => {
    expect(
      await deleteReply({ sellerId: "7", commentId: " " }),
      "a delete with no comment id was not refused",
    ).toEqual({ success: false, message: "Missing comment id." });
    expect(
      await deleteReply({ sellerId: "7", commentId: undefined as any }),
      "a delete with a missing comment id was not refused",
    ).toEqual({ success: false, message: "Missing comment id." });
  });

  it("says so when there was nothing of this shop's to delete", async () => {
    io.updateByQuery.mockResolvedValue({ updated: 0 });

    expect(
      await deleteReply({ sellerId: "7", commentId: "c1" }),
      "deleting another shop's reply looked successful",
    ).toEqual({ success: false, message: "Comment not found or not permitted." });
  });

  it("answers a failure, and reports it, when the delete fails", async () => {
    io.updateByQuery.mockRejectedValue(new Error("write refused"));

    expect(
      await deleteReply({ sellerId: "7", commentId: "c1" }),
      "a failed delete looked successful",
    ).toEqual({ success: false, message: "Failed to delete reply." });
    expect(scenarios(), "the failed delete was not reported").toContain(
      "deleteReply: elastic update failed",
    );
  });

  it("reports a non-error throw from the delete as text", async () => {
    io.updateByQuery.mockRejectedValue("write refused");

    await deleteReply({ sellerId: "7", commentId: "c1" });

    expect(io.logServerError.mock.calls[0]?.[0]?.error, "a thrown string was not reported").toBe(
      "write refused",
    );
  });
});

describe("the per-product social counts (getSellerProductsSocial)", () => {
  beforeEach(() => {
    io.handleAuthedFetch.mockResolvedValue(memberOf(["READ_COMMENTS"]));
  });

  it("answers an empty map when no product id was given", async () => {
    expect(
      await getSellerProductsSocial({ sellerId: "7", productIds: [" ", null as any] }),
      "blank product ids were counted",
    ).toEqual({ success: true, data: {} });
    expect(
      await getSellerProductsSocial({ sellerId: "7", productIds: undefined as any }),
      "a missing product list was counted",
    ).toEqual({ success: true, data: {} });
    expect(io.search, "Elasticsearch was asked about no products").not.toHaveBeenCalled();
  });

  it("counts reviews, questions, shares and reactions per product", async () => {
    io.search.mockImplementation(async (params: any) => {
      if (params.aggs) {
        return {
          aggregations: {
            by_product: {
              buckets: [
                {
                  key: "p1",
                  by_review: {
                    buckets: [
                      { key: 1, doc_count: 4 },
                      { key: 0, doc_count: 2 },
                    ],
                  },
                },
                { key: "p2", by_review: { buckets: [{ key_as_string: "true", doc_count: 1 }] } },
                { key: "p3" },
                { key: "not-asked", by_review: { buckets: [{ key: true, doc_count: 9 }] } },
              ],
            },
          },
        };
      }
      return {
        hits: {
          hits: [
            { _source: { product_id: "p1", shared_count: "5" } },
            { _source: { product_id: "p2", shared_count: "x" } },
            { _source: { product_id: "not-asked", shared_count: 3 } },
            {},
          ],
        },
      };
    });
    io.mget.mockResolvedValue({
      docs: [
        { _id: "p1", found: true, _source: { total_likes: 8 } },
        { _id: "p2", found: true, _source: {} },
        { _id: "p3", found: false },
        { _id: "not-asked", found: true, _source: { total_likes: 1 } },
        null,
      ],
    });

    const result: any = await getSellerProductsSocial({
      sellerId: "7",
      productIds: ["p1", "p2", "p2", 3 as any, "p3"],
    });

    expect(result.data, "the per-product counts are wrong").toEqual({
      p1: { total_reactions: 8, total_fqa: 2, total_reviews: 4, total_shares: 5 },
      p2: { total_reactions: 0, total_fqa: 0, total_reviews: 1, total_shares: 0 },
      "3": { total_reactions: 0, total_fqa: 0, total_reviews: 0, total_shares: 0 },
      p3: { total_reactions: 0, total_fqa: 0, total_reviews: 0, total_shares: 0 },
    });
  });

  it("answers zero counts when the three answers are empty", async () => {
    io.search.mockResolvedValue({});
    io.mget.mockResolvedValue({});

    const result: any = await getSellerProductsSocial({ sellerId: "7", productIds: ["p1"] });

    expect(result.data.p1, "empty answers did not give zero counts").toEqual({
      total_reactions: 0,
      total_fqa: 0,
      total_reviews: 0,
      total_shares: 0,
    });
  });

  it("answers a failure, and reports it, when a count query fails", async () => {
    io.search.mockResolvedValue({});
    io.mget.mockRejectedValue(new Error("mget down"));

    expect(
      await getSellerProductsSocial({ sellerId: "7", productIds: ["p1"] }),
      "a failed count looked successful",
    ).toEqual({ success: false, message: "Failed to load product stats." });
    expect(scenarios(), "the failed count was not reported").toContain(
      "getSellerProductsSocial: elastic failed",
    );
  });

  it("reports a non-error throw from a count query as text", async () => {
    io.search.mockResolvedValue({});
    io.mget.mockRejectedValue("mget down");

    await getSellerProductsSocial({ sellerId: "7", productIds: ["p1"] });

    expect(io.logServerError.mock.calls[0]?.[0]?.error, "a thrown string was not reported").toBe(
      "mget down",
    );
  });
});

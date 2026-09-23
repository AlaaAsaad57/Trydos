// @vitest-environment node
//
// utils/pagesDataRequests/ProductPageData.ts — the product page's data that lives
// in Elasticsearch: share count, buyer reviews, questions, likes, rating and the
// view count. Elasticsearch is replaced by a stand-in that answers per index.
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  comments_index,
  comments_interactions_index,
  product_interactions_index,
  share_index,
  user_interactions_index,
  views_index,
} from "services/elastic/INDEXES";

const search = vi.fn();
const get = vi.fn();
vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: (q: any) => search(q),
    get: (q: any) => get(q),
  },
}));

const GetRecommendationCountForProduct = vi.fn(async (_a: any): Promise<any> => ({
  stats: { yes: 3 },
}));
vi.mock("serverRequests/product", () => ({
  GetRecommendationCountForProduct: (a: any) => GetRecommendationCountForProduct(a),
}));

const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (e: any) => LogServerError(e),
}));

let cookieUser: any = null;
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: async () => cookieUser,
}));

import {
  GetFQACommentsForProduct,
  GetRatingCommentsForProduct,
  GetRatingCommentsFromElastic,
  getProductDataFromElastic,
} from "utils/pagesDataRequests/ProductPageData";

/** A search answer with the given hits and aspect buckets. */
const hits = (docs: any[], extra: Record<string, any> = {}) => ({
  hits: {
    total: { value: docs.length },
    hits: docs.map((d, i) => ({ _id: d.id ?? `c${i}`, _source: d, sort: [i, d.id] })),
  },
  ...extra,
});

/** A reactions answer: comment likes and seller-reply likes. */
const reactions = (commentBuckets: any[], replyBuckets: any[] = []) => ({
  aggregations: {
    reactions_by_type: {
      buckets: [
        { key: "comment", reactions_by_target: { buckets: commentBuckets } },
        { key: "seller_reply", reactions_by_target: { buckets: replyBuckets } },
      ],
    },
  },
});

/** Route each search by its index. Comments are split by "has a rating". */
function routeSearch(answers: {
  share?: any;
  rating?: any;
  fqa?: any;
  reactions?: any;
  likes?: any;
}) {
  search.mockImplementation(async (q: any) => {
    if (q.index === share_index) {
      if (answers.share instanceof Error) throw answers.share;
      return answers.share ?? hits([]);
    }
    if (q.index === comments_interactions_index) return answers.reactions ?? reactions([]);
    if (q.index === user_interactions_index) return answers.likes ?? hits([]);
    if (q.index === comments_index) {
      const isRating = JSON.stringify(q.query).includes('"rating"');
      return (isRating ? answers.rating : answers.fqa) ?? hits([]);
    }
    throw new Error(`unexpected index ${q.index}`);
  });
}

beforeEach(() => {
  search.mockReset();
  get.mockReset();
  LogServerError.mockClear();
  cookieUser = null;
});

describe("GetRatingCommentsFromElastic", () => {
  it("asks for this user's reviews of the given orders and maps them", async () => {
    search.mockResolvedValue(
      hits([
        { id: "r1", user_id: 5, user_name: "A", text: "good", rating: 4, order_details_id: 9 },
      ]),
    );
    const out = await GetRatingCommentsFromElastic({ user_id: 5, pageSize: 10, order_ids: [9] });
    const q = search.mock.calls[0][0];
    expect(q.query.bool.must, "the review query does not filter by order and user").toEqual([
      { terms: { order_details_id: ["9"] } },
      { term: { user_id: "5" } },
    ]);
    expect(out.comments[0], "the review was mapped wrongly").toMatchObject({
      id: "r1",
      customer: { id: 5, name: "A" },
      comment: "good",
      star_rating: 4,
      order_details_id: 9,
    });
    expect(out.searchAfter, "the next-page cursor is not the last hit's sort").toEqual([0, "r1"]);
    expect(out.total, "the total is wrong").toBe(1);
  });

  it("continues from a string cursor, and ignores a cursor that is not text", async () => {
    search.mockResolvedValue(hits([]));
    const empty = await GetRatingCommentsFromElastic({
      pageSize: 10,
      order_ids: [1],
      searchAfter: "[1,2]",
    });
    await GetRatingCommentsFromElastic({ pageSize: 10, order_ids: [1], searchAfter: { a: 1 } });
    expect(search.mock.calls[0][0].search_after, "the text cursor was not parsed").toEqual([1, 2]);
    expect(search.mock.calls[1][0].search_after, "a non-text cursor was not reset").toEqual([]);
    expect(empty.searchAfter, "an empty page still has a cursor").toBeNull();
  });
});

describe("GetRatingCommentsForProduct", () => {
  it("maps reviews with their likes and the aspect filters", async () => {
    routeSearch({
      rating: hits(
        [
          {
            id: "r1",
            user_id: 5,
            text: "fits",
            rating: 5,
            aspects: { size: { fit_analysis: { correct: true } } },
            good_quality_comment: true,
            comments_images_customer: ["a.png"],
          },
          { id: "r2", user_id: 6, text: "meh", rating: 2 },
        ],
        { aggregations: { unique_aspects: { buckets: [{ key: "size" }, { key: "color" }] } } },
      ),
      reactions: reactions([
        { key: "r1", doc_count: 3, user_like: { doc_count: 1 } },
        { key: "r2", doc_count: 1, user_like: { doc_count: 0 } },
      ]),
    });
    const out = await GetRatingCommentsForProduct({ product_id: 7, user_id: 5 });
    expect(out.buyers_comments[0], "the first review was mapped wrongly").toMatchObject({
      id: "r1",
      isOwner: true,
      true_size: true,
      good_quality_comment: true,
      comments_images_customer: ["a.png"],
      total_likes: 3,
      is_liked: true,
    });
    expect(out.buyers_comments[1], "the second review defaults are wrong").toMatchObject({
      isOwner: false,
      true_size: false,
      good_quality_comment: false,
      comments_images_customer: [],
      total_likes: 1,
      is_liked: false,
    });
    expect(out.filters_key, "the aspect filters are wrong").toEqual(["size", "color"]);
    const reactionQuery = search.mock.calls.find((c) => c[0].index === comments_interactions_index)[0];
    expect(
      reactionQuery.query.bool.must[0].terms.target_id,
      "the likes query does not ask for the seller-reply ids too",
    ).toEqual(["r1", "r1-seller_reply", "r2", "r2-seller_reply"]);
  });

  it("filters by an aspect, or by 'recommend', and skips a blank filter", async () => {
    routeSearch({});
    await GetRatingCommentsForProduct({ product_id: 7, filter: "size" });
    await GetRatingCommentsForProduct({ product_id: 7, filter: "recommend", searchAfter: "[3]" });
    await GetRatingCommentsForProduct({ product_id: 7, filter: "  ", searchAfter: 5 as any });
    const [aspect, recommend, blank] = search.mock.calls.map((c) => c[0]);
    expect(aspect.query.bool.must[3].bool.should[0], "the aspect filter is missing").toEqual({
      term: { discussed_aspects_en: "size" },
    });
    expect(recommend.query.bool.must[3], "the recommend filter is missing").toEqual({
      term: { recommendation: true },
    });
    expect(recommend.search_after, "the text cursor was not parsed").toEqual([3]);
    expect(blank.query.bool.must.length, "a blank filter was added").toBe(3);
    expect(blank.search_after, "a non-text cursor was not reset").toEqual([]);
  });

  it("has no likes query and no owner when there are no reviews and no user", async () => {
    routeSearch({ rating: hits([{ id: "r1", user_id: 5 }]) });
    const out = await GetRatingCommentsForProduct({ product_id: 7 });
    const reactionQuery = search.mock.calls.find((c) => c[0].index === comments_interactions_index)[0];
    expect(
      reactionQuery.aggs.reactions_by_type.aggs.reactions_by_target.aggs,
      "a guest likes query asks for the user's own like",
    ).toEqual({});
    expect(out.buyers_comments[0].isOwner, "a guest was marked as owner").toBeFalsy();
  });
});

describe("GetFQACommentsForProduct", () => {
  it("maps questions with reply likes and an aspect filter", async () => {
    routeSearch({
      fqa: hits([
        { id: "q1", user_id: 5, text: "size?", has_reply: true, seller_reply: "M" },
        { id: "q2", user_id: 6, text: "color?", has_reply: false },
      ], { aggregations: { unique_aspects: { buckets: [{ key: "fit" }] } } }),
      reactions: reactions(
        [{ key: "q1", doc_count: 2 }],
        [{ key: "q1-seller_reply", doc_count: 4, user_like: { doc_count: 2 } }],
      ),
    });
    const out = await GetFQACommentsForProduct({
      product_id: 7,
      user_id: 5,
      filter: "size",
      searchAfter: "[1]",
    });
    const q = search.mock.calls[0][0];
    expect(q.query.bool.must[1].bool.should[3], "the aspect filter is missing").toEqual({
      term: { discussed_aspects_ku: "size" },
    });
    expect(q.search_after, "the cursor was not parsed").toEqual([1]);
    expect(out.fqa_comments[0], "the answered question was mapped wrongly").toMatchObject({
      id: "q1",
      isOwner: true,
      total_likes: 2,
      is_liked: false,
      reply_total_likes: 4,
      reply_is_liked: true,
    });
    expect(out.fqa_comments[1], "the unanswered question has reply likes").toMatchObject({
      reply_total_likes: 0,
      reply_is_liked: false,
      total_likes: 0,
    });
    expect(out.filters_key, "the question aspect filters are wrong").toEqual(["fit"]);
  });

  it("gives zero reply likes when the reply has no reaction yet", async () => {
    routeSearch({
      fqa: hits([{ id: "q1", has_reply: true, seller_reply: "M" }]),
      reactions: reactions([]),
    });
    const out = await GetFQACommentsForProduct({ product_id: 7, searchAfter: 1 as any });
    expect(out.fqa_comments[0].reply_total_likes, "reply likes are not zero").toBe(0);
    expect(search.mock.calls[0][0].search_after, "a non-text cursor was not reset").toEqual([]);
    expect(out.searchAfter, "the cursor is wrong").toEqual([0, "q1"]);
  });

  it("returns an empty page with no cursor", async () => {
    routeSearch({});
    const out = await GetFQACommentsForProduct({ product_id: 7, filter: "" });
    expect(out, "the empty page is wrong").toEqual({
      fqa_comments: [],
      total: 0,
      filters_key: [],
      searchAfter: null,
    });
  });
});

describe("getProductDataFromElastic", () => {
  it("puts the whole product block together for a signed-in user", async () => {
    routeSearch({
      share: hits([{ shared_count: 12 }]),
      likes: hits([{ status: "ACTIVE" }]),
    });
    get.mockImplementation(async (q: any) =>
      q.index === views_index
        ? { _source: { view_count: 40 } }
        : {
            _source: {
              final_rating: "4.5",
              total_likes: 8,
              star_distribution: { star_5: 3, star_1: null },
              size_analysis: { true_percentage: 90 },
              good_quality_product: true,
            },
          },
    );
    const out = await getProductDataFromElastic({
      productId: "7",
      slug: "shirt",
      lang: "ar",
      userId: 5,
    });
    expect(out, "the product block is wrong").toMatchObject({
      shared_count: 12,
      total_views: 40,
      total_rating: 4.5,
      count_of_likes: 8,
      is_liked: true,
      recommendation_stats: { yes: 3 },
      ratingDetails: [
        { ratingGroup: "5", count: 3 },
        { ratingGroup: "1", count: 0 },
      ],
      size_analysis: { true_percentage: 90 },
      good_quality_product: true,
    });
    const likeQuery = search.mock.calls.find((c) => c[0].index === user_interactions_index)[0];
    expect(likeQuery.body.query.bool.must[1], "the like query is for the wrong user").toEqual({
      term: { user_id: "5" },
    });
  });

  it("reads the user from the cookie, and counts zero shares, views and likes when there is nothing", async () => {
    cookieUser = { id: "9" };
    routeSearch({ share: new Error("share index down") });
    get.mockImplementation(async (q: any) =>
      q.index === views_index ? { _source: {} } : { _source: { final_rating: 3 } },
    );
    const out = await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en" });
    expect(out?.shared_count, "a failed share lookup did not count as zero").toBe(0);
    expect(out?.total_views, "a missing view count is not zero").toBe(0);
    expect(out?.count_of_likes, "missing likes are not zero").toBe(0);
    expect(out?.ratingDetails, "a missing star spread is not empty").toEqual([]);
    expect(LogServerError.mock.calls[0]?.[0]?.scenario, "the share failure was not reported").toBe(
      "getProductSharedCountFromElasticsearch in ProductPageData",
    );
  });

  it("does not ask for a like when there is no user at all", async () => {
    cookieUser = null;
    routeSearch({ share: new (class extends Error {})("x") });
    search.mockImplementationOnce(async () => {
      throw "share text";
    });
    get.mockResolvedValue({ _source: { final_rating: 1 } });
    const out = await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en" });
    expect(
      search.mock.calls.some((c) => c[0].index === user_interactions_index),
      "a guest's like was looked up",
    ).toBe(false);
    expect(out?.is_liked, "a guest is marked as liking").toBe(false);
    expect(LogServerError.mock.calls[0]?.[0]?.error, "the thrown text was not kept").toBe("share text");
  });

  it("uses the empty defaults when the product has no interactions record (404)", async () => {
    routeSearch({});
    get.mockImplementation(async (q: any) => {
      if (q.index === product_interactions_index) throw { meta: { statusCode: 404 } };
      throw { statusCode: 404 };
    });
    const out = await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en", userId: 5 });
    expect(out, "the 404 defaults are wrong").toMatchObject({
      total_views: 0,
      total_rating: 0,
      count_of_likes: 0,
      is_liked: false,
      ratingDetails: [],
    });
    expect(
      LogServerError.mock.calls.map((c) => c[0].scenario),
      "a missing view-count record was reported as an error",
    ).toEqual(["getProductInteractions in ProductPageData"]);
  });

  it("reports a failed view count that is not a 404 and counts zero", async () => {
    routeSearch({});
    get.mockImplementation(async (q: any) => {
      if (q.index === views_index) throw new Error("views down");
      return { _source: { final_rating: 2 } };
    });
    const out = await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en", userId: 5 });
    get.mockImplementation(async (q: any) => {
      if (q.index === views_index) throw "views text";
      return { _source: { final_rating: 2 } };
    });
    await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en", userId: 5 });
    expect(out?.total_views, "a failed view count is not zero").toBe(0);
    expect(LogServerError.mock.calls.map((c) => c[0].error), "the view-count failures were not reported").toEqual([
      "views down",
      "views text",
    ]);
  });

  it("reports and returns nothing when the interactions lookup fails for another reason", async () => {
    routeSearch({});
    get.mockImplementation(async (q: any) => {
      if (q.index === product_interactions_index) throw new Error("es down");
      return { _source: { view_count: 1 } };
    });
    const out = await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en", userId: 5 });
    get.mockImplementation(async (q: any) => {
      if (q.index === product_interactions_index) throw "es text";
      return { _source: { view_count: 1 } };
    });
    await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en", userId: 5 });
    expect(out, "a failed lookup still returned a product block").toBeUndefined();
    expect(
      LogServerError.mock.calls.map((c) => c[0].scenario),
      "the failure was not reported at both levels",
    ).toEqual([
      "getProductInteractions in ProductPageData",
      "getProductDataFromElastic in ProductPageData",
      "getProductInteractions in ProductPageData",
      "getProductDataFromElastic in ProductPageData",
    ]);
    expect(LogServerError.mock.calls[3][0].error, "the thrown text was not kept").toBe("es text");
  });

  it(
    "BUG-utils-1: total_rating is 0, not NaN, when the product has no final_rating yet",
    async () => {
      routeSearch({});
      get.mockImplementation(async (q: any) =>
        q.index === views_index ? { _source: { view_count: 1 } } : { _source: { total_likes: 2 } },
      );
      const out = await getProductDataFromElastic({ productId: "7", slug: "s", lang: "en", userId: 5 });
      expect(
        out?.total_rating,
        "a product with no final_rating got total_rating NaN (Number(undefined) ?? 0 never falls back)",
      ).toBe(0);
    },
  );
});

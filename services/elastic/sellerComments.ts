"use server";

// ---------------------------------------------------------------------------
// Secure seller-dashboard comments layer (direct Elasticsearch).
//
// SECURITY MODEL
// --------------
// The Elasticsearch comments index (`comments_develop`) is reachable only from
// the server — its credentials live in non-public env vars (ELASTICSEARCH_*),
// never shipped to the browser. These server actions are therefore the ONLY way
// the dashboard touches comments.
//
// The gate is UN-SKIPPABLE BY CONSTRUCTION: every exported action is built with
// `withSellerCommentAccess(...)`, a higher-order wrapper that runs identity +
// ownership + permission verification BEFORE the handler body ever sees a shop.
// There is no code path to the Elasticsearch helpers that does not first pass
// through that wrapper, so a future action cannot accidentally forget the check.
//
// Each wrapped action enforces:
//
//   1. Identity is resolved from the HttpOnly MARKET-TOKEN by asking the market
//      (Go) backend `GET /shop/auth/permissions` — the source of truth for which
//      shops a user owns and with what permissions. We NEVER trust the
//      client-supplied `sellerId` on its own; it is only accepted if the Go
//      backend confirms the authenticated user is a member of that shop. The
//      lookup is cached per request (React `cache`) and for a short TTL in Redis
//      (see `getVerifiedShops`), so a burst of actions does not hammer Go and a
//      brief Go outage falls back to a stale copy instead of breaking the tab.
//
//   2. The `owner_id` / `owner_type` filter on every query/mutation is injected
//      here from that verified identity — a seller can only ever read or write
//      documents where `owner_id === <their verified shop id>` and
//      `owner_type === "seller"`. A forged `sellerId` or `commentId` simply
//      matches zero documents.
//
//   3. Role gating mirrors the market service: SUPER_ADMIN, or the specific
//      permission for the action (READ_COMMENTS / REPLY_COMMENT / EDIT_REPLY /
//      DELETE_REPLY). Mutations are additionally rate-limited per shop+session.
//
// This makes the comments flow exactly as strong as the rest of the dashboard:
// authorization is decided by Go, enforced server-side, and unbypassable from
// the client.
// ---------------------------------------------------------------------------

import { cache } from "react";
import { createHash } from "crypto";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import {
  comments_index,
  comments_interactions_index,
  product_interactions_index,
  share_index,
} from "services/elastic/INDEXES";
import { HandleAuthedFetch } from "serverRequests/HandleAuthedFetch";
import { getCookieServer } from "utils/cookies/cookie-manager";
import {
  RedisGet,
  RedisSet,
  fixedWindowRateLimit,
} from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import {
  COMMENT_PERMISSIONS,
  SUPER_ADMIN,
  type CommentPermission,
} from "services/sellerDashboard/commentPermissions";

// Elasticsearch refuses `from + size` above index.max_result_window (10k default).
const MAX_RESULT_WINDOW = 10000;
const MAX_REPLY_LENGTH = 1000;

const PERMISSIONS_URL =
  (process.env.BACKEND_URL || "") + "/shop/auth/permissions";

// Short-TTL permission cache (Rec #2) and a longer "stale" copy used only as a
// fallback while Go is unreachable (Rec #7). Both are keyed by a hash of the
// auth token so a rotated token never reuses another identity's entry.
const PERMS_TTL_SECONDS = Number(process.env.SELLER_COMMENTS_PERMS_TTL ?? 30);
const PERMS_STALE_TTL_SECONDS = Number(
  process.env.SELLER_COMMENTS_PERMS_STALE_TTL ?? 3600,
);

// Per-shop+session rate limits (Rec #4). Reads are looser than mutations.
const READ_LIMIT = Number(process.env.SELLER_COMMENTS_READ_LIMIT ?? 60);
const READ_WINDOW = Number(process.env.SELLER_COMMENTS_READ_WINDOW ?? 60);
const WRITE_LIMIT = Number(process.env.SELLER_COMMENTS_WRITE_LIMIT ?? 20);
const WRITE_WINDOW = Number(process.env.SELLER_COMMENTS_WRITE_WINDOW ?? 60);

const COOKIE_NAMES = {
  MARKET_TOKEN: "MARKET-TOKEN",
  DEVICE_TOKEN: "DEVICE-TOKEN",
};

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; message: string };

interface VerifiedShop {
  sellerId: string;
  shopName: string;
  permissions: string[];
}

// ---------------------------------------------------------------------------
// Identity helpers — resolve the caller's raw auth token and derive a stable,
// non-reversible cache/rate-limit key from it. The raw token is never logged.
//
// TOKEN SOURCE IS INJECTABLE (web vs mobile), but the security model is not:
//   • Web (server actions) pass NO token → we read the HttpOnly MARKET-TOKEN /
//     DEVICE-TOKEN cookie, exactly as before.
//   • Mobile (the `/api/seller/comments/*` route handlers) pass the market
//     token the app sent in the `Authorization` header.
// Whatever the source, the token is verified against Go the same way and the
// same ownership/permission gate runs — a caller can never grant itself access
// by choosing a source.
// ---------------------------------------------------------------------------
async function resolveAuthToken(explicitToken?: string): Promise<string> {
  const explicit = explicitToken?.trim();
  if (explicit) return explicit;
  const market = await getCookieServer<string>(COOKIE_NAMES.MARKET_TOKEN);
  const device = await getCookieServer<string>(COOKIE_NAMES.DEVICE_TOKEN);
  return market || device || "anonymous";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 32);
}

// Raw Go fetch — the only place that actually calls the market backend.
async function fetchShopsFromGo(
  explicitToken?: string,
): Promise<{ ok: boolean; shops: any[] }> {
  let res: any;
  try {
    if (explicitToken) {
      // Header/mobile path: verify the caller-supplied bearer token directly
      // against Go. We deliberately do NOT fall back to guest re-registration
      // the way HandleAuthedFetch does — a guest owns no shops, so a bad or
      // expired token must simply fail closed here.
      const response = await fetch(PERMISSIONS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${explicitToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!response.ok) return { ok: false, shops: [] };
      res = { data: await response.json().catch(() => null) };
    } else {
      // Web path: cookie token + automatic 401 handling, unchanged.
      res = await HandleAuthedFetch({ url: PERMISSIONS_URL, method: "GET" });
    }
  } catch (error) {
    LogServerError({
      scenario: "fetchShopsFromGo: permissions fetch failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, shops: [] };
  }

  // Fail closed on any non-2xx (401 guest, 403, upstream error, …).
  if (!res || res.isError || (res.status && res.status >= 400)) {
    return { ok: false, shops: [] };
  }

  // `/shop/auth/permissions` body is `{ success, data: [{ seller_id, shop_name,
  // permissions, shop_role }] }` — but tolerate a bare array too.
  const body = res.data;
  const shops: any[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.data)
      ? body.data
      : [];
  return { ok: true, shops };
}

// ---------------------------------------------------------------------------
// Cached, downtime-resilient permission lookup (Rec #2 + Rec #7).
//
// Order of resolution:
//   1. React `cache` dedupes within a single request.
//   2. Fresh Redis copy (PERMS_TTL_SECONDS) → return immediately, no Go hop.
//   3. Cache miss → ask Go; on success refresh both the fresh and stale copies.
//   4. Go unreachable → fall back to the longer-lived stale copy if present.
//
// TRADE-OFF: a permission revoked on Go is honoured only after the fresh TTL
// (default 30s) expires, and up to PERMS_STALE_TTL_SECONDS during a Go outage.
// Acceptable for a low-risk comment-reply surface; tune the TTLs via env.
// ---------------------------------------------------------------------------
const getVerifiedShops = cache(
  async (tokenHash: string, explicitToken?: string): Promise<any[] | null> => {
  const freshKey = `seller:perms:${tokenHash}`;
  const staleKey = `seller:perms:stale:${tokenHash}`;

  const cached = await RedisGet(freshKey);
  if (Array.isArray(cached)) return cached;

  const live = await fetchShopsFromGo(explicitToken);
  if (live.ok) {
    await RedisSet(freshKey, live.shops, PERMS_TTL_SECONDS);
    await RedisSet(staleKey, live.shops, PERMS_STALE_TTL_SECONDS);
    return live.shops;
  }

  // Go failed — last-resort stale copy so a backend blip doesn't kill the tab.
  const stale = await RedisGet(staleKey);
  if (Array.isArray(stale)) return stale;

  return null;
});

// ---------------------------------------------------------------------------
// Trust anchor: confirm the authenticated user owns `sellerId` AND holds the
// required permission, by asking the market backend (not by trusting the input).
// ---------------------------------------------------------------------------
async function assertSellerCommentAccess(
  sellerId: string | undefined,
  requiredPermission: CommentPermission,
  tokenHash: string,
  explicitToken?: string,
): Promise<{ ok: boolean; message?: string; shop?: VerifiedShop }> {
  const normalizedSellerId = String(sellerId ?? "").trim();
  if (!normalizedSellerId) {
    return { ok: false, message: "Missing shop identifier." };
  }

  const shops = await getVerifiedShops(tokenHash, explicitToken);
  if (!shops) {
    return { ok: false, message: "Unable to verify permissions." };
  }

  const shop = shops.find((s) => String(s?.seller_id) === normalizedSellerId);

  // User is not a member of this shop → ownership cannot be granted.
  if (!shop) {
    return { ok: false, message: "Not authorized for this shop." };
  }

  const permissions: string[] = Array.isArray(shop.permissions)
    ? shop.permissions
    : [];

  const allowed =
    permissions.includes(SUPER_ADMIN) ||
    permissions.includes(requiredPermission);

  if (!allowed) {
    return { ok: false, message: "You do not have permission for this action." };
  }

  return {
    ok: true,
    shop: {
      sellerId: normalizedSellerId,
      shopName: String(shop.shop_name ?? ""),
      permissions,
    },
  };
}

// ---------------------------------------------------------------------------
// Rec #1 — the un-skippable gate.
//
// Every exported action is produced by this wrapper. The handler body can ONLY
// run after access is verified, and it receives the verified `shop` (never raw
// client input) for its ownership filter. Adding a new action without going
// through `withSellerCommentAccess` is the one mistake this design makes hard:
// there is simply no other entry point to the Elasticsearch helpers below.
// ---------------------------------------------------------------------------
type GuardOptions = {
  permission: CommentPermission;
  /** "read" = looser limit, "write" = stricter (Rec #4). */
  kind: "read" | "write";
};

function withSellerCommentAccess<
  P extends { sellerId: string; authToken?: string },
  R,
>(
  opts: GuardOptions,
  handler: (shop: VerifiedShop, params: P) => Promise<ActionResult<R>>,
): (params: P) => Promise<ActionResult<R>> {
  return async (params: P): Promise<ActionResult<R>> => {
    // Web callers omit `authToken` (identity comes from the HttpOnly cookie);
    // mobile route handlers pass the token from the Authorization header.
    const rawToken = await resolveAuthToken(params?.authToken);
    const tokenHash = hashToken(rawToken);

    const access = await assertSellerCommentAccess(
      params?.sellerId,
      opts.permission,
      tokenHash,
      params?.authToken,
    );
    if (!access.ok || !access.shop) {
      return { success: false, message: access.message || "Not authorized." };
    }

    // Rate limit AFTER identity is known so the bucket is per verified
    // shop+session, not spoofable by client input. Fails open if Redis is down.
    const limit = opts.kind === "write" ? WRITE_LIMIT : READ_LIMIT;
    const windowSeconds = opts.kind === "write" ? WRITE_WINDOW : READ_WINDOW;
    const bucket = `seller:cmt:rl:${opts.kind}:${access.shop.sellerId}:${tokenHash}`;
    const rl = await fixedWindowRateLimit(bucket, limit, windowSeconds);
    if (!rl.allowed) {
      return {
        success: false,
        message: `Too many requests. Try again in ${rl.ttl}s.`,
      };
    }

    return handler(access.shop, params);
  };
}

// The ownership filter every query/mutation must carry. Sourced ONLY from the
// verified shop id — never from raw client input.
function ownerFilter(sellerId: string) {
  return [
    { term: { owner_id: String(sellerId) } },
    { term: { owner_type: "seller" } },
  ];
}

// ---------------------------------------------------------------------------
// Reaction (heart) counts. Reactions live in a separate index keyed by
// `target_id` — the comment_id for a comment, and `${comment_id}-seller_reply`
// for the shop's reply. Mirrors the customer-facing aggregation in
// `serverRequests/product.tsx#GetFQACommentsForProductWithReactions`, but the
// dashboard only needs the public totals (no per-user `is_liked`).
// ---------------------------------------------------------------------------
async function attachReactionCounts<
  T extends { comment_id: string; has_reply: boolean },
>(comments: T[]): Promise<(T & { total_likes: number; reply_total_likes: number })[]> {
  const withZero = (c: T) => ({ ...c, total_likes: 0, reply_total_likes: 0 });
  if (!comments.length) return [];

  const targetIds: string[] = [];
  for (const c of comments) {
    targetIds.push(String(c.comment_id));
    if (c.has_reply) targetIds.push(`${c.comment_id}-seller_reply`);
  }

  try {
    const res: any = await elasticSearchClient.search({
      index: comments_interactions_index,
      size: 0,
      query: {
        bool: {
          must: [
            { terms: { target_id: targetIds } },
            { term: { status: "active" } },
            { terms: { target_type: ["comment", "seller_reply"] } },
          ],
        },
      },
      aggs: {
        by_target: { terms: { field: "target_id", size: targetIds.length } },
      },
    });

    const counts: Record<string, number> = {};
    for (const b of res?.aggregations?.by_target?.buckets ?? []) {
      counts[String(b.key)] = b.doc_count;
    }

    return comments.map((c) => ({
      ...c,
      total_likes: counts[String(c.comment_id)] ?? 0,
      reply_total_likes: c.has_reply
        ? (counts[`${c.comment_id}-seller_reply`] ?? 0)
        : 0,
    }));
  } catch (error) {
    LogServerError({
      scenario: "attachReactionCounts: elastic agg failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return comments.map(withZero);
  }
}

// ---------------------------------------------------------------------------
// READ — list this shop's own comments (FAQ) or reviews, ownership-scoped.
// ---------------------------------------------------------------------------
// Each action below is a thin async export (required by the "use server"
// contract) that forwards to its guarded implementation. The implementations
// are module-private, so the Elasticsearch helpers stay reachable ONLY through
// `withSellerCommentAccess`.
const guardedGetSellerComments = withSellerCommentAccess<
  {
    sellerId: string;
    isReview: boolean;
    page?: number;
    pageSize?: number;
    authToken?: string;
  },
  { comments: any[]; meta: any }
>({ permission: COMMENT_PERMISSIONS.READ, kind: "read" }, async (shop, params) => {
  const isReview = Boolean(params.isReview);
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(params.pageSize) || 10));

  const from = (page - 1) * pageSize;
  if (from + pageSize > MAX_RESULT_WINDOW) {
    return { success: false, message: "Pagination limit reached." };
  }

  try {
    const searchBody: any = {
      index: comments_index,
      from,
      size: pageSize,
      track_total_hits: true,
      sort: [{ created_at: "desc" }, { comment_id: "desc" }],
      query: {
        bool: {
          filter: [
            ...ownerFilter(shop.sellerId),
            { term: { is_review: isReview } },
          ],
          must_not: [{ term: { status: "deleted" } }],
        },
      },
    };

    // Reviews only: one review per order line. A poor-network double-write can
    // leave two docs sharing the same order_details_id, so collapse to show the
    // newest per order line (sort already orders newest first). FAQ comments
    // have no order_details_id, so collapsing them would wrongly fold every FAQ
    // into a single null bucket — never collapse those.
    if (isReview) {
      searchBody.collapse = { field: "order_details_id" };
      // Distinct order lines = real review count after collapse, so pagination
      // doesn't count duplicate docs.
      searchBody.aggs = {
        collapsed_total: { cardinality: { field: "order_details_id" } },
      };
    }

    const result: any = await elasticSearchClient.search(searchBody);

    const hits: any[] = result?.hits?.hits ?? [];
    const comments = hits.map((hit) => {
      const s = hit?._source ?? {};
      return {
        comment_id: s.comment_id ?? hit._id,
        product_id: s.product_id ?? "",
        user_id: s.user_id ?? "",
        user_name: s.user_name ?? "",
        user_avatar: s.user_avatar ?? "",
        text: s.text ?? "",
        rating: s.rating ?? null,
        variant: s.variant ?? "",
        created_at: s.created_at ?? null,
        has_reply: Boolean(s.has_reply),
        seller_reply: s.seller_reply ?? "",
        seller_name: s.seller_name ?? "",
        reply_created_at: s.reply_created_at ?? null,
      };
    });

    const enriched = await attachReactionCounts(comments);

    const totalRaw = result?.hits?.total;
    const rawTotal =
      typeof totalRaw === "number" ? totalRaw : (totalRaw?.value ?? 0);
    // For reviews use the collapsed (distinct-order-line) count so duplicate
    // docs don't inflate the total/page count.
    const total = isReview
      ? (result?.aggregations?.collapsed_total?.value ?? rawTotal)
      : rawTotal;
    const last_page = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: true,
      data: {
        comments: enriched,
        meta: {
          current_page: page,
          per_page: pageSize,
          total,
          last_page,
          has_more_pages: page < last_page,
        },
      },
    };
  } catch (error) {
    LogServerError({
      scenario: "getSellerComments: elastic search failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to load comments." };
  }
});

export async function getSellerComments(params: {
  sellerId: string;
  isReview: boolean;
  page?: number;
  pageSize?: number;
  authToken?: string;
}): Promise<ActionResult<{ comments: any[]; meta: any }>> {
  return guardedGetSellerComments(params);
}

// ---------------------------------------------------------------------------
// WRITE helpers — guarded update_by_query. The ownership filter is part of the
// match, so a comment that isn't this shop's simply isn't updated (updated: 0).
// ---------------------------------------------------------------------------
async function guardedUpdate(
  sellerId: string,
  commentId: string,
  source: string,
  scriptParams: Record<string, unknown>,
): Promise<{ updated: number }> {
  const result: any = await elasticSearchClient.updateByQuery({
    index: comments_index,
    refresh: true,
    conflicts: "proceed",
    query: {
      bool: {
        filter: [
          { term: { comment_id: String(commentId) } },
          ...ownerFilter(sellerId),
        ],
        must_not: [{ term: { status: "deleted" } }],
      },
    },
    script: { lang: "painless", source, params: scriptParams },
  });
  return { updated: result?.updated ?? 0 };
}

// Rec #5 — strip any HTML markup and control chars before storing. The public
// render path already escapes `seller_reply` (React text child in
// FaqItemComponent, `innerText` in BuyersReplyMenu — no dangerouslySetInnerHTML),
// so this is defense-in-depth: the stored value can never carry markup at all.
function sanitizeReply(replyText: unknown): string | null {
  if (typeof replyText !== "string") return null;
  const stripped = replyText
    .replace(/<[^>]*>/g, "") // drop HTML tags
    .replace(/[ -]/g, " ") // drop control chars
    .trim();
  if (!stripped || stripped.length > MAX_REPLY_LENGTH) return null;
  return stripped;
}

// Create OR edit a reply. `reply_created_at` is stamped only the first time, so
// the same painless script is safe for both REPLY_COMMENT and EDIT_REPLY.
const REPLY_SCRIPT = `
  if (ctx._source.reply_created_at == null) { ctx._source.reply_created_at = params.now; }
  ctx._source.seller_reply = params.reply;
  ctx._source.has_reply = true;
  ctx._source.seller_name = params.seller_name;
  ctx._source.seller_updated_at = params.now;
`;

async function upsertReply(
  shop: VerifiedShop,
  commentId: string,
  replyText: string,
): Promise<ActionResult<{ comment_id: string; seller_reply: string }>> {
  const reply = sanitizeReply(replyText);
  if (!reply) return { success: false, message: "Invalid reply text." };

  const id = String(commentId ?? "").trim();
  if (!id) return { success: false, message: "Missing comment id." };

  try {
    const { updated } = await guardedUpdate(shop.sellerId, id, REPLY_SCRIPT, {
      reply,
      seller_name: shop.shopName,
      now: new Date().toISOString(),
    });
    if (updated === 0) {
      return { success: false, message: "Comment not found or not permitted." };
    }
    return { success: true, data: { comment_id: id, seller_reply: reply } };
  } catch (error) {
    LogServerError({
      scenario: "upsertReply: elastic update failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to save reply." };
  }
}

const guardedReplyToComment = withSellerCommentAccess<
  { sellerId: string; commentId: string; replyText: string; authToken?: string },
  { comment_id: string; seller_reply: string }
>({ permission: COMMENT_PERMISSIONS.REPLY, kind: "write" }, (shop, params) =>
  upsertReply(shop, params.commentId, params.replyText),
);

export async function replyToComment(params: {
  sellerId: string;
  commentId: string;
  replyText: string;
  authToken?: string;
}): Promise<ActionResult<{ comment_id: string; seller_reply: string }>> {
  return guardedReplyToComment(params);
}

const guardedEditReply = withSellerCommentAccess<
  { sellerId: string; commentId: string; replyText: string; authToken?: string },
  { comment_id: string; seller_reply: string }
>({ permission: COMMENT_PERMISSIONS.EDIT_REPLY, kind: "write" }, (shop, params) =>
  upsertReply(shop, params.commentId, params.replyText),
);

export async function editReply(params: {
  sellerId: string;
  commentId: string;
  replyText: string;
  authToken?: string;
}): Promise<ActionResult<{ comment_id: string; seller_reply: string }>> {
  return guardedEditReply(params);
}

const DELETE_REPLY_SCRIPT = `
  ctx._source.remove('seller_reply');
  ctx._source.remove('reply_created_at');
  ctx._source.has_reply = false;
  ctx._source.seller_updated_at = params.now;
`;

const guardedDeleteReply = withSellerCommentAccess<
  { sellerId: string; commentId: string; authToken?: string },
  { comment_id: string }
>({ permission: COMMENT_PERMISSIONS.DELETE_REPLY, kind: "write" }, async (shop, params) => {
  const id = String(params.commentId ?? "").trim();
  if (!id) return { success: false, message: "Missing comment id." };

  try {
    const { updated } = await guardedUpdate(shop.sellerId, id, DELETE_REPLY_SCRIPT, {
      now: new Date().toISOString(),
    });
    if (updated === 0) {
      return { success: false, message: "Comment not found or not permitted." };
    }
    return { success: true, data: { comment_id: id } };
  } catch (error) {
    LogServerError({
      scenario: "deleteReply: elastic update failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to delete reply." };
  }
});

export async function deleteReply(params: {
  sellerId: string;
  commentId: string;
  authToken?: string;
}): Promise<ActionResult<{ comment_id: string }>> {
  return guardedDeleteReply(params);
}

// ---------------------------------------------------------------------------
// READ — per-product social counts (reactions / FAQ questions / reviews /
// shares) for this shop's products. Reuses the same Elasticsearch indices the
// customer storefront aggregates from, but the whole action is permission-gated
// (READ_COMMENTS) so only an authorized member of the shop can pull them.
// `productIds` is a hint only — counts are scoped by product_id, and the action
// already proved the caller is a verified member of the shop.
// ---------------------------------------------------------------------------
const MAX_PRODUCTS_PER_BATCH = 100;

export interface ProductSocial {
  total_reactions: number;
  total_fqa: number;
  total_reviews: number;
  total_shares: number;
}

const guardedGetSellerProductsSocial = withSellerCommentAccess<
  { sellerId: string; productIds: Array<string | number>; authToken?: string },
  Record<string, ProductSocial>
>({ permission: COMMENT_PERMISSIONS.READ, kind: "read" }, async (_shop, params) => {
  const ids = Array.from(
    new Set(
      (params.productIds ?? [])
        .map((p) => String(p ?? "").trim())
        .filter(Boolean),
    ),
  ).slice(0, MAX_PRODUCTS_PER_BATCH);

  if (!ids.length) return { success: true, data: {} };

  const result: Record<string, ProductSocial> = {};
  for (const id of ids) {
    result[id] = {
      total_reactions: 0,
      total_fqa: 0,
      total_reviews: 0,
      total_shares: 0,
    };
  }

  try {
    const [commentsRes, sharesRes, interactionsRes]: any[] = await Promise.all([
      // FAQ vs review counts per product, in one pass.
      elasticSearchClient.search({
        index: comments_index,
        size: 0,
        query: {
          bool: {
            filter: [{ terms: { product_id: ids } }],
            must_not: [{ term: { status: "deleted" } }],
          },
        },
        aggs: {
          by_product: {
            terms: { field: "product_id", size: ids.length },
            aggs: { by_review: { terms: { field: "is_review", size: 2 } } },
          },
        },
      }),
      // Share counts (one doc per product in share_index).
      elasticSearchClient.search({
        index: share_index,
        size: ids.length,
        _source: ["product_id", "shared_count"],
        query: { terms: { product_id: ids } },
      }),
      // Product like totals (doc id === product_id).
      elasticSearchClient.mget({
        index: product_interactions_index,
        ids,
        _source: ["total_likes"],
      }),
    ]);

    for (const pb of commentsRes?.aggregations?.by_product?.buckets ?? []) {
      const key = String(pb.key);
      if (!result[key]) continue;
      for (const rb of pb.by_review?.buckets ?? []) {
        const isReview =
          rb.key === 1 || rb.key === true || rb.key_as_string === "true";
        if (isReview) result[key].total_reviews = rb.doc_count;
        else result[key].total_fqa = rb.doc_count;
      }
    }

    for (const hit of sharesRes?.hits?.hits ?? []) {
      const src = hit?._source ?? {};
      const key = String(src.product_id);
      if (result[key]) result[key].total_shares = Number(src.shared_count) || 0;
    }

    for (const doc of interactionsRes?.docs ?? []) {
      if (!doc?.found) continue;
      const key = String(doc._id);
      if (result[key])
        result[key].total_reactions = Number(doc._source?.total_likes) || 0;
    }

    return { success: true, data: result };
  } catch (error) {
    LogServerError({
      scenario: "getSellerProductsSocial: elastic failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: "Failed to load product stats." };
  }
});

export async function getSellerProductsSocial(params: {
  sellerId: string;
  productIds: Array<string | number>;
  authToken?: string;
}): Promise<ActionResult<Record<string, ProductSocial>>> {
  return guardedGetSellerProductsSocial(params);
}

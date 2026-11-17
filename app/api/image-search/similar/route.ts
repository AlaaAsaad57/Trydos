import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { RedisGet, RedisSet } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import { guardPaidCall, PAID_CALL_MESSAGES } from "utils/server/paidRouteGuard";
import { EmbeddingError, embedImage } from "utils/server/imageEmbedding";
// Full path, never a `utils/server` barrel (see the file header).
import { qaMode } from "utils/server/qaMode";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import {
  buildSimilarProductsQuery,
  readPhotoSearchFilters,
  toPhotoSearchChips,
  toSimilarProducts,
} from "services/elastic/similarProducts";

// Photo search by vector: the photo becomes a vector (Gemini), and the
// catalogue answers with the products whose photos are nearest. The answer
// also carries the chip lists (brands, categories, boutiques, related
// categories) of those products, so the search box chips belong to the photo
// results, as they belong to the text results in text search.
//
// A new photo costs a Gemini call, so the paid-route guard and caps apply.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 60;

/** The types the embedding model reads (GIF too, checked 2026-11-15). The
 *  browser sends a JPEG it made itself, so this list is for other callers. */
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/gif",
];

const LANGUAGES = ["en", "ar", "tr", "ku"];

// A shopper who changes a filter sends the same photo again. Its vector is kept
// for 10 minutes under a hash of the photo bytes, so a filter change costs a
// search, not another Gemini call. The hash is not the photo, and the vector
// cannot be turned back into it. With Redis down, every call asks Gemini.
const VECTOR_CACHE_SECONDS = 600;
const vectorCacheKey = (data: Buffer) =>
  `photo-search:vector:${createHash("sha256").update(data).digest("hex")}`;
const isVector = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((v) => typeof v === "number" && Number.isFinite(v));

// English keys; the browser passes each one through `translateFunction`, so
// each is in the three translation files.
const SIMILAR_MESSAGES = {
  missing: "Missing required fields",
  badType: "Invalid file type",
  badImage: "We could not read this image. Please try another photo.",
  failed: "failed to search with image",
} as const;

const answer = (body: object, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    const language = String(form?.get("language") ?? "").toLowerCase();
    const country = String(form?.get("country") ?? "").toLowerCase();
    const filters = readPhotoSearchFilters(form?.get("filters"));

    const refused = await guardPaidCall(request, {
      name: "image-search-similar",
      file: file instanceof File ? file : null,
      maxBytes: MAX_IMAGE_BYTES,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
    });
    if (refused) {
      return answer({ error: refused.message, success: false }, refused.status);
    }

    if (
      !(file instanceof File) ||
      file.size === 0 ||
      !LANGUAGES.includes(language) ||
      !/^[a-z]{2}$/.test(country)
    ) {
      return answer({ error: SIMILAR_MESSAGES.missing, success: false }, 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return answer({ error: SIMILAR_MESSAGES.badType, success: false }, 400);
    }

    const data = Buffer.from(await file.arrayBuffer());
    const cacheKey = vectorCacheKey(data);
    const cached = await RedisGet(cacheKey);
    let vector: number[];
    try {
      vector = isVector(cached) ? cached : await embedImage(data, file.type);
    } catch (error) {
      if (error instanceof EmbeddingError && error.kind === "invalid-image") {
        return answer({ error: SIMILAR_MESSAGES.badImage, success: false }, 400);
      }
      if (error instanceof EmbeddingError && error.kind === "quota") {
        return answer({ error: PAID_CALL_MESSAGES.tooMany, success: false }, 429);
      }
      LogServerError(
        {
          error: error?.message || error,
          kind: error instanceof EmbeddingError ? error.kind : "unknown",
          type: "image search by vector: the embedding model failed",
          url: request.url,
        },
        "/api/image-search/similar",
      );
      return answer({ error: SIMILAR_MESSAGES.failed, success: false }, 502);
    }
    if (cached !== vector) await RedisSet(cacheKey, vector, VECTOR_CACHE_SECONDS);

    const response = await elasticSearchClient.search(
      buildSimilarProductsQuery({
        vector,
        country,
        language,
        filters,
        qaView: await qaMode(),
      }) as any,
    );
    const products = toSimilarProducts(response.hits.hits as any[], language, country);

    const chips = toPhotoSearchChips(response.aggregations, filters);

    return answer({ success: true, products, ...chips });
  } catch (error) {
    LogServerError(
      {
        error: error?.message || error,
        type: "image search by vector: the search failed",
        url: request.url,
      },
      "/api/image-search/similar",
    );
    return answer({ error: SIMILAR_MESSAGES.failed, success: false }, 500);
  }
}

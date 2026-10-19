import { NextRequest, NextResponse } from "next/server";
import { fixedWindowRateLimit } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import {
  AiBusyError,
  assertProductCreateAccess,
  buildGeminiRequest,
  callGemini,
  checkSuggestion,
  loadImage,
  loadLists,
  MESSAGES,
  parseImageName,
} from "./_autofill";

// POST /api/seller/products/ai-autofill   body: { sellerId, image }
//
// Web dashboard only: identity comes from the HttpOnly market cookie. The seller
// uploads the photo to the media server first and sends its bare file name; this
// route suggests title / description / brand / three category levels for the
// new-product form. It never saves anything.
//
// Answers: 200 { success, data } | 401 / 403 not allowed | 422 bad image |
// 429 over the limit | 503 AI busy or limiter down | 500 anything else.

const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 60;

const fail = (status: number, message: string) =>
  NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sellerId = String(body?.sellerId ?? "").trim();
  if (!/^\d{1,12}$/.test(sellerId)) return fail(403, MESSAGES.forbidden);

  const access = await assertProductCreateAccess(sellerId);
  if (!access.ok) return fail(access.status, MESSAGES.forbidden);

  // One bucket per shop, so a token renewal cannot reset it. The shared limiter
  // fails open (ttl 0) when Redis is missing or erroring; a paid call must not
  // run uncapped, so that case answers "busy" here.
  const rl = await fixedWindowRateLimit(
    `seller:ai:rl:${sellerId}`,
    RATE_LIMIT,
    RATE_WINDOW_SECONDS,
  );
  if (rl.ttl === 0) return fail(503, MESSAGES.busy);
  if (!rl.allowed) return fail(429, MESSAGES.tooMany);

  const name = parseImageName(body?.image);
  const image = name ? await loadImage(name) : null;
  if (!image) return fail(422, MESSAGES.image);

  try {
    const lists = await loadLists(sellerId);
    const raw = await callGemini(buildGeminiRequest(image, lists));
    return NextResponse.json(
      { success: true, data: checkSuggestion(raw, lists) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const busy = error instanceof AiBusyError;
    LogServerError({
      scenario: "seller-ai-autofill: analysis failed",
      reason: error instanceof Error ? error.message : "unknown",
      sellerId,
    });
    return busy ? fail(503, MESSAGES.busy) : fail(500, MESSAGES.failed);
  }
}

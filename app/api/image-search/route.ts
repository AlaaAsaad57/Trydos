import { NextRequest, NextResponse } from "next/server";
import { LogServerError } from "utils/serverErrorReporter";
import { guardPaidCall, PAID_CALL_MESSAGES } from "utils/server/paidRouteGuard";

// Every call costs money (Gemini), so the route refuses a caller with no
// session, a picture over the cap, and more than this many calls per address
// per window. The checks live in `utils/server/paidRouteGuard.ts`.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 60;

// The model is an env value, so Ops can swap it without a redeploy. The old
// hardcoded `gemini-1.5-flash` was retired by Google on 24 Sep 2025, and from
// that day every photo search failed. The default is the same model the search
// text analyser uses (`services/elastic/analyzeSearchText.ts`); it reads
// pictures too.
const MODEL = process.env.GEMINI_IMAGE_SEARCH_MODEL || "gemini-2.5-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Hard ceiling on the model call. A photo is larger than a search text, so
// the budget is longer than the analyser's 6 s. Tunable without a redeploy.
const DEFAULT_TIMEOUT_MS = 15000;
const timeoutMs = () =>
  Number(process.env.IMAGE_SEARCH_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

// The picture goes to the model inline, as base64, with its MIME type.
async function fileToInlineData(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return {
    inlineData: {
      mimeType: file.type,
      data: Buffer.from(arrayBuffer).toString("base64"),
    },
  };
}

/** The model refused to answer because of its safety filters. */
const blockedBySafety = (result: any) =>
  Boolean(result?.promptFeedback?.blockReason) ||
  result?.candidates?.[0]?.finishReason === "SAFETY";

export async function POST(request: NextRequest) {
  try {
    // Parse the FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const language = formData.get("language") as string;

    const refused = await guardPaidCall(request, {
      name: "image-search",
      file,
      maxBytes: MAX_IMAGE_BYTES,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
    });
    if (refused) {
      return NextResponse.json(
        { error: refused.message, success: false },
        { status: refused.status, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Validate required fields
    if (!file || !language) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "file, language  are required",
        },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          details: "Only image files (JPEG, PNG, JPG, WEBP, GIF) are supported",
        },
        { status: 400 },
      );
    }

    const picture = await fileToInlineData(file);

    // Create language-specific prompt
    const basePrompt =
      "Describe the product most clearly shown in this picture with no more than 5 words like: T-shirt black xxl";

    const languagePrompt =
      language.toLowerCase() === "ar"
        ? `${basePrompt}. If you cannot identify any clear product in the image, respond exactly with "NO_PRODUCT_FOUND". (Please respond in Arabic)`
        : language.toLowerCase() === "en"
          ? `${basePrompt}. If you cannot identify any clear product in the image, respond exactly with "NO_PRODUCT_FOUND". (Please respond in English)`
          : `${basePrompt}. If you cannot identify any clear product in the image, respond exactly with "NO_PRODUCT_FOUND". (Please respond in Turkish)`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The key travels only in the header, never in the URL.
        "x-goog-api-key": process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: languagePrompt }, picture] }],
        generationConfig: {
          // Thinking tokens are billed and add seconds; a five-word label
          // does not need them.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs()),
    });

    if (response.status === 429) {
      // The Gemini quota, not ours: the shopper may try again in a moment.
      return NextResponse.json(
        { error: PAID_CALL_MESSAGES.tooMany, success: false },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      const keyRefused =
        (response.status === 400 || response.status === 403) &&
        /api key/i.test(bodyText);
      LogServerError(
        {
          error: `Gemini API error: ${response.status} — ${bodyText.slice(0, 200)}`,
          type: "search image api route",
          url: request.url,
        },
        "/api/image-search",
      );
      if (keyRefused) {
        return NextResponse.json(
          {
            error: "API Configuration Error",
            details: "Google AI API key is missing or invalid",
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        {
          error: "Internal server error",
          details: `The image model answered ${response.status}`,
        },
        { status: 500 },
      );
    }

    const result: any = await response.json();

    if (blockedBySafety(result)) {
      return NextResponse.json(
        {
          error: "Content Safety Error",
          details: "The content was flagged by safety filters",
        },
        { status: 400 },
      );
    }

    const text: string = (
      result?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    ).trim();

    // Check if no product was found
    if (
      !text ||
      text === "NO_PRODUCT_FOUND" ||
      text.toLowerCase().includes("no product") ||
      text.toLowerCase().includes("cannot identify") ||
      text.toLowerCase().includes("not a product") ||
      text.toLowerCase().includes("no clear product")
    ) {
      return NextResponse.json(
        {
          error: "No product detected",
          details: "No clear product could be identified in the uploaded image",
          success: false,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      response: text,
    });
  } catch (error) {
    LogServerError(
      {
        error: error,
        type: "search image api route",
        url: request.url,
      },
      "/api/image-search",
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}

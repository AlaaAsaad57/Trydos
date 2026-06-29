import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { serializeUnknownForErrorLog } from "utils/errorSerialization";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPayload = body?.error ?? {};
    const errorPayload = serializeUnknownForErrorLog(rawPayload);

    const cookieStore = await cookies();

    const marketToken =
      cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value ?? null;
    const deviceToken =
      cookieStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value ?? null;
    const chatToken = cookieStore.get(COOKIE_NAMES.CHAT_TOKEN)?.value ?? null;
    const storiesToken =
      cookieStore.get(COOKIE_NAMES.STORIES_TOKEN)?.value ?? null;
    const walletToken =
      cookieStore.get(COOKIE_NAMES.WALLET_TOKEN)?.value ?? null;
    const userIdHash =
      cookieStore.get(COOKIE_NAMES.USER_ID_HASH)?.value ?? null;

    const cookiesSnapshot: Record<string, string> = {};
    for (const c of cookieStore.getAll()) {
      cookiesSnapshot[c.name] = c.value;
    }

    const enrichedError = {
      platform: "\u{1F6D1}WEB\u{1F6D1}",
      ...(typeof errorPayload === "object" &&
      errorPayload !== null &&
      !Array.isArray(errorPayload)
        ? errorPayload
        : { message: String(errorPayload) }),
      marketToken,
      deviceToken,
      chatToken,
      storiesToken,
      walletToken,
      userIdHash,
      cookiesSnapshot,
    };

    let res=await fetch(
      process.env.NEXT_PUBLIC_GO_BACKEND_URL + "/mobile_error_log/store",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept":"application/json"
        },
        body: JSON.stringify({error_description: JSON.stringify(enrichedError)}),
      },
    );

    return NextResponse.json({ success: true },{headers:{
      'IS-FROM-GO':'true'
    }});
  } catch (err) {
    console.error("mobile-error-log route error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

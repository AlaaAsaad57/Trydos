import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getFirebaseMessaging } from "utils/firebaseAdmin";
import { LogServerError } from "utils/serverErrorReporter";
import {
  hasOrderPermission,
  shopOrderTopicSellerId,
} from "utils/shopOrderTopicRules";

// A1-6: a shop's order topic has a guessable name (`shop_{sellerId}_order`),
// and an order push carries the order itself. So before this route subscribes
// a device it must know who asks (the session cookie) and must check that the
// shopper belongs to that shop with an order permission. `proxy.ts` never runs
// on `/api`, so both checks live here.
//
// Only the shop order topics are accepted at all. Nothing else in the app
// subscribes through this route (see `utils/shopOrderTopics.ts`).

const PERMISSIONS_URL = "/shop/auth/permissions";

const refuse = (status: number, message: string) =>
  NextResponse.json({ success: false, message }, { status });

/**
 * Null when the shopper may receive this shop's order pushes, else the
 * refusal to answer with. The shop list comes from the core backend, which
 * answers the shops this token belongs to, each with its permissions.
 */
async function membershipRefusal(
  request: NextRequest,
  token: string,
  sellerId: string,
) {
  const [country, language] = (
    request.cookies.get(COOKIE_NAMES.LOCAL)?.value || "gb-en"
  ).split("-");
  let response: Response;
  try {
    response = await fetch(process.env.BACKEND_URL + PERMISSIONS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        country,
        lang: language,
      },
      credentials: "omit",
      cache: "no-store",
    });
  } catch (error) {
    LogServerError({ scenario: "subscribe: the shop list could not be read", error });
    return refuse(503, "The shop list could not be read");
  }
  if (!response.ok) return refuse(403, "This topic cannot be subscribed to");

  const body = await response.json().catch(() => null);
  const shops: any[] = Array.isArray(body?.data) ? body.data : [];
  const shop = shops.find((s) => String(s?.seller_id) === sellerId);
  if (!shop || !hasOrderPermission(shop.permissions)) {
    return refuse(403, "This topic cannot be subscribed to");
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAMES.MARKET_TOKEN)?.value;
    if (!token) return refuse(401, "Please reload the page and try again");

    const body = await request.json();
    const deviceToken = body?.token;
    const topic = body?.topic;

    if (!deviceToken || !topic) {
      return refuse(400, "token and topic are required");
    }

    const sellerId = shopOrderTopicSellerId(topic);
    if (!sellerId) return refuse(403, "This topic cannot be subscribed to");

    const refused = await membershipRefusal(request, token, sellerId);
    if (refused) return refused;

    const messaging = getFirebaseMessaging();
    await messaging.subscribeToTopic(deviceToken, topic);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    LogServerError({ scenario: "subscribe to notification topic failed", error });
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to subscribe to topic",
      },
      { status: 500 },
    );
  }
}

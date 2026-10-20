import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getFirebaseMessaging } from "utils/firebaseAdmin";
import { LogServerError } from "utils/serverErrorReporter";
import { shopOrderTopicSellerId } from "utils/shopOrderTopicRules";

// A1-6: this route used to take any device token and any topic from anyone.
// Now it needs a session, and it only accepts the shop order topics, the only
// topics the app subscribes through its own routes. No membership check here:
// a device token cannot be guessed, and leaving a topic leaks nothing.

const refuse = (status: number, message: string) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(request: NextRequest) {
  try {
    if (!request.cookies.get(COOKIE_NAMES.MARKET_TOKEN)?.value) {
      return refuse(401, "Please reload the page and try again");
    }

    const body = await request.json();
    const token = body?.token;
    const topic = body?.topic;

    if (!token || !topic) {
      return refuse(400, "token and topic are required");
    }

    if (!shopOrderTopicSellerId(topic)) {
      return refuse(403, "This topic cannot be subscribed to");
    }

    const messaging = getFirebaseMessaging();
    await messaging.unsubscribeFromTopic(token, topic);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    LogServerError({ scenario: "unsubscribe from notification topic failed", error });
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to unsubscribe from topic",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getFirebaseMessaging } from "utils/firebaseAdmin";
import { LogServerError } from "utils/serverErrorReporter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;
    const topic = body?.topic;

    if (!token || !topic) {
      return NextResponse.json(
        {
          success: false,
          message: "token and topic are required",
        },
        { status: 400 },
      );
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

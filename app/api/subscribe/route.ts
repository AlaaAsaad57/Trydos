import { NextRequest, NextResponse } from "next/server";
import { subscribeToTopic } from "utils/fcm";

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

    await subscribeToTopic(token, topic);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Subscribe topic error", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to subscribe to topic",
      },
      { status: 500 },
    );
  }
}

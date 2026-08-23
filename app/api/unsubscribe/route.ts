import { NextRequest, NextResponse } from "next/server";
import { unsubscribeFromTopic } from "utils/fcm";

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

    await unsubscribeFromTopic(token, topic);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unsubscribe topic error", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to unsubscribe from topic",
      },
      { status: 500 },
    );
  }
}

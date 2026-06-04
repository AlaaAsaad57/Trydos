import { NextRequest, NextResponse } from "next/server";
import { getFirebaseMessaging } from "utils/firebaseAdmin";
import { RedisGet, RedisSet } from "serverRequests/radis";

const STAT_TTL = 86400 * 30;

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-fcm-token");
  const secret = process.env.FCM_DASHBOARD_TOKEN;
  return !!(secret && token === secret);
}

async function incrementStat(key: string) {
  const current = ((await RedisGet(key)) ?? 0) as number;
  await RedisSet(key, current + 1, STAT_TTL);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: unknown; body?: unknown; topic?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { title, body: msgBody, topic } = body;
  if (
    typeof title !== "string" ||
    typeof msgBody !== "string" ||
    typeof topic !== "string" ||
    !title.trim() ||
    !msgBody.trim() ||
    !topic.trim()
  ) {
    return NextResponse.json(
      { message: "title, body and topic are required strings" },
      { status: 400 },
    );
  }

  // Load platform-specific settings stored by /api/fcm/settings
  const settings = (await RedisGet("fcm:settings")) as {
    webLinkEnabled?: boolean;
    webLink?: string;
    badgeCountEnabled?: boolean;
    badgeCount?: number;
  } | null;

  const message: Parameters<
    ReturnType<typeof getFirebaseMessaging>["send"]
  >[0] = {
    notification: { title, body: msgBody },
    topic,
    ...(settings?.webLinkEnabled && settings.webLink
      ? { webpush: { fcmOptions: { link: settings.webLink } } }
      : {}),
    ...(settings?.badgeCountEnabled &&
    typeof settings.badgeCount === "number" &&
    settings.badgeCount >= 0
      ? { apns: { payload: { aps: { badge: settings.badgeCount } } } }
      : {}),
  };

  try {
    const messaging = getFirebaseMessaging();
    const messageId = await messaging.send(message);
    await incrementStat("fcm:stat:messages_sent");
    return NextResponse.json({ success: true, messageId });
  } catch (error: unknown) {
    await incrementStat("fcm:stat:delivery_failures");
    const msg =
      error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

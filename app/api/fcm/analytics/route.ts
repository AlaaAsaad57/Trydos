import { NextRequest, NextResponse } from "next/server";
import { RedisGet } from "serverRequests/radis";

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-fcm-token");
  const secret = process.env.FCM_DASHBOARD_TOKEN;
  return !!(secret && token === secret);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [sent, failures, inactive] = await Promise.all([
    RedisGet("fcm:stat:messages_sent"),
    RedisGet("fcm:stat:delivery_failures"),
    RedisGet("fcm:stat:inactive_tokens"),
  ]);

  const messagesSent = (sent as number) ?? 0;
  const deliveryFailures = (failures as number) ?? 0;
  const inactiveTokens = (inactive as number) ?? 0;

  const deliveryRate =
    messagesSent === 0
      ? 100
      : Math.round(((messagesSent - deliveryFailures) / messagesSent) * 1000) /
        10;

  return NextResponse.json({ messagesSent, deliveryRate, inactiveTokens });
}

import { NextRequest, NextResponse } from "next/server";
import { withApiProtection } from "serverRequests/apiMiddlware";
import { RedisGet, RedisSet } from "serverRequests/radis";

const INACTIVE_TOKEN_TTL = 86400 * 30;

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-fcm-token");
  const secret = process.env.FCM_DASHBOARD_TOKEN;
  return !!(secret && token === secret);
}

export async function GET(req: NextRequest) {
  return (
    await withApiProtection(async (request) => {
      if (!isAuthorized(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const fcmToken = request.nextUrl.searchParams.get("token");
      if (!fcmToken) {
        return NextResponse.json(
          { message: "token query param is required" },
          { status: 400 },
        );
      }

      const serverKey = process.env.FIREBASE_SERVER_KEY;
      if (!serverKey) {
        return NextResponse.json(
          { message: "FIREBASE_SERVER_KEY is not configured" },
          { status: 500 },
        );
      }

      let iidRes: Response;
      try {
        iidRes = await fetch(
          `https://iid.googleapis.com/iid/info/${encodeURIComponent(fcmToken)}?details=true`,
          { headers: { Authorization: `key=${serverKey}` } },
        );
      } catch {
        return NextResponse.json(
          { message: "Failed to reach Firebase IID service" },
          { status: 502 },
        );
      }

      const data = await iidRes.json();

      if (!iidRes.ok) {
        // 404 / 400 means token is invalid or unregistered — count it
        if (iidRes.status === 404 || iidRes.status === 400) {
          const current = ((await RedisGet("fcm:stat:inactive_tokens")) ?? 0) as number;
          await RedisSet("fcm:stat:inactive_tokens", current + 1, INACTIVE_TOKEN_TTL);
        }
        return NextResponse.json(
          { message: (data?.error as string) || "Token lookup failed" },
          { status: iidRes.status >= 500 ? 502 : 404 },
        );
      }

      const platform = (data.platform as string)?.toUpperCase() ?? "UNKNOWN";
      const topics = data.rel?.topics ? Object.keys(data.rel.topics) : [];
      const appVersion = (data.appVersion as string | undefined) ?? undefined;

      return NextResponse.json({ platform, topics, appVersion });
    })
  )(req);
}

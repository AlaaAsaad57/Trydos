import { NextRequest, NextResponse } from "next/server";
import { withApiProtection } from "serverRequests/apiMiddlware";
import { RedisGet, RedisSet } from "serverRequests/radis";

type FcmSettings = {
  webLinkEnabled: boolean;
  webLink: string;
  badgeCountEnabled: boolean;
  badgeCount: number;
};

const SETTINGS_TTL = 86400 * 365;

const DEFAULT_SETTINGS: FcmSettings = {
  webLinkEnabled: false,
  webLink: "",
  badgeCountEnabled: false,
  badgeCount: 0,
};

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

      const settings =
        ((await RedisGet("fcm:settings")) as FcmSettings | null) ??
        DEFAULT_SETTINGS;

      return NextResponse.json(settings);
    })
  )(req);
}

export async function POST(req: NextRequest) {
  return (
    await withApiProtection(async (request) => {
      if (!isAuthorized(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      let body: Record<string, unknown>;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { message: "Invalid JSON body" },
          { status: 400 },
        );
      }

      // Validate webLink is a well-formed URL when provided
      if (body.webLinkEnabled && body.webLink) {
        try {
          new URL(body.webLink as string);
        } catch {
          return NextResponse.json(
            { message: "webLink must be a valid URL" },
            { status: 400 },
          );
        }
      }

      const settings: FcmSettings = {
        webLinkEnabled: Boolean(body.webLinkEnabled),
        webLink: typeof body.webLink === "string" ? body.webLink : "",
        badgeCountEnabled: Boolean(body.badgeCountEnabled),
        badgeCount:
          typeof body.badgeCount === "number" && body.badgeCount >= 0
            ? Math.floor(body.badgeCount)
            : 0,
      };

      await RedisSet("fcm:settings", settings, SETTINGS_TTL);
      return NextResponse.json({ success: true });
    })
  )(req);
}

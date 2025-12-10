import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  sendSecurityAlert,
  trackSuspiciousBehavior,
} from "./radis";

export async function withApiProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") || "0.0.0.0";

    // Rate limiting
    const allowed = await checkRateLimit(ip, 100, 60);
    if (!allowed) {
      await sendSecurityAlert(`IP ${ip} exceeded API rate limit`);
      return new NextResponse("Too many requests", { status: 429 });
    }

    // Suspicious behavior
    const suspicious = await trackSuspiciousBehavior(ip, req.nextUrl.pathname);
    if (suspicious) {
      await sendSecurityAlert(suspicious);
    }

    return handler(req);
  };
}

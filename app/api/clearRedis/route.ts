import { NextRequest, NextResponse } from "next/server";
import { removeRedis, getKeys, flushOtpLimitsAction } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
// your helper

export async function GET(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  // return NextResponse.json({ message: "unauth-401" });
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  try {
   await flushOtpLimitsAction();
    // Find all keys that start with "product:"
    const keys = await getKeys("product*");

    if (!keys || keys?.length === 0) {
      return NextResponse.json({ message: "No matching keys found" });
    }

    // Remove each key using your helper
    await Promise.all(keys.map((key) => removeRedis(key)));

    return NextResponse.json(
      {
        message: `Removed ${keys.length} keys`,
        removedKeys: keys,
      },
      { headers },
    );
  } catch (error: any) {
    LogServerError({ scenario: "clearRedis route failed", error });
    return NextResponse.json(
      { error: error.message || "Failed to remove keys" },
      { status: 500, headers },
    );
  }
}

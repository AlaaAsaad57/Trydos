import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "utils/cookies/cookie-manager";
// your helper

export async function GET(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  try {
    // Find all keys that start with "product:"

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("uid");
    if (!userId) {
      return NextResponse.json(
        { error: "no user id!" },
        { status: 422, headers }
      );
    }
    const SECRET_KEY = process.env.SECRET_KEY; // Replace with an env variable in production

    let token = generateToken(userId, SECRET_KEY);
    return NextResponse.json({ token: token, user_id: userId }, { headers });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to remove keys" },
      { status: 500, headers }
    );
  }
}

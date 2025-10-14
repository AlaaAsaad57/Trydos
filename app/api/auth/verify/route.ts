import { NextRequest, NextResponse } from "next/server";
import { generateToken, verifyToken } from "utils/cookies/cookie-manager";
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
    let stored_token =
      req.headers.get("authorization") || req.headers.get("Authorization");
    const userId = searchParams.get("uid");

    if (!userId || !stored_token) {
      return NextResponse.json(
        { error: "no user id or token!" },
        { status: 422, headers }
      );
    }
    stored_token = stored_token?.split("Bearer ")[1];
    const SECRET_KEY = process.env.SECRET_KEY; // Replace with an env variable in production

    let token = verifyToken(stored_token, SECRET_KEY);
    if (!token) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers }
      );
    }
    if (token.user_id !== userId) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 401, headers }
      );
    }
    return NextResponse.json({ token: token, user_id: userId }, { headers });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { country, lang } = await request.json();

    console.log("🍪 Setting server cookies:", { country, lang });

    const response = NextResponse.json({ success: true });

    // Set cookies with proper configuration
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 360 * 7 * 24 * 60 * 60, // 1 week
    };

    response.cookies.set("country", country.toLowerCase(), cookieOptions);
    response.cookies.set("lang", lang.toLowerCase(), cookieOptions);
    response.cookies.set("language", lang.toLowerCase(), cookieOptions);

    console.log("✅ Server cookies set successfully");
    return response;
  } catch (error) {
    console.error("❌ Error setting cookies:", error);
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    );
  }
}

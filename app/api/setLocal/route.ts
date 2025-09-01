import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET(request: NextRequest) {
  try {
    const country = request.headers.get("country")?.trim() || "sy";
    let language = request.headers.get("language")?.trim();
    const lang = request.headers.get("lang")?.trim();
    const cookieStore = cookies();
    if (country) cookieStore.set("country", country);
    if (lang) cookieStore.set("lang", lang);
    if (language) cookieStore.set("language", language);
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
    return response;
  } catch (error) {
    console.error("❌ Error setting cookies:", error);
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    );
  }
}

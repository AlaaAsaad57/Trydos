import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET(request: NextRequest) {
  try {
    const country = request.headers.get("country")?.trim() || "sy";
    let language = request.headers.get("language")?.trim();
    const lang = request.headers.get("lang")?.trim();
    const cookieOptions = {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false, // 1 week
    };
    const cookieStore = await cookies();
    if (country)
      cookieStore.set({
        name: "country",
        value: country,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false,
      });
    if (lang)
      cookieStore.set({
        name: "lang",
        value: lang,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false,
      });
    if (language)
      cookieStore.set({
        name: "language",
        value: language,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false,
      });

    const response = NextResponse.json({ success: true });

    // Set cookies with proper configuration

    return response;
  } catch (error) {
    console.error("❌ Error setting cookies:", error);
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    );
  }
}

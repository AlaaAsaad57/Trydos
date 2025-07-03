import { NextRequest, NextResponse } from "next/server";
import { AuthServerService } from "@/services/auth-server";

export async function POST(request: NextRequest) {
  try {
    const result = await AuthServerService.ensureGuestSession();

    return NextResponse.json({
      success: result.success,
      isNewUser: result.isNewUser,
      userData: result.userData,
      error: result.error,
    });
  } catch (error) {
    console.error("Guest session API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const hasValidSession = await AuthServerService.hasValidGuestSession();

    return NextResponse.json({
      hasValidSession,
    });
  } catch (error) {
    console.error("Guest session check API error:", error);
    return NextResponse.json(
      {
        hasValidSession: false,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "utils/server/tokenManager";
import { LogServerError } from "utils/serverErrorReporter";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    return NextResponse.json(currentUser, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    LogServerError({ error, type: "auth/me route error" });
    return NextResponse.json(
      { message: "Failed to get user data" },
      { status: 500 },
    );
  }
}

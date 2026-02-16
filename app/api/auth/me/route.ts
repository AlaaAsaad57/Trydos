import { NextResponse } from "next/server";
import { getCurrentUser } from "utils/server/tokenManager";
import { LogServerError } from "utils/serverErrorReporter";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    return NextResponse.json(currentUser, { status: 200 });
  } catch (error) {
    LogServerError({ error, type: "auth/me route error" });
    return NextResponse.json(
      { message: "Failed to get user data" },
      { status: 500 },
    );
  }
}

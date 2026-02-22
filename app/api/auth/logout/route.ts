import { NextResponse } from "next/server";
import {
  deleteSecureCookie,
  SECURE_COOKIE_NAMES,
} from "utils/server/tokenManager";
import { LogServerError } from "utils/serverErrorReporter";

export async function POST() {
  try {
    // Delete every secure cookie
    await Promise.all(
      SECURE_COOKIE_NAMES.map((name) => deleteSecureCookie(name)),
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    LogServerError({ error, type: "auth/logout route error" });
    return NextResponse.json({ message: "Failed to logout" }, { status: 500 });
  }
}

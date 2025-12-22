import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    throw new Error("Sentry test: server-side exception from /api/sentry-test");
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

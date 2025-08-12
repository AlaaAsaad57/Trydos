import { NextRequest, NextResponse } from "next/server";

import { headers } from "next/headers";
import Sentry from "sentry.config";

// Initialize Sentry for this API route

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: any;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  extra?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors } = body as { errors: ErrorInfo[] };

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Get request metadata
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const referer = headersList.get("referer") || "Unknown";
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "Unknown";

    // Process each error
    for (const errorInfo of errors) {
      // Create a synthetic error for Sentry
      const error = new Error(errorInfo.message);

      // Set the stack trace if available
      if (errorInfo.stack) {
        error.stack = errorInfo.stack;
      }

      // Configure Sentry scope
      if (process.env.NODE_ENV === "production") {
        Sentry.withScope((scope) => {
          // Set error level
          scope.setLevel("error");

          // Set tags
          scope.setTag("source", "client");
          scope.setTag("error.source", errorInfo.source || "unknown");

          // Set context
          scope.setContext("error_details", {
            componentStack: errorInfo.componentStack,
            source: errorInfo.source,
            lineno: errorInfo.lineno,
            colno: errorInfo.colno,
            timestamp: errorInfo.timestamp,
            url: errorInfo.url,
            originalError: errorInfo.error,
          });

          // Set user context
          scope.setContext("browser", {
            userAgent: errorInfo.userAgent || userAgent,
            ip: ip,
            referer: referer,
          });

          // Add extra data
          if (errorInfo.extra) {
            Object.entries(errorInfo.extra).forEach(([key, value]) => {
              scope.setExtra(key, value);
            });
          }

          // Add breadcrumb
          scope.addBreadcrumb({
            category: "client-error",
            message: errorInfo.message,
            level: "error",
            timestamp: errorInfo.timestamp
              ? new Date(errorInfo.timestamp).getTime() / 1000
              : undefined,
          });

          // Send to Sentry
          Sentry.captureException(error);
        });
        await Sentry.flush(2000);
      }
    }

    // Flush Sentry to ensure errors are sent

    return NextResponse.json(
      { success: true, processed: errors.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to process error report:", error);

    // Still try to capture this error to Sentry
    Sentry.captureException(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optionally handle GET requests for health checks
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "error-reporter",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

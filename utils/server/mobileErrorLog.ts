import { serializeUnknownForErrorLog } from "../errorSerialization";

// Server-side error-log POST. It lives in its own server-only module rather than
// in utils/serverErrorReporter.ts because that module is imported by client code
// (services/home.ts is "use client"), which would pull the backend base-URL
// reference into the client bundle and fail AC-4. It is reached only through a guarded dynamic
// import, so it must never be statically imported from client-reachable code.
//
// Reached exclusively via a guarded dynamic import from serverErrorReporter, so
// it never enters the client module graph.
//
// Best-effort: this must never throw. A failed log that rejected would become an
// unhandled rejection, which the global error listeners would then try to log in
// turn — a loop.
export async function postServerErrorLog(error: unknown) {
  try {
    const safeError = serializeUnknownForErrorLog(error ?? {});
    await fetch(process.env.BACKEND_URL /* TEMP TEST: was GO_BACKEND_URL — revert after testing */ + "/mobile_error_log/store", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: JSON.stringify({
        error_description: JSON.stringify({
          platform: "\u{1F6D1}WEB\u{1F6D1}",
          ...(typeof safeError === "object" &&
          safeError !== null &&
          !Array.isArray(safeError)
            ? (safeError as Record<string, unknown>)
            : { payload: safeError }),
        }),
      }),
    }).catch(() => {});
  } catch {
    // ignore - logging must be best-effort
  }
}

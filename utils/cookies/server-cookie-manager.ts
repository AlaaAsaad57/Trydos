// Server-side cookie reads. SERVER ONLY — this module imports `next/headers`,
// so importing it from a client component fails the build.
//
// Why it is its own file: `cookie-manager.ts` holds the cookie names and the
// browser helpers, so it is part of the client bundle. It used to reach the
// request reader through a bare `require("next/headers")` inside a `try`, which
// is the only reason that import could sit in a client-safe file. That trick
// had two costs: the reader was resolved once at module load and, whenever the
// `require` failed, EVERY server-side cookie read returned null with nothing but
// a console warning — a signed-in visitor silently looked like a guest. It also
// meant no test could reach these reads at all.
//
// Splitting the server half out lets it use a normal import.
import { cookies } from "next/headers";

import { deserialize } from "./cookie-manager";

/**
 * Read a cookie on the server, in a Server Component, Server Action or Route
 * Handler. JSON values come back parsed; plain strings come back as they are.
 *
 * Returns null when the cookie is absent, and also when there is no request to
 * read from (a static render, for example) — `cookies()` throws there, and a
 * missing cookie is the right answer for a request that does not exist.
 */
export async function getCookieServer<T = string>(
  name: string,
): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);

    if (!cookie?.value) return null;
    const decoded = decodeURIComponent(cookie.value);
    return deserialize<T>(decoded);
  } catch (error) {
    // Give the framework's own errors back to the framework before treating
    // this as a missing cookie.
    //
    // Under Cache Components, `cookies()` rejects during a prerender to say
    // "this part is dynamic, defer it to a request". Swallowing that and
    // answering null turns a deferral into a lie: the component renders as
    // though the visitor were a guest, and that guest markup can be baked into
    // the static shell for a page that is anything but static.
    //
    // Seen for real in the first build after the flag was enabled, which logged
    // "During prerendering, `cookies()` rejects when the prerender is complete"
    // at route /[lang]/settings — caught here, so the caller never learned the
    // render should have been deferred. unstable_rethrow re-throws exactly this
    // class (and notFound/redirect) and returns for everything else.
    if (isFrameworkControlFlow(error)) throw error;
    console.warn("Failed to get cookie from server:", error);
    return null;
  }
}

/**
 * Is this the framework steering the render, rather than a real failure?
 *
 * Next signals control flow by throwing: `notFound()`, `redirect()`, and — the
 * one that matters here — a rejection from `cookies()` during a prerender,
 * which means "this part is dynamic, defer it to a request". Every one of those
 * carries a `digest`. An ordinary failure does not.
 *
 * React's own postpone signal carries no digest, so it is checked separately.
 *
 * Why not `unstable_rethrow` from next/navigation, which exists for this: it
 * re-throws a plain `new Error("...")` as well, so using it would turn the
 * documented "no request to read from" case into a thrown error and break every
 * caller that relies on null. Measured, not assumed.
 */
function isFrameworkControlFlow(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (typeof (error as { digest?: unknown }).digest === "string") return true;
  return (
    (error as { $$typeof?: symbol }).$$typeof === Symbol.for("react.postpone")
  );
}

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
    console.warn("Failed to get cookie from server:", error);
    return null;
  }
}

// QA mode: the one way a request may ask to see QA data.
//
// Everything else in this feature hides QA rows. This is the single switch that
// turns that off, and it is deliberately narrow:
//
//  - It reads **one header**, `x-qa-view`, and compares it to `QA_VIEW_SECRET`.
//  - It is **off unless the secret is set and long enough**. An environment that
//    never sets `QA_VIEW_SECRET` — which must include the deployed staging app
//    — cannot be put into QA mode by anybody, whatever they send.
//  - It returns a plain boolean and touches nothing else. It sets no cookie,
//    writes no log line per request, and has no effect beyond the one query that
//    asks for it.
//
// **Import this by its full path only.** Never add it to a `utils/server`
// barrel: the barrel is pulled into the client graph by other modules, and a
// module that calls `next/headers` breaks the build when that happens.
//
// **It must never be reachable from a `"use cache"` tree.** Reading a request
// header inside a cached component is a build error in Next 16, and the cached
// home tree is scanned for exactly that (`tests/cache/`).

import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/** The header a test attaches. Lower case, because `Headers` is case-insensitive
 *  on read but this name is also written into a `page.route` handler. */
export const QA_VIEW_HEADER = "x-qa-view";

/** Below this length a secret is treated as unset.
 *
 *  32 characters is not a cryptographic threshold; it is a "somebody pasted a
 *  placeholder" threshold. `QA_VIEW_SECRET=test` must not open the catalogue. */
const MIN_SECRET_LENGTH = 32;

let warnedAboutSecret = false;

/** Say once, loudly, that QA mode is unavailable — and never print the value.
 *
 *  This exists because of how the failure looks otherwise. With no warning, a
 *  weak or missing secret shows up much later as the seed reporting "the index
 *  never caught up", which names the wrong cause and costs an afternoon. */
const warnOnce = (reason: string): void => {
  if (warnedAboutSecret) return;
  warnedAboutSecret = true;
  console.warn(
    `[qa-mode] QA mode is OFF: ${reason}. Every request will see the shopper-facing catalogue.`,
  );
};

/** Compare two secrets without leaking their length through timing.
 *
 *  Both sides are hashed first. `timingSafeEqual` throws `RangeError` when the
 *  two buffers differ in length, so handing it raw values of different lengths
 *  would turn a wrong header into a 500. Two SHA-256 digests are always 32
 *  bytes, so the comparison is total. */
const secretsMatch = (sent: string, expected: string): boolean => {
  const digest = (value: string): Buffer =>
    createHash("sha256").update(value, "utf8").digest();

  return timingSafeEqual(digest(sent), digest(expected));
};

/** Is this request allowed to see QA data?
 *
 *  Reads the request headers, so it may only be called from a Server Action,
 *  a Route Handler or an uncached Server Component. */
export const qaMode = async (): Promise<boolean> => {
  const expected = (process.env.QA_VIEW_SECRET ?? "").trim();

  if (!expected) {
    warnOnce("QA_VIEW_SECRET is not set");
    return false;
  }

  if (expected.length < MIN_SECRET_LENGTH) {
    warnOnce(
      `QA_VIEW_SECRET is shorter than ${MIN_SECRET_LENGTH} characters`,
    );
    return false;
  }

  let sent: string;
  try {
    sent = ((await headers()).get(QA_VIEW_HEADER) ?? "").trim();
  } catch {
    // No request headers here — a static render, or a context that has none.
    // That is never QA mode.
    return false;
  }

  if (!sent) return false;

  return secretsMatch(sent, expected);
};

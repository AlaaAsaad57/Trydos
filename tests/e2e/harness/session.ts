// The credential machinery: making a stored credential unusable, telling
// whether the stored pair changed, and recording which authentication requests
// a page made.
//
// **This lives in the harness and not in `actions/`, deliberately.** An action
// is a thing a visitor does. Overwriting a cookie and listening to traffic are
// neither — they are test plumbing, which is what this folder is for.
//
// ---------------------------------------------------------------------------
// The one rule this file exists to enforce
//
// **No credential value leaves this module, in any form.** Not the value, not a
// digest of it, not a length. `snapshotCredentials` keeps values inside an
// opaque object that refuses to serialise; `credentialsChangedSince` answers
// with two booleans; `spoilCredentials` reads the real cookie records to copy
// their attributes and hands back only names.
//
// The reason is the repository, not the values: it is public, so every line the
// browser suite prints on a failure is world-readable. Playwright's default
// reporter writes assertion output straight to the job log and that path is not
// masked, so an `expect` that receives a cookie record publishes the token in
// it. Keeping values inside this module means there is nothing to leak rather
// than something that must be remembered to be masked.
//
// ---------------------------------------------------------------------------
// The one permitted response-body reader
//
// `recordSignInOutcome` is the **only** thing in this file that reads a response
// body, and it is bounded on purpose. Everything else here watches request
// *paths* and nothing more.
//
// It exists because `/api/auth/me` cannot tell "the backend refused us" apart
// from "the backend answered with nothing" — both arrive as `null` — and the
// sign-in route already says which, and by name. Nothing else does.
//
// What keeps it safe, and what any future edit must preserve:
//
//   * it matches on `new URL(...).pathname` and keeps **no URL and no query
//     string** — the sign-in route is a `GET` whose query carries the live
//     one-time code, so a stored or printed URL is a published credential;
//   * it maps the body to a **closed set** of backend names and throws the rest
//     away unread. The body it reads carries the account's phone, e-mail and
//     name, and each failure entry carries the phone again plus whatever the
//     sub-backend put in its error — none of which may reach the log;
//   * it keeps no reference to the body or the response once it has mapped;
//   * a parse failure is swallowed rather than raised. Nothing awaits the
//     listener, so a throw would be an unhandled rejection, not a test failure —
//     and a parser message quotes the input it choked on, which would publish
//     the body prefix. The case reports the miss instead, through the next
//     point;
//   * it fails **closed**: never having seen the sign-in answer reads as "not
//     observed", never as "nothing failed".
//
// Do not add a second body reader here. If another one is ever truly needed, it
// gets the same five properties and its own paragraph in this list.

import { expect, type Page } from "@playwright/test";

/** The guest's working credential. */
export const ACCESS_COOKIE = "MARKET-TOKEN";
/** The credential that buys a new working one. */
export const REFRESH_COOKIE = "MARKET-REFRESH-TOKEN";

/** A value the backend will refuse.
 *
 *  **Keep the shape.** It is a well-formed JWT with a meaningless payload and a
 *  meaningless signature, and that shape is not decoration: the refusal was
 *  measured with exactly this shape, and the whole recovery is keyed on a 401.
 *  A value the backend cannot parse at all may come back as a bad request
 *  instead, which would exercise nothing while still looking green.
 *
 *  The payload segment decodes to `{"note":"not-a-real-credential","use":
 *  "e2e-test-only"}` so that anyone who finds this string and decodes it —
 *  a scanner triage, a reviewer, a future reader — is told immediately what it
 *  is.
 *
 *  **Never replace this with a captured token.** A real one would publish live
 *  claims in a public repository, and it would expire, which would turn a
 *  refusal we control into one we do not. */
const UNUSABLE_CREDENTIAL =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJub3RlIjoibm90LWEtcmVhbC1jcmVkZW50aWFsIiwidXNlIjoiZTJlLXRlc3Qtb25seSJ9" +
  ".000000000000000000000000000000000000000000";

/** Every attribute Playwright's cookie store round-trips.
 *
 *  Named explicitly rather than spread, because "copy the original's
 *  attributes" has to mean something checkable. Anything the API does not
 *  surface cannot be copied and cannot be asserted on — a real limit, recorded
 *  here rather than assumed away. */
const COPIED_ATTRIBUTES = [
  "domain",
  "path",
  "expires",
  "httpOnly",
  "secure",
  "sameSite",
] as const;

/** What a cookie looked like, with the value deliberately absent.
 *
 *  This is the only cookie-shaped thing this module ever returns. */
export type CookieShape = {
  name: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
};

/** The stored credentials at a moment in time.
 *
 *  The values are held privately and there is no getter. `toJSON` and
 *  `toString` are overridden so that printing one — in an assertion message, a
 *  `console.log`, a step title — produces a label rather than the credentials.
 *  Compare two of these with `credentialsChangedSince`. */
export type CredentialSnapshot = {
  readonly taken: true;
  toJSON(): string;
  toString(): string;
};

type SnapshotInternals = CredentialSnapshot & { readonly values: Map<string, string> };

/** Read the stored credentials into an opaque snapshot. */
export const snapshotCredentials = async (
  page: Page,
): Promise<CredentialSnapshot> => {
  const jar = await page.context().cookies();
  const values = new Map<string, string>();
  for (const cookie of jar) {
    if (cookie.name === ACCESS_COOKIE || cookie.name === REFRESH_COOKIE) {
      values.set(cookie.name, cookie.value);
    }
  }

  const snapshot: SnapshotInternals = {
    taken: true,
    values,
    toJSON: () => "[credential snapshot — values withheld]",
    toString: () => "[credential snapshot — values withheld]",
  };
  return snapshot;
};

/** Did each stored credential change since the snapshot?
 *
 *  Two booleans and nothing else. A credential that was absent then and present
 *  now counts as changed, which is what "the app replaced it" means here. */
export const credentialsChangedSince = async (
  page: Page,
  since: CredentialSnapshot,
): Promise<{ access: boolean; refresh: boolean }> => {
  const before = (since as SnapshotInternals).values;
  const after = (await snapshotCredentials(page)) as SnapshotInternals;

  const changed = (name: string): boolean =>
    (before.get(name) ?? "") !== (after.values.get(name) ?? "");

  return { access: changed(ACCESS_COOKIE), refresh: changed(REFRESH_COOKIE) };
};

/** Which of the two credentials the browser currently holds.
 *
 *  Names only — this is how a case asserts a guest "holds both" without any
 *  value reaching an assertion. */
export const credentialsHeld = async (page: Page): Promise<string[]> => {
  const jar = await page.context().cookies();
  return jar
    .map((cookie) => cookie.name)
    .filter((name) => name === ACCESS_COOKIE || name === REFRESH_COOKIE)
    .sort();
};

/** Make one or both stored credentials unusable.
 *
 *  Writes through the browser's own cookie store and nothing else. The app has
 *  a debug route that can set auth cookies from a request body; it is never
 *  used here, and nothing in this suite may depend on it.
 *
 *  Copies **every** attribute the cookie store exposes from the original, not
 *  just the domain and path. Dropping `httpOnly` would leave a
 *  credential-shaped cookie readable by page scripts, and dropping the domain
 *  or path would append a second cookie beside the real one instead of
 *  replacing it — which would let a case pass while the app still held a
 *  working credential.
 *
 *  Returns the shapes it wrote, with no values. */
export const spoilCredentials = async (
  page: Page,
  names: string[],
): Promise<CookieShape[]> => {
  const context = page.context();
  const before = await context.cookies();

  const written: CookieShape[] = [];

  for (const name of names) {
    const original = before.find((cookie) => cookie.name === name);
    expect(
      original,
      `cannot spoil ${name}: the browser is not holding it`,
    ).toBeTruthy();
    if (!original) continue;

    // Carry the original forward attribute by attribute, then swap only the
    // value. Building it this way — rather than spreading the record — is what
    // makes COPIED_ATTRIBUTES an honest list.
    const replacement: Record<string, unknown> = { name, value: UNUSABLE_CREDENTIAL };
    for (const attribute of COPIED_ATTRIBUTES) {
      replacement[attribute] = original[attribute];
    }

    await context.clearCookies({ name });
    await context.addCookies([replacement as never]);
  }

  // Prove the replacement replaced rather than joined. A mismatched attribute
  // produces two cookies of the same name, the real one still wins, and the
  // case would pass for entirely the wrong reason.
  const after = await context.cookies();
  for (const name of names) {
    const matches = after.filter((cookie) => cookie.name === name);
    expect(
      matches.length,
      `spoiling ${name} left ${matches.length} cookies of that name, not 1`,
    ).toBe(1);

    const original = before.find((cookie) => cookie.name === name);
    expect(matches[0].httpOnly, `${name} lost httpOnly when spoiled`).toBe(
      original?.httpOnly,
    );
    expect(matches[0].path, `${name} changed path when spoiled`).toBe(
      original?.path,
    );

    written.push({
      name: matches[0].name,
      domain: matches[0].domain,
      path: matches[0].path,
      httpOnly: matches[0].httpOnly,
      secure: matches[0].secure,
    });
  }

  return written;
};

// The only internal routes these cases care about. An exact match on the
// normalised path, never a substring or a regular expression: a loose match on
// a locale-prefixed address can capture a redirect target and quietly widen
// what is recorded.
const WATCHED_PATHS = new Set([
  "/api/auth/register-device",
  "/api/auth/refresh",
  "/api/auth/expire",
  "/api/auth/me",
  "/api/auth/update-user",
]);

export type AuthCallRecorder = {
  /** A position in the list, so a case can ask "since this moment". */
  mark(): number;
  /** Was this path called at or after `mark`? Never how many times — refusals
   *  in flight together share one exchange, so a count measures timing rather
   *  than behaviour. */
  sawSince(mark: number, path: string): boolean;
  /** Everything recorded, for a failure message. Paths only. */
  paths(): string[];
  /** Wait until a path is seen, or give up. Returns whether it arrived. */
  waitFor(path: string, timeoutMs: number): Promise<boolean>;
};

/** Record which authentication requests the page makes.
 *
 *  A passive listener. Deliberately **not** `page.route`, which would put the
 *  test process in front of every asset the page loads: it would slow the very
 *  page whose window is tight, and it would disturb the request coalescing that
 *  makes several simultaneous refusals share one exchange.
 *
 *  Filters at capture and keeps the path component only — never the full
 *  address, which carries the origin and the query string, and never headers or
 *  bodies, which carry the credential itself. */
export const recordAuthCalls = (page: Page): AuthCallRecorder => {
  const seen: string[] = [];

  page.on("request", (request) => {
    let pathname: string;
    try {
      pathname = new URL(request.url()).pathname;
    } catch {
      return;
    }
    if (!WATCHED_PATHS.has(pathname)) return;
    seen.push(pathname);
  });

  return {
    mark: () => seen.length,
    sawSince: (mark, path) => seen.slice(mark).includes(path),
    paths: () => [...seen],
    waitFor: async (path, timeoutMs) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (seen.includes(path)) return true;
        await page.waitForTimeout(200);
      }
      return seen.includes(path);
    },
  };
};

// ---------------------------------------------------------------------------
// The sign-in outcome recorder — see "The one permitted response-body reader"
// at the top of this file before changing anything below.
// ---------------------------------------------------------------------------

/** The path the sign-in answer arrives on. */
const SIGN_IN_PATH = "/api/auth/login";

/** The backends a sign-in fans out to, besides the storefront itself.
 *
 *  This is a **closed** set. The sign-in route labels each failed sub-service
 *  with one of these, and anything that is not one of them is dropped rather
 *  than repeated — a label is a value the server chose, and this suite does not
 *  print server-chosen text into a public log. */
const KNOWN_BACKENDS = ["CHAT", "STORIES", "COMMENTS", "WALLET"] as const;

export type BackendName = (typeof KNOWN_BACKENDS)[number];

/** What a label maps to. Nothing else can come out of this recorder. */
export type SignInLabel = BackendName | "unrecognised backend label";

export type SignInOutcome =
  | { observed: false }
  | { observed: true; failed: SignInLabel[] };

export type SignInOutcomeRecorder = {
  /** What the app said about its own sign-in.
   *
   *  `observed: false` means the answer was never seen — which is a failure for
   *  the case to report, never "nothing went wrong". */
  outcome(): SignInOutcome;
  /** Did the app name this backend as failed? False when nothing was observed,
   *  so callers must check `observed` first. */
  named(backend: BackendName): boolean;
  /** Wait until the sign-in answer has been seen. Returns whether it arrived. */
  waitForOutcome(timeoutMs: number): Promise<boolean>;
};

/** Read the labels the sign-in answer carries, and nothing else.
 *
 *  Attach before the sign-in starts. */
export const recordSignInOutcome = (page: Page): SignInOutcomeRecorder => {
  let outcome: SignInOutcome = { observed: false };

  const mapLabels = (body: unknown): SignInLabel[] => {
    const failures = (body as { is_failed?: unknown })?.is_failed;
    if (!Array.isArray(failures)) return [];

    // Read one field per entry, map it, drop everything else. The entries also
    // carry the account's phone and id, and the sub-backend's own error body.
    return failures.map((entry): SignInLabel => {
      const label = (entry as { endpoint?: unknown })?.endpoint;
      return KNOWN_BACKENDS.includes(label as BackendName)
        ? (label as BackendName)
        : "unrecognised backend label";
    });
  };

  page.on("response", (response) => {
    let pathname: string;
    try {
      // Path only. Never `response.url()` — the sign-in query carries the code.
      pathname = new URL(response.url()).pathname;
    } catch {
      return;
    }
    if (pathname !== SIGN_IN_PATH) return;

    void response
      .json()
      .then((body) => {
        outcome = { observed: true, failed: mapLabels(body) };
      })
      .catch(() => {
        // Swallowed on purpose, and it must stay swallowed.
        //
        // Nothing awaits this listener, so throwing here would be an unhandled
        // rejection rather than a test failure — and the parser's own message
        // quotes the input it choked on, which is the body this reader exists to
        // keep out of the log.
        //
        // Leaving `outcome` untouched is the fail-closed answer the design wants:
        // it stays `observed: false`, and the case reports that the sign-in
        // answer was never read instead of concluding that nothing failed.
      });
  });

  return {
    outcome: () => outcome,
    named: (backend) => outcome.observed && outcome.failed.includes(backend),
    waitForOutcome: async (timeoutMs) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (outcome.observed) return true;
        await page.waitForTimeout(200);
      }
      return outcome.observed;
    },
  };
};

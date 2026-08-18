// The cookie jar, and the `fetch` that uses it.
//
// Node has no cookie store. The app's client code sends `credentials: "include"`
// on every call, which in a browser means "attach the cookies for this origin and
// keep whatever comes back" — and in Node means nothing at all. Without a jar,
// every request the suite makes is a request from a browser with no cookies: the
// guest token is minted and thrown away, and no session can survive one call.
//
// **One jar is one identity.** Two jars is two people, which is what the chat
// phases need — shopper A and shopper B talking to each other on the same server.
//
// Two deliberate divergences from a browser, both of which matter:
//
//   * **`Secure` is ignored.** The app sets its token cookies with
//     `secure: NODE_ENV === "production"`, and the harness runs a production
//     build, so every token cookie arrives marked `Secure` over plain
//     `http://127.0.0.1`. A browser would refuse to store them and no live test
//     could ever hold a session. This jar stores them, because it is not a
//     browser and the transport is a loopback socket.
//   * **Cookies never leave the test server's origin.** A request to any other
//     host — a media server, a backend called directly, the fleet product — is
//     sent with no `Cookie` header at all, and its `Set-Cookie` is dropped. A jar
//     that leaked the session token to a third-party host would be a real
//     vulnerability in the test suite itself.

import { LIVE_ORIGIN } from "./env";

// The real `fetch`, captured before anything installs a wrapper over the global.
// Every call below goes through this, so installing the wrapper cannot recurse.
const baseFetch: typeof fetch = globalThis.fetch.bind(globalThis);

/** Split one `Set-Cookie` value into its pair and its attributes. */
const parseSetCookie = (
  raw: string,
): { name: string; value: string; attributes: string[] } | null => {
  const parts = raw.split(";");
  const pair = parts[0] ?? "";
  const equals = pair.indexOf("=");
  if (equals < 1) return null;

  return {
    name: pair.slice(0, equals).trim(),
    value: pair.slice(equals + 1).trim(),
    attributes: parts.slice(1),
  };
};

/** Is this `Set-Cookie` a deletion rather than a value?
 *
 *  Three spellings, all of which the app uses somewhere: an empty value, a
 *  non-positive `Max-Age`, and an `Expires` in the past. Reading a deletion as a
 *  value is how a logout test ends up passing while the session is still alive. */
const isRemoval = (value: string, attributes: string[]): boolean => {
  if (value === "") return true;

  for (const attribute of attributes) {
    const equals = attribute.indexOf("=");
    const name = (equals < 0 ? attribute : attribute.slice(0, equals))
      .trim()
      .toLowerCase();
    const attributeValue = equals < 0 ? "" : attribute.slice(equals + 1).trim();

    if (name === "max-age") {
      const seconds = Number(attributeValue);
      if (!Number.isNaN(seconds) && seconds <= 0) return true;
    }

    if (name === "expires") {
      const when = Date.parse(attributeValue);
      if (!Number.isNaN(when) && when <= Date.now()) return true;
    }
  }

  return false;
};

/** One identity's cookies.
 *
 *  Keyed by name only — no domain, no path. The suite talks to exactly one origin
 *  and every cookie the app sets is `path: "/"`, so the extra bookkeeping would
 *  buy nothing and would be one more thing to get wrong. */
export class CookieJar {
  /** A name for the identity, used in messages. Never a secret. */
  readonly label: string;

  private readonly store = new Map<string, string>();

  constructor(label = "anonymous") {
    this.label = label;
  }

  /** The `Cookie` header for the next request, or `""` when the jar is empty. */
  header(): string {
    return [...this.store.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  /** Take every `Set-Cookie` off a response. Returns the names that changed.
   *
   *  The returned names are what a refresh assertion reads: "both cookie values
   *  changed, not just one" is the whole point of the phase 3 rotation test. */
  ingest(response: Response): string[] {
    const changed: string[] = [];

    for (const raw of readSetCookies(response)) {
      const parsed = parseSetCookie(raw);
      if (!parsed) continue;

      const { name, value, attributes } = parsed;

      if (isRemoval(value, attributes)) {
        if (this.store.delete(name)) changed.push(name);
        continue;
      }

      if (this.store.get(name) !== value) changed.push(name);
      this.store.set(name, value);
    }

    return changed;
  }

  get(name: string): string | undefined {
    return this.store.get(name);
  }

  has(name: string): boolean {
    return this.store.has(name);
  }

  /** Every cookie name currently held. Names are safe to print; values are not. */
  names(): string[] {
    return [...this.store.keys()].sort();
  }

  /** Plant a value. The forced-expiry helper in phase 3 needs this. */
  set(name: string, value: string): void {
    this.store.set(name, value);
  }

  remove(name: string): void {
    this.store.delete(name);
  }

  clear(): void {
    this.store.clear();
  }
}

/** Read the `Set-Cookie` values off a response, one per header.
 *
 *  `getSetCookie()` is the only correct way: `headers.get("set-cookie")` joins
 *  them with ", " and a cookie's own `Expires` attribute contains a comma, so the
 *  joined form cannot be split apart again. The fallback exists only so an older
 *  runtime degrades to something rather than crashing. */
const readSetCookies = (response: Response): string[] => {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();

  const single = headers.get("set-cookie");
  return single ? [single] : [];
};

/** A `fetch` bound to one jar.
 *
 *  Also resolves relative URLs, which is what lets the app's own client code run
 *  unchanged: `utils/fetchData.ts` calls `fetch("/api/proxy")`, and a bare path
 *  is a parse error in Node. Here it resolves against the test server. */
export const jarFetch =
  (jar: CookieJar) =>
  async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input), LIVE_ORIGIN);
    const sameOrigin = url.origin === LIVE_ORIGIN;

    const headers = new Headers(init.headers);

    if (sameOrigin) {
      const cookie = jar.header();
      if (cookie) headers.set("cookie", cookie);
    } else {
      // Never send this identity's cookies off the test server. See the header
      // comment: this is the jar's one security rule.
      headers.delete("cookie");
    }

    const response = await baseFetch(url, {
      ...init,
      headers,
      // Manual by default. Following a redirect here would swallow the hop's
      // `Set-Cookie` and hide the status code — and phase 13 asserts on the
      // status code of a locale redirect. A caller that wants the browser
      // behaviour passes `redirect: "follow"` explicitly.
      redirect: init.redirect ?? "manual",
    });

    if (sameOrigin) jar.ingest(response);

    return response;
  };

/** Install a jar-bound `fetch` as the global one, and return the undo.
 *
 *  Needed only by tests that drive the app's own client code, which calls the
 *  global `fetch` itself. A test that makes its own requests should use
 *  `jarFetch(jar)` directly instead — an explicit dependency beats a global. */
export const useJarFetch = (jar: CookieJar): (() => void) => {
  const previous = globalThis.fetch;
  globalThis.fetch = jarFetch(jar) as unknown as typeof fetch;
  return () => {
    globalThis.fetch = previous;
  };
};

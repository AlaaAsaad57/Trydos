/**
 * The login page, `/[lang]/login` (D-11 in UI-MIGRATION-PLAN.md), and the way
 * back from it (A-20).
 *
 * A page that needs a signed-in shopper sends them to the login page with its
 * own path in `?next=`. After the login (or "Later", or the close button) the
 * login page goes back to that path.
 *
 * `next` comes from the URL, so anyone can write it. It is only followed when
 * it is a path on this site; anything else (another host, a scheme, a
 * protocol-relative `//host`) goes to the home page instead. Without this check
 * the login page would be an open redirect: a link to our login that ends on a
 * stranger's page after the shopper has signed in.
 */

/** The query key that carries the page to go back to. */
export const LOGIN_RETURN_PARAM = "next";

/** The login page of a locale segment, e.g. `/sy-en/login`. */
export const loginPath = (lang: string) => `/${lang}/login`;

/** The login page with the way back to `next` (a path on this site). */
export function loginHref(lang: string, next?: string): string {
  if (!next) return loginPath(lang);
  return `${loginPath(lang)}?${LOGIN_RETURN_PARAM}=${encodeURIComponent(next)}`;
}

/** A host that cannot be ours, to resolve a path against and see if it stays. */
const PROBE_ORIGIN = "https://return-path.invalid";

/**
 * The page to go back to: `raw` when it is a path on this site, else the home
 * page of `lang`. The login page itself is never a way back.
 */
export function safeReturnPath(raw: string | null | undefined, lang: string): string {
  const home = `/${lang}`;
  if (!raw) return home;
  // One leading slash only: `//host` and `/\host` are other hosts to a browser.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return home;
  // Backslashes and control characters are read as `/` or dropped by browsers,
  // which can turn a harmless-looking path into another host.
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return home;
  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return home;
  }
  if (url.origin !== PROBE_ORIGIN) return home;
  // Back to the login page would be a loop.
  if (/^\/[^/]+\/login\/?$/.test(url.pathname)) return home;
  return `${url.pathname}${url.search}${url.hash}`;
}

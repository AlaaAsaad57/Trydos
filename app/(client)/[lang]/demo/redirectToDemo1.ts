import { redirect } from "next/navigation";
import { lang as langParam } from "next/root-params";

/*
  /demo is turned off: every /demo page sends the browser to the same screen
  on /demo1, the fluid demo. The path and the query are kept, so
  /demo/settings/wallet goes to /demo1/settings/wallet and /demo?search to
  /demo1?search.

  The redirect sits in the page and not in generateMetadata: the page is the
  last thing that still blocks the response, so the browser gets a real 307.
  The /demo layout no longer draws the demo shell, because the shell draws
  each screen from the URL and never renders the page under it.

  To turn /demo on again, take the redirect out of the pages and give the
  layout its shell back (see git history).
*/

type Search = Record<string, string | string[] | undefined>;

/** The query as /demo1 writes it: a key with no value has no `=`, as in `?search`. */
function queryOf(search: Search) {
  return Object.entries(search)
    .flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value ?? ""]).map((one) =>
        one
          ? `${encodeURIComponent(key)}=${encodeURIComponent(one)}`
          : encodeURIComponent(key),
      ),
    )
    .join("&");
}

/** Sends the browser to `path` under /demo1 (no leading slash; "" for the home screen). */
export async function redirectToDemo1(
  path: string,
  searchParams: Promise<Search>,
): Promise<never> {
  const [locale, search] = await Promise.all([langParam(), searchParams]);
  const query = queryOf(search);
  redirect(
    `/${locale}/demo1${path ? `/${path}` : ""}${query ? `?${query}` : ""}`,
  );
}

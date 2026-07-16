/**
 * If a legacy listing URL carries search as a path pair (`.../search/<value>`),
 * return the equivalent URL with search moved to `?search=<value>` and the pair
 * stripped from the path (all other path filters + existing query params kept).
 * Returns null when there is no path search pair to migrate.
 *
 * Part of the listing search → ?search= refactor: `?search=` is the single
 * source of truth; page components 308-redirect the legacy form to it.
 */
export function buildSearchRedirectTarget(
  lang: string,
  routeBase: "filters" | "featured" | "flashDeals",
  filterParams: string[] | undefined,
  existingSearch: Record<string, string | string[] | undefined>,
): string | null {
  const segs = filterParams ?? [];
  const i = segs.indexOf("search");
  if (i === -1 || i + 1 >= segs.length) return null;

  const rawValue = segs[i + 1];
  let value = rawValue;
  try {
    value = decodeURIComponent(rawValue);
  } catch {
    /* keep raw */
  }

  const remaining = [...segs.slice(0, i), ...segs.slice(i + 2)];
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(existingSearch)) {
    if (k === "search") continue;
    if (typeof v === "string") params.set(k, v);
    else if (Array.isArray(v) && v.length) params.set(k, v[0]);
  }
  if (value && value.length > 0) params.set("search", value);

  const path = `/${lang}/${routeBase}${
    remaining.length ? `/${remaining.join("/")}` : ""
  }`;
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

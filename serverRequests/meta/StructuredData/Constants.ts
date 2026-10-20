// The site origin behind every canonical, hreflang, sitemap, robots and
// JSON-LD URL. It comes from the environment only, never from a hardcoded
// domain:
//   1. `NEXT_PUBLIC_SITE_URL` — the production setting (Part C of the
//      readiness docs);
//   2. `VERCEL_PROJECT_PRODUCTION_URL` — the production domain Vercel gives
//      every deployment of the project, previews included;
//   3. localhost — a local run with neither.
// An empty string is treated as unset: `new URL("")` in the layout's
// `metadataBase` would throw on every page.
const siteOrigin = () => {
  const set = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (set) return set;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
};

export const General_Site_Data = {
  url: siteOrigin(),
  og: "/opengraph-image.png",
  name: "TryDos",
  // Official social profiles feed schema.org `sameAs` (Organization). Set the env vars to the
  // verified Trydos handles in production; the branded fallbacks below are sensible defaults.
  facebookPage:
    process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/trydos",
  instagranPage:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/trydos",
};

export const General_Site_Data = {
  // Canonical site origin. Set NEXT_PUBLIC_SITE_URL to the production domain in the
  // production environment; falls back to the dev domain locally / on preview builds.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://trydos.ramaaz.dev",
  og: "/opengraph-image.png",
  name: "TryDos",
  // Official social profiles feed schema.org `sameAs` (Organization). Set the env vars to the
  // verified Trydos handles in production; the branded fallbacks below are sensible defaults.
  facebookPage:
    process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/trydos",
  instagranPage:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/trydos",
};

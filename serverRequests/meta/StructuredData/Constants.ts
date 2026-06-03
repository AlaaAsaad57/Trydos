export const General_Site_Data = {
  // Canonical site origin. Set NEXT_PUBLIC_SITE_URL to the production domain in the
  // production environment; falls back to the dev domain locally / on preview builds.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.trydos.com",
  og: "/opengraph-image.png",
  name: "TryDos",
  facebookPage: "https://facebook.com/",
  instagranPage: "https://instagram.com/",
};

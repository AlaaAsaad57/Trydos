export const languages = ["en", "ar", "tr", "ku"];
export const countries = ["sy", "tr", "iq", "lb"];
export const locale = countries.flatMap((country) =>
  languages.map((lang) => `${country}-${lang}`)
);
export const site_url = "https://trydos.com";
export const site_og = "/opengraph-image.png";

export const languages = ["en", "ar", "tr", "ku"];
export const countries = ["sy", "tr", "iq", "lb"];
export const locale = countries.flatMap((country) =>
  languages.map((lang) => `${country}-${lang}`)
);
export const site_url = "https://trydos.com";
export const site_og = "/opengraph-image.png";
export const generateCodeCurrency = (code: string) => {
  if (code?.toLowerCase() === "sp") {
    return "SYP";
  } else {
    return code.toUpperCase();
  }
};

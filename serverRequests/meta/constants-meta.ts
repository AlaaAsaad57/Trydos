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

// translations/metadata.ts
export const trydosTranslations = {
  en: {
    siteName: "Trydos",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `Explore the best ${title} products on Trydos. Filter by brand, color, and size with fast shipping.`,
  },
  ar: {
    siteName: "ترايدوس",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `اكتشف أفضل منتجات ${title} على ترايدوس. تصفح حسب الماركة، اللون، والقياس مع خدمة شحن سريع.`,
  },
  tr: {
    siteName: "Trydos",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `Trydos'taki en iyi ${title} ürünlerini keşfedin. Marka, renk ve bedene göre filtreleyin, hızlı kargo ile sahip olun.`,
  },
  ku: {
    siteName: "Trydos",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `باشترین کاڵاکانی ${title} لە ترايدوس ببینە. بەپێی مارکە، ڕەنگ و قەبارە بپشکنە لەگەڵ گەیاندنی خێرا.`,
  },
};

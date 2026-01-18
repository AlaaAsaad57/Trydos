const languages = ["en", "ar", "tr", "ku"];
const countries = ["sy", "tr", "iq", "lb"];
const locale = countries.flatMap((country) =>
  languages.map((lang) => `${country}-${lang}`),
);

// translations/metadata.ts
export const trydosTranslations = {
  en: {
    siteName: "Trydos",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `Explore the best ${title} products on Trydos. Filter by brand, color, and size with fast shipping.`,
    home: {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      categoryTitle: (category) => `${category} - Trydos`,
    },
  },
  ar: {
    siteName: "ترايدوس",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `اكتشف أفضل منتجات ${title} على ترايدوس. تصفح حسب الماركة، اللون، والقياس مع خدمة شحن سريع.`,
    home: {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      categoryTitle: (category) => `${category} - ترايدوس`,
    },
  },
  tr: {
    siteName: "Trydos",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `Trydos'taki en iyi ${title} ürünlerini keşfedin. Marka, renk ve bedene göre filtreleyin, hızlı kargo ile sahip olun.`,
    home: {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      categoryTitle: (category) => `${category} - Trydos`,
    },
  },
  ku: {
    siteName: "Trydos",
    // ... الترجمات السابقة
    listingDesc: (title) =>
      `باشترین کاڵاکانی ${title} لە ترايدوس ببینە. بەپێی مارکە، ڕەنگ و قەبارە بپشکنە لەگەڵ گەیاندنی خێرا.`,
    home: {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      categoryTitle: (category) => `${category} - Trydos`,
    },
  },
};

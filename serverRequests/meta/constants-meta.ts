const languages = ["en", "ar", "tr", "ku"];
const countries = ["sy", "tr", "iq", "lb"];
const locale = countries.flatMap((country) =>
  languages.map((lang) => `${country}-${lang}`),
);

// translations/metadata.ts
export const trydosTranslations = {
  en: {
    siteName: "Trydos",
    Categories: "Categories",
    Featured_Products: "Featured Products",
    flash_products: "Flash Products",
    Boutiques: "Boutiques",

    listingDesc: (title) =>
      `Explore the best ${title} products on Trydos. Filter by brand, color, and size with fast shipping.`,
    home: {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      categoryTitle: (category) => `${category} - Trydos`,
      getBoutiqueCategories: (boutique) => `${boutique} Categories `,
    },
  },
  ar: {
    siteName: "ترايدوس",
    Categories: "Categories",
    Featured_Products: "Featured Products",
    Boutiques: "Boutiques",
    flash_products: "Flash Products",
    listingDesc: (title) =>
      `اكتشف أفضل منتجات ${title} على ترايدوس. تصفح حسب الماركة، اللون، والقياس مع خدمة شحن سريع.`,
    home: {
      title: "ترايدوس - تجربة تسوق مميزة",
      description:
        "اكتشف المنتجات المميزة في ترايدوس - وجهتك الأمثل للتسوق مع المنتجات المميزة والعروض السريعة ومجموعات البوتيك.",
      categoryTitle: (category) => `${category} - ترايدوس`,
      getBoutiqueCategories: (boutique) => `${boutique} اصناف`,
    },
  },
  tr: {
    siteName: "Trydos",
    Categories: "Categories",
    Featured_Products: "Featured Products",
    Boutiques: "Boutiques",
    flash_products: "Flash Products",
    listingDesc: (title) =>
      `Trydos'taki en iyi ${title} ürünlerini keşfedin. Marka, renk ve bedene göre filtreleyin, hızlı kargo ile sahip olun.`,
    home: {
      title: "TryDos - Premium Alışveriş Deneyimi",
      description:
        "TryDos'ta premium ürünleri keşfedin - Öne çıkan ürünler, hızlı fırsatlar ve butik koleksiyonlarla nihai alışveriş hedefiniz.",
      categoryTitle: (category) => `${category} - Trydos`,
      getBoutiqueCategories: (boutique) => `${boutique} Kategorileri`,
    },
  },
  ku: {
    siteName: "Trydos",
    Categories: "Categories",
    Featured_Products: "Featured Products",
    Boutiques: "Boutiques",
    flash_products: "Flash Products",
    listingDesc: (title) =>
      `باشترین کاڵاکانی ${title} لە ترايدوس ببینە. بەپێی مارکە، ڕەنگ و قەبارە بپشکنە لەگەڵ گەیاندنی خێرا.`,
    home: {
      title: "TryDos - تجربەی کڕینی پێشکەوتوو",
      description:
        "لە TryDos بەرهەمە تایبەتییەکان بدۆزەوە — شوێنی باشترین بۆ کڕین بە بەرهەمە تایبەتیەکان، دیلە فلاش و کۆمەڵە بوتیک.",
      categoryTitle: (category) => `${category} - Trydos`,
      getBoutiqueCategories: (boutique) => `${boutique} هاوپۆلەکان`,
    },
  },
};

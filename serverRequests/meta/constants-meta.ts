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
    homeTitle: "Trydos | Exclusive Boutiques & Daily Flash Deals",
    homeDesc: (count) =>
      `Explore ${count}+ curated boutiques on Trydos. Shop the latest fashion and featured products with fast shipping.`,
    categoryTitle: (cat, count) => `Best ${cat} Boutiques (${count}) | Trydos`,
  },
  ar: {
    homeTitle: "ترايدوس | بوتيكات حصرية وعروض فلاش يومية",
    homeDesc: (count) =>
      `اكتشف أكثر من ${count} بوتيك منسق على ترايدوس. تسوق أحدث الأزياء والمنتجات المميزة مع شحن سريع.`,
    categoryTitle: (cat, count) => `أفضل بوتيكات ${cat} (${count}) | ترايدوس`,
  },
  tr: {
    homeTitle: "Trydos | Özel Butikler ve Günlük Flaş Fırsatlar",
    homeDesc: (count) =>
      `Trydos'ta ${count}+ seçkin butiği keşfedin. En yeni moda ve öne çıkan ürünleri hızlı kargo ile satın alın.`,
    categoryTitle: (cat, count) =>
      `En İyi ${cat} Butikleri (${count}) | Trydos`,
  },
  ckb: {
    // Kurdish Sorani
    homeTitle: "Trydos | بووتیکە تایبەتەکان و داشکاندنی ڕۆژانە",
    homeDesc: (count) =>
      `زیاتر لە ${count} بووتیکی هەڵبژێردراو لە ترايدوس ببینە. نوێترین مۆدێل و کاڵا ناوازەکان بکڕە بە گەیاندنی خێرا.`,
    categoryTitle: (cat, count) =>
      `باشترین بووتیکەکانی ${cat} (${count}) | Trydos`,
  },
};

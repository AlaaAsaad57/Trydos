import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lang as langParam } from "next/root-params";
import {
  DEMO_STORES,
  listingPage,
  productById,
  storeBySlug,
} from "components/DemoApp/demoStores";
import {
  PRODUCT_STATS,
  galleryOf,
  titleWords,
} from "components/DemoApp/demoProduct";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { translateFunction } from "utils/server";

/*
  A product's page in the demo: /[lang]/demo/store/<slug>/<product id>
  (XD `Home Page – 49`).

  The demo shell draws the page itself, from the URL (components/DemoApp1/
  screens/ProductScreen.tsx), so a tap on a card on the store's page opens it
  at once and the URL follows. This file gives the same URL what a search
  engine reads:

   - a title, a description, a canonical URL and Open Graph tags;
   - JSON-LD: the product, its photos, its price, its brand and its rating;
   - static params for the products of each store's first page (the ones in
     the store page's first HTML). The others are built on their first visit.

  The /demo layout keeps `robots: noindex` for the whole demo, as on the
  store page.

  Instant validation is off, as on the other demo pages (see demo/page.tsx).
*/
export const instant = false;

export function generateStaticParams() {
  return DEMO_STORES.flatMap((store) =>
    listingPage(1).map((product) => ({ store: store.slug, product: product.id })),
  );
}

const languageOf = (locale: string) => locale.split("-")[1] || "en";

type Params = Promise<{ store: string; product: string }>;

async function pageOf(params: Params) {
  const { store: slug, product: id } = await params;
  const store = storeBySlug(slug);
  const product = productById(id);
  if (!store || !product) return null;
  const locale = await langParam();
  const language = languageOf(locale);
  const color = product.colors[product.selected];
  const name = `${store.name} ${titleWords(product, color)
    .map((word) => translateFunction(word, language))
    .join(" . ")}`;
  const description = translateFunction(
    "Stay cool and chic in this airy women’s summer top, featuring a comfortable fit and fresh seasonal prints",
    language,
  );
  const path = `/${locale}/demo/store/${store.slug}/${product.id}`;
  return { store, product, name, description, path, photos: galleryOf(product, product.selected) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await pageOf(params);
  if (!page) return {};
  const { name, description, path, photos } = page;
  return {
    title: `${name} | Trydos`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${name} | Trydos`,
      description,
      url: path,
      images: [{ url: photos[0], width: 642, height: 933, alt: name }],
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const page = await pageOf(params);
  if (!page) notFound();
  const { store, product, name, description, path, photos } = page;
  const site = General_Site_Data.url.replace(/\/$/, "");
  const url = `${site}${path}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    description,
    url,
    image: photos.map((photo) => `${site}${photo}`),
    brand: { "@type": "Brand", name: store.name },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: PRODUCT_STATS.stars,
      bestRating: 5,
      ratingCount: PRODUCT_STATS.raters,
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
      url,
      seller: { "@type": "Store", name: store.name, url: `${site}${path.replace(/\/[^/]+$/, "")}` },
    },
  };

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so no text in the data can close the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\u003c"),
      }}
    />
  );
}

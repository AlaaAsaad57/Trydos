import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lang as langParam } from "next/root-params";
import {
  DEMO_STORES,
  LISTING_PRODUCTS,
  listingPage,
  storeBySlug,
} from "components/DemoApp/demoStores";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { translateFunction } from "utils/server";

/*
  A store's page in the demo: /[lang]/demo/store/<slug> (XD `Home Page – 47`).

  The demo shell draws the page itself, from the URL (components/DemoApp1/
  screens/ListingScreen.tsx), so a tap on a card opens it at once and the URL
  follows. This file gives the same URL what a search engine reads:

   - a title, a description, a canonical URL and Open Graph tags, per store;
   - JSON-LD: the store, and the products of the first page (the ones in the
     first HTML) with their prices. `numberOfItems` gives the full count;
     the other pages load as the person scrolls (see ListingScreen);
   - static params for every store, so each page is built ahead of time and
     its tags are in the first HTML, not streamed in later.

  The /demo layout keeps `robots: noindex` for the whole demo. That is on
  purpose while it is a demo; the tags here are ready for the day it is not.

  Instant validation is off, as on the other demo pages (see demo/page.tsx).
*/
export const instant = false;

export function generateStaticParams() {
  return DEMO_STORES.map((store) => ({ store: store.slug }));
}

const languageOf = (locale: string) => locale.split("-")[1] || "en";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string }>;
}): Promise<Metadata> {
  const { store: slug } = await params;
  const store = storeBySlug(slug);
  if (!store) return {};
  const locale = await langParam();
  const language = languageOf(locale);
  const description = translateFunction(
    "Shop {brand} collection now !",
    language,
  ).replace("{brand}", store.name);
  const path = `/${locale}/demo/store/${store.slug}`;
  const image = LISTING_PRODUCTS[0].image;
  return {
    title: `${store.name} | Trydos`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${store.name} | Trydos`,
      description,
      url: path,
      images: [{ url: image, width: 642, height: 933, alt: store.name }],
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = storeBySlug(slug);
  if (!store) notFound();

  const locale = await langParam();
  const language = languageOf(locale);
  const site = General_Site_Data.url.replace(/\/$/, "");
  const url = `${site}/${locale}/demo/store/${store.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Store",
        "@id": `${url}#store`,
        name: store.name,
        url,
        ...(store.logo ? { logo: `${site}${store.logo.src}` } : {}),
      },
      {
        "@type": "ItemList",
        name: store.name,
        url,
        numberOfItems: LISTING_PRODUCTS.length,
        itemListElement: listingPage(1).map((product, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: `${store.name} ${product.name
              .map((word) => translateFunction(word, language))
              .join(" . ")}`,
            image: `${site}${product.image}`,
            brand: { "@type": "Brand", name: store.name },
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: product.currency,
              availability: "https://schema.org/InStock",
              seller: { "@id": `${url}#store` },
            },
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so no text in the data can close the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

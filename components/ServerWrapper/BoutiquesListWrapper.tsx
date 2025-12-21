import OfferListServer from "components/Server/OfferListServer";
import RecomendedProducts from "components/Server/RecomendedProducts";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import { api } from "lib/eden";
import { Suspense } from "react";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";

export async function BoutiquesListWrapper({
  params,
  currency: currencyData,
  mainCategory = null,
}) {
  const [country, language] = params.lang.split("-");
  let query: any = { limit: 10, offset: null };

  if (mainCategory) {
    query.category_slugs = JSON.stringify([mainCategory]);
  }
  let response = await api.home.boutiques.get({
    headers: { country: country, language: language },
    query: query,
    fetch: {
      next: {
        revalidate: 60,
      },
    },
  });
  // @ts-ignore
  let data: any = response.data.data ?? {};

  return (
    <OfferListServer boutiquesData={{ ...(data ?? {}) }} params={params}>
      {!mainCategory ? (
        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <RecomendedProductWrapper
            lang={params.lang}
            currency={currencyData}
          />
        </Suspense>
      ) : (
        <></>
      )}
    </OfferListServer>
  );
}

async function RecomendedProductWrapper({
  lang,
  currency: currencyData,
}): Promise<JSX.Element> {
  const [country, language] = lang.split("-");
  const userId = ((await getCookieServer(COOKIE_NAMES.USER_DATA)) as any)?.id;
  let response = await api.products.recomended.get({
    headers: { language, country },
    fetch: {
      next: {
        revalidate: 60,
      },
    },
    query: {
      limit: 7,
      offset: null,
    },
  });
  return (
    <RecomendedProducts
      InitialProducts={(response.data as any).data.products}
      userId={userId}
      InitialOffset={(response.data as any).data.offset}
      lang={lang}
      currencyData={currencyData}
    />
  );
}

import OfferListServer from "components/Server/OfferListServer";
import { GetHomeBoutiques } from "serverRequests/home";

export async function BoutiquesListWrapper({
  params,
  mainCategory = null,
  children = null,
}: any) {
  const [country, language] = params.lang.split("-");
  let query: any = { limit: 10, offset: null };

  if (mainCategory) {
    query.category_slugs = JSON.stringify([mainCategory]);
  }

  let response = await GetHomeBoutiques({
    language,
    country,
    category: mainCategory ? JSON.stringify([mainCategory]) : null,
  });
  // @ts-ignore
  let data: any = response.data ?? {};

  return (
    <>
      <OfferListServer
        boutiquesData={{ ...(data ?? {}) }}
        params={params}
        mainCategory={mainCategory}
      >
        {children}
      </OfferListServer>
    </>
  );
}

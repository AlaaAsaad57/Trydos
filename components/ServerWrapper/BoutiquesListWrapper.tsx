import OfferListServer from "components/Server/OfferListServer";
import { getCachedBoutiques } from "serverRequests/cached/home";

/**
 * The boutique offers section.
 *
 * The boutiques come from a cached reader, so this wrapper holds no
 * request-bound read of its own. Anything personal — the recommendations —
 * arrives as `children`, rendered by the caller outside this scope.
 */
export async function BoutiquesListWrapper({
  params,
  mainCategory = null,
  children = null,
}: any) {
  const [country, language] = params.lang.split("-");
  const { boutiques, offset } = await getCachedBoutiques(
    country,
    language,
    mainCategory,
  );

  return (
    <OfferListServer
      // OfferListServer feeds `searchAfter` to the infinite scroll. It is the
      // same value as `offset` — GetHomeBoutiques sets both from the search
      // engine's searchAfter — and it is passed under both names here so the
      // cached reader can keep the one name it is tested on.
      boutiquesData={{ boutiques, offset, searchAfter: offset }}
      params={params}
      mainCategory={mainCategory}
    >
      {children}
    </OfferListServer>
  );
}

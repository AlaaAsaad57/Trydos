import { Suspense } from "react";
import { lang as langParam } from "next/root-params";

import SearchIcon from "components/Home/Search/SearchIcon";
import MainCategoriesNavbar from "components/Server/MainCategories";
import StoriesBarClient from "components/Home/Stories/StoriesBarClient";
import Home from "components/Home";
import RecommendedWrapper from "components/ServerWrapper/RecommendedWrapper";
import { BoutiquesListWrapper } from "components/ServerWrapper/BoutiquesListWrapper";
import { FlashProductWrapper } from "components/ServerWrapper/FlashDealsProduct";
import { FeaturedProductWrapper } from "components/ServerWrapper/FeaturedProduct";

import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";

import { getCachedCurrency } from "serverRequests/cached/currency";
import {
  getCachedFeatured,
  getCachedFlashDeals,
} from "serverRequests/cached/home";

/**
 * Will this row have anything in it?
 *
 * A read that fails answers `true`. A broken backend then leaves the page
 * exactly as it was before this check existed — a skeleton, and then whatever
 * the row renders — instead of hiding a row that was going to be fine.
 */
async function rowHasProducts(
  read: () => Promise<unknown[]>,
): Promise<boolean> {
  try {
    return (await read()).length > 0;
  } catch {
    return true;
  }
}

/**
 * The home and category views, which differ only by `slug`.
 *
 * `slug` is null for the home page and a category slug for /categories/{slug}.
 * It arrives as a route segment, never as a search parameter: a page that awaits
 * searchParams can never be cached, which is why D-13 moved the address.
 *
 * Every child is either cached or wrapped in its own <Suspense>. Nothing between
 * them reads a cookie, a header or the clock. Two children are deliberately
 * request-bound and stream in: the recommendations (they need the shopper's id)
 * and the stories bar (it runs in the browser).
 *
 * The redeemed-luck script is NOT rendered here. It already sits in the [lang]
 * layout, which wraps both routes; a second copy would run the same pre-paint
 * script twice on every page.
 */
export default async function CategoryHomeView({
  slug,
}: {
  slug: string | null;
}) {
  const lang = await langParam();
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  // Not awaited on purpose. The wrappers await it themselves, so the currency
  // fetch overlaps the product fetches instead of blocking them.
  const currency = getCachedCurrency(country, language);

  // Does each product row have anything to show?
  //
  // The two rows are dynamic holes: a product card cannot be prerendered, so the
  // shell carries a 457px skeleton and the cards arrive about 300ms later. That
  // skeleton is a guess at the final size, and a wrong guess is a jump. The
  // flash-deal row is the one that is regularly wrong: with no deal running it
  // renders nothing, so the skeleton collapsed to zero and pulled the boutiques
  // section 467px up on every load — measured in a browser.
  //
  // Asking here costs no backend call: both readers are cached, and the wrappers
  // read the same entry again inside the boundary. The shell now reserves space
  // only for a row that will really be there.
  //
  // The answer is as old as the shell, which is at most 60 seconds
  // (cacheLife "homepage"). A deal that starts inside that window shows up on
  // the next revalidation, the same delay the row's own data already has.
  const [hasFeatured, hasFlashDeals] = await Promise.all([
    rowHasProducts(() => getCachedFeatured(country, language, slug)),
    rowHasProducts(() => getCachedFlashDeals(country, language, slug)),
  ]);

  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse pr-[10px]" : "flex-row pl-[10px]"
        } bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-999999995`}
      >
        <SearchIcon country={country} language={language} />
        <Suspense fallback={<MobileNavigationSkeleton />} key={`Navbar ${lang}`}>
          <MainCategoriesNavbar lang={lang} mainCategory={slug} />
        </Suspense>
      </div>

      {/* No <Suspense>: this is a client component that fetches the bar itself
          and shows its own skeleton while it waits. */}
      <StoriesBarClient
        key={`Stories ${lang}`}
        language={language}
        country={country}
      />

      {hasFeatured && (
        <Suspense
          fallback={<FeaturedProductsSkeleton />}
          key={`Featured Products ${lang} ${slug ?? "main"}`}
        >
          <FeaturedProductWrapper
            currency={currency}
            lang={lang}
            mainCategory={slug}
          />
        </Suspense>
      )}

      {hasFlashDeals && (
        <Suspense
          fallback={<FeaturedProductsSkeleton />}
          key={`FlashDeals ${lang} ${slug ?? "main"}`}
        >
          <FlashProductWrapper
            currency={currency}
            lang={lang}
            mainCategory={slug}
          />
        </Suspense>
      )}

      {/* Suspense, even though <Home /> paints nothing. It calls
          useSearchParams(), and an unwrapped read of that in the static shell
          makes the WHOLE route dynamic — measured: /[lang] stayed `ƒ` with this
          boundary missing and turned `◐` with it. The fallback is null because
          the component itself renders null until a modal is due. */}
      <Suspense fallback={null} key={`Home ${lang}`}>
        <Home />
      </Suspense>

      <Suspense
        fallback={<OfferListSkeleton />}
        key={`OfferList ${lang} ${slug ?? "main"}`}
      >
        <BoutiquesListWrapper params={{ lang }} mainCategory={slug}>
          {/* Rendered here, not inside the wrapper, and in its own <Suspense>.
              Recommendations read the shopper's User-Data cookie, so they can
              never join the cached offers section — they stream in beside it. */}
          {slug ? null : (
            <Suspense fallback={<FeaturedProductsSkeleton />}>
              <RecommendedWrapper lang={lang} currency={currency} />
            </Suspense>
          )}
        </BoutiquesListWrapper>
      </Suspense>
    </>
  );
}

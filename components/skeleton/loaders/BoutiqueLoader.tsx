import ListingPageSkeleton from "components/Listing/ListingPageSkeleton";

/**
 * In-flow loader shown while a boutique's page loads (from a search result,
 * a notification or a product's back mark). Since Stage 7b (S7b-13) it is
 * the store page's shape, as the boutique page is.
 */
function BoutiqueLoader(_props: { boutique?: any; isForSearch?: boolean }) {
  return <ListingPageSkeleton />;
}

export default BoutiqueLoader;

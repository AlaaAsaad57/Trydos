import ListingPageSkeleton from "components/Listing/ListingPageSkeleton";

/**
 * In-flow listing loader, shown while a search listing loads. Rendered
 * inside `.main-content`, so it needs no fixed positioning. Since Stage 7b
 * (S7b-13) it is the store page's shape, as every listing is.
 */
function FilterLoader(_props: { boutique: any; isForSearch?: boolean }) {
  return <ListingPageSkeleton />;
}

export default FilterLoader;

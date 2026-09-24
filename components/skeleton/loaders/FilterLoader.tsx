import ListingSkeleton from "../listing";

/**
 * In-flow listing loader. Rendered inside `.main-content` (below the persistent
 * navbar), so it needs no fixed positioning and no measured `top` — the source of
 * the "floats above the search bar / NaN top" bug that this removes.
 */
function FilterLoader({
  boutique,
  isForSearch,
}: {
  boutique: any;
  isForSearch?: boolean;
}) {
  return (
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
      <ListingSkeleton
        isForSearch={isForSearch}
        boutique={boutique?.name === "Search" ? null : boutique}
        forProducts={true}
        withBanners={true}
      />
    </div>
  );
}

export default FilterLoader;

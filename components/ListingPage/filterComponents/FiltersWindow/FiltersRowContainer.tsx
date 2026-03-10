"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";

function FiltersRowContainer({ children, values, setValues, term, loading }) {
  const HandleClick = (e) => {
    const target = (e.target as HTMLElement).closest("[data-filter]");
    if (!target) return;
    const filterValue = target.getAttribute("data-filter-value");
    const parentContainer = (e.target as HTMLElement).closest(
      "[data-filter-parents]",
    );
    const filterParents = parentContainer?.getAttribute("data-filter-parents");
    if (values?.includes(filterValue)) {
      setValues(values?.filter((s) => s !== filterValue));
    } else {
      const parentSlugs = filterParents ? filterParents.split(",") : [];
      setValues([
        filterValue,
        ...values.filter((s) => !parentSlugs.includes(s)),
      ]);
    }
  };
  return (
    <div className="flex flex-col items-start gap-[10px]">
      <FilterRowTop loading={loading} term={`Filter By ${term}`} />
      <HortiznalScrollBar
        className={`flex ${term === "categories" && "pb-[20px] items-end"} ${loading && "opacity-65"} max-w-[calc(100vw-60px)] gap-1`}
        id={`${term}-filter-row`}
        onClick={(e) => {
          HandleClick(e);
        }}
      >
        {children}
      </HortiznalScrollBar>
    </div>
  );
}

export default FiltersRowContainer;

const FilterRowTop = ({ term, loading }) => {
  return (
    <div className={`filter-label flex-row justify-start align-center m-0`}>
      <img src="/icons/ActiveCategoryIcon.svg" />
      <div className="filter-label-text">{translateFunction(term)}</div>
      <img src="/icons/FilterInfoIcon.svg" className="filter-info-icon" />
      {loading && (
        <span className="ml-2">
          <Spinner />
        </span>
      )}
    </div>
  );
};

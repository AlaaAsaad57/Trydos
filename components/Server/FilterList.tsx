import React, { Suspense } from "react";
import {
  getCurrency,
  getProductsAndFilters,
} from "store/homepage/cachedActions";

import SwitchFiltersButton from "components/filterPage/SwitchFiltersButton";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import Search from "public/svg/SearchIcon.svg";
import NextLink from "components/global/NextLink";

async function FilterList({ searchParams, params }) {
  const filtersData = await getProductsAndFilters({
    searchParams,
    lang: params.lang ? params.lang.split("-")[1] : null,
    country: params.lang ? params.lang.split("-")[0] : null,
    noProducts: true,
    noFilters: false,
    boutiqueId: params.boutiqueId === "listing" ? null : params.boutiqueId,
    offset: false,
  });

  let filters = {
    categories: filtersData.data?.categories,
    brands: filtersData.data?.brands,
    colors: filtersData.data?.colors,
    prices: filtersData.data?.prices?.priceRanges,
    sizes: filtersData.data?.attributes[0]?.options,
    boutiques: filtersData.data?.boutiques,
    search_text: searchParams?.searchText || null,
  };
  const currency = await getCurrency({
    country: params.lang.split("-")[0],
    lang: params.lang.split("-")[1],
  });
  ``;
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <div className={`w-full flex-row items-center pl-[15px]`}>
        <SwitchFiltersButton
          length={
            Object.keys(filters).filter(
              (s) => filters[s] && filters[s]?.length > 0
            ).length
          }
        />
        <div
          className={`flex-row items-center  justify-start align-start filter-container overflow-auto scroll-smooth`}
        >
          {Object.keys(filters).map((filter) => {
            if (filters[filter] && filters[filter]?.length > 0)
              return (
                <FilterItemsRow
                  currency={currency}
                  searchParams={searchParams}
                  items={filters[filter]}
                  key={filter}
                  term={filter}
                />
              );
          })}
        </div>
      </div>
      <ActiveFiltersBar
        currency={currency}
        searchParams={searchParams}
        filters={filters}
      />
    </Suspense>
  );
}

export default FilterList;
const ActiveFiltersBar = ({ currency, searchParams, filters }) => {
  let activeFilters: any = Object.keys(searchParams).reduce((acc, key) => {
    return {
      ...acc,
      [key]:
        key === "search_text"
          ? searchParams[key]
          : JSON.parse(decodeURIComponent(searchParams[key])),
    };
  }, {});
  const getItemData = ({ value, arr, key }) => {
    try {
      if (key) return arr.find((item) => item[key] === value);
      else return arr.find((item) => item === value);
    } catch (error) {
      console.log(`getItemData Error: ${error} , ${arr} , ${value} , ${key}`);
      return null;
    }
  };
  if (Object.keys(activeFilters).length === 0) return <></>;
  return (
    <div
      className="filter-info-bar flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none "
      data-cy="filterInfo"
    >
      <NextLink href={`?`}>
        <CloseIcon data-cy="closeIcon" className="mr-2 ml-2" />
      </NextLink>
      {activeFilters?.categories?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />

          {activeFilters?.categories.map(
            (category) =>
              getItemData({
                value: category,
                arr: filters.categories,
                key: "slug",
              }) && (
                <>
                  <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      style={{ zIndex: "1" }}
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke="#ff5f61"
                        strokeWidth="0.5"
                      >
                        <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                        <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                      </g>
                    </svg>

                    <img
                      width={20}
                      height={20}
                      src={
                        getItemData({
                          value: category,
                          arr: filters.categories,
                          key: "slug",
                        })?.icon?.file_path ??
                        getItemData({
                          value: category,
                          arr: filters.categories,
                          key: "slug",
                        }).most_viewed_product_thumbnail?.file_path ??
                        getItemData({
                          value: category,
                          arr: filters.categories,
                          key: "slug",
                        }).flat_photo_path?.file_path
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilter"
                  >
                    {
                      getItemData({
                        value: category,
                        arr: filters.categories,
                        key: "slug",
                      }).name
                    }
                  </div>
                  {getItemData({
                    value: category,
                    arr: filters.categories,
                    key: "slug",
                  })?.categories_sub?.map((s) => (
                    <>
                      <div className="sub-category-icon flex-row min-h-[10px] min-w-[10px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          style={{ zIndex: "1" }}
                        >
                          <g
                            id="Ellipse_283"
                            data-name="Ellipse 283"
                            fill="none"
                            stroke="#ff5f61"
                            strokeWidth="0.5"
                          >
                            <circle cx="5" cy="5" r="5" stroke="none" />
                            <circle cx="5" cy="5" r="4.75" fill="none" />
                          </g>
                        </svg>
                        <img
                          src={
                            s.icon?.file_path ||
                            filters.categories.filter(
                              (sub) => sub.slug === s.slug
                            )[0]?.icon?.file_path
                          }
                          width={10}
                          height={10}
                        />
                      </div>
                      <div className="category-title filter-bar-main-title">
                        {s.name}
                      </div>
                    </>
                  ))}
                </>
              )
          )}
        </>
      )}
      {activeFilters?.boutiques?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters?.boutiques?.map(
            (category) =>
              getItemData({
                value: category,
                arr: filters.boutiques,
                key: "slug",
              }) && (
                <>
                  <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      style={{ zIndex: "1" }}
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke="#ff5f61"
                        strokeWidth="0.5"
                      >
                        <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                        <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                      </g>
                    </svg>

                    <img
                      width={20}
                      height={20}
                      src={
                        getItemData({
                          value: category,
                          arr: filters.boutiques,
                          key: "slug",
                        })?.banner?.file_path
                      }
                    />
                  </div>
                  <div className="category-title filter-bar-main-title">
                    {
                      getItemData({
                        value: category,
                        arr: filters.boutiques,
                        key: "slug",
                      })?.name
                    }
                  </div>
                </>
              )
          )}
        </>
      )}
      {activeFilters?.brands?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters?.brands?.map(
            (brand) =>
              getItemData({
                value: brand,
                arr: filters.brands,
                key: "slug",
              }) && (
                <>
                  <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      style={{ zIndex: "1" }}
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke="#ff5f61"
                        strokeWidth="0.5"
                      >
                        <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                        <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                      </g>
                    </svg>

                    <img
                      width={20}
                      height={20}
                      src={
                        getItemData({
                          value: brand,
                          arr: filters.brands,
                          key: "slug",
                        })?.icon?.file_path
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilterBrand"
                  >
                    {
                      getItemData({
                        value: brand,
                        arr: filters.brands,
                        key: "slug",
                      })?.name
                    }
                  </div>
                </>
              )
          )}
        </>
      )}
      {activeFilters?.colors?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters?.colors.map((color) => (
            <>
              <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  style={{ zIndex: "1" }}
                >
                  <g
                    id="Ellipse_283"
                    data-name="Ellipse 283"
                    fill="none"
                    stroke="#ff5f61"
                    strokeWidth="0.5"
                  >
                    <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                    <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                  </g>
                </svg>

                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </>
          ))}
        </>
      )}
      {activeFilters?.prices?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {
            <>
              {activeFilters.prices.map((price, index) => (
                <>
                  <div className="category-title filter-bar-main-title">
                    {price}
                  </div>
                </>
              ))}
            </>
          }
        </>
      )}
      {activeFilters?.sizes?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters?.sizes.map((size, index) => (
            <>
              <div
                className="category-title filter-bar-main-title uppercase"
                data-cy="sizeFilterTitle"
              >
                {size}
              </div>
              {index < activeFilters?.sizes.length - 1 && " - "}
            </>
          ))}
        </>
      )}
      {activeFilters?.search_text?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          <span>
            <Search className="scale-75" />
          </span>
          <div className="category-title filter-bar-main-title  text-[#5d5d5d]">
            {activeFilters?.search_text}
          </div>
        </>
      )}
    </div>
  );
};
const FilterItemsRow = ({ currency, searchParams, items, term }) => {
  const getDataCy = () => {
    if (term === "categories") return "categoryBox";
    if (term === "brands") return "BrandBox";
    if (term === "colors") return "ColorBox";
    if (term === "sizes") return "SizesBox";
  };

  return (
    <div
      className={`${
        term !== "categories" && term !== "brands" && "pt-[10px]"
      } boutique-category-filter flex-row`}
    >
      <div className="category-row-container flex-row" data-cy={getDataCy()}>
        {items &&
          items?.map((item) => (
            <FilterItem
              searchParams={searchParams}
              key={item.id}
              term={term}
              item={item}
            />
          ))}
      </div>
    </div>
  );
};
const FilterItem = ({ term, item, searchParams }) => {
  if (term === "categories") {
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      item.slug,
      term
    );

    return (
      <NextLink
        href={href}
        className={`category-circle flex-col align-center ${
          item?.categories_sub?.length > 0 && "extended-circle"
        }`}
        data-cy="category_botiquePage"
      >
        <div className="relative w-[70px] h-[70px] z-10">
          {isFiltered && (
            <ActiveCategoryIcon className="active-category-icon" />
          )}
          <svg
            className="absolute z-10 top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="70"
            height="70"
            viewBox="0 0 70 70"
          >
            <g
              id="Ellipse_283"
              data-name="Ellipse 283"
              fill="none"
              stroke={isFiltered ? "#FF5F61" : "#fff"}
              strokeWidth="0.5"
            >
              <circle cx="35" cy="35" r="35" stroke="none" />
              <circle cx="35" cy="35" r="34.5" fill="none" />
            </g>
          </svg>
          <div className="category-shadow"></div>
          <img
            width={70}
            height={70}
            className="object-center"
            src={
              item.most_viewed_product_thumbnail?.file_path ??
              item.flat_photo_path?.file_path ??
              item?.icon?.file_path
            }
          />
        </div>
        <div className="category-text-container flex-col align-center">
          <span className="category-title" data-cy="categoryTitle">
            {item.name}
          </span>
          {/* <span className="category-typo">1100</span> */}
        </div>
      </NextLink>
    );
  }
  if (term === "brands") {
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      item.slug,
      term
    );

    return (
      <NextLink
        href={href}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="categoryShadow"
      >
        <div className="relative w-[70px] h-[70px]">
          {isFiltered && (
            <ActiveCategoryIcon className="active-category-icon" />
          )}
          <svg
            className="absolute z-10 top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="70"
            height="70"
            viewBox="0 0 70 70"
          >
            <g
              id="Ellipse_283"
              data-name="Ellipse 283"
              fill="none"
              stroke={isFiltered ? "#FF5F61" : "#C4C2C2"}
              strokeWidth="0.5"
            >
              <circle cx="35" cy="35" r="35" stroke="none" />
              <circle cx="35" cy="35" r="34.5" fill="none" />
            </g>
          </svg>
          <div className="category-shadow"></div>
          <img
            className="brand-photo"
            width={70}
            height={70}
            src={item.icon?.file_path}
          />
        </div>

        <div className="category-text-container flex-col align-center">
          <span className="category-title" data-cy="brandTitle">
            {item.name}
          </span>
          {/* <span className="category-typo">1100</span> */}
        </div>
      </NextLink>
    );
  }
  if (term === "colors") {
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      item,
      term
    );
    return (
      <NextLink
        href={href}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="categoryColor"
      >
        <div className="relative w-[70px] h-[70px]">
          {isFiltered && (
            <ActiveCategoryIcon className="active-category-icon" />
          )}

          <svg
            className="absolute z-10 top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="70"
            height="70"
            viewBox="0 0 70 70"
          >
            <g
              id="Ellipse_283"
              data-name="Ellipse 283"
              fill="none"
              stroke={isFiltered ? "#FF5F61" : "#6b6b6b"}
              strokeWidth="0.5"
              strokeDasharray="3 3"
            >
              <circle cx="35" cy="35" r="35" stroke="none" />
              <circle cx="35" cy="35" r="34.75" fill="none" />
            </g>
          </svg>

          <div
            className={`brand-photo rounded-full  ${
              isFiltered && "bold-size"
            } whitespace-pre-wrap text-center`}
            style={{
              backgroundColor: item,
              minHeight: "70px",
              minWidth: "70px",
            }}
          ></div>
        </div>
        <div className="category-text-container flex-col align-center"></div>
      </NextLink>
    );
  }
  if (term === "sizes") {
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      item,
      term
    );
    return (
      <NextLink
        href={href}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="sizeBox"
      >
        <div className="relative w-[70px] h-[70px]">
          {isFiltered && (
            <ActiveCategoryIcon className="active-category-icon" />
          )}

          <svg
            className="absolute z-10 top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="70"
            height="70"
            viewBox="0 0 70 70"
          >
            <g
              id="Ellipse_283"
              data-name="Ellipse 283"
              fill="none"
              stroke={isFiltered ? "#FF5F61" : "#6b6b6b"}
              strokeWidth="0.5"
              strokeDasharray="3 3"
            >
              <circle cx="35" cy="35" r="35" stroke="none" />
              <circle cx="35" cy="35" r="34.75" fill="none" />
            </g>
          </svg>

          <div
            className={`brand-photo ${
              isFiltered && "bold-size"
            } whitespace-pre-wrap text-center uppercase`}
            style={{
              backgroundColor: "#fff",
              minHeight: "70px",
              minWidth: "70px",
            }}
          >
            {item}
          </div>
        </div>
        <div className="category-text-container flex-col align-center">
          <span className="category-title" data-cy="sizeTitle">
            {item}
          </span>
          {/* <span className="category-typo">1100</span> */}
        </div>
      </NextLink>
    );
  }
  if (term === "prices") {
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      `${item.min_price}-${item.max_price}`,
      term
    );
    return (
      <NextLink
        href={href}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="categoryPrice"
      >
        <div className="relative w-[140px] h-[70px]">
          {isFiltered && (
            <ActiveCategoryIcon className="active-category-icon" />
          )}

          <div
            className={`brand-photo ${
              isFiltered && "bold-size"
            } whitespace-pre-wrap text-center uppercase rounded-xl ${
              isFiltered
                ? "border-[#FF5F61] border-[1px] border-dashed"
                : " border-[#6b6b6b] border-[1px] border-dashed"
            }`}
            style={{
              backgroundColor: "#fff",
              minHeight: "70px",
              minWidth: "140px",
            }}
          >
            {` ${item.min_price} - ${item.max_price}`}
          </div>
        </div>
        <div className="category-text-container flex-col align-center">
          {/* <span className="category-typo">1100</span> */}
        </div>
      </NextLink>
    );
  }
};

function getFilterStateForItem(
  searchParams: URLSearchParams | string,
  itemValue: string,
  filterKey: string
) {
  // Convert to URLSearchParams if it's a string
  const params = new URLSearchParams(searchParams);

  let currentValues: any[] = [];

  // Extract and decode the filter value
  const filterRawValue = params.get(filterKey);
  if (filterRawValue) {
    try {
      currentValues = JSON.parse(decodeURIComponent(filterRawValue));
    } catch (e) {
      console.error("Error parsing filter values:", e);
      currentValues = [];
    }
  }

  // Special handling for prices - only allow one value at a time
  if (filterKey === "prices") {
    const isFiltered =
      Array.isArray(currentValues) && currentValues.includes(itemValue);
    const newValues = isFiltered ? [] : [itemValue];

    // Create a new set of URLSearchParams
    const newParams = new URLSearchParams(params.toString());

    // Update or remove the filterKey
    if (newValues.length > 0) {
      newParams.set(filterKey, encodeURIComponent(JSON.stringify(newValues)));
    } else {
      newParams.delete(filterKey);
    }

    let newSearchParams = new URLSearchParams();
    if (newParams.get("categories") && newParams.get("categories").length > 0) {
      newSearchParams.set("categories", newParams.get("categories"));
    }
    if (newParams.get("brands") && newParams.get("brands").length > 0) {
      newSearchParams.set("brands", newParams.get("brands"));
    }
    if (newParams.get("sizes") && newParams.get("sizes").length > 0) {
      newSearchParams.set("sizes", newParams.get("sizes"));
    }
    if (
      newParams.get("search_text") &&
      newParams.get("search_text").length > 0
    ) {
      newSearchParams.set("search_text", newParams.get("search_text"));
    }
    if (
      newParams.get("boutique_slug") &&
      newParams.get("boutique_slug").length > 0
    ) {
      newSearchParams.set("boutique_slug", newParams.get("boutique_slug"));
    }
    if (newParams.get("prices") && newParams.get("prices").length > 0) {
      newSearchParams.set("prices", newParams.get("prices"));
    }
    if (newParams.get("colors") && newParams.get("colors").length > 0) {
      newSearchParams.set("colors", newParams.get("colors"));
    }

    return {
      isFiltered,
      href: `?${newSearchParams.toString()}`,
    };
  }

  // Normal handling for other filter types
  const isFiltered =
    Array.isArray(currentValues) && currentValues.includes(itemValue);
  const newValues = isFiltered
    ? currentValues.filter((val) => val !== itemValue)
    : [...currentValues, itemValue];

  // Create a new set of URLSearchParams
  const newParams = new URLSearchParams(params.toString());

  // Update or remove the filterKey
  if (newValues.length > 0) {
    newParams.set(filterKey, encodeURIComponent(JSON.stringify(newValues)));
  } else {
    newParams.delete(filterKey);
  }

  let newSearchParams = new URLSearchParams();
  if (newParams.get("categories") && newParams.get("categories").length > 0) {
    newSearchParams.set("categories", newParams.get("categories"));
  }
  if (newParams.get("brands") && newParams.get("brands").length > 0) {
    newSearchParams.set("brands", newParams.get("brands"));
  }
  if (newParams.get("sizes") && newParams.get("sizes").length > 0) {
    newSearchParams.set("sizes", newParams.get("sizes"));
  }
  if (newParams.get("search_text") && newParams.get("search_text").length > 0) {
    newSearchParams.set("search_text", newParams.get("search_text"));
  }
  if (
    newParams.get("boutique_slug") &&
    newParams.get("boutique_slug").length > 0
  ) {
    newSearchParams.set("boutique_slug", newParams.get("boutique_slug"));
  }
  if (newParams.get("prices") && newParams.get("prices").length > 0) {
    newSearchParams.set("prices", newParams.get("prices"));
  }
  if (newParams.get("colors") && newParams.get("colors").length > 0) {
    newSearchParams.set("colors", newParams.get("colors"));
  }

  return {
    isFiltered,
    href: `?${newSearchParams.toString()}`,
  };
}

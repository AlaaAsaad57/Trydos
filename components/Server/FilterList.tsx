"use client";
import React from "react";
import NextLink from "components/global/NextLink";
import {
  GetImageUrl,
  buildParamsFromFilters,
  FilterParams,
  pollinateInput,
} from "utils/server";
import InfiniteScrollFilters from "components/ListingPage/filterComponents/InfiniteScrollFilters";
import SwitchFiltersButton from "components/filterPage/SwitchFiltersButton";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getConfiguredImage, RoundPrice } from "utils/server";

import FilterItem from "components/ListingPage/FilterItem";

function FilterList({
  parsedFilters,
  params,
  filters,
  currency,
  isFeatured,
  isFlashDeals,
  itemsLength,
  searchText = "",
}: any) {
  // Use parsedFilters if available, otherwise use searchParams for backward compatibility
  const filterParams = parsedFilters;
  const isUsingParsedFilters = Boolean(parsedFilters);
  // "Load more filters" (InfiniteScrollFilters → GetNextPageFilters) must page
  // within the active search. buildParamsFromFilters/getFilterStateForItem ignore
  // search_text, and FilterItem reads the live query itself, so adding it here only
  // scopes the paging fetch — it does not affect chip hrefs or active state.
  const filterParamsForPaging = searchText
    ? { ...parsedFilters, search_text: [searchText] }
    : parsedFilters;
  const language = params.lang.split("-")?.[1];
  const isRtl = language === "ar" || language === "ku";
  const parseFiltersFunction = () => {
    if (filterParams?.Search)
      return { ...filterParams, Search: parsedFilters?.search };
    return filterParams;
  };

  return (
    <>
      {/* Related Categories Section */}

      {/* ...existing code... */}
      {itemsLength > 1 && (
        <div
          data-cy="boutique_filter_options"
          className={`w-full relative flex-row items-center pl-3.75`}
        >
          <SwitchFiltersButton
            language={language}
            length={
              Object.keys(filters).filter(
                (s) =>
                  filters[s] &&
                  filters[s]?.length > 0 &&
                  s !== "search_text" &&
                  s !== "boutiques",
              ).length
            }
          />
          <HortiznalScrollBar
            id="filter-list-row-container"
            className={`$${
              isRtl
                ? "flex-row-reverse flex mr-[45px]"
                : "flex-row flex ml-[45px]"
            }  items-center pr-5   justify-start align-start filter-container overflow-auto scroll-smooth`}
          >
            {(Object.keys(filters) as any)
              .filter(
                (filter) =>
                  filter !== "search_text" &&
                  filter !== "boutiques" &&
                  filters[filter] &&
                  filters[filter]?.length > 0,
              )
              .map((filter, index) => {
                if (
                  filter !== "search_text" &&
                  filter !== "boutiques" &&
                  filter !== "related_categories" &&
                  filters[filter] &&
                  filters[filter]?.length > 0
                )
                  return (
                    <FilterItemsRow
                      index={index}
                      isFeatured={isFeatured}
                      isFlashDeals={isFlashDeals}
                      isRtl={isRtl}
                      params={params}
                      currency={currency}
                      filterParams={filterParamsForPaging}
                      isUsingParsedFilters={isUsingParsedFilters}
                      items={filters[filter]}
                      key={filter}
                      term={filter}
                    />
                  );
              })}
          </HortiznalScrollBar>
        </div>
      )}
      <ActiveFiltersBar
        params={params}
        currency={currency}
        filterParams={parseFiltersFunction()}
        isUsingParsedFilters={isUsingParsedFilters}
        filters={filters}
        searchText={searchText}
      />
    </>
  );
}

export default FilterList;
interface ActiveFiltersBarProps {
  currency: any;
  filterParams: FilterParams | any;
  isUsingParsedFilters: boolean;
  filters: any;
  params: any;
  searchText?: string;
}

const ActiveFiltersBar = ({
  currency,
  filterParams,
  isUsingParsedFilters,
  filters,
  params,
  searchText = "",
}: ActiveFiltersBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Chip ✕: clear ONLY ?search= (keep path filters + other query params like sort).
  const removeSearch = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("search");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  let activeFilters: any = {};

  if (isUsingParsedFilters) {
    // Handle new parsedFilters format
    activeFilters = Object.keys(filterParams).reduce((acc, key) => {
      acc[key] =
        key === "Search"
          ? filterParams[key][0] // Get first element for search text
          : filterParams[key]; // Array is already parsed
      return acc;
    }, {});
  } else {
    // Handle old searchParams format
    activeFilters = Object.keys(filterParams).reduce((acc, key) => {
      acc[key] =
        key === "Search"
          ? filterParams[key]
          : JSON.parse(decodeURIComponent(filterParams[key]));
      return acc;
    }, {});
  }

  // Flatten the category tree (self + children + grandchildren) once per
  // render instead of re-flattening it on every getItemData({isCategory:true})
  // call (previously ~7x per active category).
  const categoryBySlug = new Map<string, any>();
  (filters?.categories ?? []).forEach((category) => {
    if (category?.slug !== undefined && !categoryBySlug.has(category.slug)) {
      categoryBySlug.set(category.slug, category);
    }
    category?.childes?.forEach((child_category) => {
      if (
        child_category?.slug !== undefined &&
        !categoryBySlug.has(child_category.slug)
      ) {
        categoryBySlug.set(child_category.slug, child_category);
      }
      child_category?.childes?.forEach((child_child) => {
        if (
          child_child?.slug !== undefined &&
          !categoryBySlug.has(child_child.slug)
        ) {
          categoryBySlug.set(child_child.slug, child_child);
        }
      });
    });
  });

  const getItemData = ({ value, arr, key, isCategory = false }) => {
    try {
      if (isCategory) {
        return categoryBySlug.get(value);
      }
      const selected_filters_array = Array.isArray(arr) ? arr : [];
      if (key)
        return selected_filters_array.find((item) => item[key] === value);
      else return selected_filters_array.find((item) => item === value);
    } catch (error) {
      return null;
    }
  };

  const renderCategoryFilters = (values, sourceCategories = []) => {
    if (!values?.length) return null;

    return (
      <>
        <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />

        {values.map((category) => (
          <React.Fragment key={category}>
            {getItemData({
              value: category,
              arr: sourceCategories,
              key: "slug",
              isCategory: true,
            }) && (
              <>
                <div
                  className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                  key={category}
                >
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

                  <Image
                    alt={category?.name || "Image"}
                    width={20}
                    height={20}
                    src={getConfiguredImage({
                      src:
                        (getItemData({
                          value: category,
                          arr: sourceCategories,
                          key: "slug",
                          isCategory: true,
                        })?.icon?.file_path &&
                          GetImageUrl(
                            getItemData({
                              value: category,
                              arr: sourceCategories,
                              key: "slug",
                              isCategory: true,
                            })?.icon?.file_path,
                          )) ??
                        (getItemData({
                          value: category,
                          arr: sourceCategories,
                          key: "slug",
                          isCategory: true,
                        }).most_viewed_product_thumbnail &&
                          GetImageUrl(
                            getItemData({
                              value: category,
                              arr: sourceCategories,
                              key: "slug",
                              isCategory: true,
                            }).most_viewed_product_thumbnail,
                          )) ??
                        GetImageUrl(
                          getItemData({
                            value: category,
                            arr: sourceCategories,
                            key: "slug",
                            isCategory: true,
                          }).flat_photo_path?.file_path,
                        ),
                      height: 100,
                    })}
                  />
                </div>
                <div
                  className="category-title filter-bar-main-title"
                  data-cy="mainFilter"
                >
                  {
                    getItemData({
                      value: category,
                      arr: sourceCategories,
                      key: "slug",
                      isCategory: true,
                    }).name
                  }
                </div>
                {getItemData({
                  value: category,
                  arr: sourceCategories,
                  key: "slug",
                  isCategory: true,
                })?.childes?.map((s) => (
                  <>
                    {getItemData({
                      value: s,
                      arr: sourceCategories,
                      key: "slug",
                      isCategory: true,
                    }) && (
                      <>
                        <div
                          className="sub-category-icon flex-row min-h-[10px] min-w-[10px]"
                          key={s}
                        >
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
                          <Image
                            alt={s?.name || "Image"}
                            src={getConfiguredImage({
                              src:
                                (s.icon?.file_path &&
                                  GetImageUrl(s.icon?.file_path)) ||
                                (sourceCategories.filter(
                                  (sub) => sub.slug === s.slug,
                                )[0]?.icon?.file_path &&
                                  GetImageUrl(
                                    sourceCategories.filter(
                                      (sub) => sub.slug === s.slug,
                                    )[0]?.icon?.file_path,
                                  )),
                              height: 100,
                            })}
                            width={10}
                            height={10}
                          />
                        </div>
                        <div className="category-title filter-bar-main-title">
                          {s.name}
                        </div>
                      </>
                    )}
                  </>
                ))}
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const hasAnyActiveFilter = Object.keys(activeFilters).some(
    (key) => activeFilters[key]?.length > 0,
  );
  if (!hasAnyActiveFilter && !(searchText?.length > 0)) return <></>;

  // Check if only one boutique is selected and no other filters
  const hasOnlyOneBoutique = activeFilters?.boutiques?.length === 1;
  const otherFiltersCount = Object.keys(activeFilters).filter(
    (key) => key !== "boutiques" && activeFilters[key]?.length > 0,
  ).length;

  // If only one boutique and no other filters, don't show ActiveFiltersBar
  if (hasOnlyOneBoutique && otherFiltersCount === 0 && !(searchText?.length > 0)) {
    return <></>;
  }

  // Global clear-all: getResetUrl() returns a clean PATH with no query string, so
  // it inherently drops ?search= (Req 2). Never append the active query here.
  // Determine reset URL based on boutique filters
  const getResetUrl = () => {
    if (activeFilters?.boutiques?.length === 1) {
      // If only one boutique, keep it in the reset URL
      const pathParams = buildParamsFromFilters({
        boutiques: activeFilters.boutiques,
      });
      return pathParams.length > 0
        ? `/${params.lang}/filters/${pathParams.join("/")}`
        : `/${params.lang}/filters`;
    }
    // For other cases, reset completely
    return `/${params.lang}/filters`;
  };

  // Check if we should hide boutiques in active filters
  // Hide if: on boutique page OR (one boutique selected with other filters)
  const isOnBoutiquePage = activeFilters.boutiques?.length === 1;
  const shouldHideBoutiques =
    isOnBoutiquePage || (hasOnlyOneBoutique && otherFiltersCount > 0);
  const language = params.lang.split("-")?.[1];
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`filter-info-bar ${
        isRtl ? "flex-row-reverse" : "flex-row"
      } w-full mx-[10px] mt-[5px] h-[30px] bg-[#efefef] rounded-[10px] px-[10px] cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none `}
      data-cy="filterInfo"
    >
      <NextLink
        data={{
          is_filter: true,
        }}
        ignoreConditionCase={true}
        href={getResetUrl()}
        data-cy="reset_filter_button"
        ariaLabel={`close filter ${params.lang}`}
      >
        <img
          src="/icons/CloseIcon.svg"
          data-cy="closeIcon"
          className="mr-2 ml-2"
        />
      </NextLink>
      {renderCategoryFilters(activeFilters?.categories, filters.categories)}
      {activeFilters?.boutiques?.length > 0 && !shouldHideBoutiques && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          {activeFilters?.boutiques?.map((category) => (
            <React.Fragment key={category}>
              {getItemData({
                value: category,
                arr: filters.boutiques,
                key: "slug",
              }) && (
                <>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={category}
                  >
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

                    <Image
                      alt={category?.name || "Image"}
                      width={20}
                      height={20}
                      src={getConfiguredImage({
                        src: GetImageUrl(
                          getItemData({
                            value: category,
                            arr: filters.boutiques,
                            key: "slug",
                          })?.banner?.file_path,
                        ),
                        height: 100,
                      })}
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
              )}
            </React.Fragment>
          ))}
        </>
      )}
      {activeFilters?.brands?.length > 0 && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          {activeFilters?.brands?.map((brand) => (
            <React.Fragment key={brand}>
              {getItemData({
                value: brand,
                arr: filters.brands,
                key: "slug",
              }) && (
                <>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={brand}
                  >
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

                    <Image
                      alt={brand?.name || "Image"}
                      width={20}
                      height={20}
                      src={getConfiguredImage({
                        src: GetImageUrl(
                          getItemData({
                            value: brand,
                            arr: filters.brands,
                            key: "slug",
                          })?.icon,
                        ),
                        height: 100,
                      })}
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
              )}
            </React.Fragment>
          ))}
        </>
      )}
      {activeFilters?.colors?.length > 0 && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          {activeFilters?.colors.map((color) => {
            // Ensure color has # prefix for display
            const displayColor = color.startsWith("#") ? color : `#${color}`;
            return (
              <div
                className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                key={color}
              >
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
                  style={{ backgroundColor: displayColor }}
                />
              </div>
            );
          })}
        </>
      )}
      {activeFilters?.prices?.length > 0 && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          {
            <>
              {activeFilters?.prices && (
                <div
                  className="category-title filter-bar-main-title flex-row gap-1"
                  key={activeFilters?.prices[0]}
                >
                  <span>
                    {RoundPrice({
                      num: activeFilters?.prices?.[0],
                      rate: currency?.exchange_rate,
                      points:currency?.decimal_digits,
                      language: language,
                    })}
                  </span>
                  <span>{currency?.symbol}</span>-
                  <span>
                    {RoundPrice({
                      num: activeFilters?.prices?.[1],
                      rate: currency?.exchange_rate,
                      language: language,
                    })}
                  </span>
                  <span>{currency?.symbol}</span>
                </div>
              )}
            </>
          }
        </>
      )}
      {activeFilters?.sizes?.length > 0 && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          {activeFilters?.sizes.map((size, index) => (
            <React.Fragment key={size}>
              <div
                className="category-title filter-bar-main-title uppercase"
                data-cy="sizeFilterTitle"
                key={size}
              >
                {size}
              </div>
              {index < activeFilters?.sizes.length - 1 && " - "}
            </React.Fragment>
          ))}
        </>
      )}
      {searchText?.length > 0 && (
        <>
          <img src="/icons/ActiveCategoryIcon.svg" style={{ height: "21px" }} />
          <span>
            <img src="/icons/Search.svg" className="scale-75" />
          </span>
          <div className="category-title filter-bar-main-title text-[#5d5d5d]">
            {typeof searchText === "string" ? pollinateInput(searchText) : ""}
          </div>
          <img
            src="/icons/CloseIcon.svg"
            data-cy="removeSearchChip"
            className="ml-1 scale-90"
            onClick={(e) => {
              e.stopPropagation();
              removeSearch();
            }}
          />
        </>
      )}

      {activeFilters?.tags_names?.map((tag, index) => (
        <div
          className="category-title mx-[4px] filter-bar-main-title  text-[#467aff] ml-1 rounded-md bg-[#fafaf8] p-1"
          key={tag}
        >
          #{tag}
        </div>
      ))}
    </div>
  );
};
interface FilterItemsRowProps {
  currency: any;
  filterParams: FilterParams | any;
  isUsingParsedFilters: boolean;
  items: any[];
  term: string;
  params: any;
  index: number;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
  total?: number;
  isRtl?: boolean;
}

const FilterItemsRow = ({
  currency,
  filterParams,
  isUsingParsedFilters,
  items,
  term,
  params,
  index,
  isFeatured,
  isFlashDeals,
  total = 10,
  isRtl = false,
}: FilterItemsRowProps) => {
  const [country, language] = params.lang.split("-");
  const getDataCy = () => {
    if (term === "categories") return "categoryBox";
    if (term === "brands") return "BrandBox";
    if (term === "colors") return "ColorBox";
    if (term === "sizes") return "SizesBox";
  };
  const shouldShowMore = () => {
    return items.length >= 10;
  };
  const baseUrlOfFiltersPage = () => {
    if (isFeatured) return `/featured`;
    if (isFlashDeals) return "/flashDeals";
    return "/filters";
  };
  return (
    <div
      className={`${
        term !== "categories" && term !== "brands" && "pt-[10px]"
      } scrollable-area-${index} boutique-category-filter flex-row`}
    >
      <div
        className="category-row-container flex-row"
        data-cy={getDataCy()}
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {items &&
          items?.map((item) => (
            // <FilterItemWrapper
            //   item={{ value: item?.name ?? item, type: term }}
            //   key={item.id}
            // >
            <FilterItem
              isRtl={isRtl}
              baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
              params={params}
              filterParams={filterParams}
              isUsingParsedFilters={isUsingParsedFilters}
              key={
                item.id ??
                item?.slug ??
                (item?.min_price && `${item?.min_price}-${item?.max_price}`) ??
                item
              }
              currency={currency}
              term={term}
              item={item}
            />
            // </FilterItemWrapper>
          ))}

        {shouldShowMore() && (
          <InfiniteScrollFilters
            currency={currency}
            term={term}
            params={params}
            filters={filterParams}
            country={country}
            language={language}
            isRtl={isRtl}
            baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
            isUsingParsedFilters={isUsingParsedFilters}
            // key={JSON.stringify(filterParams)}
          />
        )}
      </div>
    </div>
  );
};

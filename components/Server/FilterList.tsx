import React, { Suspense } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import Search from "public/svg/SearchIcon.svg";
import NextLink from "components/global/NextLink";
import {
  GetImageUrl,
  getPrice,
  buildParamsFromFilters,
  FilterParams,
  FilterListProps,
  FilterItemProps,
  FilterState,
} from "utils/tinyUtils";
import InfiniteScrollFilters from "components/ListingPage/filterComponents/InfiniteScrollFilters";

import SwitchFiltersButton from "components/filterPage/SwitchFiltersButton";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import { getConfiguredImage, RoundPrice } from "utils/functions";
import { FilterItemsRowPropsType } from "models/componentType/FilterItemsRowPropsType";

function FilterList({
  parsedFilters,
  searchParams,
  params,
  filters,
  currency,
  boutique,
  isFeatured,
  isFlashDeals,
}: FilterItemsRowPropsType) {
  // Use parsedFilters if available, otherwise use searchParams for backward compatibility
  const filterParams = parsedFilters || searchParams;
  const isUsingParsedFilters = Boolean(parsedFilters);

  return (
    <>
      <div
        data-cy="boutique_filter_options"
        className={`w-full relative flex-row items-center pl-[15px]`}
      >
        <Suspense
          key={`switch-filters-button-${JSON.stringify(filters)}`}
          fallback={
            <div className="filter-button flex-row items-center h-[25px]" />
          }
        >
          <SwitchFiltersButton
            length={
              Object.keys(filters).filter(
                (s) =>
                  filters[s] &&
                  filters[s]?.length > 0 &&
                  s !== "search_text" &&
                  s !== "boutiques"
              ).length
            }
          />
        </Suspense>
        <HortiznalScrollBar
          id="filter-list-row-container"
          className="flex-row items-center pr-[20px] ml-[45px]  justify-start align-start filter-container overflow-auto scroll-smooth"
        >
          {Object.keys(filters).map((filter, index) => {
            if (
              filter !== "search_text" &&
              filter !== "boutiques" &&
              filters[filter] &&
              filters[filter]?.length > 0
            )
              return (
                <>
                  <FilterItemsRow
                    index={index}
                    boutique={boutique}
                    isFeatured={isFeatured}
                    isFlashDeals={isFlashDeals}
                    params={params}
                    currency={currency}
                    filterParams={filterParams}
                    isUsingParsedFilters={isUsingParsedFilters}
                    items={filters[filter]}
                    key={filter}
                    term={filter}
                  />
                </>
              );
          })}
        </HortiznalScrollBar>
      </div>
      <ActiveFiltersBar
        params={params}
        boutique={boutique}
        currency={currency}
        filterParams={filterParams}
        isUsingParsedFilters={isUsingParsedFilters}
        filters={filters}
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
  boutique: any;
}

const ActiveFiltersBar = ({
  currency,
  filterParams,
  isUsingParsedFilters,
  filters,
  params,
  boutique,
}: ActiveFiltersBarProps) => {
  let activeFilters: any = {};

  if (isUsingParsedFilters) {
    // Handle new parsedFilters format
    activeFilters = Object.keys(filterParams).reduce((acc, key) => {
      return {
        ...acc,
        [key]:
          key === "Search"
            ? filterParams[key][0] // Get first element for search text
            : filterParams[key], // Array is already parsed
      };
    }, {});
  } else {
    // Handle old searchParams format
    activeFilters = Object.keys(filterParams).reduce((acc, key) => {
      return {
        ...acc,
        [key]:
          key === "Search"
            ? filterParams[key]
            : JSON.parse(decodeURIComponent(filterParams[key])),
      };
    }, {});
  }

  const getItemData = ({ value, arr, key, isCategory = false }) => {
    let selected_filters_array = arr;
    if (isCategory) {
      selected_filters_array?.map((category) => {
        category?.childes?.map((child_category) => {
          selected_filters_array?.push(child_category);
          child_category?.childes?.map((child_child) => {
            selected_filters_array?.push(child_child);
          });
        });
      });
    }
    try {
      if (key)
        return selected_filters_array.find((item) => item[key] === value);
      else return selected_filters_array.find((item) => item === value);
    } catch (error) {
      console.log(
        `getItemData Error: ${error} , ${selected_filters_array} , ${value} , ${key}`
      );
      return null;
    }
  };
  if (activeFilters && Object.keys?.(activeFilters)?.length === 0) return <></>;

  // Check if only one boutique is selected and no other filters
  const hasOnlyOneBoutique = activeFilters?.boutiques?.length === 1;
  const otherFiltersCount = Object.keys(activeFilters).filter(
    (key) => key !== "boutiques" && activeFilters[key]?.length > 0
  ).length;

  // If only one boutique and no other filters, don't show ActiveFiltersBar
  if (hasOnlyOneBoutique && otherFiltersCount === 0) {
    return <></>;
  }

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
  const isOnBoutiquePage = boutique?.name && boutique.name !== "Search";
  const shouldHideBoutiques =
    isOnBoutiquePage || (hasOnlyOneBoutique && otherFiltersCount > 0);

  return (
    <div
      className="filter-info-bar flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none "
      data-cy="filterInfo"
    >
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
          href: getResetUrl(),
        }}
        href={getResetUrl()}
        data-cy="reset_filter_button"
        ariaLabel={`close filter ${params.lang}`}
      >
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
                      alt={category?.name}
                      width={20}
                      height={20}
                      src={getConfiguredImage({
                        src:
                          (getItemData({
                            value: category,
                            arr: filters.categories,
                            key: "slug",
                            isCategory: true,
                          })?.icon?.file_path &&
                            GetImageUrl(
                              getItemData({
                                value: category,
                                arr: filters.categories,
                                key: "slug",
                                isCategory: true,
                              })?.icon?.file_path
                            )) ??
                          (getItemData({
                            value: category,
                            arr: filters.categories,
                            key: "slug",
                            isCategory: true,
                          }).most_viewed_product_thumbnail &&
                            GetImageUrl(
                              getItemData({
                                value: category,
                                arr: filters.categories,
                                key: "slug",
                                isCategory: true,
                              }).most_viewed_product_thumbnail
                            )) ??
                          GetImageUrl(
                            getItemData({
                              value: category,
                              arr: filters.categories,
                              key: "slug",
                              isCategory: true,
                            }).flat_photo_path?.file_path
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
                        arr: filters.categories,
                        key: "slug",
                        isCategory: true,
                      }).name
                    }
                  </div>
                  {getItemData({
                    value: category,
                    arr: filters.categories,
                    key: "slug",
                    isCategory: true,
                  })?.childes?.map((s) => (
                    <>
                      {getItemData({
                        value: s,
                        arr: filters.categories,
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
                              alt={s?.name}
                              src={getConfiguredImage({
                                src:
                                  (s.icon?.file_path &&
                                    GetImageUrl(s.icon?.file_path)) ||
                                  (filters.categories.filter(
                                    (sub) => sub.slug === s.slug
                                  )[0]?.icon?.file_path &&
                                    GetImageUrl(
                                      filters.categories.filter(
                                        (sub) => sub.slug === s.slug
                                      )[0]?.icon?.file_path
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
              )
          )}
        </>
      )}
      {activeFilters?.boutiques?.length > 0 && !shouldHideBoutiques && (
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
                      alt={category?.name}
                      width={20}
                      height={20}
                      src={getConfiguredImage({
                        src: GetImageUrl(
                          getItemData({
                            value: category,
                            arr: filters.boutiques,
                            key: "slug",
                          })?.banner?.file_path
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
                      alt={brand?.name}
                      width={20}
                      height={20}
                      src={getConfiguredImage({
                        src: GetImageUrl(
                          getItemData({
                            value: brand,
                            arr: filters.brands,
                            key: "slug",
                          })?.icon
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
              )
          )}
        </>
      )}
      {activeFilters?.colors?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
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
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {
            <>
              {activeFilters?.prices.map((price, index) => (
                <>
                  <div
                    className="category-title filter-bar-main-title flex-row gap-1"
                    key={price}
                  >
                    <span>
                      {RoundPrice({
                        num: price?.split("-")[0],
                        rate: currency?.exchange_rate,
                      })}
                    </span>
                    <span>{currency?.symbol}</span>-
                    <span>
                      {RoundPrice({
                        num: price?.split("-")[1],
                        rate: currency?.exchange_rate,
                      })}
                    </span>
                    <span>{currency?.symbol}</span>
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
                key={size}
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

      {activeFilters?.tags_names?.map((tag, index) => (
        <div
          className="category-title mx-[4px] filter-bar-main-title  text-[#467aff] ml-1 rounded-md bg-[#fafaf8] p-1"
          key={index}
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
  boutique: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
}

const FilterItemsRow = ({
  currency,
  filterParams,
  isUsingParsedFilters,
  items,
  term,
  params,
  index,
  boutique,
  isFeatured,
  isFlashDeals,
}: FilterItemsRowProps) => {
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
      } scrollable-area-${index} boutique-category-filter flex-row`}
    >
      <div className="category-row-container flex-row" data-cy={getDataCy()}>
        {items &&
          items?.map((item) => (
            <FilterItem
              params={params}
              boutique={boutique}
              filterParams={filterParams}
              isUsingParsedFilters={isUsingParsedFilters}
              key={item.id}
              currency={currency}
              term={term}
              item={item}
            />
          ))}

        {items?.length >= 8 && (
          <InfiniteScrollFilters
            term={term}
            isFeatured={isFeatured}
            isFlashDeals={isFlashDeals}
            boutique={boutique}
            filterParams={filterParams}
            isUsingParsedFilters={isUsingParsedFilters}
            lang={params?.lang}
            currency={currency}
            params={params}
            key={JSON.stringify(filterParams)}
          />
        )}
      </div>
    </div>
  );
};
export const FilterItem = ({
  term,
  item,
  filterParams,
  isUsingParsedFilters,
  currency,
  params,
  boutique,
}: FilterItemProps) => {
  // Helper function to get filter state with proper typing
  const getFilterState = (
    itemValue: string,
    filterKey: string,
    parentValue?: string[]
  ): FilterState => {
    if (isUsingParsedFilters) {
      return getFilterStateForItem(
        filterParams,
        itemValue,
        filterKey,
        parentValue,
        params.lang
      );
    } else {
      // For backward compatibility with searchParams
      return getFilterStateForItemLegacy(
        filterParams,
        itemValue,
        filterKey,
        parentValue
      );
    }
  };

  const getSubCategoryUrl = (slug: string, grand_slug?: string) => {
    let { href, isFiltered } = getFilterState(
      slug,
      "categories",
      grand_slug ? [item.slug, grand_slug] : [item.slug]
    );
    return { href, isFiltered };
  };

  if (term === "categories") {
    const { href, isFiltered } = getFilterState(item.slug, term);

    const shouldShowSubCategories = () => {
      let sub_index = 0;
      if (getFilterState(item.slug, "categories")?.isFiltered) {
        sub_index++;
      }
      item?.childes?.map((sub: any) => {
        if (getFilterState(sub.slug, "categories")?.isFiltered) {
          sub_index++;
        }
        sub?.childes?.map((sub_sub: any) => {
          if (getFilterState(sub_sub.slug, "categories")?.isFiltered) {
            sub_index++;
          }
        });
      });
      return sub_index > 0;
    };

    return (
      <>
        <NextLink
          data={{
            is_filter: true,
            ...boutique,
            href: href,
          }}
          ariaLabel={`filter category ${item.slug} ${params.lang}`}
          href={href}
          className={`category-circle flex-col align-center ${
            item?.childes?.length > 0 && "extended-circle"
          }`}
          data-cy="category_filter_item"
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
            <Image
              alt={item?.name}
              width={70}
              height={70}
              className="object-center bg-white"
              src={getConfiguredImage({
                src:
                  (item.most_viewed_product_thumbnail &&
                    GetImageUrl(item.most_viewed_product_thumbnail)) ??
                  (item.flat_photo_path?.file_path &&
                    GetImageUrl(item.flat_photo_path?.file_path)) ??
                  (item?.icon?.file_path && GetImageUrl(item?.icon?.file_path)),
                height: 100,
              })}
            />
          </div>
          <div className="category-text-container flex-col align-center max-w-[70px]">
            <span className="category-title" data-cy="categoryTitle">
              {item.name}
            </span>
            {/* <span className="category-typo">1100</span> */}
          </div>
        </NextLink>
        {item.childes?.length > 0 && (
          <div
            className={`categories-sub-circles relative ${
              shouldShowSubCategories() ? "no-transform" : "ml-0"
            } z-0`}
            style={{
              minWidth: shouldShowSubCategories()
                ? "max-content"
                : `${(item?.childes?.length * 10) / 2}px`,
              right: shouldShowSubCategories() ? "0px" : "40px",
            }}
          >
            {item.childes.map((s, index) => {
              return (
                <>
                  <NextLink
                    data={{
                      is_filter: true,
                      ...boutique,
                      href: getSubCategoryUrl(s.slug)?.href,
                    }}
                    href={getSubCategoryUrl(s.slug)?.href}
                    className={`sub-circle`}
                    key={s.slug}
                    style={{
                      position: shouldShowSubCategories()
                        ? "relative"
                        : "absolute",
                      left: shouldShowSubCategories() ? "0" : `${index * 8}px`,
                      zIndex: shouldShowSubCategories() ? "auto" : 100 - index,
                      transform: shouldShowSubCategories()
                        ? "none"
                        : `scale(${1 - index * 0.05})`,
                      transition: "all 0.5s ease",
                    }}
                  >
                    {getSubCategoryUrl(s.slug)?.isFiltered && (
                      <ActiveCategoryIcon
                        className="active-category-icon"
                        style={{ top: "-5px", left: "-5px" }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        zIndex: "7",
                        width: "50px",
                        height: "50px",
                      }}
                      className="category-shadow"
                    ></div>
                    <svg
                      style={{ position: "absolute", zIndex: "6" }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="50"
                      height="50"
                      viewBox="0 0 50 50"
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke={
                          getSubCategoryUrl(s.slug)?.isFiltered
                            ? "#FF5F61"
                            : "#fff"
                        }
                        strokeWidth="0.5"
                      >
                        <circle cx="25" cy="25" r="25" stroke="none" />
                        <circle cx="25" cy="25" r="25" fill="none" />
                      </g>
                    </svg>

                    <Image
                      alt={s?.name}
                      width={50}
                      height={50}
                      className="bg-white"
                      src={
                        GetImageUrl(s.most_viewed_product_thumbnail) ??
                        GetImageUrl(s.flat_photo_path?.file_path) ??
                        GetImageUrl(s?.icon?.file_path)
                      }
                    />
                    {shouldShowSubCategories() && (
                      <div className="category-text-container flex-col align-center max-w-[50px]">
                        <span className="category-title">{s.name}</span>
                        {/* <span className="category-typo">1100</span> */}
                      </div>
                    )}
                  </NextLink>
                  {s.childes?.length > 0 && (
                    <div
                      className={`categories-sub-circles ${
                        shouldShowSubCategories() && "no-transform ml-[10px]"
                      } z-0`}
                      style={{
                        minWidth: shouldShowSubCategories()
                          ? "max-content"
                          : "10px",
                      }}
                    >
                      {shouldShowSubCategories() &&
                        s.childes.map((sub_s, index) => {
                          return (
                            <NextLink
                              key={sub_s.slug}
                              data={{
                                is_filter: true,
                                ...boutique,
                                href: getSubCategoryUrl(sub_s.slug, s.slug)
                                  ?.href,
                              }}
                              href={getSubCategoryUrl(sub_s.slug, s.slug)?.href}
                              className="sub-circle w-[40px] h-[40px]"
                              style={{
                                zIndex: 4 - index,
                              }}
                            >
                              {getSubCategoryUrl(sub_s.slug, s.slug)
                                ?.isFiltered && (
                                <ActiveCategoryIcon
                                  className="active-category-icon"
                                  style={{ top: "-5px", left: "-5px" }}
                                />
                              )}
                              <div
                                style={{
                                  position: "absolute",
                                  zIndex: "7",
                                  width: "40px",
                                  height: "40px",
                                }}
                                className="category-shadow"
                              ></div>
                              <svg
                                style={{ position: "absolute", zIndex: "6" }}
                                xmlns="http://www.w3.org/2000/svg"
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                              >
                                <g
                                  id="Ellipse_283"
                                  data-name="Ellipse 283"
                                  fill="none"
                                  stroke={
                                    getSubCategoryUrl(sub_s.slug, s.slug)
                                      ?.isFiltered
                                      ? "#FF5F61"
                                      : "#fff"
                                  }
                                  strokeWidth="0.5"
                                >
                                  <circle
                                    cx="20"
                                    cy="20"
                                    r="20"
                                    stroke="none"
                                  />
                                  <circle cx="20" cy="20" r="20" fill="none" />
                                </g>
                              </svg>

                              <Image
                                alt={s?.name}
                                className="min-w-[40px] min-h-[40px] w-[40px] h-[40px]"
                                width={40}
                                height={40}
                                src={
                                  GetImageUrl(
                                    s.most_viewed_product_thumbnail
                                  ) ??
                                  GetImageUrl(s.flat_photo_path?.file_path) ??
                                  GetImageUrl(s?.icon?.file_path)
                                }
                              />
                              {shouldShowSubCategories() && (
                                <div className="category-text-container flex-col align-center mt-2 max-w-[50px]">
                                  <span className="category-title">
                                    {sub_s.name}
                                  </span>
                                  {/* <span className="category-typo">1100</span> */}
                                </div>
                              )}
                            </NextLink>
                          );
                        })}
                    </div>
                  )}
                </>
              );
            })}
          </div>
        )}
      </>
    );
  }
  if (term === "brands") {
    const { href, isFiltered } = getFilterState(item.slug, term);

    return (
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
          href: href,
        }}
        href={href}
        ariaLabel={`filter brand ${item.slug} ${params.lang}`}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="brand_filter_item"
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
          <Image
            alt={item?.name}
            className="brand-photo"
            width={70}
            height={70}
            src={getConfiguredImage({
              src: GetImageUrl(item.icon),
              height: 100,
            })}
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
    const { href, isFiltered } = getFilterState(item, term);
    // Ensure color has # prefix for display
    const displayColor = item.startsWith("#") ? item : `#${item}`;

    return (
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
          href: href,
        }}
        href={href}
        ariaLabel={`filter color ${item} ${params.lang}`}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="color_filter_item"
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
              backgroundColor: displayColor,
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
    const { href, isFiltered } = getFilterState(item, term);
    return (
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
          href: href,
        }}
        href={href}
        ariaLabel={`filter size ${item} ${params.lang}`}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
        data-cy="size_filter_item"
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
    const { href, isFiltered } = getFilterState(
      `${item.min_price}-${item.max_price}`,
      term
    );
    return (
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
          href: href,
        }}
        href={href}
        ariaLabel={`filter price ${item.min_price}-${item.max_price} ${params.lang}`}
        className={`category-circle flex-col align-center min-w-[140px] w-auto static ${
          true && "extended-circle"
        }`}
        data-cy="price_filter_item"
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
            {` ${currency.symbol} ${getPrice(
              item.min_price,
              params.lang.split("-")[1],
              currency
            )} - ${currency.symbol} ${getPrice(
              item.max_price,
              params.lang.split("-")[1],
              currency
            )}`}
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
  parsedFilters: FilterParams,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  lang?: string
): FilterState {
  let currentValues: any[] = [];

  // Extract the filter value - it's already parsed as an array
  const filterRawValue = parsedFilters[filterKey];
  if (filterRawValue && Array.isArray(filterRawValue)) {
    currentValues = filterRawValue;
  }

  // Check if item is currently filtered
  let isFiltered = false;
  if (filterKey === "colors") {
    // For colors, check both with and without # prefix
    const colorWithHash = itemValue.startsWith("#")
      ? itemValue
      : `#${itemValue}`;
    const colorWithoutHash = itemValue.startsWith("#")
      ? itemValue.substring(1)
      : itemValue;
    isFiltered =
      currentValues.includes(colorWithHash) ||
      currentValues.includes(colorWithoutHash);
  } else {
    isFiltered =
      Array.isArray(currentValues) && currentValues.includes(itemValue);
  }

  // Create new filters object
  const newFilters = { ...parsedFilters };

  // Special handling for prices - only allow one value at a time
  if (filterKey === "prices") {
    if (isFiltered) {
      delete newFilters[filterKey]; // Remove filter
    } else {
      newFilters[filterKey] = [itemValue]; // Set new value
    }
  } else if (filterKey === "colors") {
    // Special handling for colors - ensure we store with # prefix
    const colorValue = itemValue.startsWith("#") ? itemValue : `#${itemValue}`;

    if (!newFilters[filterKey]) {
      newFilters[filterKey] = [];
    }

    if (isFiltered) {
      // Remove both possible formats
      newFilters[filterKey] = newFilters[filterKey].filter(
        (val) => val !== colorValue && val !== itemValue
      );
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      newFilters[filterKey] = [...(newFilters[filterKey] || []), colorValue];
    }
  } else {
    // For other filters, toggle the value
    if (!newFilters[filterKey]) {
      newFilters[filterKey] = [];
    }

    if (isFiltered) {
      newFilters[filterKey] = newFilters[filterKey].filter(
        (val) => val !== itemValue
      );
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      // Remove parent values if specified
      if (parentValue) {
        newFilters[filterKey] = newFilters[filterKey].filter(
          (val) => !parentValue.includes(val)
        );
      }
      newFilters[filterKey] = [...(newFilters[filterKey] || []), itemValue];
    }
  }

  // Build URL path using utility function
  const pathParams = buildParamsFromFilters(newFilters);
  const basePath = lang ? `/${lang}/filters` : "/filters";
  const href =
    pathParams.length > 0 ? `${basePath}/${pathParams.join("/")}` : basePath;

  return {
    isFiltered,
    href,
  };
}

// Legacy function for backward compatibility with searchParams
function getFilterStateForItemLegacy(
  searchParams: URLSearchParams | any,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  lang?: string
): FilterState {
  // Convert to URLSearchParams if it's an object
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams();

  let currentValues: any[] = [];

  // Extract and decode the filter value
  const filterRawValue = params.get
    ? params.get(filterKey)
    : searchParams[filterKey];
  if (filterRawValue) {
    try {
      currentValues =
        typeof filterRawValue === "string"
          ? JSON.parse(decodeURIComponent(filterRawValue))
          : filterRawValue;
    } catch (e) {
      console.error("Error parsing filter values:", e);
      currentValues = [];
    }
  }

  // Check if item is currently filtered
  const isFiltered =
    Array.isArray(currentValues) && currentValues.includes(itemValue);

  // For legacy mode, return search params format
  const newParams = new URLSearchParams(
    params.toString ? params.toString() : ""
  );

  // Handle filter updates the old way
  if (filterKey === "prices") {
    const newValues = isFiltered ? [] : [itemValue];
    if (newValues.length > 0) {
      newParams.set(filterKey, encodeURIComponent(JSON.stringify(newValues)));
    } else {
      newParams.delete(filterKey);
    }
  } else {
    const newValues = isFiltered
      ? currentValues.filter((val) => val !== itemValue)
      : [
          ...currentValues?.filter((val) => !parentValue?.includes(val)),
          itemValue,
        ];

    if (newValues.length > 0) {
      newParams.set(filterKey, encodeURIComponent(JSON.stringify(newValues)));
    } else {
      newParams.delete(filterKey);
    }
  }

  return {
    isFiltered,
    href: `?${newParams.toString()}`,
  };
}

export const getActiveFilters = (parsedFilters: FilterParams): any => {
  const activeFilters = {};
  Object.keys(parsedFilters).forEach((key) => {
    if (!["boutiques"]?.includes(key))
      activeFilters[key] =
        key === "Search"
          ? parsedFilters[key][0] // Get first element for search text
          : parsedFilters[key]; // Array is already parsed
  });
  return activeFilters;
};

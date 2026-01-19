import NextLink from "components/global/NextLink";
import React from "react";

import Image from "next/image";
import {
  getConfiguredImage,
  RoundPrice,
  GetImageUrl,
  buildParamsFromFilters,
  FilterParams,
  FilterItemProps,
  FilterState,
} from "utils/server";

const FilterItem = ({
  term,
  item,
  filterParams,
  isUsingParsedFilters,
  currency,
  params,
  baseUrlOfFiltersPage,
  isRtl = false,
}: FilterItemProps) => {
  // Helper function to get filter state with proper typing
  const getFilterState = (
    itemValue: string,
    filterKey: string,
    parentValue?: string[],
  ): FilterState => {
    if (isUsingParsedFilters) {
      return getFilterStateForItem(
        filterParams,
        itemValue,
        filterKey,
        parentValue,
        params.lang,
        baseUrlOfFiltersPage,
      );
    } else {
      // For backward compatibility with searchParams
      return getFilterStateForItemLegacy(
        filterParams,
        itemValue,
        filterKey,
        parentValue,
      );
    }
  };

  const getSubCategoryUrl = (slug: string, grand_slug?: string) => {
    let { href, isFiltered } = getFilterState(
      slug,
      "categories",
      grand_slug ? [item.slug, grand_slug] : [item.slug],
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
          ignoreConditionCase={true}
          data={{
            is_filter: true,
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
              <img
                src="/icons/ActiveCategoryIcon.svg"
                className="active-category-icon w-[30px] h-[30px] z-50"
              />
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
              alt={item?.name || "Image"}
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
              right: isRtl
                ? "initial"
                : shouldShowSubCategories()
                  ? "0px"
                  : "40px",

              left: isRtl
                ? shouldShowSubCategories()
                  ? "0px"
                  : "40px"
                : "initial",
            }}
          >
            {item.childes.map((s, index) => {
              return (
                <React.Fragment key={s.slug}>
                  <NextLink
                    ignoreConditionCase={true}
                    data={{
                      is_filter: true,
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
                      <img
                        src="/icons/ActiveCategoryIcon.svg"
                        className="active-category-icon w-[30px] h-[30px] z-50"
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
                      alt={s?.name || "Image"}
                      width={50}
                      height={50}
                      className="bg-white"
                      src={getConfiguredImage({
                        src:
                          (s.most_viewed_product_thumbnail &&
                            GetImageUrl(s.most_viewed_product_thumbnail)) ??
                          (s.flat_photo_path?.file_path &&
                            GetImageUrl(s.flat_photo_path?.file_path)) ??
                          (s?.icon?.file_path &&
                            GetImageUrl(item?.icon?.file_path)),
                        height: 100,
                      })}
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
                              ignoreConditionCase={true}
                              key={sub_s.slug}
                              data={{
                                is_filter: true,
                              }}
                              href={getSubCategoryUrl(sub_s.slug, s.slug)?.href}
                              className="sub-circle w-[40px] h-[40px]"
                              style={{
                                zIndex: 4 - index,
                              }}
                            >
                              {getSubCategoryUrl(sub_s.slug, s.slug)
                                ?.isFiltered && (
                                <img
                                  src="/icons/ActiveCategoryIcon.svg"
                                  className="active-category-icon w-[30px] h-[30px] z-50"
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
                                alt={s?.name || "Image"}
                                className="min-w-[40px] min-h-[40px] w-[40px] h-[40px]"
                                width={40}
                                height={40}
                                src={getConfiguredImage({
                                  src:
                                    (sub_s.most_viewed_product_thumbnail &&
                                      GetImageUrl(
                                        sub_s.most_viewed_product_thumbnail,
                                      )) ??
                                    (sub_s.flat_photo_path?.file_path &&
                                      GetImageUrl(
                                        sub_s.flat_photo_path?.file_path,
                                      )) ??
                                    (sub_s?.icon?.file_path &&
                                      GetImageUrl(item?.icon?.file_path)),
                                  height: 100,
                                })}
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
                </React.Fragment>
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
        ignoreConditionCase={true}
        data={{
          is_filter: true,
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
            <img
              src="/icons/ActiveCategoryIcon.svg"
              className="active-category-icon w-[30px] h-[30px] z-50"
            />
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
            alt={item?.name || "Image"}
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
        ignoreConditionCase={true}
        data={{
          is_filter: true,
        }}
        href={href}
        ariaLabel={`filter color ${item} ${params.lang}`}
        className={`category-circle flex-col align-center extended-circle`}
        data-cy="color_filter_item"
      >
        <div className="relative w-[70px] h-[70px]">
          {isFiltered && (
            <img
              src="/icons/ActiveCategoryIcon.svg"
              className="active-category-icon w-[30px] h-[30px] z-50"
            />
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
        ignoreConditionCase={true}
        data={{
          is_filter: true,
        }}
        href={href}
        ariaLabel={`filter size ${item} ${params.lang}`}
        className={`category-circle flex-col align-center extended-circle`}
        data-cy="size_filter_item"
      >
        <div className="relative w-[70px] h-[70px]">
          {isFiltered && (
            <img
              src="/icons/ActiveCategoryIcon.svg"
              className="active-category-icon w-[30px] h-[30px] z-50"
            />
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
              fontSize: item?.length < 6 ? "15px" : "10px",
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
      term,
    );
    return (
      <NextLink
        ignoreConditionCase={true}
        data={{
          is_filter: true,
        }}
        href={href}
        ariaLabel={`filter price ${item.min_price}-${item.max_price} ${params.lang}`}
        className={`category-circle flex-col align-center min-w-[140px] w-auto static extended-circle`}
        data-cy="price_filter_item"
      >
        <div className="relative w-[140px] h-[70px]">
          {isFiltered && (
            <img
              src="/icons/ActiveCategoryIcon.svg"
              className="active-category-icon w-[30px] h-[30px] z-50"
            />
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
            {` ${currency.symbol}  ${RoundPrice({
              num: item.min_price,
              language: params.lang.split("-")[1],
              rate: currency?.exchange_rate,
              points: currency?.decimal_digits,
            })} - ${currency.symbol} ${RoundPrice({
              num: item.max_price,
              language: params.lang.split("-")[1],
              rate: currency?.exchange_rate,
              points: currency?.decimal_digits,
            })}`}
          </div>
        </div>
        <div className="category-text-container flex-col align-center">
          {/* <span className="category-typo">1100</span> */}
        </div>
      </NextLink>
    );
  }
};
export default FilterItem;
function getFilterStateForItem(
  parsedFilters: FilterParams,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  lang?: string,
  baseUrlOfFiltersPage?: string,
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
        (val) => val !== colorValue && val !== itemValue,
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
        (val) => val !== itemValue,
      );
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      // Remove parent values if specified
      if (parentValue) {
        newFilters[filterKey] = newFilters[filterKey].filter(
          (val) => !parentValue.includes(val),
        );
      }
      newFilters[filterKey] = [...(newFilters[filterKey] || []), itemValue];
    }
  }

  // Build URL path using utility function
  const pathParams = buildParamsFromFilters(newFilters);
  const basePath = lang
    ? `/${lang}${baseUrlOfFiltersPage}`
    : baseUrlOfFiltersPage;
  const href =
    pathParams.length > 0 ? `${basePath}/${pathParams.join("/")}` : basePath;

  return {
    isFiltered,
    href,
  };
}
function getFilterStateForItemLegacy(
  searchParams: URLSearchParams | any,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  lang?: string,
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
    params.toString ? params.toString() : "",
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

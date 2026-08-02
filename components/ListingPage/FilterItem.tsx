"use client";

import NextLink from "components/global/NextLink";
import React from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  getConfiguredImage,
  RoundPrice,
  GetImageUrl,
  FilterItemProps,
  FilterState,
} from "utils/server/helpers";
import {
  getFilterStateForItem,
  getFilterStateForItemLegacy,
} from "utils/listing/filterItemState";

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
  // Live query string (?search=/?sort=) so filter links keep the active search
  // instead of clearing it when a filter is toggled.
  const searchParams = useSearchParams();
  const activeQueryString = searchParams.toString();
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
        activeQueryString,
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
    const categoryFilterKey = "categories";
    let { href, isFiltered } = getFilterState(
      slug,
      categoryFilterKey,
      grand_slug ? [item.slug, grand_slug] : [item.slug],
    );
    return { href, isFiltered };
  };

  if (term === "categories") {
    const categoryFilterKey = "categories";
    const { href, isFiltered } = getFilterState(item.slug, categoryFilterKey);

    const shouldShowSubCategories = () => {
      let sub_index = 0;
      if (getFilterState(item.slug, categoryFilterKey)?.isFiltered) {
        sub_index++;
      }
      item?.childes?.map((sub: any) => {
        if (getFilterState(sub.slug, categoryFilterKey)?.isFiltered) {
          sub_index++;
        }
        sub?.childes?.map((sub_sub: any) => {
          if (getFilterState(sub_sub.slug, categoryFilterKey)?.isFiltered) {
            sub_index++;
          }
        });
      });
      return sub_index > 0;
    };

    const showSub = shouldShowSubCategories();

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
                className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
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
              showSub ? "no-transform" : "ml-0"
            } z-0`}
            style={{
              minWidth: showSub
                ? "max-content"
                : `${(item?.childes?.length * 10) / 2}px`,
              right: isRtl ? "initial" : showSub ? "0px" : "40px",

              left: isRtl ? (showSub ? "0px" : "40px") : "initial",
            }}
          >
            {item.childes.map((s, index) => {
              const sub = getSubCategoryUrl(s.slug);
              return (
                <React.Fragment key={s.slug}>
                  <NextLink
                    ignoreConditionCase={true}
                    data={{
                      is_filter: true,
                    }}
                    href={sub?.href}
                    className={`sub-circle`}
                    key={s.slug}
                    style={{
                      position: showSub ? "relative" : "absolute",
                      // Anchor the collapsed stack on the parent-circle side so
                      // the peeking cascade mirrors under RTL.
                      [isRtl ? "right" : "left"]: showSub
                        ? "0"
                        : `${index * 8}px`,
                      zIndex: showSub ? "auto" : 100 - index,
                      transform: showSub
                        ? "none"
                        : `scale(${1 - index * 0.05})`,
                      transition: "all 0.5s ease",
                    }}
                  >
                    {sub?.isFiltered && (
                      <img
                        src="/icons/ActiveCategoryIcon.svg"
                        className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
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
                        stroke={sub?.isFiltered ? "#FF5F61" : "#fff"}
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
                    {showSub && (
                      <div className="category-text-container flex-col align-center max-w-[50px]">
                        <span className="category-title">{s.name}</span>
                        {/* <span className="category-typo">1100</span> */}
                      </div>
                    )}
                  </NextLink>
                  {s.childes?.length > 0 && (
                    <div
                      className={`categories-sub-circles ${
                        showSub && "no-transform ms-[10px]"
                      } z-0`}
                      style={{
                        minWidth: showSub ? "max-content" : "10px",
                      }}
                    >
                      {showSub &&
                        s.childes.map((sub_s, index) => {
                          const gsub = getSubCategoryUrl(sub_s.slug, s.slug);
                          return (
                            <NextLink
                              ignoreConditionCase={true}
                              key={sub_s.slug}
                              data={{
                                is_filter: true,
                              }}
                              href={gsub?.href}
                              className="sub-circle w-[40px] h-[40px]"
                              style={{
                                zIndex: 4 - index,
                              }}
                            >
                              {gsub?.isFiltered && (
                                <img
                                  src="/icons/ActiveCategoryIcon.svg"
                                  className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
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
                                  stroke={gsub?.isFiltered ? "#FF5F61" : "#fff"}
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
                              {showSub && (
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
              className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
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
              className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
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
              className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
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
              className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
            />
          )}

          <div
            className={`brand-photo ${
              isFiltered && "bold-size"
            } whitespace-pre-wrap text-center uppercase rounded-xl ${
              isFiltered
                ? "border-[#FF5F61] border border-dashed"
                : " border-[#6b6b6b] border border-dashed"
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

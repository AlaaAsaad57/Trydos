import React, { Suspense } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import Search from "public/svg/SearchIcon.svg";
import NextLink from "components/global/NextLink";
import { translateFunction } from "utils/functions";
import dynamic from "next/dynamic";
import { getPrice } from "utils/tinyUtils";

const SwitchFiltersButton = dynamic(
  () => import("components/filterPage/SwitchFiltersButton"),
  {
    ssr: false,
  }
);
const FilterLabel = dynamic(
  () => import("components/ListingPage/filterComponents/FilterLabel"),
  {
    ssr: false,
  }
);
function FilterList({ searchParams, params, filters, currency, boutique }) {
  return (
    <>
      <div className={`w-full flex-row items-center pl-[15px]`}>
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
                  filters !== "search_text" &&
                  filters !== "boutiques"
              ).length
            }
          />
        </Suspense>
        <div
          className={`flex-row items-center pr-[100px]  justify-start align-start filter-container overflow-auto scroll-smooth`}
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
                  <Suspense>
                    <FilterLabel text={`Filter By ${filter}`} />
                  </Suspense>
                  <FilterItemsRow
                    index={index}
                    boutique={boutique}
                    params={params}
                    currency={currency}
                    searchParams={searchParams}
                    items={filters[filter]}
                    key={filter}
                    term={filter}
                  />
                </>
              );
          })}
        </div>
      </div>
      <ActiveFiltersBar
        params={params}
        boutique={boutique}
        currency={currency}
        searchParams={searchParams}
        filters={filters}
      />
    </>
  );
}

export default FilterList;
const ActiveFiltersBar = ({
  currency,
  searchParams,
  filters,
  params,
  boutique,
}) => {
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
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
        }}
        href={`?`}
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
                      src={(
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
                      )?.replace(
                        "/upload",
                        "/upload/w_50,h_50,c_fit/f_avif/q_100"
                      )}
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
                  })?.childes?.map((s) => (
                    <>
                      {getItemData({
                        value: s,
                        arr: filters.categories,
                        key: "slug",
                      }) && (
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
                              src={(
                                s.icon?.file_path ||
                                filters.categories.filter(
                                  (sub) => sub.slug === s.slug
                                )[0]?.icon?.file_path
                              )?.replace(
                                "/upload",
                                "/upload/w_50,h_50,c_fit/f_avif/q_100"
                              )}
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
                      src={getItemData({
                        value: category,
                        arr: filters.boutiques,
                        key: "slug",
                      })?.banner?.file_path?.replace(
                        "/upload",
                        "/upload/w_50,h_50,c_fit/f_avif/q_100"
                      )}
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
                      src={getItemData({
                        value: brand,
                        arr: filters.brands,
                        key: "slug",
                      })?.icon?.file_path?.replace(
                        "/upload",
                        "/upload/w_50,h_50,c_fit/f_avif/q_100"
                      )}
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
const FilterItemsRow = ({
  currency,
  searchParams,
  items,
  term,
  params,
  index,
  boutique,
}) => {
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
              searchParams={searchParams}
              key={item.id}
              currency={currency}
              term={term}
              item={item}
            />
          ))}
      </div>
    </div>
  );
};
const FilterItem = ({
  term,
  item,
  searchParams,
  currency,
  params,
  boutique,
}) => {
  const getSubCategoryUrl = (slug) => {
    console.log(item);
    let { href, isFiltered } = getFilterStateForItem(
      searchParams,
      slug,
      "categories"
    );
    return { href, isFiltered };
  };
  if (term === "categories") {
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      item.slug,
      term
    );
    const shouldShowSubCategories = () => {
      let sub_index = 0;
      if (
        getFilterStateForItem(searchParams, item.slug, "categories")?.isFiltered
      ) {
        sub_index++;
      }
      item?.childes.map((sub) => {
        if (
          getFilterStateForItem(searchParams, sub.slug, "categories")
            ?.isFiltered
        ) {
          sub_index++;
          sub?.childes.map((sub_sub) => {
            if (
              getFilterStateForItem(searchParams, sub_sub.slug, "categories")
                ?.isFiltered
            ) {
              sub_index++;
            }
          });
        }
      });
      return sub_index > 0;
    };
    return (
      <>
        <NextLink
          data={{
            is_filter: true,
            ...boutique,
          }}
          ariaLabel={`filter category ${item.slug} ${params.lang}`}
          href={href}
          className={`category-circle flex-col align-center ${
            item?.childes?.length > 0 && "extended-circle"
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
              src={(
                item.most_viewed_product_thumbnail?.file_path ??
                item.flat_photo_path?.file_path ??
                item?.icon?.file_path
              )?.replace("/upload", "/upload/w_50,h_50,c_fit/f_avif/q_100")}
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
            className={`categories-sub-circles ${
              shouldShowSubCategories() && "no-transform"
            } z-0`}
            style={{
              minWidth: shouldShowSubCategories() ? "max-content" : "10px",
            }}
          >
            {item.childes.map((s, index) => {
              return (
                <>
                  <NextLink
                    data={{
                      is_filter: true,
                      ...boutique,
                    }}
                    href={getSubCategoryUrl(s.slug)?.href}
                    className="sub-circle"
                    style={{
                      zIndex: 4 - index,
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

                    <img
                      width={50}
                      height={50}
                      src={
                        s.most_viewed_product_thumbnail?.file_path ??
                        s.flat_photo_path?.file_path ??
                        s?.icon?.file_path
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
                      {s.childes.map((sub_s, index) => {
                        return (
                          <NextLink
                            key={sub_s.slug}
                            data={{
                              is_filter: true,
                              ...boutique,
                            }}
                            href={getSubCategoryUrl(sub_s.slug)?.href}
                            className="sub-circle w-[40px] h-[40px]"
                            style={{
                              zIndex: 4 - index,
                            }}
                          >
                            {getSubCategoryUrl(sub_s.slug)?.isFiltered && (
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
                                  getSubCategoryUrl(sub_s.slug)?.isFiltered
                                    ? "#FF5F61"
                                    : "#fff"
                                }
                                strokeWidth="0.5"
                              >
                                <circle cx="20" cy="20" r="20" stroke="none" />
                                <circle cx="20" cy="20" r="20" fill="none" />
                              </g>
                            </svg>

                            <img
                              className="min-w-[40px] min-h-[40px] w-[40px] h-[40px]"
                              width={40}
                              height={40}
                              src={
                                s.most_viewed_product_thumbnail?.file_path ??
                                s.flat_photo_path?.file_path ??
                                s?.icon?.file_path
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
    const { href, isFiltered } = getFilterStateForItem(
      searchParams,
      item.slug,
      term
    );

    return (
      <NextLink
        data={{
          is_filter: true,
          ...boutique,
        }}
        href={href}
        ariaLabel={`filter brand ${item.slug} ${params.lang}`}
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
            src={item.icon?.file_path?.replace(
              "/upload",
              "/upload/w_50,h_50,c_fit/f_avif/q_100"
            )}
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
        data={{
          is_filter: true,
          ...boutique,
        }}
        href={href}
        ariaLabel={`filter color ${item} ${params.lang}`}
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
        data={{
          is_filter: true,
          ...boutique,
        }}
        href={href}
        ariaLabel={`filter size ${item} ${params.lang}`}
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
        data={{
          is_filter: true,
          ...boutique,
        }}
        href={href}
        ariaLabel={`filter price ${item.min_price}-${item.max_price} ${params.lang}`}
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
    let newParamsStr = params.toString();
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
    if (newParams.get("boutiques") && newParams.get("boutiques").length > 0) {
      newSearchParams.set("boutiques", newParams.get("boutiques"));
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
  if (newParams.get("boutiques") && newParams.get("boutiques").length > 0) {
    newSearchParams.set("boutiques", newParams.get("boutiques"));
  }
  if (newParams.get("prices") && newParams.get("prices").length > 0) {
    newSearchParams.set("prices", newParams.get("prices"));
  }
  if (newParams.get("colors") && newParams.get("colors").length > 0) {
    newSearchParams.set("colors", newParams.get("colors"));
  }
  let newParamsStr = newSearchParams.toString().replace(/"/g, "'");
  newParamsStr = newParamsStr.replace(/%22/g, "'");

  return {
    isFiltered,
    href: `?${newParamsStr}`,
  };
}

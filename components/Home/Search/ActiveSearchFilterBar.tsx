"use client";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon";
import CloseIcon from "public/svg/CloseIcon";

import Search from "public/svg/SearchIcon";
import { GetImageUrl } from "utils/tinyUtils";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";

function ActiveSearchFilterBar({ value, appliedFilters, reset }) {
  const showFilterBar = () => {
    return (
      appliedFilters?.categories.length > 0 ||
      appliedFilters?.brands.length > 0 ||
      appliedFilters?.boutiques.length > 0 ||
      value.length > 0
    );
  };

  const getCategory = (slug) => {
    let variable = {
      name: "",
      most_viewed_product_thumbnail: "",
    };
    appliedFilters.categories.map((s) =>
      s.childes?.map((sub) => {
        variable = sub;
        if (sub.slug === slug) return sub;
      })
    );
    return variable;
  };
  if (!showFilterBar()) return <></>;
  return (
    <HortiznalScrollBar
      id="filter-info-bar"
      className="filter-info-bar gap-[8px] w-full mx-[10px] mt-[5px] h-[30px] bg-[#efefef] rounded-[10px] px-[10px] flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none "
      data-cy="filterInfo"
    >
      <CloseIcon
        data-cy="closeIcon"
        className="mx-[10px]"
        onClick={() => {
          reset();
        }}
      />
      {appliedFilters?.categories.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />

          {appliedFilters?.categories.map(
            (category, key) =>
              (category.name ||
                appliedFilters.categories.filter(
                  (s) => s.slug === category.slug
                )[0]?.name ||
                getCategory(category.slug)?.name) && (
                <div className="flex-row" key={category.slug}>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={category.slug}
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

                    <img
                      width={20}
                      height={20}
                      src={
                        (category?.icon?.file_path &&
                          GetImageUrl(category?.icon?.file_path)) ??
                        (category.most_viewed_product_thumbnail &&
                          GetImageUrl(
                            category.most_viewed_product_thumbnail
                          )) ??
                        (category.flat_photo_path?.file_path &&
                          GetImageUrl(category.flat_photo_path?.file_path)) ??
                        (appliedFilters.categories.filter(
                          (s) => s.slug === category.slug
                        )[0]?.most_viewed_product_thumbnail &&
                          GetImageUrl(
                            appliedFilters.categories.filter(
                              (s) => s.slug === category.slug
                            )[0]?.most_viewed_product_thumbnail
                          )) ??
                        (getCategory(category.slug)
                          ?.most_viewed_product_thumbnail &&
                          GetImageUrl(
                            getCategory(category.slug)
                              ?.most_viewed_product_thumbnail
                          ))
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilter"
                  >
                    {category?.name ||
                      appliedFilters.categories.filter(
                        (s) => s.slug === category.slug
                      )[0]?.name ||
                      getCategory(category.slug)?.name}
                  </div>
                  {category?.categories_sub?.map((s) => (
                    <div className="flex-row" key={s.slug}>
                      <div
                        className="sub-category-icon flex-row min-h-[10px] min-w-[10px]"
                        key={s.slug}
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
                        <img
                          src={
                            (s.icon?.file_path &&
                              GetImageUrl(s.icon?.file_path)) ||
                            (appliedFilters.categories.filter(
                              (sub) => sub.slug === s.slug
                            )[0]?.icon?.file_path &&
                              GetImageUrl(
                                appliedFilters.categories.filter(
                                  (sub) => sub.slug === s.slug
                                )[0]?.icon?.file_path
                              ))
                          }
                          width={10}
                          height={10}
                        />
                      </div>
                      <div
                        className="category-title filter-bar-main-title"
                        key={`${s.slug}-name`}
                      >
                        {s.name ||
                          appliedFilters.categories.filter(
                            (sub) => sub.slug === s.slug
                          )[0]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}
        </>
      )}
      {appliedFilters?.boutiques?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {appliedFilters?.boutiques?.map(
            (category) =>
              category.name && (
                <div className="flex-row" key={category.slug}>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={category.slug}
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

                    <img
                      width={20}
                      height={20}
                      src={GetImageUrl(category?.banner?.file_path)}
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    key={`${category.slug}-name`}
                  >
                    {category?.name}
                  </div>
                </div>
              )
          )}
        </>
      )}
      {appliedFilters?.brands?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {appliedFilters?.brands?.map(
            (brand) =>
              (brand.name ||
                appliedFilters.brands.filter((s) => s.slug === brand.slug)[0]
                  ?.name) && (
                <div className="flex-row" key={brand.slug}>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={brand.slug}
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

                    <img
                      width={20}
                      height={20}
                      src={
                        (brand?.icon?.file_path &&
                          GetImageUrl(brand?.icon?.file_path)) ||
                        (appliedFilters.brands.filter(
                          (sub) => sub.slug === brand.slug
                        )[0]?.icon?.file_path &&
                          GetImageUrl(
                            appliedFilters.brands.filter(
                              (sub) => sub.slug === brand.slug
                            )[0]?.icon?.file_path
                          ))
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilterBrand"
                    key={`${brand.slug}-name`}
                  >
                    {brand?.name ||
                      appliedFilters.brands.filter(
                        (sub) => sub.slug === brand.slug
                      )[0]?.name}
                  </div>
                </div>
              )
          )}
        </>
      )}

      {value?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          <span>
            <Search className="scale-75" />
          </span>
          <div className="category-title filter-bar-main-title  text-[#5d5d5d]">
            {value}
          </div>
        </>
      )}
    </HortiznalScrollBar>
  );
}

export default ActiveSearchFilterBar;

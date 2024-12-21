import React, { useEffect } from "react";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import BoutiquePhoto from "./BoutiquePhoto";
import BoutiqueCategoryFilter from "./BoutiqueCategoryFilter";
import { useDispatch, useSelector } from "react-redux";
import BoutiqueBrandFilter from "./filterComponents/BoutiqueBrandFilter";
import BoutiqueOfferFilter from "./filterComponents/BoutiqueOfferFilter";
import BoutiquePriceFilter from "./filterComponents/BoutiquePriceFilter";
import BoutiqueSizeFilter from "./filterComponents/BoutiqueSizeFilter";
import { expandView, normalizeView, Sendevent } from "utils/functions";
import FilterButtons from "./filterComponents/FilterButtons";
import FilterComponentLoader from "./filterComponents/FilterComponentLoader";
import {
  usePathname,
  useSearchParams,
  useRouter,
  useParams,
} from "next/navigation";
import FilterButton from "./FilterButton";
import BoutiqueColorsFilter from "./filterComponents/BoutiqueColorsFilter";
import BoutiquePriceSelect from "./BoutiquePriceSelect";
import { AxiosCacheApi } from "utils/constants";
const PrefetchingFilters = () => {
  const filters = useSelector((state: any) => state.details.filters);
  let params = useParams();
  let boutique = params.productCategory;
  let arr = [];

  arr = [...filters.categories.slice(0, 3), ...filters.brands.slice(0, 4)];

  useEffect(() => {
    AxiosCacheApi({
      url:
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
        `/api/products/search${
          boutique ? `?boutique_slugs=["${boutique}"]` : ""
        }`,
    });
    arr.map((s) => {
      if (s.childes) {
        AxiosCacheApi({
          url:
            process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
            `/api/products/search?category_slugs=${JSON.stringify([s.slug])}${
              boutique ? `&boutique_slugs=["${boutique}"]` : ""
            }`,
        });
      } else {
        AxiosCacheApi({
          url:
            process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
            `/api/products/search?&brand_slugs=${JSON.stringify([s.slug])}${
              boutique ? `&boutique_slugs=["${boutique}"]` : ""
            }`,
        });
      }
    });
  }, []);

  return <></>;
};

function BoutiqueHeader({ boutique, showFilters }) {
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const showedFilter = useSelector((state: any) => state.listing.showedFilter);
  const filterLoading = useSelector(
    (state: any) => state.details.filterLoading
  );
  const loading = useSelector((state: any) => state.details.loading);

  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );

  const filters = useSelector((state: any) => state.details.filters);
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );

  const dispatch = useDispatch();
  useEffect(() => {
    if (boutique) {
      setTimeout(() => {
        Sendevent({
          event: "viewed_boutique",
          extra: {
            boutique_name: boutique.name,
            boutique_id: boutique.id,
          },
        });
      }, 4000);
    }
    dispatch({ type: "enable-handling-filter" });
  }, []);
  const activeFiltersShouldUpdate = useSelector(
    (state: any) => state.details.activeFiltersShouldUpdate
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (data) => {
    const params = new URLSearchParams(searchParams);
    //categories
    if (data.categories.length > 0) {
      params.set("categories", `${data.categories.map((s) => s.slug)}`);
    } else {
      if (params.get("categories")) {
        params.delete("categories");
      }
    }
    //brands
    if (data.brands.length > 0) {
      params.set("brands", `${data.brands.map((s) => s.slug)}`);
    } else {
      if (params.get("brands")) {
        params.delete("brands");
      }
    }
    //colors
    if (data.colors.length > 0) {
      params.set("colors", `${data.colors.map((s) => s.slug)}`);
    } else {
      if (params.get("colors")) {
        params.delete("colors");
      }
    }
    //sizes
    if (data.sizes.length > 0) {
      params.set("sizes", `${data.sizes.map((s) => s)}`);
      params.set("attr-var", `{id:'${sizesAttr.id}',name:'${sizesAttr.name}'}`);
    } else {
      if (params.get("sizes")) {
        params.delete("sizes");
        params.delete("attr-var");
      }
    }
    //offers
    if (data.offers.length > 0) {
      params.set("offers", `${data.offers.map((s) => s)}`);
    } else {
      if (params.get("offers")) {
        params.delete("offers");
      }
    }
    //prices
    if (
      data.prices &&
      data.prices?.min >= 0 &&
      data.prices?.max >= 0 &&
      data.prices.pricesWord
    ) {
      params.set("max-pr", `${data.prices.max}`);
      params.set("min-pr", `${data.prices.min}`);
    } else {
      if (params.get("max-pr") && params.get("max-pr")) {
        params.delete("max-pr");
        params.delete("min-pr");
      }
    }
    if (data.searchText?.length > 0) {
      params.set("searchText", data.searchText);
    } else {
      params.delete("searchText");
    }
    // color
    if (data.colors.length > 0) {
      params.set("colors", `${data.colors.map((s) => s)}`);
    } else {
      if (params.get("colors")) {
        params.delete("colors");
      }
    }
    dispatch({
      type: "ACTIVE-ROUTE",
      payload: `${pathname}?${params.toString()}`,
    });
    replace(`${pathname}?${params.toString()}`);
  };
  useEffect(() => {
    if (activeFiltersShouldUpdate) {
      handleSearch(activeFilters);
    }
  }, [activeFilters]);
  useEffect(() => {
    if (searchParams.size > 0) {
      dispatch({
        type: "ACTIVE-FILTER",
        payload: {
          // @ts-ignore
          categories: searchParams.get("categories")
            ? searchParams
                .get("categories")
                .split(",")
                .map((s) => {
                  return {
                    slug: s,
                  };
                })
            : [],
          colors: searchParams.get("colors")
            ? searchParams
                .get("colors")
                .split(",")
                .map((s) => {
                  return s;
                })
            : [],
          brands: searchParams.get("brands")
            ? searchParams
                .get("brands")
                .split(",")
                .map((s) => {
                  return {
                    slug: s,
                  };
                })
            : [],
          sizes: searchParams.get("sizes")
            ? searchParams.get("sizes").split(",")
            : [],
          prices: searchParams.get("min-pr")
            ? {
                min: searchParams.get("min-pr"),
                max: searchParams.get("max-pr"),
                pricesWord: `["${searchParams.get("min-pr")}-${searchParams.get(
                  "max-pr"
                )}"]`,
              }
            : null,
          offers: [],
          searchText: searchParams.get("searchText") || "",
        },
      });
    }
    dispatch({
      type: "ACTIVE-ROUTE",
      payload: `${window.location.href}`,
    });
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement =
        document?.querySelector(".filter-container");
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);
  return (
    <div className={`boutique-header ${"flex-col"} align-center`}>
      {(filters.categories.length > 0 || filters.brands.length > 0) && (
        <PrefetchingFilters />
      )}
      {boutique && (
        <>
          <div className="boutique-top-info flex-col items-center">
            <div className="boutique-logo-container flex-row align-center">
              <img width={130} height={20} src={boutique.icon} />
              <VerificationIcon />
              <TopStarIcon />
            </div>
            <div className="boutique-text">{boutique.name}</div>
          </div>
          <BoutiquePhoto photo={boutique?.banners} />
        </>
      )}
      {showFilters && (
        <div
          className={`w-full flex-row items-center pl-[15px] ${
            filterEnabled && "pb-[200px]"
          }`}
        >
          {!filterEnabled && (
            <FilterButton
              filters={() => {
                let arr = [];
                if (filters.categories.length > 0)
                  arr.push({ name: "Categories" });
                if (filters?.brands.length > 0) arr.push({ name: "Brands" });
                if (filters?.sizes.length > 0) arr.push({ name: "Sizes" });
                if (filters?.offers.length > 0) arr.push({ name: "Offers" });
                if (filters?.colors.length > 0) arr.push({ name: "Colors" });
                if (filters?.prices?.priceRanges?.length > 0)
                  arr.push({ name: "Prices" });
                return arr;
              }}
              showedFilter={showedFilter}
            />
          )}
          {
            <div
              className={`${
                filterEnabled
                  ? "flex-col filter-enabled"
                  : "flex-row items-center"
              }  justify-start align-start filter-container overflow-auto scroll-smooth`}
              onScroll={(e) => {
                e.preventDefault();
              }}
            >
              {filters?.categories.length > 0 && (
                <BoutiqueCategoryFilter filterEnabled={filterEnabled} />
              )}
              {
                <>
                  {filters?.brands.length > 0 && (
                    <>
                      {!filterEnabled && <BorderThin />}
                      <BoutiqueBrandFilter filterEnabled={filterEnabled} />
                    </>
                  )}
                  {filters?.offers?.length > 0 && (
                    <>
                      {!filterEnabled && <BorderThin />}
                      <BoutiqueOfferFilter filterEnabled={filterEnabled} />
                    </>
                  )}

                  {filters?.sizes?.length > 0 && (
                    <>
                      {!filterEnabled && <BorderThin />}
                      <BoutiqueSizeFilter filterEnabled={filterEnabled} />
                    </>
                  )}
                  {filters?.colors?.length > 0 && (
                    <>
                      {!filterEnabled && <BorderThin />}
                      <BoutiqueColorsFilter filterEnabled={filterEnabled} />
                    </>
                  )}
                  {filters?.prices?.min_price >= 0 &&
                    (filterEnabled ? (
                      <>
                        <BoutiquePriceFilter />
                      </>
                    ) : (
                      <>
                        {" "}
                        {!filterEnabled && <BorderThin />}
                        <BoutiquePriceSelect
                          prices={filters.prices.priceRanges}
                        />
                      </>
                    ))}
                  <FilterButtons />
                  {filterLoading && <FilterComponentLoader />}
                </>
              }
            </div>
          }
        </div>
      )}
    </div>
  );
}

export default BoutiqueHeader;

const BorderThin = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="0.5"
      height="63"
      viewBox="0 0 0.5 63"
    >
      <path
        id="Path_22202"
        data-name="Path 22202"
        d="M0,0V63"
        transform="translate(0.25)"
        fill="#fff"
        stroke="#5d5d5d"
        strokeWidth="0.5"
      />
    </svg>
  );
};

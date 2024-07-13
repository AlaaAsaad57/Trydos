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
import { expandView, normalizeView } from "utils/functions";
import FilterButtons from "./filterComponents/FilterButtons";
import FilterComponentLoader from "./filterComponents/FilterComponentLoader";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

function BoutiqueHeader({ boutique }) {
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const filterLoading = useSelector(
    (state: any) => state.details.filterLoading
  );
  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (data) => {
    const params = new URLSearchParams(searchParams);
    //categories
    if (data.categories.length > 0) {
      params.set("categories", `${data.categories.map((s) => s.id)}`);
    } else {
      if (params.get("categories")) {
        params.delete("categories");
      }
    }
    //brands
    if (data.brands.length > 0) {
      params.set("brands", `${data.brands.map((s) => s.id)}`);
    } else {
      if (params.get("brands")) {
        params.delete("brands");
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
    if (data.prices) {
      params.set("max-pr", `${data.prices.max}`);
      params.set("min-pr", `${data.prices.min}`);
    } else {
      if (params.get("max-pr") && params.get("max-pr")) {
        params.delete("max-pr");
        params.delete("min-pr");
      }
    }
    console.log(params.toString(), decodeURIComponent(params.toString()));
    replace(`${pathname}?${params.toString()}`);
  };
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  const activeFiltersShouldUpdate = useSelector(
    (state: any) => state.details.activeFiltersShouldUpdate
  );
  const filters = useSelector((state: any) => state.details.filters);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: "enable-handling-filter" });
    if (activeFiltersShouldUpdate) handleSearch(activeFilters);
  }, [activeFilters]);
  useEffect(() => {
    console.log("hi", searchParams);

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
                    id: s,
                  };
                })
            : [],
          brands: searchParams.get("brands")
            ? searchParams
                .get("brands")
                .split(",")
                .map((s) => {
                  return {
                    id: s,
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
              }
            : null,
          offers: [],
        },
      });
    }
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 66) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
  }, []);
  return (
    <div className="boutique-header flex-col align-center">
      <div className="boutique-top-info flex-col items-center">
        <div className="boutique-logo-container flex-row align-center">
          <img width={130} height={20} src={boutique.icon} />
          <VerificationIcon />
          <TopStarIcon />
        </div>
        <div className="boutique-text">{boutique.name}</div>
      </div>
      <BoutiquePhoto photo={boutique.photo} />
      <BoutiqueCategoryFilter filterEnabled={filterEnabled} />
      {filterEnabled && (
        <>
          {filters.brands.length > 0 && <BoutiqueBrandFilter />}
          {filters.offers?.length > 0 && <BoutiqueOfferFilter />}
          {filters.prices && <BoutiquePriceFilter />}
          {filters.sizes?.length > 0 && <BoutiqueSizeFilter />}
          <FilterButtons />
          {filterLoading && <FilterComponentLoader />}
        </>
      )}
    </div>
  );
}

export default BoutiqueHeader;

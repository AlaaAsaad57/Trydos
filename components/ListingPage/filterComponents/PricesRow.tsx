import React, { useEffect, useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useParams, useSearchParams } from "next/navigation";
import {
  filterProducts,
  RoundPrice,
  Sendevent,
  UpdateFilter,
} from "utils/functions";
import { useAppStore } from "store";

function SizeCircle({
  text,
}: {
  text: {
    min_price?: number;
    max_price?: number;
  };
}) {
  const {
    setFilterLoading,
    filterPrice,
    filterPriceText,
    editFilter,
    filterStart,
    getProducts,
    setSkeleton,
    setActiveFilter,
    selectedFilter,
    filters,
    filterEnabled,
    settings,
    currency,
  } = useAppStore();

  const pathName = useParams();

  const selectCategory = (e) => {
    let { min_price, max_price } = e;

    setFilterLoading(true);
    Sendevent({
      event: "button_clicked",
      value: "add_filter_button",
      extra: {
        type: "price",
        name: `${Math.round(min_price)} - ${Math.round(max_price)}`,
      },
    });

    filterPrice({
      min: Math.round(min_price),
      max: Math.round(max_price),
    });
    Sendevent({
      event: "button_clicked",
      value: "add_filter_button",
      extra: {
        type: "price",
        name: `${min_price} - ${max_price}`,
      },
    });

    filterPriceText(`${min_price} - ${max_price}`);
    UpdateFilter({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      newFiltersCallback: ({ filtersVar }) => {
        editFilter(filtersVar);
      },
      searchText: "",
      done: () => {
        setFilterLoading(false);
      },
    });
    if (!filterEnabled) {
      filter();
    }
  };
  const SearchParams = useSearchParams();
  const filter = () => {
    filterStart();
    setSkeleton(true);
    filterProducts({
      boutiqueId:
        (SearchParams.get("boutique_slugs") &&
          SearchParams.get("boutique_slugs")) ||
        pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        getProducts({ products });
      },
      offset: 1,
      storeCallback: (e) => {
        setActiveFilter(e);
      },
      newFiltersCallback: ({ filtersVar }) => {
        editFilter(filtersVar);
      },
    });
  };
  const isSelected = () => {
    return (
      selectedFilter?.pricesSelected.filter(
        (s) => s === `${text.min_price} - ${text.max_price}`
      ).length > 0
    );
  };

  return (
    <div
      onClick={() => selectCategory(text)}
      className={`category-circle flex-col align-center ${
        true && "extended-circle"
      }`}
      data-cy="categoryPrice"
    >
      {" "}
      <div className="relative w-[140px] h-[70px]">
        {isSelected() && (
          <ActiveCategoryIcon className="active-category-icon" />
        )}

        <div
          className={`brand-photo ${
            isSelected() && "bold-size"
          } whitespace-pre-wrap text-center uppercase rounded-xl ${
            isSelected()
              ? "border-[#FF5F61] border-[1px] border-dashed"
              : " border-[#6b6b6b] border-[1px] border-dashed"
          }`}
          style={{
            backgroundColor: "#fff",
            minHeight: "70px",
            minWidth: "140px",
          }}
        >
          {currency?.symbol}
          {` ${RoundPrice({
            num: text.min_price,
            points: settings,
            rate: currency?.exchange_rate,
          })} - ${RoundPrice({
            num: text.max_price,
            points: settings,
            rate: currency?.exchange_rate,
          })}`}
        </div>
      </div>
      <div className="category-text-container flex-col align-center">
        {/* <span className="category-typo">1100</span> */}
      </div>
    </div>
  );
}

function PricesRow() {
  const { filters } = useAppStore();
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(".prices-row");
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
    <div
      className="category-row-container brand-row prices-row flex-row"
      data-cy="priceBox"
    >
      {filters?.prices?.priceRanges?.map(
        (price, key) =>
          price.products_count > 0 && <SizeCircle text={price} key={key} />
      )}
    </div>
  );
}

export default PricesRow;

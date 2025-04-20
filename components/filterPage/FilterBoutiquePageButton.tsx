"use client";
import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import { Sendevent } from "utils/functions";
import FilterIcon from "public/svg/listing/filterIcon.svg";
import { useSearchParams, useRouter, useParams } from "next/navigation";

function FilterBoutiquePageButton() {
  const router = useRouter();
  const { setFilterEnabled, filterEnabled, setActiveRoute, activeRoute } =
    useAppStore();
  const searchParams = useSearchParams();
  const paramsUrl = useParams();
  const [savedSearchParams, setSavedSearchParams] = useState("");

  useEffect(() => {
    // Store initial search params when component mounts
    if (filterEnabled) {
      const currentSearch = window.location.search;
      setSavedSearchParams(currentSearch);
      setActiveRoute(currentSearch);
    }
  }, [filterEnabled]);

  useEffect(() => {
    if (filterEnabled) {
      let container = document.querySelector(".filter-container");
      if (!container) {
        setFilterEnabled(false);
      }
      handleDomClasses();
    }
  }, [searchParams]);

  const handleDomClasses = () => {
    if (!filterEnabled) {
      document
        .querySelector(".filter-container")
        ?.classList.add(...["flex-row", "items-center"]);
      document
        .querySelector(".filter-container")
        ?.classList.remove(
          ...[
            "flex-col",
            "items-start",
            "fixed",
            "top-[140px]",
            "z-[10000]",
            "left-0",
            "bg-white",
            "h-screen",
          ]
        );

      document.querySelector(".boutique-top-info")?.classList.remove("hidden");
      document
        .querySelector(".boutique-photo-holder")
        .classList.remove("hidden");
      document.querySelector(".filter-button")?.classList.remove("hidden");
      Sendevent({
        event: "button_clicked",
        value: "filter_close_icon_button",
      });
    } else {
      document
        .querySelector(".filter-container")
        ?.classList.remove(...["flex-row", "items-center"]);
      document
        .querySelector(".filter-container")
        ?.classList.add(
          ...[
            "flex-col",
            "items-start",
            "fixed",
            "top-[140px]",
            "z-[10000]",
            "left-0",
            "bg-white",
            "h-screen",
            "overflow-y-auto",
          ]
        );
      document.querySelector(".boutique-top-info")?.classList.add("hidden");
      document.querySelector(".boutique-photo-holder")?.classList.add("hidden");
      document.querySelector(".filter-button")?.classList.add("hidden");
      Sendevent({
        event: "button_clicked",
        value: "product_listing_filter_icon_button",
      });

      window.scrollTo({ top: 0 });
    }
  };

  const handleFilterButtonClick = () => {
    setFilterEnabled(!filterEnabled);
    let params = new URLSearchParams(window.location.search);

    if (filterEnabled) {
      // Restore to saved search params
      const newUrl = `/boutique/${paramsUrl.boutiqueId}${savedSearchParams}`;
      router.push(newUrl, { scroll: false });
      setActiveRoute(savedSearchParams);

      document
        .querySelector(".filter-container")
        ?.classList.add(...["flex-row", "items-center"]);
      document
        .querySelector(".filter-container")
        ?.classList.remove(
          ...[
            "flex-col",
            "items-start",
            "fixed",
            "top-[140px]",
            "z-[10000]",
            "left-0",
            "bg-white",
            "h-screen",
          ]
        );
      document.querySelector(".boutique-top-info")?.classList.remove("hidden");
      document
        .querySelector(".boutique-photo-holder")
        ?.classList.remove("hidden");
      document.querySelector(".filter-button")?.classList.remove("hidden");
      Sendevent({
        event: "button_clicked",
        value: "filter_close_icon_button",
      });
      params.delete("filterEnabled");
    } else {
      // Store current search params before clearing
      const currentSearch = window.location.search;
      setSavedSearchParams(currentSearch);

      // Clear filters
      // router.push(`/boutique/${paramsUrl.boutiqueId}`, { scroll: false });
      // setActiveRoute("");

      document
        .querySelector(".filter-container")
        ?.classList.remove(...["flex-row", "items-center"]);
      document
        .querySelector(".filter-container")
        ?.classList.add(
          ...[
            "flex-col",
            "items-start",
            "fixed",
            "top-[140px]",
            "z-[10000]",
            "left-0",
            "bg-white",
            "h-screen",
            "overflow-y-auto",
          ]
        );

      document.querySelector(".boutique-top-info")?.classList.add("hidden");
      document.querySelector(".boutique-photo-holder")?.classList.add("hidden");
      document.querySelector(".filter-button")?.classList.add("hidden");
      Sendevent({
        event: "button_clicked",
        value: "product_listing_filter_icon_button",
      });
      params.set("filterEnabled", "true");
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div
      className="filter-option"
      data-cy="settingsIcon"
      onClick={handleFilterButtonClick}
    >
      <FilterIcon className={`${filterEnabled && "filter-icon-enabled"}`} />
    </div>
  );
}

export default FilterBoutiquePageButton;

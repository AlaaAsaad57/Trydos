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
  useEffect(() => {
    console.log(`activeRoute: ${activeRoute}`);
  }, [activeRoute]);
  const searchParams = useSearchParams();
  const paramsUrl = useParams();
  useEffect(() => {
    let params = new URLSearchParams(window.location.search);
    let container = document.querySelector(".filter-container");
    if (!container) {
      setFilterEnabled(false);
    }
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
      params.set("filterEnabled", "true");
      window.scrollTo({ top: 0 });
    }
  }, [searchParams]);

  return (
    <div
      className="filter-option"
      data-cy="settingsIcon"
      onClick={() => {
        if (filterEnabled) {
          const params = new URLSearchParams(activeRoute);
          console.log(
            "filterEnabled",
            params,
            `/boutique/${paramsUrl.boutiqueId}?${params.toString()}`
          );
          router.push(
            `/boutique/${paramsUrl.boutiqueId}?${params.toString()}`,
            {
              scroll: false,
            }
          );
          setActiveRoute(activeRoute === "/" ? "?" : activeRoute);
        } else {
          setActiveRoute(
            window.location.search?.length > 0 ? window.location.search : "?"
          );
        }
        setFilterEnabled(!filterEnabled);
        let params = new URLSearchParams(window.location.search);
        if (filterEnabled) {
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
          document
            .querySelector(".boutique-top-info")
            ?.classList.remove("hidden");
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

          document.querySelector(".boutique-top-info").classList.add("hidden");
          document
            .querySelector(".boutique-photo-holder")
            .classList.add("hidden");
          document.querySelector(".filter-button").classList.add("hidden");
          Sendevent({
            event: "button_clicked",
            value: "product_listing_filter_icon_button",
          });
          params.set("filterEnabled", "true");
          window.scrollTo({ top: 0 });
        }
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}?${params.toString()}`
        );
      }}
    >
      <FilterIcon className={`${filterEnabled && "filter-icon-enabled"}`} />
    </div>
  );
}

export default FilterBoutiquePageButton;

"use client";
import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { useParams } from "next/navigation";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import { dispatchRouteChangeEvent } from "utils/events";
import { fetchBoutiques } from "Server Requests";

import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { InfinteScrollPropsType } from "models/componentType/InfinteScrollPropsType";
const useInfiniteScroll = (fetchNextPage) => {
  useEffect(() => {
    // Function to check scroll position
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // If the scroll reaches 70% of the document height
      if (scrollPosition >= documentHeight * 0.3) {
        fetchNextPage();
      }
    };

    // Add the scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage]);
};
function InfinteScroll({ offsetVariable }: InfinteScrollPropsType) {
  const [boutiques, setBoutiques] = useState([]);
  const [offset, setOffset] = useState(offsetVariable);
  const [loading, setLoading] = useState(false);
  const [isEnd, setEnd] = useState(false);
  const params = useParams();
  const { lang }: { lang?: string } = params;
  const [country, language] = lang.split("-");
  const getNextBoutique = async () => {
    if (!loading && !isEnd) {
      setLoading(true);
      console.log("fetching boutiques offset", offset);
      try {
        const result = await fetchBoutiques(
          language,
          country,
          params.mainCategory?.toString() || "",
          offset,
          10
        );

        if (offset === result.offset) {
          setLoading(false);
          setEnd(true);
        } else if (result.boutiques.length === 0) {
          setLoading(false);
          setEnd(true);
        } else {
          setBoutiques(result.boutiques);
          setLoading(false);
          setOffset(result.offset);
        }
      } catch (error) {
        console.error("Error fetching boutiques:", error);
        setLoading(false);
        setEnd(true);
      }
    }
  };
  useInfiniteScroll(getNextBoutique);
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: window.location.pathname?.includes("categories")
          ? GA_GLOBAL_SCREEN.HOME_CATEGORY_SCREEN
          : GA_GLOBAL_SCREEN.HOME_SCREEN,
        screen_path: window.location.pathname,
      },
    });
    dispatchRouteChangeEvent("completed");
  }, []);
  return (
    <>
      {boutiques.map((boutique) => {
        return (
          <NormalWidget
            key={boutique.slug}
            lang={lang}
            boutique={boutique}
            myKey={boutique.slug}
          />
        );
      })}
      {loading && (
        <h2 className="spinner-container w-full flex justify-center items-center">
          {loading && <Spinner no={false} className="" />}
        </h2>
      )}
    </>
  );
}

export default InfinteScroll;

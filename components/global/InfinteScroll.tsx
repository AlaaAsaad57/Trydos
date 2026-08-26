"use client";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { useParams } from "next/navigation";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";

import { useAppStore } from "store";
import { GetNextBoutiques } from "serverRequests/home";
import { LogError } from "utils/functions";
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
function InfinteScroll({ offsetVariable, mainCategory = null }) {
  const [boutiques, setBoutiques] = useState([]);
  const [offset, setOffset] = useState<any>(offsetVariable);
  const [loading, setLoading] = useState(false);
  const [isEnd, setEnd] = useState(false);
  const params = useParams();
  const { lang }: { lang?: string } = params;
  const [country, language] = lang.split("-");
  const getNextBoutique = async () => {
    if (!loading && !isEnd) {
      setLoading(true);
      try {
        let result = await GetNextBoutiques({
          category: mainCategory,
          language,
          country,
          offset: JSON.stringify(offset),
        });

        // @ts-ignore
        if (result.boutiques.length === 0) {
          setLoading(false);
          setEnd(true);
        } else {
          setBoutiques([...boutiques, ...result.boutiques]);
          setLoading(false);
        }
        if (result?.offset) setOffset([...result.offset]);
        else {
          setLoading(false);
          setEnd(true);
        }
      } catch (error) {
        LogError({
          error: error,
          scenario: "get Next Boutiques in Home Page",
          offset: offset,
          category: mainCategory,
        });
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
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
  }, []);
  return (
    <>
      {boutiques}
      {loading && (
        <h2 className="spinner-container w-full flex justify-center items-center">
          {loading && <Spinner no={false} className="" />}
        </h2>
      )}
    </>
  );
}

export default InfinteScroll;

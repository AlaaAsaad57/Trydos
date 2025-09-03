"use client";
import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { useParams } from "next/navigation";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { InfinteScrollPropsType } from "models/componentType/InfinteScrollPropsType";
import { useAppStore } from "store";
import { GetBoutiquesElasticPagination } from "services/elastic/utils";
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
function InfinteScroll({ offsetVariable, temp }: InfinteScrollPropsType) {
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
        // const result = await GetBoutiquesElasticPagination({
        //   country,
        //   language,
        //   category: params.mainCategory,
        //   offset: offsetVariable,
        // });
        let api_url = "/api/home/boutiques";
        let search = new URLSearchParams();
        search.set("limit", "10");
        search.set("offset", `[${offsetVariable}]`);
        if (params?.mainCategory)
          search.set("category_slugs", params.mainCategory as string);
        let new_results = await fetch(api_url + `?${search?.toString()}`, {
          headers: {
            lang: language,
            country: country,
          },
          next: {
            revalidate: 0,
          },
        });
        let result = await new_results.json();
        result = result.data;

        // @ts-ignore
        if (offset?.[0] === result.offset?.[0]) {
          setLoading(false);
          setEnd(true);
        } else if (result.boutiques.length === 0) {
          setLoading(false);
          setEnd(true);
        } else {
          setBoutiques(result.boutiques);
          setLoading(false);
          setOffset([...result.offset]);
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
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
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

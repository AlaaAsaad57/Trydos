"use client";
import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { useParams } from "next/navigation";
import NormalWidget from "components/Home/OfferWidgets/NormalWidget";
import { dispatchRouteChangeEvent } from "utils/events";
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
function InfinteScroll({ offsetVariable }) {
  const [boutiques, setBoutiques] = useState([]);
  const [offset, setOffset] = useState(offsetVariable);
  const [loading, setLoading] = useState(false);
  const [isEnd, setEnd] = useState(false);
  const params = useParams();
  const { lang }: { lang?: string } = params;
  const getNextBoutique = async () => {
    if (!loading && !isEnd) {
      setLoading(true);
      ("use server");
      let res = await fetch(
        `/api/${params.lang}/boutiques?offset=${offset}${
          params.mainCategory?.length > 0 ? `&str=${params.mainCategory}` : ""
        }`,
        {
          headers: {
            lang: lang.split("-")[1],
            country: lang.split("-")[0],
          },
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE),
            tags: ["home", "boutiques"],
          },
        }
      );

      let body = await res.json();
      let boutiques = body;

      if (offset === boutiques.data.ofsset) {
        setLoading(false);
        setEnd(true);
      } else if (boutiques.data.boutiques.length === 0) {
        setLoading(false);
        setEnd(true);
      } else {
        setBoutiques(boutiques.data.boutiques);
        setLoading(false);
        setOffset(boutiques.data.offset);
      }
    }
  };
  useInfiniteScroll(getNextBoutique);
  useEffect(() => {
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

import React, { useEffect, useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "./Spinner";
import { useParams } from "next/navigation";
const useInfiniteScroll = (fetchNextPage) => {
  useEffect(() => {
    // Function to check scroll position
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // If the scroll reaches 70% of the document height
      if (scrollPosition >= documentHeight * 0.7) {
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
function InfinteScroll({ SetBoutiques, offsetVariable }) {
  const [offset, setOffset] = useState(offsetVariable);
  const [loading, setLoading] = useState(false);
  const [isEnd, setEnd] = useState(false);
  const params = useParams();
  const getNextBoutique = async () => {
    if (!loading && !isEnd) {
      setLoading(true);
      let res = await fetch(
        `/api/boutiques?lang=${params.lang}&offset=${offset}${
          params.mainCategory?.length > 0 ? `&str=${params.mainCategory}` : ""
        }`
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
        SetBoutiques(boutiques.data.boutiques);
        setLoading(false);
        setOffset(boutiques.data.offset);
      }
    }
  };
  useInfiniteScroll(getNextBoutique);

  return (
    <>
      {!loading ? (
        <></>
      ) : (
        <h2 className="spinner-container w-full flex justify-center items-center">
          {loading && <Spinner no={false} className="" />}
        </h2>
      )}
    </>
  );
}

export default InfinteScroll;

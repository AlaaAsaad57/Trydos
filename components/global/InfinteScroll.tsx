import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "./Spinner";
import { useParams } from "next/navigation";

function InfinteScroll({ SetBoutiques, offsetVariable }) {
  const [offset, setOffset] = useState(offsetVariable);
  const [loading, setLoading] = useState(false);
  const [isEnd, setEnd] = useState(false);
  const params = useParams();
  const getNextBoutique = async () => {
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
  };
  return (
    <>
      {!loading ? (
        <InView
          className="spinner-container w-full flex justify-center items-center min-h-8"
          as="div"
          threshold={0.01}
          onChange={(inView) => {
            if (inView && !loading && !isEnd) {
              getNextBoutique();
            }
          }}
        ></InView>
      ) : (
        <h2 className="spinner-container w-full flex justify-center items-center">
          {loading && <Spinner no={false} className="" />}
        </h2>
      )}
    </>
  );
}

export default InfinteScroll;

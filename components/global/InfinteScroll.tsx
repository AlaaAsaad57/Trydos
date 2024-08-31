import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "./Spinner";
import { getHomeDataOffset } from "store/homepage/cachedActions";
import { useParams } from "next/navigation";

function InfinteScroll({ SetBoutiques }) {
  const [offset, setOffset] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEnd, setEnd] = useState(false);
  const params = useParams();
  const getNextBoutique = async () => {
    setLoading(true);
    let [boutiques] = await getHomeDataOffset({
      str: params.mainCategory ?? null,
      lang: params.lang,
      offset: offset + 1,
    });
    if (boutiques.length === 0) {
      setLoading(false);
      setEnd(true);
    } else {
      SetBoutiques(boutiques);
      setLoading(false);
      setOffset(offset + 1);
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

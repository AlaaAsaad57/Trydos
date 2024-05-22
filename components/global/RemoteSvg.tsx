import { useState } from "react";
import useSWRImmutable from "swr/immutable";
import Loading from "public/svg/loading.svg";
import ImageLoader from "./ImageLoader";
import Skeleton from "react-loading-skeleton";
const fetcher = async (url) =>
  fetch(url, { cache: "force-cache" }).then((res) => {
    if (res.status === 200) return res.text();
    else throw new Error("Invalid Url");
  });

export default function RemoteSvg({ url, size }) {
  const [src, setSrc] = useState(url);
  const { data, error, isLoading } = useSWRImmutable(src, fetcher, {
    errorRetryCount: 0,
  });
  if (isLoading)
    return (
      <Skeleton
        style={{
          width: `${size || 30}px`,
          height: `${size || 30}px`,
          borderRadius: "50%",
        }}
      />
    );
  if (error)
    return (
      <>
        <Loading
          onClick={() => {
            setSrc(url + `?t=${new Date().getTime()}`);
          }}
        />
      </>
    );
  if (!url.includes("svg") && !error) {
    return (
      <ImageLoader
        loading="eager"
        alt={"category"}
        noLoader={true}
        priority={false}
        fetchPriority={"high"}
        style={{
          maxWidth: "187px",
          width: "auto",
          height: "20px",
        }}
        width={20}
        height={20}
        src={url}
      />
    );
  }
  if (data && !error)
    return (
      <div style={{ width: "20px", height: "20px" }} className="svg-holder-r">
        <img src={url} alt="icon" width={size || 20} height={size || 20} />
      </div>
    );
}

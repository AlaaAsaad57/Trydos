import { useState } from "react";
import useSWRImmutable from "swr/immutable";
import Loading from "public/svg/loading.svg";
import Spinner from "./Spinner";
const fetcher = async (url) =>
  fetch(url).then((res) => {
    if (res.status === 200) return res.text();
    else throw new Error("Invalid Url");
  });

export default function RemoteSvg({ url }) {
  const [src, setSrc] = useState(url);
  const { data, error, isLoading } = useSWRImmutable(src, fetcher, {
    errorRetryCount: 0,
  });
  if (isLoading) return <Spinner no={false} className="" />;
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
  if (data) return <div dangerouslySetInnerHTML={{ __html: data }} />;
}

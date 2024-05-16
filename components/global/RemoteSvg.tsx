import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.text());

export default function RemoteSvg({ url }) {
  const { data, error } = useSWR(url, fetcher);
  if (error) return <></>;
  if (!data) return <></>;
  return <div dangerouslySetInnerHTML={{ __html: data }} />;
}

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { BoutiqueContainer } from "components/Home/OfferWidgets/BoutiqueElement";

function BoutiquesTab({ sellerId }: { sellerId: string }) {
  const [boutiques, setBoutiques] = useState<Array<any>>([]);
  const [offset, setOffset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const limit = 5;
  const params = useParams() as { lang?: string };
  const [country, language] = (params?.lang || "iq-ku").split("-"); // default fallback

  const fetchData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      //   const res = await elasticClient.getBoutiques({
      //     country,
      //     language,
      //     limit,
      //     sellerId,
      //     searchAfter: offset,
      //   });
      let newParam = new URLSearchParams();
      newParam.append("country", country);
      newParam.append("language", language);
      newParam.append("limit", limit.toString());
      newParam.append("offset", offset ? JSON.stringify(offset) : "");
      if (sellerId) {
        newParam.append("sellerId", sellerId);
      }
      let response = await fetch("/api/home/boutiques?" + newParam.toString(), {
        method: "GET",
        headers: {
          country: country,
          language: language,
        },
      });
      let data = await response.json();
      const res = data?.data;

      // Expecting result shape; adjust keys if your service differs
      const items = res?.boutiques;
      const nextOffset = res?.offset;

      setBoutiques((prev) => [...prev, ...items]);
      setOffset(nextOffset);
      setHasMore(Boolean(nextOffset) && items.length >= limit);
    } catch (err) {
      console.error("Failed to fetch boutiques:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    setBoutiques([]);
    setOffset(null);
    setHasMore(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, country, language]);

  return (
    <div className="flex flex-col w-full p-2 gap-3">
      {boutiques.length === 0 && !loading && (
        <div className="text-center text-gray-500">No boutiques found.</div>
      )}

      {boutiques.map((b: any) => (
        <BoutiqueContainer
          key={b?.slug || b?.id}
          boutique={b}
          lang={`${country}-${language}`}
        />
      ))}

      <div className="flex justify-center mt-2">
        {hasMore ? (
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        ) : (
          boutiques.length > 0 && (
            <span className="text-gray-500 text-sm">No more boutiques.</span>
          )
        )}
      </div>
    </div>
  );
}

export default BoutiquesTab;

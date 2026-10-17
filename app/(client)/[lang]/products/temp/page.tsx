import "styles/productDetails.css";
import "styles/product-body.css";
import { lang as langParam } from "next/root-params";
import { Metadata } from "next";
import ProductGeneralPropertiesWrapper from "components/Server/product/ProductGeneralPropertiesWrapper";
import { getRobotsConfig } from "utils/server";
import TempCountsDemo from "./TempCountsDemo";

// A test page for testers, not a real product. It shows the product page parts
// that show a count, fed with fixed big numbers, so testers can see the short
// form ("1.2K", "10K", "1M", "2.4B") without a real product that has that many
// buyers, likes or comments. The counts are in TempCountsDemo.tsx.
// Remove this folder once testers have checked the short counts.

export const instant = false;

export const metadata: Metadata = {
  robots: getRobotsConfig({ index: false, follow: false }),
};

// 1,000,000 + 35,000 + 1,500 + 999 + 12 = 1,037,511 buyers -> "1M".
const GENERAL_DATA = {
  final_rating: 4.5,
  ratingDetails: [
    { ratingGroup: 5, count: 1000000 },
    { ratingGroup: 4, count: 35000 },
    { ratingGroup: 3, count: 1500 },
    { ratingGroup: 2, count: 999 },
    { ratingGroup: 1, count: 12 },
  ],
  total_views: 10000,
  good_quality_product: true,
  recommendation_stats: [
    { category: "recommend", count: 1000000, percentage: 97 },
    { category: "not_recommend", count: 25300, percentage: 3 },
  ],
  size_analysis: { true_percentage: 80, small_percentage: 15, large_percentage: 5 },
};

export default async function Page() {
  const lang = await langParam();
  const [, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="product-details-container w-full relative bg-[#ffffff] pt-[20px] pb-[120px]">
      <div
        className={`${isRtl ? "pr-[10px]" : "pl-[10px]"} product-info-section bg-[#ffffff] flex-col align-start`}
      >
        <div className="flex-col px-[10px] max-w-full w-full">
          <ProductGeneralPropertiesWrapper
            globalData={{ id: "temp" }}
            generalData={GENERAL_DATA}
            language={language}
          />
        </div>
        <TempCountsDemo
          language={language}
          isRtl={isRtl}
          recommendation_stats={GENERAL_DATA.recommendation_stats}
        />
      </div>
    </div>
  );
}

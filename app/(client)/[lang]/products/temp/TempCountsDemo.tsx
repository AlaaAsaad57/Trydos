"use client";
import {
  BuyerCommentRateInfo,
  BuyersRatingBar,
} from "components/Server/product/ProductBuyersComment/BuyerCommentRateInfo";
import ProductFooterWrapper from "components/Server/product/ProductFooter.tsx/ProductFooterWrapper";

// The client half of the /products/temp test page: the like count under a
// buyer comment, the recommend bar, and the footer's likes / comments / shares.
// The product and the comment do not exist on any backend, so the hearts and
// the footer take no taps (pointer-events-none): a tap would like a fake id.

const COMMENT = {
  id: "temp-comment",
  product_id: "temp",
  total_likes: 2450000000, // -> "2.4B"
  is_liked: false,
  good_quality_comment: true,
  true_size: true,
};

const SOCIAL_DATA = {
  total_likes: 1000, // -> "1K"
  total_comments: 10000, // -> "10K"
  total_shares: 1000000, // -> "1M"
  is_liked: false,
};

const PRODUCT = {
  id: "temp",
  slug: "temp",
  name: "Dummy product",
  images: [],
  brand: { id: 0, name: "Trydos" },
  category: { id: 0, name: "Test" },
};

function TempCountsDemo({ language, isRtl, recommendation_stats }) {
  return (
    <>
      <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px] py-[10px]">
        <div className="comment-item rounded-[15px] flex-col min-w-[330px] w-full bg-[#F8F8F8] py-[8px] pointer-events-none">
          <BuyerCommentRateInfo
            language={language}
            rating={5}
            recommendation={true}
            comment={COMMENT}
          />
        </div>
        <BuyersRatingBar
          language={language}
          recommendation_stats={recommendation_stats}
        />
      </div>

      <div className="product-details-footer alternate-product-details-footer z-999999999 pointer-events-none">
        <ProductFooterWrapper
          isRtl={isRtl}
          language={language}
          globalPromise={PRODUCT}
          QtyPricePromise={{}}
          color={undefined}
          size={undefined}
          currencyPromise={undefined}
          local={undefined}
          redeemed_status={false}
          socialData={SOCIAL_DATA}
        />
      </div>
    </>
  );
}

export default TempCountsDemo;

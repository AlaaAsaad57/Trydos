import { lang as langParam } from "next/root-params";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductPageContent from "components/Product/ProductPageContent";
import { GetGlobalProduct, GetProductGeneralData } from "serverRequests/product";
import { GetProducts } from "serverRequests/listing";
import { getRobotsConfig } from "utils/server";

// A test page for testers, not a real route. It draws a real staging product
// with the real product page layout (ProductPageContent), but every count is a
// fixed big number, so testers can see the short form ("1.2K", "10K", "1M",
// "2.4B") without a product that really has that many buyers, likes or
// comments.
//
// The product is the first one in the listing, or the one named by ?slug=.
// Remove this folder once testers have checked the short counts.

export const instant = false;

export const metadata: Metadata = {
  robots: getRobotsConfig({ index: false, follow: false }),
};

// 1,000,000 + 35,000 + 1,500 + 999 + 12 = 1,037,511 buyers -> "1M".
const RATING_DETAILS = [
  { ratingGroup: 5, count: 1000000 },
  { ratingGroup: 4, count: 35000 },
  { ratingGroup: 3, count: 1500 },
  { ratingGroup: 2, count: 999 },
  { ratingGroup: 1, count: 12 },
];

// "1M" recommend it, "25.3K" do not.
const RECOMMENDATION_STATS = [
  { category: "recommend", count: 1000000, percentage: 97 },
  { category: "not_recommend", count: 25300, percentage: 3 },
];

// Likes under each comment: "1.5K", "25K", "2.4B".
const FAKE_COMMENTS = [
  { likes: 1500, rating: 5, recommend: true },
  { likes: 25000, rating: 4, recommend: true },
  { likes: 2450000000, rating: 3, recommend: false },
].map((s, i) => ({
  id: `temp-comment-${i + 1}`,
  comment: `Test comment ${i + 1}`,
  customer: { name: `Test Buyer ${i + 1}` },
  star_rating: s.rating,
  recommendation: s.recommend,
  good_quality_comment: true,
  true_size: true,
  total_likes: s.likes,
  is_liked: false,
  created_at: new Date().toISOString(),
}));

// Footer: "1K" likes, "10K" comments, "1M" shares.
const SOCIAL_DATA = {
  total_likes: 1000,
  total_comments: 10000,
  total_shares: 1000000,
  is_liked: false,
};

export default async function Page({ searchParams }) {
  const SearchParams = (await searchParams) || {};
  const lang = await langParam();
  const [country, language] = lang.split("-");

  const slug =
    SearchParams.slug ??
    (
      await GetProducts({
        language,
        country,
        offset: undefined,
        parsedFilters: {},
        currency: undefined,
      })
    )?.products?.[0]?.slug;
  if (!slug) notFound();

  const product = await GetGlobalProduct({ slug, language, country });
  // @ts-ignore
  if (!product?.id) notFound();

  // The real facts (rating, size fit) with the counts swapped for big ones.
  // @ts-ignore
  const realGeneral = await GetProductGeneralData({ id: product.id });
  const generalData = {
    ...(realGeneral || {}),
    ratingDetails: RATING_DETAILS,
    total_views: 10000,
    good_quality_product: true,
    recommendation_stats: RECOMMENDATION_STATS,
  };

  // `slug` is not a product option, so it does not go on to the sections.
  const { slug: _slug, ...productSearchParams } = SearchParams;

  return (
    <ProductPageContent
      params={{ lang, productId: slug }}
      searchParams={productSearchParams}
      fakeCounts={{
        generalData,
        buyersComments: {
          buyers_comments: FAKE_COMMENTS,
          filters_key: [],
          searchAfter: null,
        },
        recommendationStats: { stats: RECOMMENDATION_STATS },
        socialData: SOCIAL_DATA,
      }}
    />
  );
}

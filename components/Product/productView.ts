import { formatCount } from "utils/formatCount";
import {
  getBrandIconImageUrl,
  getConfiguredImage,
  GetImageUrl,
} from "utils/server/helpers";
import { formatTime, translateFunction } from "utils/server";
import { sanitizeHtml } from "utils/sanitizeHtml";
import { getColorImageGroups } from "components/Server/product/colorImageGroups";
import { productHasSizes } from "components/Server/product/productHasSizes";
import {
  SIZE_VOTE_GAP,
  type ProductColorView,
  type ProductView,
} from "components/DemoApp1/productData";
import {
  toQuestionCard,
  toReviewCard,
  type CardWords,
} from "components/DemoApp1/productCards";

/** The photo sizes the old slider and the old colour row asked for. */
const GALLERY_SIZE = { width: 500, height: 700 };
const TILE_SIZE = { width: 140, height: 196 };

const image = (src: unknown, size: { width: number; height: number }) =>
  getConfiguredImage({ src: GetImageUrl(src), ...size });

/** The colours with photos. A product with no colour rows has one with its own photos. */
function toColors(global: any): ProductColorView[] {
  const named = global?.sync_color_images ?? [];
  return getColorImageGroups(global).map((group) => {
    const color = named.find((c: any) =>
      group.keys.some((key) => key === c?.color_option || key === c?.color_name),
    );
    return {
      name: color?.color_name ?? "",
      key: color?.color_option ?? color?.color_name,
      keys: group.keys,
      tile: image(group.images[0], TILE_SIZE),
      photos: group.images.map((photo) => ({ src: image(photo, GALLERY_SIZE) })),
      trend: Boolean(color?.color_trend),
    };
  });
}

/** The product, in the shape the page draws (A-16). Runs on the server. */
export function toProductView({
  global,
  qty,
  general,
  reviews,
  questions,
  language,
}: {
  global: any;
  qty: any;
  general: any;
  reviews: any[];
  questions: any[];
  language: string;
}): ProductView {
  const buyers = (general?.ratingDetails ?? []).reduce(
    (sum: number, group: any) => sum + (group?.count ?? 0),
    0,
  );
  const stats = general?.recommendation_stats ?? [];
  const recommend = stats.find((s: any) => s.category === "recommend")?.count ?? 0;
  const notRecommend = stats.find((s: any) => s.category === "not_recommend")?.count ?? 0;
  const size = general?.size_analysis;
  const brand = global?.brand;
  const details = global?.details;
  const cardWords: CardWords = {
    date: (time) => formatTime(time, language),
    goodQuality: translateFunction("Good Quality", language),
    trueSize: translateFunction("True Size", language),
    dear: translateFunction("Dear", language),
  };
  const words = [global?.name, ...(global?.categories ?? []).map((c: any) => c?.name)];

  return {
    id: String(global?.id),
    mark: {
      name: brand?.name ?? "",
      logo: brand?.icon ? { src: getBrandIconImageUrl(brand.icon) } : undefined,
    },
    verified: Boolean(brand?.is_verified),
    words: words.filter(Boolean),
    colors: toColors(global),
    // The old page's rule: a text with a script in it is not shown at all.
    details: details && !details.includes("script") ? { html: sanitizeHtml(details) } : null,
    stats: {
      stars: Number(general?.final_rating) || 0,
      raters: buyers > 0 ? formatCount(buyers, language) : null,
      views: general?.total_views > 0 ? formatCount(general.total_views, language) : null,
      quality: Boolean(general?.good_quality_product) && buyers > 0,
      recommend: recommend > 0 ? formatCount(recommend, language) : null,
    },
    freeShipping: Number(qty?.shipping_cost) === 0,
    returnDays: Number(qty?.allow_return_in_days) || 0,
    reviews: reviews.map((comment) => toReviewCard(comment, cardWords)),
    questions: questions.map((comment) => toQuestionCard(comment, cardWords)),
    votes:
      recommend + notRecommend > 0
        ? {
            recommend: formatCount(recommend, language),
            notRecommend: formatCount(notRecommend, language),
            share: recommend / (recommend + notRecommend),
          }
        : null,
    sizeVotes: productHasSizes(qty)
      ? (
          [
            ["True", size?.true_percentage],
            ["Small", size?.small_percentage],
            ["Large", size?.large_percentage],
          ] as const
        ).map(([key, value]) => ({
          key,
          share: `${value ?? 0}%`,
          fill: (Number(value) || 0) / 100,
          gap: SIZE_VOTE_GAP[key],
        }))
      : null,
  };
}

/** The lines of "Product information": each descriptor group and its values. */
export function toInfoRows(qty: any): { label: string; values: string[] }[] {
  return (qty?.descriptors ?? []).map((descriptor: any) => ({
    label: descriptor?.descriptor_group?.name ?? "",
    values: (descriptor?.descriptors ?? []).map((sub: any) =>
      [sub?.descriptor?.name, sub?.value].filter(Boolean).join(" "),
    ),
  }));
}

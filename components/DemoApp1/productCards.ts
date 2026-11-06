import { convertTextToXFormat, GetImageUrl } from "utils/server/helpers";
import type { QuestionCardData, ReviewCardData } from "./productData";

/**
 * A review or a question, as Elasticsearch gives it, in the shape the cards
 * draw (Stage 7c). The first page is mapped on the server and the next pages
 * in the browser, by the same functions, so both give the same cards.
 *
 * Only `utils/server/helpers` is imported from utils: it is safe in client
 * bundles, unlike `utils/server` (which carries the translation tables). The
 * words and the date come in as `CardWords`, because each side has its own.
 */
export type CardWords = {
  date: (time: string) => string;
  goodQuality: string;
  trueSize: string;
  dear: string;
};

/** The old list's picture for a person with no photo. */
const NO_AVATAR = "/images/profileNoSmall.png";

export function toReviewCard(comment: any, words: CardWords): ReviewCardData {
  const facts = [
    comment?.good_quality_comment && words.goodQuality,
    comment?.true_size && words.trueSize,
  ].filter(Boolean);
  return {
    id: String(comment.id),
    name: convertTextToXFormat(comment?.customer?.name),
    avatar: GetImageUrl(comment?.customer?.image) ?? NO_AVATAR,
    date: words.date(comment?.created_at),
    variant: comment?.variant ?? "",
    text: comment?.comment ?? "",
    rating: Number(comment?.star_rating) || 0,
    facts: facts.join(" | "),
    recommends: Boolean(comment?.recommendation),
    like: {
      commentId: String(comment.id),
      targetType: "comment",
      productId: String(comment?.product_id),
      liked: Boolean(comment?.is_liked),
      likes: Number(comment?.total_likes) || 0,
    },
  };
}

/** The seller's time to answer, in minutes. The card shows it under an hour only. */
function answerMinutes(asked?: string, answered?: string): number | null {
  const minutes = Math.round(
    (new Date(answered ?? "").getTime() - new Date(asked ?? "").getTime()) / 60000,
  );
  return minutes >= 0 && minutes < 60 ? minutes : null;
}

export function toQuestionCard(comment: any, words: CardWords): QuestionCardData {
  const buyer = convertTextToXFormat(comment?.customer?.name);
  const productId = String(comment?.product_id);
  return {
    id: String(comment.id),
    name: buyer,
    avatar: GetImageUrl(comment?.customer?.image) ?? NO_AVATAR,
    date: words.date(comment?.created_at),
    variant: comment?.variant ?? "",
    text: comment?.comment ?? "",
    like: {
      commentId: String(comment.id),
      targetType: "comment",
      productId,
      liked: Boolean(comment?.is_liked),
      likes: Number(comment?.total_likes) || 0,
    },
    answer: comment?.has_reply
      ? {
          name: convertTextToXFormat(comment?.seller_name),
          avatar: NO_AVATAR,
          greeting: `${words.dear} ${buyer}`,
          date: words.date(comment?.reply_created_at),
          text: comment?.seller_reply ?? "",
          minutes: answerMinutes(comment?.created_at, comment?.reply_created_at),
          like: {
            commentId: `${comment.id}-seller_reply`,
            targetType: "seller_reply",
            productId,
            liked: Boolean(comment?.reply_is_liked),
            likes: Number(comment?.reply_total_likes) || 0,
          },
        }
      : null,
  };
}

import type { ListingMark } from "./listingData";

/**
 * The product page's data (Stage 7c of UI-MIGRATION-PLAN.md, A-16, A-33).
 *
 * Plain types with no React in them. The real page reads the product on the
 * server and maps it here (components/Product/productView.ts); `/demo` maps
 * its mock product into the same shape. `screens/ProductPage.tsx` draws it.
 */

/** A photo of the gallery. `srcSet` is only set where a bigger cut exists. */
export type ProductPhoto = { src: string; srcSet?: string };

/** One colour of the product. */
export type ProductColorView = {
  /** The colour's name, in the page's language. */
  name: string;
  /** What the page's address calls the colour (`?color=`). */
  key?: string;
  /** Every value of `?color=` that picks this colour. */
  keys: readonly string[];
  /** The photo of its 70 x 98 tile. */
  tile: string;
  photos: readonly ProductPhoto[];
  /** The backend marks this colour as a trend (`color_trend`). */
  trend: boolean;
};

/** What a card's heart reads and writes. */
export type CardLike = {
  commentId: string;
  targetType: "comment" | "seller_reply";
  productId: string;
  liked: boolean;
  likes: number;
};

/** A review card. */
export type ReviewCardData = {
  id: string;
  /** The buyer's name, with its letters hidden. */
  name: string;
  avatar: string;
  date: string;
  /** The size and colour the buyer bought. */
  variant: string;
  text: string;
  rating: number;
  /** The line after the stars: "Good Quality | True Size". */
  facts: string;
  recommends: boolean;
  like: CardLike;
};

/** The seller's answer in a question card. */
export type AnswerData = {
  name: string;
  avatar: string;
  /** The line under the name. */
  greeting: string;
  date: string;
  text: string;
  /** The minutes the seller took. Null: the card shows no time. */
  minutes: number | null;
  like: CardLike;
};

/** A question card. A question with no answer shows only its top half (S7c-6). */
export type QuestionCardData = {
  id: string;
  name: string;
  avatar: string;
  date: string;
  variant: string;
  text: string;
  like: CardLike;
  answer: AnswerData | null;
};

/** One of the three size bars: its label, its share and how full the bar is. */
export type SizeVote = {
  key: "True" | "Small" | "Large";
  share: string;
  fill: number;
  /** The file's room between the label and the share. */
  gap: number;
};

export type ProductView = {
  id: string;
  /** The mark in the header and over the name: the product's brand. */
  mark: ListingMark;
  verified: boolean;
  /** The words of the name, before the colour. */
  words: readonly string[];
  colors: readonly ProductColorView[];
  /** The text under the name: the seller's safe HTML, or a plain line. */
  details: { html: string } | { text: string } | null;
  /** The rating row. A null part is not shown. */
  stats: {
    stars: number;
    raters: string | null;
    views: string | null;
    quality: boolean;
    recommend: string | null;
  };
  freeShipping: boolean;
  /** The days a buyer has to send it back. 0: no return block. */
  returnDays: number;
  reviews: readonly ReviewCardData[];
  questions: readonly QuestionCardData[];
  /** The recommend bar. Null: no buyer has voted. */
  votes: { recommend: string; notRecommend: string; share: number } | null;
  /** The size bars. Null: the product has no sizes. */
  sizeVotes: readonly SizeVote[] | null;
};

/** A line of the page with marks (<b>, <m>, <a>, <c>) and `{name}` values. */
export type RichLine = {
  text: string;
  values?: Record<string, string | number>;
};

/** The file's room between a size label and its share. */
export const SIZE_VOTE_GAP = { True: 5, Small: 3, Large: 3 } as const;

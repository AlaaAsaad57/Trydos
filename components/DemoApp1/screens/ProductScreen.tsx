"use client";

import React, { useState } from "react";
import {
  PRODUCT_STATS,
  RECOMMEND_SHARE,
  REVIEWER,
  SIZE_VOTES,
  colorTileOf,
  galleryOf,
  openColorOf,
  gallerySrcSet,
  ringPhotoOf,
  titleWords,
  videoPosterOf,
} from "../../DemoApp/demoProduct";
import {
  productById,
  storeBySlug,
  type DemoProduct,
  type DemoStore,
} from "../../DemoApp/demoStores";
import { useDemoNav } from "../Demo1Shell";
import { useDemoCase } from "../demoCase";
import type { CardLike, ProductView } from "../productData";
import type { T } from "./ListingParts";
import { useLike } from "./LikeHeart";
import { FixedLikes, ProductPage, Rich, type CardLikesProps } from "./ProductPage";
import ProductBuy, { type BuySize, type BuyView } from "./ProductBuy";
import { demoCard } from "./ListingScreen";
import type { DemoKey } from "../../DemoApp/demoKeys";
import XdIcon from "../../DemoApp/XdIcon";

/** The file's sizes, in order. The word is the one the bar's chip uses ("Medium"). */
const SIZES: readonly { code: string; number: number; word: DemoKey }[] = [
  { code: "XXS", number: 32, word: "XX Small" },
  { code: "XS", number: 34, word: "X Small" },
  { code: "S", number: 36, word: "Small" },
  { code: "M", number: 38, word: "Medium" },
  { code: "L", number: 40, word: "Large" },
  { code: "XL", number: 42, word: "X Large" },
  { code: "XXL", number: 44, word: "XX Large" },
];

/** The file's story: S is sold out (`– 67`), M is the size it recommends (`– 57`), "last 2". */
const SOLD_OUT = 2;
const RECOMMENDED = 3;
const STOCK = 2;

/** The file's prices: the bar and the card show them for every product. */
const PRICE = { was: "200", now: "160" } as const;

/** The file's numbers under the bar's marks. */
const COUNTS = { likes: "110k", comments: "11k", shares: "2" } as const;

/** The buy bar's data on `/demo`: the file's story for every product. */
function toDemoBuy(product: DemoProduct, store: DemoStore, notified: ReadonlySet<number>, t: T): BuyView {
  const sizes = SIZES.map(
    (size, i): BuySize => ({
      code: size.code,
      number: String(size.number),
      word: t(size.word),
      stock: i === SOLD_OUT ? 0 : STOCK,
      notified: notified.has(i),
      price: PRICE,
    }),
  );
  return {
    card: demoCard(product, store, "", t),
    sizes: product.colors.map(() => sizes),
    recommended: product.colors.map(() => RECOMMENDED),
    rings: product.colors.map((color) => ringPhotoOf(color)),
    price: PRICE,
    currency: t(product.currency),
    counts: COUNTS,
  };
}

/** The demo's avatar, the file's own picture. */
const AVATAR = "/assets/demo/product/avatar.webp";

const NO_LIKE: CardLike = {
  commentId: "",
  targetType: "comment",
  productId: "",
  liked: false,
  likes: 0,
};

/** Likes that stay on the page: the demo has no backend. */
const DemoLikes = ({ top, t }: CardLikesProps) => <FixedLikes top={top} t={t} />;

/** The mock product, in the shape the page draws (A-16). */
function toDemoView(product: DemoProduct, store: DemoStore, colorIndex: number, t: T, body: T): ProductView {
  const color = product.colors[colorIndex];
  const words = titleWords(product, color).map((word) => t(word));
  const cardText = body(
    "Amazing product I buy it and I saw it is good quality regarding price Amazing product I buy it and I saw it is good quality regardin",
  );
  const question = {
    id: "question",
    name: REVIEWER,
    avatar: AVATAR,
    date: t("18 feb"),
    variant: t("Medium | Bule"),
    text: cardText,
    like: NO_LIKE,
  };
  const answer = {
    name: store.name,
    avatar: AVATAR,
    greeting: t("Medium | Bule"),
    date: t("18 feb"),
    text: cardText,
    minutes: 13,
    like: NO_LIKE,
  };
  return {
    id: product.id,
    mark: store,
    verified: true,
    // The name's last word is the colour on show: the page adds it.
    words: words.slice(0, -1),
    colors: product.colors.map((c, i) => ({
      name: i === colorIndex ? words[words.length - 1] : t(c.name),
      keys: [],
      tile: colorTileOf(c),
      photos: galleryOf(product, i).map((src) => ({ src, srcSet: gallerySrcSet(src) })),
      trend: true,
    })),
    details: {
      text: body("Stay cool and chic in this airy women’s summer top, featuring a comfortable fit and fresh seasonal prints"),
    },
    stats: {
      stars: PRODUCT_STATS.stars,
      raters: String(PRODUCT_STATS.raters),
      views: PRODUCT_STATS.views,
      quality: true,
      recommend: String(PRODUCT_STATS.recommend),
    },
    freeShipping: true,
    returnDays: 3,
    reviews: [
      {
        id: "review",
        name: REVIEWER,
        avatar: AVATAR,
        date: t("18 feb"),
        variant: t("Medium | Bule"),
        text: cardText,
        rating: PRODUCT_STATS.stars,
        facts: t("Good quality | Ture size"),
        recommends: true,
        like: NO_LIKE,
      },
    ],
    questions: [
      { ...question, id: "question-1", answer },
      { ...question, id: "question-2", answer },
    ],
    votes: {
      recommend: String(PRODUCT_STATS.recommend),
      notRecommend: String(PRODUCT_STATS.notRecommend),
      share: RECOMMEND_SHARE,
    },
    sizeVotes: SIZE_VOTES,
  };
}

/**
 * A product's page on `/demo`, at /[lang]/demo/store/<slug>/<product id>:
 * the design (`ProductPage`) with the mock product. The real page is
 * `AppProduct`.
 */
export default function ProductScreen({ slug, id }: { slug: string; id: string }) {
  // Labels in Apple's title style, body text in sentence style (demoCase).
  const { t, body } = useDemoCase();
  const { back, navigate } = useDemoNav();
  const like = useLike();
  const product = productById(id);
  const store = storeBySlug(slug);
  // The colour the tapped card showed; from the server, the product's own colour.
  const [colorIndex, setColorIndex] = useState(() => openColorOf(id) ?? product?.selected ?? 0);
  const [buying, setBuying] = useState(false);
  /** The sizes the shopper asked to be told about: the demo keeps them on this screen. */
  const [notified, setNotified] = useState<ReadonlySet<number>>(new Set());
  if (!product || !store) return null;
  const poster = videoPosterOf(galleryOf(product, colorIndex));

  return (
    <>
      <ProductPage
        t={t}
        body={body}
        view={toDemoView(product, store, colorIndex, t, body)}
        picked={colorIndex}
        onPick={setColorIndex}
        onBack={back}
        heart={like}
        lines={{
          delivery: { text: t("Monday <m>2.jun </m>| <m>3</m> work days in your hands in <m>Lebanon</m>") },
          inHands: { text: t("<m>just {days} days</m> In your hands"), values: { days: 3 } },
          arrives: { text: t("<b>2.jun</b> in lebanon") },
          returnText: {
            text: body(
              "Within <m>3 days</m> after receiving the product, you can return it without conditions or reasons with complete ease and \n<a>get the amount back </a>to your wallet",
            ),
          },
        }}
        info={[
          <Rich key="pattern" text={t("pattern<m> | Fit Slim</m>")} />,
          <Rich key="occasions" text={t("Suitable occasions<m> | Birthday</m> <b>.</b> <m>Casual</m> <b>.</b> <m>Business</m>")} />,
          <Rich key="material" text={t("material <m>|</m> <m>polyester</m> <m>97%</m> <b>.</b> <m>elastane</m> <m>3%</m>")} />,
        ]}
        origin={{ mark: <XdIcon name="productFlagTr" />, text: t("made in turkey") }}
        video={
          <img
            src={poster}
            alt=""
            width={121}
            height={170}
            draggable={false}
            decoding="async"
            className="block w-full h-full object-cover select-none"
          />
        }
        Likes={DemoLikes}
        onChat={() => navigate("chat")}
        filePicture
        boardHeight
      />
      <ProductBuy
        view={toDemoBuy(product, store, notified, t)}
        colorIndex={colorIndex}
        onColor={setColorIndex}
        open={buying}
        onOpen={setBuying}
        heart={like}
        actions={{
          add: () => true,
          remove: () => true,
          notify: (size) =>
            setNotified((now) => {
              const next = new Set(now);
              if (!next.delete(size)) next.add(size);
              return next;
            }),
        }}
      />
    </>
  );
}

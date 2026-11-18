"use client";

import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "store";
import { getProductDataForAddToCart } from "serverRequests";
import { getCart, LogError, RoundPrice } from "utils/functions";
import { formatCount } from "utils/formatCount";
import {
  addOne,
  bagLineOf,
  buyOpened,
  notifyMe,
  readStock,
  removeChangedLine,
  sizePicked,
  takeOne,
  withNotified,
  withStock,
  type BuyPick,
  type PriceChange,
} from "components/Cart/buyActions";
import { sizesOf, toBuyView } from "../buyData";
import type { ProductView } from "../productData";
import type { T } from "./ListingParts";
import ProductBuy, { type BuyHeart } from "./ProductBuy";

// Opens only when a new line costs more or less than the bar showed: its own chunk.
const AskSheet = dynamic(() => import("./AskSheet"), { ssr: false });

/** The luck price has no place in the design (A-33), so the bar does not offer it. */
const noLuck = (product: any) => ({ ...product, is_luck: false });

/**
 * The buy bar and the size sheet on the real product page (Stage 7d): the
 * design (ProductBuy, XD `Listing page – 154` and `Home Page – 57` on) with the
 * live product.
 *
 *  - the price, the sizes and their stock are the product's
 *    (`qtyPriceDetails`). The first open reads them again with the shopper's
 *    notify flags, as the old add sheet did;
 *  - the recommended size is the first size in stock, and "last N" is its
 *    stock (S7d-10);
 *  - Add to bag, Buy now, Remove, Add More and Notify Me are the old sheet's
 *    taps, with their requests and events (components/Cart/buyActions);
 *  - the marks: the page's like, the reviews and the shares, with their
 *    real counts (S7d-9). A tap on the comment mark goes to the reviews; the
 *    share mark opens the old share sheet;
 *  - the size tabs past the first say "Soon available": there is no size chart.
 *
 * A new line that costs something else than the bar showed asks the shopper:
 * keep it at the new price, or take the line out (the old price prompt, in the
 * new design's style, S7d-11).
 */
export default function AppProductBuy({
  lang,
  slug,
  product: first,
  view,
  picked,
  onPick,
  heart,
  counts,
  onComments,
  onShare,
  onSoon,
  away,
  t,
}: {
  lang: string;
  slug: string;
  /** The old sheet's `ProductData`, as the server read it. */
  product: any;
  view: ProductView;
  picked: number;
  onPick: (index: number) => void;
  heart: BuyHeart & { likes: number };
  /** The review count (the comment mark, S7d-9) and the share count. */
  counts: { comments: number; shares: number };
  onComments: () => void;
  onShare: () => void;
  onSoon: () => void;
  /** An old sheet of the page is open: the bar steps away. */
  away: boolean;
  t: T;
}) {
  const [country, language] = lang.split("-");
  const [product, setProduct] = useState(() => noLuck(first));
  const [open, setOpen] = useState(false);
  const [priceChange, setPriceChange] = useState<PriceChange | null>(null);
  const [removing, setRemoving] = useState(false);
  /** The fresh read with the notify flags has been asked for. */
  const read = useRef(false);
  /** The shopper changed the size before the tap (the old `add_to_cart` field). */
  const sizeChanged = useRef(false);
  const colorAtOpen = useRef(picked);
  const localCart = useAppStore((s) => s.localCart) as any[];
  const currency = useAppStore((s) => s.currency) as any;

  const keys = view.colors[picked]?.keys ?? [];
  const sizes = sizesOf(product);
  const pickOf = (index: number): BuyPick => ({
    product,
    colorKeys: keys,
    size: sizes[index] ?? null,
    colorChanged: picked !== colorAtOpen.current,
    sizeChanged: sizeChanged.current,
  });
  const quantity = (line: any) => Number(line?.quantity) || 0;

  const money = (value: number) =>
    `${RoundPrice({
      charged: true,
      num: value,
      rate: currency?.exchange_rate,
      points: currency?.decimal_digits,
      language,
    })} ${currency?.symbol ?? ""}`.trim();

  const buy = toBuyView({
    product,
    colors: view.colors,
    words: view.words,
    mark: view.mark,
    currency: currency?.symbol ?? "",
    counts: {
      likes: formatCount(heart.likes, language),
      comments: formatCount(counts.comments, language),
      shares: formatCount(counts.shares, language),
    },
    oneSize: t("One Size"),
    round: (value) =>
      String(RoundPrice({ num: value, rate: currency?.exchange_rate, points: currency?.decimal_digits })),
  });

  /** The first open: the bag and the product again, with the shopper's notify flags (the old sheet's read). */
  const readAgain = async () => {
    if (read.current) return;
    read.current = true;
    getCart({ callback: ([data]) => useAppStore.getState().initCart(data ?? { cart: [] }) });
    try {
      const data: any = await getProductDataForAddToCart({ language, country, slug });
      setProduct((now) =>
        noLuck({
          ...now,
          ...data,
          sync_color_images: data?.sync_color_images || now?.sync_color_images || [],
        }),
      );
    } catch (error) {
      LogError({ error, scenario: "reading the product again for the buy bar - AppProductBuy", slug, url: window.location.href });
    }
  };

  /** A failed request: the stock on the page may be wrong, so it is read again. */
  const stockAgain = async () => {
    try {
      const fresh = await readStock(slug, product);
      setProduct(noLuck(fresh));
    } catch (error) {
      LogError({ error, scenario: "reading the stock again for the buy bar - AppProductBuy", slug });
    }
  };

  return (
    <>
      <ProductBuy
        view={buy}
        colorIndex={picked}
        onColor={onPick}
        open={open}
        onOpen={(now) => {
          if (now) colorAtOpen.current = picked;
          setOpen(now);
        }}
        heart={heart}
        away={away}
        held={{
          size: (index) => quantity(bagLineOf(pickOf(index))),
          product: localCart.filter((line) => String(line?.id) === String(product?.id)).reduce((sum, line) => sum + quantity(line), 0),
          bag: localCart.reduce((sum, line) => sum + quantity(line), 0),
        }}
        actions={{
          add: async (index) => {
            const pick = pickOf(index);
            const answer = await addOne(pick);
            if (!answer.ok) {
              void stockAgain();
              return false;
            }
            setProduct((now) => withStock(now, pick, -1));
            if (answer.priceChange) {
              setPriceChange(answer.priceChange);
              void stockAgain();
            }
            return true;
          },
          remove: async (index) => {
            const pick = pickOf(index);
            const done = await takeOne(pick);
            if (!done) {
              void stockAgain();
              return false;
            }
            setProduct((now) => withStock(now, pick, 1));
            return true;
          },
          notify: (index) => {
            const pick = pickOf(index);
            void notifyMe(pick).then((done) => {
              if (done) setProduct((now) => withNotified(now, pick));
            });
          },
          onPick: (index) => {
            sizeChanged.current = true;
            sizePicked(pickOf(index));
          },
          onOpened: () => {
            buyOpened(product);
            void readAgain();
          },
          onComments,
          onShare,
          onSoon,
        }}
      />
      {priceChange && (
        <AskSheet
          open
          testId="price-changed-modal"
          title={t("Price Changed")}
          text={t("Price changed from {from} to {to}")
            .replace("{from}", money(priceChange.from))
            .replace("{to}", money(priceChange.to))}
          // Continue keeps the item at the new price, as a tap on the dimmed page does.
          main={{ label: t("Continue"), onPress: () => setPriceChange(null), testId: "price-changed-modal-continue" }}
          other={{
            label: t("Remove"),
            busy: removing,
            danger: true,
            testId: "price-changed-modal-remove",
            onPress: async () => {
              if (removing) return;
              setRemoving(true);
              const done = await removeChangedLine(priceChange, product);
              setRemoving(false);
              if (!done) return;
              setPriceChange(null);
              // The whole line left, not one piece: the stock is read again.
              void stockAgain();
            },
          }}
          onClose={() => setPriceChange(null)}
        />
      )}
    </>
  );
}

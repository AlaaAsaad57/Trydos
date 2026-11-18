"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import {
  areProductsEqual,
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { getBrandIconImageUrl, GetImageUrl } from "utils/server/helpers";
import { cartLineUnitPrice, showedPriceChange } from "utils/cart/pricing";
import {
  formatOldCartCountdown,
  getOldCartRemainingMs,
} from "utils/cart/oldCartTimer";
import { unitKey } from "components/products/packInfo";
import type { BagItemView, BagLabel, BagView } from "./bagView";

/*
  The shopper's real bag, as the bag design draws it (Stage 7d, A-16).

  It reads the store the old bag fills (`cart`, `oldCart`, the sums of
  `/cart/cart_shipping`) and maps them into a BagView. The actions are in
  components/Cart/bagActions.ts. Nothing here is mock data.

  The rules come from the old bag (components/Cart):
   - a line's price: one piece's price (the luck price, the offer, or the
     price) times the quantity, by the price rule the bag charges with
     (RoundPrice, `charged`);
   - the sum: `total`, and `total + total_discount` struck through when an
     offer lowers it (OrderButton);
   - "Hurry up": the stock left (`have_hurry_up_notify_qty`, `qty_left`), or
     the time left (`have_hurry_up_notify_time_left`, `time_left_in_minutes`,
     counted from the moment the bag first showed the line, as the old Timer);
   - why a line cannot be bought (CartItem): not in this country, not
     active, out of stock;
   - Out of Bag: the old cart's lines that are not in the cart, with the
     30-minute window from `created_at` (utils/cart/oldCartTimer).

  The labels "Best price" and "Best sell" are fixed words (S7d-8): the cart
  has no source for them. The cart has no trend colour and no return days, so
  the bag shows no "Trend" label and no "Free Return" detail.
*/

/** The file's "! Best price last 3 days!" (S7d-8: fixed words). */
const FIXED_LABELS: readonly BagLabel[] = [{ kind: "best", days: 3 }, { kind: "sell" }];

/** The photo's size in the media server's resize: the 80 x 120 box at 2x. */
const PHOTO = { width: 160, height: 240 } as const;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** A line's colour and size, as the backend sends them (one object, or a list with one). */
function variationOf(line: any): any {
  return Array.isArray(line?.variations) ? (line.variations[0] ?? {}) : (line?.variations ?? {});
}

/**
 * When each "time running out" ends, from the moment the bag first showed it
 * (the old Timer started at `time_left_in_minutes` when it was drawn). Kept
 * out of React, so a page that comes back keeps counting from the same end.
 */
const deadlines = new Map<string, number>();

/** "12:30": minutes and seconds. */
const clock = (ms: number) => formatOldCartCountdown(ms);

export type RealBag = {
  /** The cart is being read: the screen shows its skeleton. */
  loading: boolean;
  /** The cart could not be read: the backend's message. */
  error: string | null;
  view: BagView;
  /** The store's line for an id of the view (the actions take the line). */
  line: (id: string) => any;
  /** The old cart's line for an id of the view's Out of Bag list. */
  oldLine: (id: string) => any;
};

export function useBagData(): RealBag {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "sy-en";
  const language = lang.split("-")[1] ?? "en";
  const cart = useAppStore((s) => s.cart) as any[];
  const oldCart = useAppStore((s) => s.oldCart) as any;
  const currency = useAppStore((s) => s.currency) as any;
  const loading = useAppStore((s) => s.cart_loading) as boolean;
  const error = useAppStore((s) => s.cartShippingSuccess) as string | null;
  const settings = useAppStore((s) => s.settings) as any;
  const total = useAppStore((s) => s.total) as number | null;
  const totalDiscount = useAppStore((s) => s.total_discount) as number | null;
  const shippingCost = useAppStore((s) => s.total_shipping_cost) as number | null;

  const [now, setNow] = useState(() => Date.now());

  const lines = Array.isArray(cart) ? cart : [];
  const oldLines = (Array.isArray(oldCart?.oldCart) ? oldCart.oldCart : []).filter(
    (old: any) => !lines.some((line) => areProductsEqual(old, line)),
  );

  const deadlineOf = (line: any): number | null => {
    if (!line?.have_hurry_up_notify_time_left) return null;
    const minutes = Number(line?.time_left_in_minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    const key = `${line.id}:${minutes}`;
    if (!deadlines.has(key)) deadlines.set(key, Date.now() + minutes * 60_000);
    return deadlines.get(key) ?? null;
  };

  // A timer is on show: the bag draws again every second, so the times count down.
  const ticking =
    lines.some((line) => deadlineOf(line) !== null) ||
    oldLines.some((old: any) => getOldCartRemainingMs(old?.created_at) > 0);
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  const money = (num: number, plain = false) =>
    String(
      RoundPrice({
        charged: true,
        num,
        rate: currency?.exchange_rate,
        points: currency?.decimal_digits,
        language,
        returnNumber: plain || undefined,
      }),
    );
  const symbol = currency?.symbol ?? currency?.sumbol ?? "";
  const t = (key: string) => translateFunction(key, language);

  const common = (line: any, unitPrice: number): Omit<BagItemView, "labels"> => {
    const variation = variationOf(line);
    const brand = line?.brand;
    const icon = brand?.icon?.file_path ?? brand?.icon;
    const logo = icon ? getBrandIconImageUrl(icon, { width: 200, height: 30 }) : "";
    const qty = Number(line?.quantity) || 1;
    const pieces = Number(line?.count_of_pieces);
    return {
      id: String(line?.id),
      photo: line?.image ? getConfiguredImage({ ...PHOTO, src: GetImageUrl(line.image) }) : "",
      name: [text(line?.name), text(line?.category_name)].filter(Boolean),
      mark: { name: text(brand?.name) || text(line?.shop?.name), logo: logo ? { src: logo } : undefined },
      color: text(variation?.color ?? variation?.color_options),
      size: text(variation?.Size ?? variation?.size_options),
      pieces: Number.isFinite(pieces) && pieces > 0 ? `${pieces} ${t(unitKey(line?.unit))}` : "",
      qty,
      price: money(unitPrice * qty),
      currency: symbol,
    };
  };

  const items: BagItemView[] = lines.map((line) => {
    const labels: BagLabel[] = [...FIXED_LABELS];
    if (line?.have_hurry_up_notify_qty)
      labels.push({ kind: "hurry", time: String(line?.qty_left ?? "") });
    const deadline = deadlineOf(line);
    if (deadline !== null && deadline > now)
      labels.push({ kind: "hurryTime", time: clock(deadline - now) });
    const change = showedPriceChange(line);
    let problem: string | undefined;
    if (line?.is_country_restricted === true) problem = t("Not Available In Your Country");
    else if (line?.is_active === false) problem = t("Not Available Now");
    else if (!line?.check_availability) problem = t("Out Of Stock");
    if (!problem && change)
      problem = t("Price changed from {from} to {to}")
        .replace("{from}", `${money(change.from)} ${symbol}`.trim())
        .replace("{to}", `${money(change.to)} ${symbol}`.trim());
    return {
      ...common(line, Number(cartLineUnitPrice(line))),
      labels,
      problem,
    };
  });

  const out: BagItemView[] = oldLines.map((old: any) => {
    const left = getOldCartRemainingMs(old?.created_at);
    const unitPrice = Number(old?.offer_price) > 0 ? Number(old.offer_price) : Number(old?.price ?? old?.unit_price) || 0;
    return {
      ...common(old, unitPrice),
      labels: [],
      outTime: left > 0 ? clock(left) : "",
    };
  });

  // The days to the shopper's hands: the longest line's, as the old bag adds them.
  const extraDays = Number(settings?.["starting_setting"]?.shipping_duration_days) || 0;
  const days = Math.max(0, ...lines.map((line) => (Number(line?.shipping_days) || 0) + extraDays));
  const sum = Number(total) || 0;
  const discount = Number(totalDiscount) || 0;

  return {
    loading,
    error: error ?? null,
    view: {
      items,
      out,
      sums: {
        count: items.reduce((n, item) => n + item.qty, 0),
        total: money(sum, true),
        was: discount > 0 ? money(sum + discount, true) : null,
        currency: symbol,
        freeShipping: lines.length > 0 && Number(shippingCost) === 0,
        freeReturn: false,
        days: days > 0 ? days : null,
      },
    },
    line: (id) => lines.find((line) => String(line?.id) === id),
    oldLine: (id) => oldLines.find((old: any) => String(old?.id) === id),
  };
}

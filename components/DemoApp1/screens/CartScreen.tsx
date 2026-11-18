"use client";

import { useDemoData } from "../../DemoApp/DemoData";
import {
  addAgain,
  addOne,
  bagCount,
  bagLook,
  bagTotal,
  bagWas,
  inBag,
  outOfBag,
  takeOne,
  type DemoBagItem,
} from "../../DemoApp/demoBag";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import type { BagItemView, BagView } from "../bagView";
import type { T } from "./ListingParts";
import { BagPage } from "./BagPage";
/**
 * The bag on /demo: the demo's bag, drawn by the design (BagPage). The real
 * app draws the shopper's cart with the same design (AppCart).
 */
export default function CartScreen() {
  const { navigate } = useDemoNav();
  const { bag, updateBag } = useDemoData();
  const { t } = useDemoCase();
  return (
    <BagPage
      bag={demoBagView(bag, t)}
      onTake={(id) => updateBag((now) => takeOne(now, id))}
      onAdd={(id) => updateBag((now) => addOne(now, id))}
      onAddAgain={(id) => updateBag((now) => addAgain(now, id))}
      onConfirm={() => navigate("cart/checkout")}
      t={t}
    />
  );
}

/** The demo's item as the design draws it: its words in the page's language. */
function demoItemView(item: DemoBagItem, t: T): BagItemView {
  const { product, store, color, photo } = bagLook(item);
  return {
    id: item.id,
    photo,
    name: product.name.map((word) => t(word)),
    mark: store,
    color: t(color.name),
    size: `${t(item.size.word)} ${item.size.number}`,
    pieces: t("{count} piece").replace("{count}", String(item.pieces)),
    qty: item.qty,
    price: String(item.qty * item.price),
    currency: t("USD"),
    labels: item.labels,
    outTime: item.outTime,
  };
}

/** The demo's bag as the design draws it. The file's details are all on. */
export function demoBagView(bag: readonly DemoBagItem[], t: T): BagView {
  return {
    items: inBag(bag).map((item) => demoItemView(item, t)),
    out: outOfBag(bag).map((item) => demoItemView(item, t)),
    sums: {
      count: bagCount(bag),
      total: String(bagTotal(bag)),
      was: String(bagWas(bag)),
      currency: t("USD"),
      freeShipping: true,
      freeReturn: true,
      days: 3,
    },
  };
}


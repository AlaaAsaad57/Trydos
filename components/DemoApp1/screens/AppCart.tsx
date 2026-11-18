"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { translateFunction } from "utils/functions";
import {
  addOldLineAgain,
  beginCheckout,
  lowerLine,
  openBag,
  raiseLine,
  retryBag,
} from "components/Cart/bagActions";
import CartErrorComponent from "components/Cart/CartErrorComponent";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import { useBagData } from "../useBagData";
import { BagSkeleton } from "../ScreenSkeleton";
import { BagPage } from "./BagPage";

// Opens only when the core backend refuses a raise on stock: its own chunk.
const BagNotifySheet = dynamic(() => import("./BagNotifySheet"), { ssr: false });

/**
 * The bag on the real app: `/[lang]/cart` (Stage 7d).
 *
 * The design is BagPage (XD `Home Page – 50`). The data is the shopper's
 * real cart (useBagData), and each tap is the old bag's own action
 * (components/Cart/bagActions), with its requests and its events.
 *
 *  - The bin takes one away; on the last one it takes the line out.
 *  - The plus adds one, up to the line's cap. When the core backend refuses
 *    on stock, the bag offers "Notify Me" (the old prompt in the new
 *    design's style, S7d-11).
 *  - "ADD AGAIN" puts an Out of Bag line back into the bag.
 *  - "Confirm & continue" sends the old checkout events and opens the
 *    checkout.
 *
 * While the cart is read for the first time the screen shows the bag's
 * skeleton. A failed read shows the old error with its retry (the design has
 * no board for it).
 */
export default function AppCart() {
  const { navigate, locale } = useDemoNav();
  const { t } = useDemoCase();
  const bag = useBagData();
  /** The lines with a request on its way: their buttons wait. */
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  /** The line the core backend refused to raise: the "Notify Me" prompt is open for it. */
  const [notifyFor, setNotifyFor] = useState<any>(null);
  /** True once the first read answered, so a later read keeps the rows on show. */
  const [read, setRead] = useState(false);

  useEffect(() => {
    void openBag().finally(() => setRead(true));
  }, []);

  const run = async (id: string, job: () => Promise<void>) => {
    if (busy.has(id)) return;
    setBusy((now) => new Set(now).add(id));
    try {
      await job();
    } finally {
      setBusy((now) => {
        const next = new Set(now);
        next.delete(id);
        return next;
      });
    }
  };

  const empty = bag.view.items.length === 0 && bag.view.out.length === 0;
  if (!read && empty) return <BagSkeleton />;
  if (bag.error && !bag.loading)
    return (
      <div data-pw="app-cart-error" className="w-full min-h-dvh bg-white">
        <CartErrorComponent errorMessage={bag.error} onRetry={() => void retryBag()} />
      </div>
    );

  const view = {
    ...bag.view,
    items: bag.view.items.map((item) => (busy.has(item.id) ? { ...item, busy: true } : item)),
    out: bag.view.out.map((item) => (busy.has(item.id) ? { ...item, busy: true } : item)),
  };
  const language = locale.split("-")[1] ?? "en";

  return (
    <>
      <BagPage
        bag={view}
        onTake={(id) => void run(id, () => lowerLine(bag.line(id)))}
        onAdd={(id) => {
          const line = bag.line(id);
          void run(id, () => raiseLine(line, () => setNotifyFor(line)));
        }}
        onAddAgain={(id) => void run(id, () => addOldLineAgain(bag.oldLine(id)))}
        onConfirm={() => {
          beginCheckout();
          navigate("cart/checkout");
        }}
        t={t}
      />
      {notifyFor && (
        <BagNotifySheet
          line={notifyFor}
          translate={(key: string) => translateFunction(key, language)}
          onClose={() => setNotifyFor(null)}
        />
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData, type DemoPaymentMethod } from "../../DemoApp/DemoData";
import { useDemoCase } from "../demoCase";
import { C, SHEET, fill, lineBox, paraTop, textBottom, textTop } from "../demo1Layout";
import { Sheet, Stroke, WhyCard } from "../ui";
import {
  BACK,
  BRAND,
  CARD_X,
  CHIP_GREY,
  CHOICE_H,
  Chip,
  ChoiceCard,
  FADE,
  HANDLE_END,
  METHOD_H,
  ROOM,
  ROOM_WHY,
  SHEET_Y,
  SHEET_Z,
  STEP_SLIDE,
  SheetDone,
  TITLE,
  WHY,
  useDoneRoom,
} from "./DeliveryMethodSheet";
import { Rich, type T } from "./ListingParts";
import PayWays from "./PayWays";
import { Brand, WithBank } from "./WalletCashOutSheet";

/**
 * The payment method sheet of the checkout, opened by "Choose Payment
 * Method" (`Home Page – 75`). The same sheet as the delivery method sheet
 * (y 90, round 50). Two steps, as two boards of the file:
 *
 *  - `– 73`, the ways: the 30 px phone at (24, 114) and "Payment Method"
 *    (24 Bold) on baseline 138, centred, with the line under it (14, two
 *    lines on 170 and 188); the wallet card, 390 x 188 at (20, 212): "Your
 *    Balance 120 USD" at its top left, "Recommended" at its top right, the
 *    wallet picture, "trydos Wallet" (30) and the purple "Easy . Fast . No
 *    Commission"; the trydos | rdb card at (20, 408) with "Pay Invoice at
 *    Centers or Request Online Pay"; the row of ways at y 604, as the
 *    wallet's ways to cash in (PayWays); "Done", grey.
 *  - `– 79`, after a tap on the trydos | rdb card: a back arrow, the phone
 *    at x 53 and "Payment Option"; the same line; the trydos | rdb card at
 *    y 212; the two ways to pay with rdb, 390 x 65 at y 408 and 477 ("Via
 *    rdb App", drawn white with the purple line, and "Via Invoice QR"); the
 *    grey "What is the collection point ?" card (y 700); "Done", grey.
 *
 * The file has no board for a chosen wallet. As with the delivery sheet's
 * centres (`– 78`), a tapped wallet card takes the chosen look (white, the
 * purple line) and "Done" turns dark. "Done" then closes the sheet with the
 * wallet, and the checkout shows it (`– 80`, or `– 83` when the balance does
 * not cover the bag).
 *
 * On `– 79` a tap on "Via Invoice QR" chooses it: it takes the chosen look,
 * "Via rdb App" loses it, and "Done" turns dark. "Done" then closes the sheet
 * with the invoice, and the checkout shows it (`– 85`).
 *
 * "Via rdb App" and the row of ways take no tap yet: the file has no next
 * board for them.
 */
export default function PaymentMethodSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  /** A way was chosen and "Done" tapped. */
  onDone: (method: DemoPaymentMethod) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} y={SHEET_Y} radius={SHEET.radiusWallet} z={SHEET_Z} testId="demo-payment-sheet">
      <SheetBody onDone={onDone} />
    </Sheet>
  );
}

/** The 30 px phone: its box at (24.08, 114) on `– 73`, as the delivery sheet's map; 29 px right on `– 79`, after the back arrow. */
const PHONE = { x: 24.08, xRdb: 24.08 + 29, y: 114 } as const;

/** The line under the title: 14, two lines on baselines 170 and 188, centred. */
const LEAD = { baseline: 170, size: 14, lineHeight: 188 - 170 } as const;

/**
 * The line's box: the file's, 32 px from both edges (366 wide on a 430 px
 * screen, where the line breaks after "bag", as in the file).
 */
const LEAD_X = 32;

/** The cards' tops: on `– 73` the wallet and the rdb card; on `– 79` the rdb card and its two ways. */
const WALLET_Y = 212;
const RDB_Y = 408;
const RDB_TOP_Y = 212;
const VIA_APP_Y = 408;
const VIA_QR_Y = 477;
/** The row of ways: the tiles' top. */
const WAYS_Y = 604;

/** In a card, from its top: the 30 px words on baseline +106, the chip under them at +122. */
const CARD_BASELINE = 106;
const CARD_CHIP = 122;

/** The wallet picture, 37.84 x 38 at (196.08, 242): centred, 30 under the card's top. */
const WALLET_PICTURE_Y = 242;
const WALLET_PICTURE_H = 38;

/** The top chips, 22 tall, 6 under the card's top: the balance 5 from its left, "Recommended" 6 from its right. */
const TOP_CHIP = { y: 6, left: 25 - CARD_X, right: 410 - 404 } as const;

/** Paying an invoice by QR: the hours the file gives (`– 79`). */
const INVOICE_HOURS = 2;

type Step = "ways" | "rdb";

/** The sheet's content: built anew on every opening, so it always opens on the ways with nothing chosen (`– 73`). */
function SheetBody({ onDone }: { onDone: (method: DemoPaymentMethod) => void }) {
  const { t, body } = useDemoCase();
  const [step, setStep] = useState<Step>("ways");
  const [method, setMethod] = useState<DemoPaymentMethod | null>(null);
  /** The way chosen on `– 79`: none yet, or the invoice by QR. */
  const [rdbWay, setRdbWay] = useState<"invoice" | null>(null);
  const [showWhy, setShowWhy] = useState(true);
  const { gap, drop } = useDoneRoom();
  const rdb = step === "rdb";
  // The slide's way: to the rdb ways (1), or back to the ways (-1).
  const dir = rdb ? 1 : -1;
  const leadEnd = paraTop(LEAD.baseline, LEAD.size, LEAD.lineHeight) + 2 * LEAD.lineHeight;
  const chosen = rdb ? rdbWay : method;
  return (
    <>
      {/* The title, the line under it, the phone and the back arrow: they change with the step. */}
      <div className="relative flex flex-col shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step}
            className="flex flex-col"
            // Not Tailwind's `relative`: see the delivery sheet (the app's
            // Tailwind is `important` and would beat popLayout's `absolute`).
            style={{ position: "relative" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            {rdb && (
              <button
                type="button"
                aria-label={t("Back")}
                data-pw="demo-payment-back"
                onClick={() => setStep("ways")}
                className="absolute cursor-pointer [-webkit-tap-highlight-color:transparent] active:opacity-60"
                style={{ left: BACK.x - BACK.pad, top: BACK.y - HANDLE_END - BACK.pad, padding: BACK.pad }}
              >
                <XdIcon name="back" />
              </button>
            )}
            <XdIcon
              name="payPhone"
              className="absolute"
              style={{ left: rdb ? PHONE.xRdb : PHONE.x, top: PHONE.y - HANDLE_END }}
            />
            <h2
              className="self-center font-bold whitespace-nowrap"
              style={{
                marginTop: textTop(TITLE.baseline, TITLE.size) - HANDLE_END,
                fontSize: TITLE.size,
                lineHeight: `${lineBox(TITLE.size)}px`,
                color: C.ink,
              }}
            >
              {rdb ? t("Payment Option") : t("Payment Method")}
            </h2>
            <p
              className="self-center text-center font-normal"
              style={{
                marginTop: paraTop(LEAD.baseline, LEAD.size, LEAD.lineHeight) - textBottom(TITLE.baseline, TITLE.size),
                width: fill(LEAD_X),
                fontSize: LEAD.size,
                lineHeight: `${LEAD.lineHeight}px`,
                color: C.ink,
              }}
            >
              {body("Choose the Method you would like to pay your bag payments")}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Under the line: the cards, with the grey card and "Done" over their end. */}
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ paddingBottom: (rdb && showWhy ? ROOM_WHY : ROOM) - drop, scrollbarWidth: "none" }}
        >
          <div className="relative flex flex-col shrink-0">
            {/* The two steps trade places as two screens do, as on the delivery sheet (STEP_SLIDE). */}
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              {rdb ? (
                <motion.div
                  key="rdb"
                  className="flex flex-col"
                  custom={dir}
                  variants={STEP_SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <RdbCard mt={RDB_TOP_Y - leadEnd} t={t} />
                  <ChoiceCard
                    testId="demo-payment-via-app"
                    mt={VIA_APP_Y - (RDB_TOP_Y + METHOD_H)}
                    // The file draws this way white with the purple line, and "Done" grey,
                    // until the invoice is chosen.
                    chosen={rdbWay === null}
                    title={<WithBank text={t("Via {bank} app")} />}
                    line={<WithBank text={t("Connect to {bank} app & pay Directly")} />}
                  />
                  <ChoiceCard
                    testId="demo-payment-via-qr"
                    mt={VIA_QR_Y - (VIA_APP_Y + CHOICE_H)}
                    chosen={rdbWay === "invoice"}
                    onClick={() => setRdbWay("invoice")}
                    title={<Rich text={t("Via Invoice <b>QR</b>")} />}
                    line={<Rich text={t("Pay invoice within <m>{hours} hours</m> in many easy way")} values={{ hours: INVOICE_HOURS }} />}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="ways"
                  className="flex flex-col"
                  custom={dir}
                  variants={STEP_SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <WalletCard
                    mt={WALLET_Y - leadEnd}
                    t={t}
                    chosen={chosen === "wallet"}
                    onClick={() => setMethod("wallet")}
                  />
                  <RdbCard mt={RDB_Y - (WALLET_Y + METHOD_H)} t={t} onClick={() => setStep("rdb")} />
                  <PayWays
                    mt={WAYS_Y - (RDB_Y + METHOD_H)}
                    t={t}
                    testId={{ row: "demo-payment-ways-row", way: "demo-payment-way", soon: "demo-payment-soon" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {rdb && showWhy && (
            <WhyCard
              key="why"
              bottom={932 - WHY.end - drop}
              t={t}
              body={body}
              title="What is the collection point ?"
              onClose={() => setShowWhy(false)}
            />
          )}
        </AnimatePresence>

        <SheetDone
          testId="demo-payment-done"
          label={t("Done")}
          gap={gap}
          onDone={chosen ? () => onDone(chosen) : undefined}
        />
      </div>
    </>
  );
}

/**
 * A card, 390 x 188, 20 px from both edges, round 15: `#FCFCFC` with a grey
 * 0.5 px line on its edge, or chosen, white with a purple one (as the
 * delivery sheet's method cards). With `onClick` it is a button.
 */
function Card({
  mt,
  testId,
  chosen = false,
  onClick,
  children,
}: {
  mt: number;
  testId: string;
  chosen?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    marginTop: mt,
    marginLeft: CARD_X,
    width: fill(CARD_X),
    height: METHOD_H,
    borderRadius: 15,
    background: chosen ? C.white : C.card,
    transition: "background-color 0.2s",
  };
  const className = "relative flex flex-col items-center shrink-0 text-center [-webkit-tap-highlight-color:transparent]";
  const content = (
    <>
      {/* The file's line is 0.5 px, centred on the edge, as on the delivery sheet's cards. */}
      <Stroke color={chosen ? C.purple : C.line} radius={15} align="center" />
      {children}
    </>
  );
  return onClick ? (
    <motion.button
      type="button"
      data-pw={testId}
      aria-pressed={chosen}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`${className} cursor-pointer`}
      style={style}
    >
      {content}
    </motion.button>
  ) : (
    <div data-pw={testId} className={className} style={style}>
      {content}
    </div>
  );
}

/**
 * The wallet card (`– 73`, y 212). The balance is the client's own
 * (`walletUsd`, 120 on the board).
 */
function WalletCard({ mt, t, chosen, onClick }: { mt: number; t: T; chosen: boolean; onClick: () => void }) {
  const { profile } = useDemoData();
  return (
    <Card mt={mt} testId="demo-payment-wallet" chosen={chosen} onClick={onClick}>
      <span className="absolute" style={{ top: TOP_CHIP.y, left: TOP_CHIP.left }}>
        <Chip
          label={<Rich text={t("Your balance <b>{amount}</b> USD")} values={{ amount: profile.walletUsd }} />}
          fill={CHIP_GREY}
          color={C.ink}
          minWidth={128}
        />
      </span>
      <span className="absolute" style={{ top: TOP_CHIP.y, right: TOP_CHIP.right }}>
        <Chip label={t("Recommended")} fill={C.purpleTint} color={C.purple} minWidth={94} pad={7} />
      </span>
      <XdIcon name="payWallet" className="shrink-0" style={{ marginTop: WALLET_PICTURE_Y - WALLET_Y }} />
      <span
        className="block shrink-0 font-normal whitespace-nowrap"
        style={{
          marginTop: textTop(WALLET_Y + CARD_BASELINE, 30) - (WALLET_PICTURE_Y + WALLET_PICTURE_H),
          fontSize: 30,
          lineHeight: `${lineBox(30)}px`,
          color: C.ink,
        }}
      >
        <span className="font-bold">{BRAND[0]}</span>
        {`${BRAND[1]} ${t("Wallet")}`}
      </span>
      <span className="flex shrink-0" style={{ marginTop: CARD_CHIP - textBottom(CARD_BASELINE, 30) }}>
        <Chip label={t("Easy . Fast . No commission")} fill={C.purpleTint} stroke={C.purple} color={C.purple} minWidth={158} />
      </span>
    </Card>
  );
}

/**
 * The trydos | rdb card: at y 408 on `– 73`, where a tap opens the rdb step;
 * at y 212 on `– 79`, where it takes no tap. The brand on x 216, as on the
 * wallet's cards (Brand).
 */
function RdbCard({ mt, t, onClick }: { mt: number; t: T; onClick?: () => void }) {
  return (
    <Card mt={mt} testId={onClick ? "demo-payment-rdb" : "demo-payment-rdb-top"} onClick={onClick}>
      <Brand size={30} mt={textTop(CARD_BASELINE, 30)} nudge={1} />
      <span className="flex shrink-0" style={{ marginTop: CARD_CHIP - textBottom(CARD_BASELINE, 30) }}>
        <Chip label={t("Pay Invoice at centers or request Online pay")} fill={CHIP_GREY} stroke={C.ink} color={C.ink} minWidth={248} />
      </span>
    </Card>
  );
}

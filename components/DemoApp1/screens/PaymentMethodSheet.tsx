"use client";

import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData } from "../../DemoApp/DemoData";
import { useDemoCase } from "../demoCase";
import { C, SHEET, fill, lineBox, paraTop, textBottom, textTop } from "../demo1Layout";
import { Sheet, Stroke } from "../ui";
import {
  BRAND,
  CARD_X,
  CHIP_GREY,
  Chip,
  HANDLE_END,
  METHOD_H,
  ROOM,
  SHEET_Y,
  SHEET_Z,
  SheetDone,
  TITLE,
  useDoneRoom,
} from "./DeliveryMethodSheet";
import { Rich, type T } from "./ListingParts";
import PayWays from "./PayWays";
import { Brand } from "./WalletCashOutSheet";

/**
 * The payment method sheet of the checkout, XD `Home Page – 73`, opened by
 * "Choose Payment Method" (`– 75`). The same sheet as the delivery method
 * sheet (y 90, round 50), from the top:
 *
 *  - the 30 px phone at (24, 114) and "Payment Method" (24 Bold) on
 *    baseline 138, centred, with the line under it (14, two lines on 170
 *    and 188);
 *  - the wallet card, 390 x 188 at (20, 212): "Your Balance 120 USD" at its
 *    top left, "Recommended" at its top right, the wallet picture, "trydos
 *    Wallet" (30) and the purple "Easy . Fast . No Commission";
 *  - the trydos | rdb card at (20, 408) with "Pay Invoice at Centers or
 *    Request Online Pay";
 *  - the row of ways at y 604, as the wallet's ways to cash in (PayWays);
 *  - "Done", grey.
 *
 * Nothing on the board is chosen. A chosen way and the checkout with it are
 * the next boards (`– 79`, `– 80`, `– 83`), so the cards take no tap yet.
 */
export default function PaymentMethodSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} y={SHEET_Y} radius={SHEET.radiusWallet} z={SHEET_Z} testId="demo-payment-sheet">
      <SheetBody />
    </Sheet>
  );
}

/** The 30 px phone: its box at (24.08, 114), as the delivery sheet's map. */
const PHONE = { x: 24.08, y: 114 } as const;

/** The line under the title: 14, two lines on baselines 170 and 188, centred. */
const LEAD = { baseline: 170, size: 14, lineHeight: 188 - 170 } as const;

/**
 * The line's box: the file's, 32 px from both edges (366 wide on a 430 px
 * screen, where the line breaks after "bag", as in the file).
 */
const LEAD_X = 32;

/** The cards' tops. */
const WALLET_Y = 212;
const RDB_Y = 408;
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

function SheetBody() {
  const { t, body } = useDemoCase();
  const { gap, drop } = useDoneRoom();
  const leadEnd = paraTop(LEAD.baseline, LEAD.size, LEAD.lineHeight) + 2 * LEAD.lineHeight;
  return (
    <>
      <div className="relative flex flex-col shrink-0">
        <XdIcon name="payPhone" className="absolute" style={{ left: PHONE.x, top: PHONE.y - HANDLE_END }} />
        <h2
          className="self-center font-bold whitespace-nowrap"
          style={{
            marginTop: textTop(TITLE.baseline, TITLE.size) - HANDLE_END,
            fontSize: TITLE.size,
            lineHeight: `${lineBox(TITLE.size)}px`,
            color: C.ink,
          }}
        >
          {t("Payment Method")}
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
      </div>

      {/* Under the line: the cards and the row, with "Done" over their end. */}
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ paddingBottom: ROOM - drop, scrollbarWidth: "none" }}
        >
          <WalletCard mt={WALLET_Y - leadEnd} t={t} />
          <RdbCard mt={RDB_Y - (WALLET_Y + METHOD_H)} t={t} />
          <PayWays
            mt={WAYS_Y - (RDB_Y + METHOD_H)}
            t={t}
            testId={{ row: "demo-payment-ways-row", way: "demo-payment-way", soon: "demo-payment-soon" }}
          />
        </div>
        <SheetDone testId="demo-payment-done" label={t("Done")} gap={gap} />
      </div>
    </>
  );
}

/** A card, 390 x 188, 20 px from both edges, round 15: `#FCFCFC` with a grey 0.5 px line on its edge. */
function Card({ mt, testId, children }: { mt: number; testId: string; children: React.ReactNode }) {
  return (
    <div
      data-pw={testId}
      className="relative flex flex-col items-center shrink-0 text-center"
      style={{
        marginTop: mt,
        marginLeft: CARD_X,
        width: fill(CARD_X),
        height: METHOD_H,
        borderRadius: 15,
        background: C.card,
      }}
    >
      {/* The file's line is 0.5 px, centred on the edge, as on the delivery sheet's cards. */}
      <Stroke color={C.line} radius={15} align="center" />
      {children}
    </div>
  );
}

/**
 * The wallet card (`– 73`, y 212). The balance is the client's own
 * (`walletUsd`, 120 on the board).
 */
function WalletCard({ mt, t }: { mt: number; t: T }) {
  const { profile } = useDemoData();
  return (
    <Card mt={mt} testId="demo-payment-wallet">
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

/** The trydos | rdb card (`– 73`, y 408): the brand on x 216, as on the wallet's cards (Brand). */
function RdbCard({ mt, t }: { mt: number; t: T }) {
  return (
    <Card mt={mt} testId="demo-payment-rdb">
      <Brand size={30} mt={textTop(CARD_BASELINE, 30)} nudge={1} />
      <span className="flex shrink-0" style={{ marginTop: CARD_CHIP - textBottom(CARD_BASELINE, 30) }}>
        <Chip label={t("Pay Invoice at centers or request Online pay")} fill={CHIP_GREY} stroke={C.ink} color={C.ink} minWidth={248} />
      </span>
    </Card>
  );
}

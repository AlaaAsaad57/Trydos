"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDemoNav } from "../Demo1Shell";
import { DebugPictures } from "../../DemoApp/demoDebug";
import { C, DESIGN_W, fill, gapTo, textBottom } from "../demo1Layout";
import { Box, Icon, ScreenHeader, ScreenPage, Txt } from "../ui";
import {
  WALLET_BALANCES,
  entriesFor,
  type WalletBalance,
  type WalletEntry,
} from "../../DemoApp/demoWallet";
import WalletCashInSheet from "./WalletCashInSheet";
import WalletCashOutSheet from "./WalletCashOutSheet";
import WalletInfoSheet from "./WalletInfoSheet";
import WalletReceipt, { RECEIPT_GLASS } from "./WalletReceipt";

/**
 * Trydos Balance — XD `Home Page – 11` (every balance) and `– 17` (one
 * balance, with Cash In and Cash Out).
 *
 * Both boards, top to bottom (design y):
 *   - the line "Your Total Balance" on baseline 123 with the 14 px eye after it;
 *   - the purple cards at y 138, 103 tall: two of 200 with 6 between them on
 *     `– 11`, one of 406 on `– 17`;
 *   - on `– 17` the two page dots at y 247;
 *   - "All Transactions" on baseline 272;
 *   - the entries, 406 x 50 from y 287, 4 px apart.
 *
 * One screen, two states. A tap on a card makes it grow to the full width, in
 * place: the line above the cards names the currency, and the dots, Cash In,
 * Cash Out and that currency's entries come in. A tap on the grown card, or
 * the back arrow, brings the two cards back.
 *
 * The grown cards are a slider. Each one is a page of the screen's width (the
 * 406 card and the 12 px on each side of it), so the next card waits just
 * outside the screen, and a slide to the side brings it in. The dots show
 * which one is on show.
 *
 * On /demo1 the screen's width is not 430, so the cards are measured from the
 * page column: two small cards share the row (12 px to the edges, 6 between
 * them), a grown card is the column less 24, and one slider page is the
 * column's width. On a 430 px phone that is the file's 200, 406 and 430. The
 * widths are numbers and not CSS `calc()`, so the cards still grow on the
 * same animation.
 *
 * The dots sit in the 20 px between the cards (they end at y 241) and the
 * list title (its box starts at 261), so the list does not move when they
 * come in.
 *
 * Four layers open over the page: Cash In (`– 22`, in WalletCashInSheet),
 * Cash Out (`– 21`, `– 19`) and Wallet Info (`– 23`) from the one-balance
 * card, and the receipt (`– 18`) from an entry that has one.
 */

/** The move between the two states. */
const GROW = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/** The cards side by side: 6 apart (200 wide each on a 430 screen). */
const SMALL = { gap: 6 };
/** The cards grown: 24 apart, a screen's width from one to the next (406 wide on a 430 screen). */
const WIDE = { gap: 24 };
/** The cards' distance to each edge of the screen. */
const EDGE = 12;

/** The page column's width in px, read again when the window changes. */
function useColumnWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState<number>(DESIGN_W);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(el.getBoundingClientRect().width);
    read();
    const watch = new ResizeObserver(read);
    watch.observe(el);
    return () => watch.disconnect();
  }, [ref]);
  return width;
}
/** A slide this far, or this fast, goes to the next card. */
const SLIDE = { far: 60, fast: 400 };

/** XD's drop shadow (0, 3, blur 3, black 16%) and inner shadow (0, 3, blur 3, white 50%). */
const CARD_SHADOW =
  "0 3px 3px rgba(0, 0, 0, 0.16), inset 0 3px 3px rgba(255, 255, 255, 0.502)";
/** The shadow under the amount: 0, 3, blur 3, black 50%. */
const AMOUNT_SHADOW = "0 3px 3px rgba(0, 0, 0, 0.5)";

export default function WalletScreen() {
  const { t, back } = useDemoNav();
  /** The grown card's place in the row, or null for the two cards side by side (`Home Page – 11`). */
  const [grown, setGrown] = useState<number | null>(null);
  const [cashIn, setCashIn] = useState(false);
  const [cashOut, setCashOut] = useState(false);
  const [info, setInfo] = useState(false);
  const [receipt, setReceipt] = useState(false);
  /** True while the row is being slid, so the slide's end is not read as a tap. */
  const sliding = useRef(false);
  /** The row the cards sit in: as wide as the page column. */
  const row = useRef<HTMLDivElement>(null);
  const column = useColumnWidth(row);
  const smallWidth = (column - 2 * EDGE - SMALL.gap) / 2;
  const wideWidth = column - 2 * EDGE;
  const balance = grown === null ? null : WALLET_BALANCES[grown];
  const currency = balance?.currency ?? null;
  const entries = entriesFor(currency);
  const rest = grown === null ? 0 : -grown * column;

  return (
    <ScreenPage
      testId={currency ? `demo-wallet-${currency}` : "demo-wallet"}
      contentHeight={Math.max(932, 287 + entries.length * 54 + 40)}
      glass={receipt ? RECEIPT_GLASS : undefined}
      header={
        <ScreenHeader
          crumb={["Profile", "Trydos Balance"]}
          icon="titleWallet"
          onBack={balance ? () => setGrown(null) : back}
          t={t}
        />
      }
      footer={
        <>
          {balance && (
            <>
              <WalletCashInSheet
                open={cashIn}
                onClose={() => setCashIn(false)}
                balance={balance}
              />
              <WalletCashOutSheet
                open={cashOut}
                onClose={() => setCashOut(false)}
                balance={balance}
              />
              <WalletInfoSheet
                open={info}
                onClose={() => setInfo(false)}
                balance={balance}
              />
            </>
          )}
          <WalletReceipt open={receipt} onClose={() => setReceipt(false)} />
        </>
      }
    >
      {/* The eye starts at x 125 on `– 11` and at 152 on `– 17`: the line has
          a slot that wide, so a longer line in another language pushes it. */}
      <div
        className="flex items-start shrink-0"
        style={{ marginTop: gapTo(100, 123, 11), marginLeft: 24 }}
      >
        <Txt
          size={11}
          weight="medium"
          data-pw="demo-wallet-total"
          style={{
            minWidth: (currency ? 152 : 125) - 24,
            transition: "min-width 0.35s",
          }}
        >
          {t(balance ? balance.total : "your total balance")}
        </Txt>
        <Icon name="eyeHidden" />
      </div>

      {/* The page column clips the cards that wait beside the screen. */}
      <div
        ref={row}
        className="flex w-full shrink-0"
        style={{ marginTop: 138 - textBottom(123, 11), paddingLeft: EDGE }}
      >
        <motion.div
          data-pw="demo-wallet-cards"
          className="flex shrink-0"
          initial={false}
          animate={{ x: rest }}
          transition={GROW}
          drag={grown === null ? false : "x"}
          dragConstraints={{ left: rest, right: rest }}
          dragElastic={0.35}
          onDragStart={() => {
            sliding.current = true;
          }}
          onDragEnd={(_, move) => {
            // The click that ends the slide comes right after this.
            setTimeout(() => {
              sliding.current = false;
            }, 50);
            if (grown === null) return;
            const next =
              move.offset.x < -SLIDE.far || move.velocity.x < -SLIDE.fast
                ? grown + 1
                : move.offset.x > SLIDE.far || move.velocity.x > SLIDE.fast
                  ? grown - 1
                  : grown;
            setGrown(Math.min(WALLET_BALANCES.length - 1, Math.max(0, next)));
          }}
        >
          {WALLET_BALANCES.map((card, i) => (
            <BalanceCard
              key={card.currency}
              balance={card}
              wide={grown !== null}
              width={grown === null ? smallWidth : wideWidth}
              ml={i === 0 ? 0 : grown === null ? SMALL.gap : WIDE.gap}
              // A tap grows the card; a tap on the grown card folds it.
              onTap={() => {
                if (sliding.current) return;
                setGrown(grown === null ? i : null);
              }}
              onCashIn={() => setCashIn(true)}
              onCashOut={() => setCashOut(true)}
              onInfo={() => setInfo(true)}
            />
          ))}
        </motion.div>
      </div>

      {/* The dots at (200, 247) and (222, 247): 30 wide together, centred,
          6 px under the cards. The row is as tall as the gap to the title. */}
      <div
        className="flex justify-center items-start shrink-0"
        style={{ height: gapTo(241, 272, 11) }}
      >
        <AnimatePresence initial={false}>
          {currency && (
            <motion.div
              key="dots"
              data-pw="demo-wallet-dots"
              className="flex shrink-0"
              style={{ marginTop: 247 - 241 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={GROW}
            >
              {WALLET_BALANCES.map((card, i) => (
                <Icon
                  key={card.currency}
                  name={i === grown ? "dotOn" : "dotOff"}
                  ml={i === 0 ? 0 : 6}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Txt size={11} weight="medium" ml={24} data-pw="demo-wallet-list-title">
        {t(balance ? balance.list : "All Transactions")}
      </Txt>

      <AnimatePresence initial={false}>
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            className="flex flex-col shrink-0 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={GROW}
          >
            <EntryRow
              entry={entry}
              mt={i === 0 ? 287 - textBottom(272, 11) : 4}
              onOpen={entry.receipt ? () => setReceipt(true) : undefined}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <DebugPictures />
    </ScreenPage>
  );
}

/**
 * A balance card, 103 tall at y 138, `#4A31E7`, radius 15, 12 px of padding.
 *
 * Left, from the top: the 20 px mark at y 150, the currency's name (11 Light)
 * on baseline 187, the amount (25 Medium, with its shadow) on 223 and the code
 * (9 Light) on 227, 60 px after the amount's start.
 *
 * The wide card of `Home Page – 17` has a second column from x 302 to 406: the
 * QR mark at its right end, and under it Cash In and Cash Out — a 20 px
 * picture at y 189 over an 11 px label on baseline 226. The labels start at
 * x 302 and 359. On /demo1 that column is pinned to the card's right edge, so
 * it keeps its 104 px and the room before it follows the screen's width.
 */
function BalanceCard({
  balance,
  wide,
  width,
  ml,
  onTap,
  onCashIn,
  onCashOut,
  onInfo,
}: {
  balance: WalletBalance;
  wide: boolean;
  /** The card's width in px, measured from the page column. */
  width: number;
  ml: number;
  onTap: () => void;
  onCashIn: () => void;
  onCashOut: () => void;
  onInfo: () => void;
}) {
  const { t } = useDemoNav();
  return (
    <motion.div
      data-pw={`demo-wallet-card-${balance.currency}`}
      role="button"
      tabIndex={0}
      aria-expanded={wide}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onTap();
      }}
      className="flex items-start shrink-0 overflow-hidden cursor-pointer"
      style={{
        height: 103,
        borderRadius: 15,
        background: C.purple,
        boxShadow: CARD_SHADOW,
        padding: "12px 12px 0",
      }}
      initial={false}
      animate={{ width, marginLeft: ml }}
      transition={GROW}
    >
      <div className="flex flex-col shrink-0">
        <Icon name={balance.icon} />
        <Txt
          size={11}
          weight="light"
          color={C.white}
          mt={gapTo(150 + 20, 187, 11)}
        >
          {t(balance.name)}
        </Txt>
        <div
          className="flex items-start shrink-0"
          style={{ marginTop: gapTo(textBottom(187, 11), 223, 25) }}
        >
          <Txt
            size={25}
            weight="medium"
            color={C.white}
            style={{ minWidth: 84 - 24, textShadow: AMOUNT_SHADOW }}
          >
            {balance.amount}
          </Txt>
          <Txt
            size={9}
            weight="light"
            color={C.white}
            mt={227 - 9 - (223 - 25)}
          >
            {balance.code}
          </Txt>
        </div>
      </div>

      {wide && (
        <motion.div
          className="flex flex-col shrink-0"
          style={{ width: 406 - 302, marginLeft: "auto" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...GROW, delay: 0.15 }}
        >
          <motion.button
            type="button"
            data-pw={`demo-wallet-info-${balance.currency}`}
            aria-label={t("Wallet Info")}
            onClick={(e) => {
              e.stopPropagation();
              onInfo();
            }}
            whileTap={{ scale: 0.92 }}
            className="shrink-0 self-end cursor-pointer"
          >
            <Icon name="qrWhite" />
          </motion.button>
          <div
            className="flex items-start shrink-0"
            style={{ marginTop: 189 - (150 + 20) }}
          >
            {/* The slot runs from one label's start to the next: 359 - 302. */}
            <div className="flex shrink-0" style={{ minWidth: 359 - 302 }}>
              <CardAction
                icon="cashIn"
                label={t("Cash In")}
                testId={`demo-wallet-cash-in-${balance.currency}`}
                onClick={onCashIn}
              />
            </div>
            <CardAction
              icon="cashOut"
              label={t("Cash Out")}
              testId={`demo-wallet-cash-out-${balance.currency}`}
              onClick={onCashOut}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Cash In or Cash Out on the card. The picture is centred over its label and
 * then sits half a px right of that, as the file has it (311 over a label
 * from 302, 373 over one from 359).
 */
function CardAction({
  icon,
  label,
  onClick,
  testId,
}: {
  icon: "cashIn" | "cashOut";
  label: string;
  onClick?: () => void;
  testId: string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center shrink-0 cursor-pointer"
    >
      <Icon name={icon} ml={1} />
      <Txt size={11} color={C.card} mt={gapTo(189 + 20, 226, 11)}>
        {label}
      </Txt>
    </motion.button>
  );
}

/**
 * One entry, 50 tall and 12 px from both edges of the screen (the file's 406),
 * `#FCFCFC`, radius 15. With the row's top as 0:
 *   - the 16 px picture at (12, 8) and the 14 px arrow at (13, 28);
 *   - the title (13 Medium) on baseline 21 and the note (11, the date Light)
 *     on 39, both from x 36;
 *   - the amount (13: the number Medium, the unit Light) on baseline 21, ending
 *     12 from the right edge, and the status (11 Light) on 39.
 */
function EntryRow({
  entry,
  mt,
  onOpen,
}: {
  entry: WalletEntry;
  mt: number;
  /** Opens the entry's receipt. */
  onOpen?: () => void;
}) {
  const { t } = useDemoNav();
  const ink = entry.muted ? C.grey : C.ink;
  return (
    <Box
      w={fill(EDGE)}
      h={50}
      mt={mt}
      ml={EDGE}
      radius={15}
      fill={C.card}
      stroke={entry.latest ? C.line : undefined}
      data-pw={`demo-wallet-entry-${entry.id}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
      className={`flex items-start ${onOpen ? "cursor-pointer" : ""}`}
    >
      <div className="flex flex-col shrink-0" style={{ marginLeft: 12 }}>
        <Icon name={entry.icon} mt={8} />
        <Icon name={entry.arrow} mt={28 - (8 + 16)} ml={1} />
      </div>

      <div className="flex flex-col shrink-0" style={{ marginLeft: 48 - 40 }}>
        <Txt size={13} weight="medium" color={ink} mt={gapTo(0, 21, 13)}>
          {t(entry.title)}
        </Txt>
        <Txt
          size={11}
          color={ink}
          mt={gapTo(textBottom(21, 13), 39, 11)}
          style={{ whiteSpace: "pre" }}
        >
          <span className="font-light">{entry.date}</span>
          {` | ${entry.note}`}
        </Txt>
      </div>

      <div
        className="flex flex-col items-end shrink-0 ml-auto"
        style={{ marginRight: 12 }}
      >
        <Txt
          size={13}
          weight="light"
          color={ink}
          mt={gapTo(0, 21, 13)}
          style={{ whiteSpace: "pre" }}
        >
          <span className={entry.latest ? "font-bold" : "font-medium"}>
            {entry.amount}
          </span>
          <span className="font-bold"> </span>
          {entry.unit}
        </Txt>
        {entry.status && (
          // The file starts the status at a fixed x and lets it run to 406.
          <Txt
            size={11}
            weight="light"
            mt={gapTo(textBottom(21, 13), 39, 11)}
            style={{ width: 406 - entry.statusX, whiteSpace: "pre" }}
          >
            {t(entry.status)}
            {entry.due && (
              <>
                {` ${entry.due.time} | `}
                <span className="font-normal">{entry.due.day}</span>
                {` ${entry.due.month}`}
              </>
            )}
          </Txt>
        )}
      </div>
    </Box>
  );
}

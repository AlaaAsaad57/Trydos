"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDemoNav } from "../DemoShell";
import { C, gapTo, textBottom } from "../demoLayout";
import { Box, Icon, ScreenHeader, ScreenPage, Txt } from "../ui";
import {
  WALLET_BALANCES,
  entriesFor,
  type WalletBalance,
  type WalletCurrency,
  type WalletEntry,
} from "../demoWallet";
import WalletCashOutSheet from "./WalletCashOutSheet";
import WalletInfoSheet from "./WalletInfoSheet";
import WalletReceipt from "./WalletReceipt";

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
 * Three layers open over the page: Cash Out (`– 21`, `– 19`) and Wallet Info
 * (`– 23`) from the one-balance card, and the receipt (`– 18`) from an entry
 * that has one.
 */

/** XD's drop shadow (0, 3, blur 3, black 16%) and inner shadow (0, 3, blur 3, white 50%). */
const CARD_SHADOW =
  "0 3px 3px rgba(0, 0, 0, 0.16), inset 0 3px 3px rgba(255, 255, 255, 0.502)";
/** The shadow under the amount: 0, 3, blur 3, black 50%. */
const AMOUNT_SHADOW = "0 3px 3px rgba(0, 0, 0, 0.5)";

export default function WalletScreen({
  currency,
}: {
  /** The balance on show, or null for all of them (`Home Page – 11`). */
  currency: WalletCurrency | null;
}) {
  const { t, back, navigate } = useDemoNav();
  const [cashOut, setCashOut] = useState(false);
  const [info, setInfo] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const entries = entriesFor(currency);
  const balances = WALLET_BALANCES.filter(
    (balance) => currency === null || balance.currency === currency,
  );

  return (
    <ScreenPage
      testId={currency ? `demo-wallet-${currency}` : "demo-wallet"}
      contentHeight={Math.max(932, 287 + entries.length * 54 + 40)}
      header={
        <ScreenHeader
          crumb={["Profile", "Trydos Balance"]}
          icon="titleWallet"
          onBack={back}
          t={t}
        />
      }
      footer={
        <>
          {currency && (
            <>
              <WalletCashOutSheet
                open={cashOut}
                onClose={() => setCashOut(false)}
              />
              <WalletInfoSheet open={info} onClose={() => setInfo(false)} />
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
          style={{ minWidth: (currency ? 152 : 125) - 24 }}
        >
          {t(currency ? "your total USD balance" : "your total balance")}
        </Txt>
        <Icon name="eyeHidden" />
      </div>

      <div
        className="flex shrink-0"
        style={{ marginTop: 138 - textBottom(123, 11), marginLeft: 12 }}
      >
        {balances.map((balance, i) => (
          <BalanceCard
            key={balance.currency}
            balance={balance}
            wide={currency !== null}
            ml={i === 0 ? 0 : 6}
            // Only the dollar balance has a board of its own in the file.
            onOpen={
              currency === null && balance.currency === "usd"
                ? () => navigate("settings/wallet/usd")
                : undefined
            }
            onCashOut={() => setCashOut(true)}
            onInfo={() => setInfo(true)}
          />
        ))}
      </div>

      {currency && (
        // The dots at (200, 247) and (222, 247): 30 wide together, centred.
        <div
          className="flex justify-center shrink-0"
          style={{ marginTop: 247 - 241 }}
        >
          <Icon name="dotOn" />
          <Icon name="dotOff" ml={6} />
        </div>
      )}

      <Txt
        size={11}
        weight="medium"
        mt={gapTo(currency ? 255 : 241, 272, 11)}
        ml={24}
      >
        {t(currency ? "All USD Transactions" : "All Transactions")}
      </Txt>

      {entries.map((entry, i) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          mt={i === 0 ? 287 - textBottom(272, 11) : 4}
          onOpen={entry.receipt ? () => setReceipt(true) : undefined}
        />
      ))}
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
 * x 302 and 359.
 */
function BalanceCard({
  balance,
  wide,
  ml,
  onOpen,
  onCashOut,
  onInfo,
}: {
  balance: WalletBalance;
  wide: boolean;
  ml: number;
  onOpen?: () => void;
  onCashOut: () => void;
  onInfo: () => void;
}) {
  const { t } = useDemoNav();
  return (
    <motion.div
      data-pw={`demo-wallet-card-${balance.currency}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
      whileTap={onOpen ? { scale: 0.98 } : undefined}
      className={`flex items-start shrink-0 ${onOpen ? "cursor-pointer" : ""}`}
      style={{
        marginLeft: ml,
        width: wide ? 406 : 200,
        height: 103,
        borderRadius: 15,
        background: C.purple,
        boxShadow: CARD_SHADOW,
        padding: "12px 12px 0",
      }}
    >
      <div
        className="flex flex-col shrink-0"
        style={{ width: wide ? 302 - 24 : undefined }}
      >
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
          <Txt size={9} weight="light" color={C.white} mt={227 - 9 - (223 - 25)}>
            {balance.code}
          </Txt>
        </div>
      </div>

      {wide && (
        <div className="flex flex-col shrink-0" style={{ width: 406 - 302 }}>
          <motion.button
            type="button"
            data-pw="demo-wallet-info"
            aria-label={t("Wallet Info")}
            onClick={onInfo}
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
                testId="demo-wallet-cash-in"
              />
            </div>
            <CardAction
              icon="cashOut"
              label={t("Cash Out")}
              testId="demo-wallet-cash-out"
              onClick={onCashOut}
            />
          </div>
        </div>
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
 * One entry, 406 x 50, `#FCFCFC`, radius 15. With the row's top as 0:
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
      w={406}
      h={50}
      mt={mt}
      ml={12}
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

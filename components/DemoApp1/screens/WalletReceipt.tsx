"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDemoNav } from "../Demo1Shell";
import { C, WINDOW_COVER, fill, gapTo, lineBox, textBottom, top } from "../demo1Layout";
import { Box, Icon, Layer, Txt, fromCentre } from "../ui";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { WALLET_RECEIPT } from "../../DemoApp/demoWallet";

/**
 * Receipt — XD `Home Page – 18`. A white card 406 x 568 at (12, 149) with
 * 50 px corners, over the wallet. The page behind it is covered with
 * `#1D1D1D` at 50% and blurred by the file's background blur (15.4).
 *
 * In the card, top to bottom (design y):
 *   - the 50 px mark at (190, 161) and "Receipt" (40 Medium) on baseline 255;
 *   - the QR code, 69.72 px, at (180, 277) and its number (16 Medium) on 367;
 *   - the cells, 50 tall, `#FCFCFC`, radius 15, 4 px apart, from y 383: an
 *     11 px grey label on baseline 19 and a 13 px value on 39, 12 px in;
 *   - the wordmark at (174.72, 625);
 *   - Download and Share at y 664: a 20 px picture over an 11 px label. The
 *     labels start at x 145 and 252.
 *
 * On /demo1 the receipt is a layer on <body> (`Layer`). The card keeps 12 px
 * to both edges of the screen, and its cells share the card's width in the
 * file's ratio. The marks, the QR code and the two actions keep their size.
 */

/**
 * XD's background blur 15.37 with brightness +0.41. The wallet page takes it
 * as a filter of its own while the receipt is open (`ScreenPage glass`).
 */
export const RECEIPT_GLASS = "blur(15.37px) brightness(1.0041)";
export default function WalletReceipt({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useDemoNav();
  const receipt = WALLET_RECEIPT;
  return (
    <AnimatePresence>
      {open && (
        <Layer
          key="receipt"
          z={30}
          testId="demo-wallet-receipt"
          // `#1D1D1D` at 50% over the white page.
          tint="rgb(142, 142, 142)"
        >
          {/* The dimmed glass covers the whole window, also the room beside
              the page column on a wide screen. */}
          <motion.div
            style={{ ...WINDOW_COVER, background: C.backdropGlass }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          {/* The column starts at design y 50, the top of the app. On a short
              phone the card is taller than the room, so the layer scrolls. */}
          <motion.div
            className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ paddingTop: top(50), scrollbarWidth: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          >
            <motion.div
              data-pw="demo-wallet-receipt-card"
              role="dialog"
              aria-modal="true"
              className="flex flex-col shrink-0"
              style={{
                marginTop: 149 - 50,
                marginLeft: 12,
                width: fill(12),
                height: 568,
                borderRadius: 50,
                background: C.white,
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon
                name="receiptMark"
                mt={161 - 149}
                style={{ alignSelf: "center" }}
              />
              {/* The file starts the word at x 145: 1.5 px right of centre. */}
              <Txt
                center
                nudge={1.5}
                size={40}
                weight="medium"
                mt={gapTo(161 + 50, 255, 40)}
                as="h2"
              >
                {t("receipt")}
              </Txt>
              {/* The code at x 180, kept at that distance from the card's centre. */}
              <Icon
                name="receiptQr"
                mt={277 - textBottom(255, 40)}
                style={{ marginLeft: fromCentre(180 - 12, 406) }}
              />
              <Txt
                center
                nudge={0.5}
                size={16}
                weight="medium"
                mt={gapTo(277 + 69.72, 367, 16)}
              >
                {receipt.number}
              </Txt>

              {/* Each row keeps 12 px to the card's edges. The cells share the
                row in the file's ratio, with the file's 4 px between them. */}
              <div
                className="flex shrink-0"
                style={{
                  marginTop: 383 - textBottom(367, 16),
                  marginLeft: 12,
                  width: fill(12),
                }}
              >
                <Cell w={124} label={t("Date & time")} testId="date">
                  {receipt.date}
                </Cell>
                <Cell w={124} ml={4} label={t("reference")} testId="reference">
                  {receipt.reference}
                </Cell>
                <Cell w={126} ml={4} label={t("amount")} testId="amount">
                  <span className="font-medium">{receipt.amount}</span>
                  {` ${receipt.code}`}
                </Cell>
              </div>
              <div
                className="flex shrink-0"
                style={{ marginTop: 4, marginLeft: 12, width: fill(12) }}
              >
                <Cell
                  w={252}
                  label={t("type")}
                  testId="type"
                  marks={["receiptCash", "receiptArrow"]}
                >
                  {`${t("receive")} | ${t("Cash Deposit")}`}
                </Cell>
                <Cell
                  w={126}
                  ml={4}
                  label={t("Status")}
                  testId="status"
                  marks={["receiptDone"]}
                >
                  {t("succeeded")}
                </Cell>
              </div>
              <div
                className="flex shrink-0"
                style={{ marginTop: 4, marginLeft: 12, width: fill(12) }}
              >
                <Cell w={382} label={t("Sender")} testId="sender">
                  {receipt.sender}
                </Cell>
              </div>
              <div
                className="flex shrink-0"
                style={{ marginTop: 4, marginLeft: 12, width: fill(12) }}
              >
                <Cell w={382} label={t("Receiver")} testId="receiver">
                  {`${receipt.receiver} ${t("wallet")} ${receipt.code}`}
                </Cell>
              </div>

              {/* The wordmark at x 174.72: on the card's centre. */}
              <Icon
                name="receiptWordmark"
                mt={625 - (545 + 50)}
                style={{ alignSelf: "center" }}
              />

              {/* The two actions keep the file's slots and their distance from
                the card's centre. */}
              <div
                className="flex items-start shrink-0"
                style={{
                  marginTop: 664 - (625 + 25),
                  marginLeft: fromCentre(145 - 12, 406),
                }}
              >
                {/* The slot runs from one label's start to the next: 252 - 145. */}
                <div className="flex shrink-0" style={{ minWidth: 252 - 145 }}>
                  <Action
                    icon="infoDownload"
                    label={t("download")}
                    off={-0.5}
                    testId="demo-wallet-receipt-download"
                  />
                </div>
                <Action
                  icon="infoShare"
                  label={t("share")}
                  off={0.5}
                  testId="demo-wallet-receipt-share"
                  onClick={() => {
                    if (navigator.share)
                      navigator.share({ text: receipt.number }).catch(() => {});
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </Layer>
      )}
    </AnimatePresence>
  );
}

/**
 * One cell of the receipt. `w` is the cell's width in the file: the cells of
 * a row share the row's width in that ratio, so on a 430 px phone each cell
 * is its file width.
 *
 * `marks` are 14 px pictures 8 px down, 4 px apart. The file ends them 12 px
 * from the cell's right edge (at x 208 and 226 in the 252 cell, at 100 in the
 * 126 cell), so they stay there on every width.
 */
function Cell({
  w,
  ml,
  label,
  children,
  marks,
  testId,
}: {
  w: number;
  ml?: number;
  label: string;
  children: React.ReactNode;
  marks?: XdIconName[];
  testId: string;
}) {
  return (
    <Box
      w="auto"
      h={50}
      ml={ml}
      radius={15}
      fill={C.card}
      data-pw={`demo-wallet-receipt-${testId}`}
      className="flex flex-col"
      style={{ flex: `${w} 1 0px`, minWidth: 0, paddingLeft: 12 }}
    >
      <div className="flex items-start shrink-0" style={{ marginTop: 8 }}>
        <Txt size={11} color={C.grey}>
          {label}
        </Txt>
        {marks && (
          <div
            className="flex items-start shrink-0"
            style={{ marginLeft: "auto", marginRight: 12 }}
          >
            {marks.map((mark, i) => (
              <Icon key={mark} name={mark} ml={i === 0 ? 0 : 4} />
            ))}
          </div>
        )}
      </div>
      <Txt
        size={13}
        mt={gapTo(8 + lineBox(11), 39, 13)}
        style={{ whiteSpace: "pre" }}
      >
        {children}
      </Txt>
    </Box>
  );
}

/** Download or Share: the picture over its label, `off` px off its centre. */
function Action({
  icon,
  label,
  off,
  onClick,
  testId,
}: {
  icon: XdIconName;
  label: string;
  off: number;
  onClick?: () => void;
  testId: string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center shrink-0 cursor-pointer"
    >
      <Icon
        name={icon}
        style={off > 0 ? { marginLeft: off * 2 } : { marginRight: -off * 2 }}
      />
      <Txt size={11} mt={gapTo(664 + 20, 701, 11)}>
        {label}
      </Txt>
    </motion.button>
  );
}

"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDemoNav } from "../DemoShell";
import { C, gapTo, lineBox, textBottom, top } from "../demoLayout";
import { Box, Icon, Txt } from "../ui";
import type { XdIconName } from "../xdIcons";
import { WALLET_RECEIPT } from "../demoWallet";

/**
 * Receipt — XD `Home Page – 18`. A white card 406 x 568 at (12, 149) with
 * 50 px corners, over the wallet. The page behind it is covered with
 * `#1D1D1D` at 50% and the file's background blur (15.4).
 *
 * In the card, top to bottom (design y):
 *   - the 50 px mark at (190, 161) and "Receipt" (40 Medium) on baseline 255;
 *   - the QR code, 69.72 px, at (180, 277) and its number (16 Medium) on 367;
 *   - the cells, 50 tall, `#FCFCFC`, radius 15, 4 px apart, from y 383: an
 *     11 px grey label on baseline 19 and a 13 px value on 39, 12 px in;
 *   - the wordmark at (174.72, 625);
 *   - Download and Share at y 664: a 20 px picture over an 11 px label. The
 *     labels start at x 145 and 252.
 */

/** XD's background blur 15.37 with brightness +0.41. */
const GLASS = "blur(15.37px) brightness(1.0041)";

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
        <motion.div
          key="receipt"
          data-pw="demo-wallet-receipt"
          className="absolute inset-0 z-30 flex flex-col font-quicksand"
          // The column starts at design y 50, the top of the app.
          style={{
            background: C.backdropGlass,
            backdropFilter: GLASS,
            WebkitBackdropFilter: GLASS,
            paddingTop: top(50),
          }}
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
              width: 406,
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
            <Icon
              name="receiptQr"
              mt={277 - textBottom(255, 40)}
              ml={180 - 12}
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

            <div
              className="flex shrink-0"
              style={{ marginTop: 383 - textBottom(367, 16), marginLeft: 12 }}
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
              style={{ marginTop: 4, marginLeft: 12 }}
            >
              {/* The pictures at x 232 and 250: 208 and 226 in the cell. */}
              <Cell
                w={252}
                label={t("type")}
                testId="type"
                marks={["receiptCash", "receiptArrow"]}
                marksX={232 - 24}
              >
                {`${t("receive")} | ${t("Cash Deposit")}`}
              </Cell>
              <Cell
                w={126}
                ml={4}
                label={t("Status")}
                testId="status"
                marks={["receiptDone"]}
                marksX={380 - 280}
              >
                {t("succeeded")}
              </Cell>
            </div>
            <div className="flex shrink-0" style={{ marginTop: 4, marginLeft: 12 }}>
              <Cell w={382} label={t("Sender")} testId="sender">
                {receipt.sender}
              </Cell>
            </div>
            <div className="flex shrink-0" style={{ marginTop: 4, marginLeft: 12 }}>
              <Cell w={382} label={t("Receiver")} testId="receiver">
                {`${receipt.receiver} ${t("wallet")} ${receipt.code}`}
              </Cell>
            </div>

            <Icon
              name="receiptWordmark"
              mt={625 - (545 + 50)}
              ml={174.72 - 12}
            />

            <div
              className="flex items-start shrink-0"
              style={{ marginTop: 664 - (625 + 25), marginLeft: 145 - 12 }}
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
      )}
    </AnimatePresence>
  );
}

/** One cell of the receipt. `marks` are 14 px pictures 8 px down, 4 px apart. */
function Cell({
  w,
  ml,
  label,
  children,
  marks,
  marksX = 0,
  testId,
}: {
  w: number;
  ml?: number;
  label: string;
  children: React.ReactNode;
  marks?: XdIconName[];
  /** Where the first picture starts, from the cell's left edge. */
  marksX?: number;
  testId: string;
}) {
  return (
    <Box
      w={w}
      h={50}
      ml={ml}
      radius={15}
      fill={C.card}
      data-pw={`demo-wallet-receipt-${testId}`}
      className="flex flex-col"
      style={{ paddingLeft: 12 }}
    >
      <div className="flex items-start shrink-0" style={{ marginTop: 8 }}>
        <Txt size={11} color={C.grey} style={{ minWidth: marksX - 12 }}>
          {label}
        </Txt>
        {marks?.map((mark, i) => (
          <Icon key={mark} name={mark} ml={i === 0 ? 0 : 4} />
        ))}
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

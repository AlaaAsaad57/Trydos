"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RdbPinInputs from "components/Login/Enhanced/ui/RdbPinInputs";
import { NATIVE_WALLET_KEYBOARD } from "../demoKeyboard";
import { useDemoNav } from "../DemoShell";
import { C, gapTo, lineBox, paraTop, textBottom, top } from "../demoLayout";
import { Box, Icon, Txt, useOuterBackdrop } from "../ui";
import type { XdIconName } from "../xdIcons";
import type { DemoKey } from "../demoKeys";
import {
  WALLET_RECIPIENT,
  WALLET_REQUEST,
  type WalletBalance,
} from "../demoWallet";

/**
 * A withdrawal request — XD `Home Page – 101`, `– 28` and `– 24`. The first
 * two are steps of the cash-out sheet (from y 90), after "Withdrawal Request"
 * on the form. The third is the picture of the request, on a white page.
 *
 * Each of them starts with `head`: the sheet's title row and the brand, which
 * ends at y 186 on the sheet (baseline 180, 24 px).
 */

/** What a request says. */
export type WithdrawalRequest = {
  amount: string;
  /** The name of the authorized recipient, when the form has one. */
  authorized?: string;
};

/** Where the brand's line box ends on the sheet. */
const HEAD_END = textBottom(180, 24);

/** Two minutes, the life of a code in the login flow. */
const CODE_SECONDS = 120;

/**
 * `Home Page – 101`, all 40 px in:
 *   - the amount and "Withdrawal Request" (16 px, the amount Bold) on
 *     baseline 276;
 *   - "Verification !" (30 Bold) on 318 and the line under it (16 Medium) on
 *     354;
 *   - three rows 8 px apart: "We have sent ..." (12 px) from y 366 with a
 *     15 px picture 4 px after it, the number with "Resend after - 01:58" from
 *     y 389, and the grey privacy line (11 px) from y 412;
 *   - the six code boxes at (20, 502), the login's own (`RdbPinInputs`).
 *
 * No message is sent. Any six digits are a right code.
 */
export function RequestCode({
  head,
  balance,
  request,
  onVerified,
}: {
  head: React.ReactNode;
  balance: WalletBalance;
  request: WithdrawalRequest;
  onVerified: () => void;
}) {
  const { t } = useDemoNav();
  const [pin, setPin] = useState("");
  const [valid, setValid] = useState<"" | "valid">("");
  const [left, setLeft] = useState(CODE_SECONDS);

  React.useEffect(() => {
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <>
      {head}
      <Txt
        size={16}
        ml={40}
        mt={gapTo(HEAD_END, 276, 16)}
        data-pw="demo-wallet-code-request"
        style={{ whiteSpace: "pre" }}
      >
        <span className="font-bold">{request.amount}</span>
        {` ${balance.code} ${t("Withdrawal Request")}`}
      </Txt>
      <Txt
        size={30}
        weight="bold"
        ml={40}
        mt={gapTo(textBottom(276, 16), 318, 30)}
        as="h2"
      >
        {t("verification !")}
      </Txt>
      <Txt
        size={16}
        weight="medium"
        ml={40}
        mt={gapTo(textBottom(318, 30), 354, 16)}
      >
        {t("enter verification code sent to your WhatsApp")}
      </Txt>

      <div
        className="flex items-start shrink-0"
        style={{ marginLeft: 40, marginTop: 366 - textBottom(354, 16) }}
      >
        <Txt size={12}>
          {t("We have sent a verification code to the number")}
        </Txt>
        <Icon name="codeSent" ml={4} />
      </div>
      <div
        className="flex items-start shrink-0"
        style={{ marginLeft: 40, marginTop: 389 - (366 + 15) }}
      >
        <Txt size={12}>{WALLET_REQUEST.codeSentTo}</Txt>
        <button
          type="button"
          data-pw="demo-wallet-code-resend"
          disabled={left > 0}
          onClick={() => setLeft(CODE_SECONDS)}
          className="shrink-0"
          style={{ marginLeft: 6 }}
        >
          <Txt size={12} color={C.hint} style={{ whiteSpace: "pre" }}>
            {t("resend after")}
            <span className="font-medium" style={{ color: C.blue }}>
              {` - ${clock}`}
            </span>
          </Txt>
        </button>
        <Icon name="codeHelp" ml={4} />
      </div>
      <div
        className="flex items-start shrink-0"
        style={{ marginLeft: 40, marginTop: 412 - (389 + 15) }}
      >
        <Txt size={11} color={C.hint}>
          {t("Your privacy is completely safe")}
        </Txt>
        <Icon name="shieldGrey" ml={3} />
      </div>

      <div
        className="shrink-0"
        style={{ marginLeft: 20, marginTop: 502 - (412 + 14) }}
      >
        <RdbPinInputs
          value={pin}
          disableCustomKeypad={NATIVE_WALLET_KEYBOARD}
          onChange={setPin}
          isValidPin={valid}
          disabled={valid === "valid"}
          onComplete={() => {
            setValid("valid");
            setTimeout(onVerified, 600);
          }}
        />
      </div>
    </>
  );
}

/** The actions of `– 28`, with the x where the file starts each label. */
const ACTIONS: {
  id: "copy" | "download" | "share";
  icon: XdIconName;
  label: DemoKey;
  x: number;
  /** How far the picture sits off the label's centre, in px. */
  off: number;
}[] = [
  { id: "copy", icon: "infoCopy", label: "copy", x: 111, off: 0.5 },
  { id: "download", icon: "infoDownload", label: "download", x: 188, off: -0.5 },
  { id: "share", icon: "infoShare", label: "share", x: 290, off: 0.5 },
];

/**
 * `Home Page – 28`, after a right code:
 *   - the QR code, 300.9 px, at (65, 215);
 *   - "Withdrawal Request" (16 Medium) on baseline 544;
 *   - the cells from y 588 (see `Cells`);
 *   - three actions at y 855: a 20 px picture over an 11 px label.
 */
export function RequestReady({
  head,
  balance,
  request,
  onPicture,
}: {
  head: React.ReactNode;
  balance: WalletBalance;
  request: WithdrawalRequest;
  /** "Download": on to the picture of the request (`– 24`). */
  onPicture: () => void;
}) {
  const { t } = useDemoNav();

  const act = (id: (typeof ACTIONS)[number]["id"]) => {
    if (id === "copy")
      navigator.clipboard?.writeText(WALLET_REQUEST.reference).catch(() => {});
    if (id === "download") onPicture();
    if (id === "share" && navigator.share)
      navigator.share({ text: WALLET_REQUEST.reference }).catch(() => {});
  };

  return (
    <>
      {head}
      <Icon name="qrRequest" mt={215 - HEAD_END} ml={65} />
      <Txt center size={16} weight="medium" mt={gapTo(215 + 301, 544, 16)}>
        {t("Withdrawal Request")}
      </Txt>
      <Cells
        mt={588 - textBottom(544, 16)}
        balance={balance}
        request={request}
      />

      <div
        className="flex items-start shrink-0"
        // The labels end at y 895: 35 px above the artboard's bottom.
        style={{
          marginTop: 855 - (765 + 55),
          marginLeft: ACTIONS[0].x,
          paddingBottom: 930 - 895,
        }}
      >
        {ACTIONS.map((action, i) => (
          // The slot runs from one label's start to the next.
          <div
            key={action.id}
            className="flex shrink-0"
            style={{
              minWidth:
                i < ACTIONS.length - 1 ? ACTIONS[i + 1].x - action.x : undefined,
            }}
          >
            <motion.button
              type="button"
              data-pw={`demo-wallet-request-${action.id}`}
              onClick={() => act(action.id)}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center shrink-0 cursor-pointer"
            >
              <Icon
                name={action.icon}
                style={
                  action.off > 0
                    ? { marginLeft: action.off * 2 }
                    : { marginRight: -action.off * 2 }
                }
              />
              <Txt size={11} mt={gapTo(855 + 20, 892, 11)}>
                {t(action.label)}
              </Txt>
            </motion.button>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * `Home Page – 24`: the picture of the request, on a white page. The same
 * blocks as `– 28`, 48 px higher and with a 350.56 px code:
 *   - the title row at y 66 and the brand on baseline 132;
 *   - the QR code at (40, 167) and "Withdrawal Request" on baseline 546;
 *   - the cells from y 561;
 *   - the note, 390 x 90 at (20, 805), with a line ON its edge: its title
 *     (11 Medium) on baseline 828, then 11 px text on a 16 px line from 848.
 *
 * It lies over the sheet. A tap puts it away.
 */
export function RequestPicture({
  open,
  onClose,
  head,
  balance,
  request,
}: {
  open: boolean;
  onClose: () => void;
  head: React.ReactNode;
  balance: WalletBalance;
  request: WithdrawalRequest;
}) {
  const { t } = useDemoNav();
  return (
    <PictureLayer
      open={open}
      onClose={onClose}
      head={head}
      testId="demo-wallet-request-picture"
    >
      <Icon name="qrRequestBig" mt={167 - textBottom(132, 24)} ml={40} />
      {/* The file starts the line at x 139.5: half a px right of centre. */}
      <Txt
        center
        nudge={0.5}
        size={16}
        weight="medium"
        mt={gapTo(167 + 351, 546, 16)}
      >
        {t("Withdrawal Request")}
      </Txt>
      <Cells
        mt={561 - textBottom(546, 16)}
        balance={balance}
        request={request}
      />
      <Box
        w={390}
        h={90}
        mt={805 - (738 + 55)}
        ml={20}
        radius={15}
        fill={C.card}
        stroke={C.line}
        strokeAlign="center"
        data-pw="demo-wallet-request-note"
        className="flex flex-col"
        style={{
          height: undefined,
          minHeight: 90,
          paddingLeft: 12,
          paddingBottom: 895 - (paraTop(848, 11, 16) + 3 * 16),
          marginBottom: 930 - 895,
        }}
      >
        <Txt size={11} weight="medium" mt={gapTo(805, 828, 11)}>
          {t("Your Withdrawal Request Ready to Collect !")}
        </Txt>
        <p
          className="shrink-0 font-normal"
          style={{
            marginTop: paraTop(848, 11, 16) - textBottom(828, 11),
            width: 366,
            fontSize: 11,
            lineHeight: "16px",
            color: C.ink,
          }}
        >
          {`${t(
            "Present this code along with your personal ID at any of our branches and receive the amount in complete security.",
          )} `}
          <span className="font-medium">{t("Thank you")}</span>
          {" | "}
          <span className="font-medium">
            {t("we are pleased to serve you")}
          </span>
          .
        </p>
      </Box>
    </PictureLayer>
  );
}

/**
 * The white page a picture is drawn on (`Home Page – 24`, `– 31`, `– 38`):
 * the file draws no status bar there, and the sheet's title row at y 66. It
 * lies over the sheet; a tap puts it away.
 */
export function PictureLayer({
  open,
  onClose,
  head,
  testId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** The sheet's title row and the line under it. */
  head: React.ReactNode;
  testId: string;
  children: React.ReactNode;
}) {
  useOuterBackdrop(open, `linear-gradient(${C.white}, ${C.white})`);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="picture"
          data-pw={testId}
          role="dialog"
          aria-modal="true"
          className="absolute inset-0 z-40 flex flex-col font-quicksand overflow-y-auto overflow-x-hidden overscroll-contain"
          // The column starts at design y 50, the top of the app.
          style={{
            background: C.white,
            paddingTop: top(50),
            scrollbarWidth: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* The title row starts 11 px under its block: at y 66 here. */}
          <div
            className="flex flex-col shrink-0"
            style={{ paddingTop: 66 - 50 - 11 }}
          >
            {head}
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The cells of a request, `#FCFCFC`, radius 15, 55 tall and 4 px apart: the
 * client's name and the authorized recipient's name (390 wide), then two rows
 * of two (193 wide). A grey 12 px label on baseline 20 and a 14 px value on 43.
 */
function Cells({
  mt,
  balance,
  request,
}: {
  mt: number;
  balance: WalletBalance;
  request: WithdrawalRequest;
}) {
  const { t } = useDemoNav();
  return (
    <>
      <Cell mt={mt} label={t("Trydos client Name")} testId="client">
        {WALLET_RECIPIENT.name}
      </Cell>
      {request.authorized && (
        <Cell
          mt={4}
          label={t("Authorized recipient Full name")}
          testId="authorized"
        >
          {request.authorized}
        </Cell>
      )}
      <div className="flex shrink-0" style={{ marginTop: 4 }}>
        <Cell w={193} label={t("amount")} testId="amount">
          <span className="font-medium">{`${request.amount} `}</span>
          {balance.code}
        </Cell>
        <Cell
          w={193}
          ml={4}
          label={`${t("reference")} | ${t("ID")}`}
          testId="reference"
          medium
        >
          {WALLET_REQUEST.reference}
        </Cell>
      </div>
      <div className="flex shrink-0" style={{ marginTop: 4 }}>
        <Cell w={193} label={t("Date & time")} testId="date">
          {WALLET_REQUEST.date}
        </Cell>
        <Cell w={193} ml={4} label={t("type")} testId="type">
          {t("Withdrawal Request")}
        </Cell>
      </div>
    </>
  );
}

function Cell({
  mt,
  ml = 20,
  w = 390,
  label,
  children,
  medium = false,
  testId,
}: {
  mt?: number;
  ml?: number;
  w?: number;
  label: string;
  children: React.ReactNode;
  /** The file writes the reference Medium. */
  medium?: boolean;
  testId: string;
}) {
  return (
    <Box
      w={w}
      h={55}
      mt={mt}
      ml={ml}
      radius={15}
      fill={C.card}
      data-pw={`demo-wallet-request-${testId}`}
      className="flex flex-col"
      style={{ padding: "8px 12px 0" }}
    >
      <Txt size={12} color={C.grey}>
        {label}
      </Txt>
      <Txt
        size={14}
        weight={medium ? "medium" : "regular"}
        mt={gapTo(8 + lineBox(12), 43, 14)}
        style={{ whiteSpace: "pre" }}
      >
        {children}
      </Txt>
    </Box>
  );
}

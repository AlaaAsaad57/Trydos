"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NumericKeypad } from "components/Login/Enhanced/ui/NumericKeypad";
import { useIsTouchDevice } from "hooks/useIsTouchDevice";
import { useDemoNav } from "../DemoShell";
import { C, SHEET, gapTo, lineBox, paraTop, textBottom } from "../demoLayout";
import { Box, Icon, Sheet, Txt } from "../ui";
import type { XdIconName } from "../xdIcons";
import {
  WALLET_BALANCES,
  WALLET_BRAND,
  WALLET_PROVIDERS,
  WALLET_RECIPIENT,
} from "../demoWallet";

/**
 * Cash Out — XD `Home Page – 21` (the ways to cash out) and `– 19` (the
 * trydos | rdb form).
 *
 * One sheet, two steps. The file draws the first step from y 244 and the
 * second from y 90, both with 50 px top corners. The sheet is laid out at 90
 * and rests 154 px lower while the first step is on show.
 *
 * Every y below is the file's. The handle ends 13 px under the sheet's top
 * edge, so a step's first block has `mt` = its y minus (top + 13).
 */

type Step = "ways" | "form";

const TOP: Record<Step, number> = { ways: 244, form: 90 };

/** The brand, as the file writes it: "try" and "rdb" Bold, the rest Regular. */
function Brand({ size, mt, nudge }: { size: number; mt: number; nudge?: number }) {
  return (
    <Txt center nudge={nudge} size={size} mt={mt} style={{ whiteSpace: "pre" }}>
      <span className="font-bold">{WALLET_BRAND.start}</span>
      {WALLET_BRAND.rest}
      <span className="font-bold">{WALLET_BRAND.bank}</span>
    </Txt>
  );
}

/**
 * The top row of a wallet sheet: the 30 px picture at x 24, the dollar mark
 * at x 58 (5 px lower), and the title (24 Bold) centred on the sheet.
 */
export function SheetTitle({
  top,
  icon,
  label,
}: {
  /** Design y of the sheet's top edge. */
  top: number;
  icon: XdIconName;
  label: string;
}) {
  return (
    <div
      className="grid items-start shrink-0"
      style={{
        marginTop: top + 24 - (top + 13),
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
      }}
    >
      <div className="flex items-start">
        <Icon name={icon} ml={24} />
        <Icon name="dollarDark" mt={5} ml={58 - (24 + 30)} />
      </div>
      <Txt size={24} weight="bold" as="h2">
        {label}
      </Txt>
    </div>
  );
}

function Title({ top }: { top: number }) {
  const { t } = useDemoNav();
  return <SheetTitle top={top} icon="cashOutBig" label={t("Cash Out")} />;
}

export default function WalletCashOutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("ways");

  // The sheet opens on its first step every time. The step goes back once
  // the sheet has slid away, so it does not change while it is leaving.
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setStep("ways"), 400);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      y={TOP.form}
      lower={TOP[step] - TOP.form}
      radius={SHEET.radiusWallet}
      testId="demo-wallet-cash-out-sheet"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          data-pw={`demo-wallet-cash-out-${step}`}
          className="flex flex-col shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {step === "ways" ? (
            <Ways onPick={() => setStep("form")} />
          ) : (
            <Form />
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}

/**
 * `Home Page – 21`, sheet from y 244:
 *   - the note, 14 px on an 18 px line, 366 wide, centred, first baseline 324;
 *   - the trydos | rdb card 390 x 188 at (20, 366) with a purple line: the
 *     "Recommended" tag 94 x 22 at (310, 372), the brand (30 px) on baseline
 *     472, the "Easy . Fast . No Commission" tag 158 x 22 at (136, 488);
 *   - three 125 px tiles at y 562 with a 101 px picture 12 px in;
 *   - the grey card 390 x 188 at (20, 707) with its two 366 x 38 buttons.
 * The lines of the cards and the tiles sit ON the edge (XD's centre stroke).
 */
function Ways({ onPick }: { onPick: () => void }) {
  const { t } = useDemoNav();
  const top = TOP.ways;
  return (
    <>
      <Title top={top} />
      <p
        className="shrink-0 font-normal text-center"
        style={{
          marginTop: paraTop(324, 14, 18) - (top + 24 + lineBox(24)),
          marginLeft: 32,
          width: 366,
          fontSize: 14,
          lineHeight: "18px",
          color: C.ink,
        }}
      >
        {t(
          "You can withdraw your money through the following options easily and securely.",
        )}
      </p>

      <motion.button
        type="button"
        data-pw="demo-wallet-way-rdb"
        onClick={onPick}
        whileTap={{ scale: 0.985 }}
        className="shrink-0 cursor-pointer"
        style={{ marginTop: 366 - (310 + 36), marginLeft: 20 }}
      >
        <Box
          w={390}
          h={188}
          radius={15}
          fill={C.card}
          stroke={C.purple}
          strokeAlign="center"
          className="flex flex-col"
        >
          <Box
            w="auto"
            h={22}
            mt={372 - 366}
            radius={8}
            fill={C.purpleTint}
            className="self-end"
            style={{ marginRight: 410 - (310 + 94), minWidth: 94, padding: "0 8px" }}
          >
            <Txt center size={11} color={C.purple} mt={gapTo(372, 387, 11)}>
              {t("Recommended")}
            </Txt>
          </Box>
          {/* The file centres the brand on x 216, 1 px right of the card's centre. */}
          <Brand size={30} mt={gapTo(372 + 22, 472, 30)} nudge={1} />
          <Box
            w="auto"
            h={22}
            mt={488 - textBottom(472, 30)}
            radius={8}
            fill={C.purpleTint}
            stroke={C.purple}
            className="self-center"
            style={{ minWidth: 158, padding: "0 8px" }}
          >
            <Txt center size={11} color={C.purple} mt={gapTo(488, 503, 11)}>
              {t("Easy . Fast . No commission")}
            </Txt>
          </Box>
        </Box>
      </motion.button>

      <div
        className="flex shrink-0"
        style={{ marginTop: 562 - (366 + 188), marginLeft: 20 }}
      >
        {WALLET_PROVIDERS.map((provider) => (
          <motion.button
            key={provider.id}
            type="button"
            aria-label={t(provider.name)}
            data-pw={`demo-wallet-way-${provider.id}`}
            whileTap={{ scale: 0.97 }}
            className="shrink-0 cursor-pointer"
            style={{ marginLeft: provider.gap }}
          >
            <Box
              w={125}
              h={125}
              radius={15}
              fill={C.card}
              stroke={C.line}
              strokeAlign="center"
              style={{ padding: 12 }}
            >
              <img
                src={`/assets/demo/xd/${provider.picture}.jpg`}
                alt=""
                draggable={false}
                width={101}
                height={101}
                className="block object-cover select-none pointer-events-none"
                style={{ width: 101, height: 101, borderRadius: 15 }}
              />
            </Box>
          </motion.button>
        ))}
      </div>

      <Box
        w={390}
        h={188}
        mt={707 - (562 + 125)}
        ml={20}
        radius={15}
        fill={C.card}
        stroke={C.line}
        strokeAlign="center"
        className="flex flex-col"
        style={{ height: undefined, minHeight: 188, paddingBottom: 895 - (845 + 38) }}
      >
        <Txt
          center
          size={11}
          weight="medium"
          color={C.grey}
          mt={gapTo(707, 730, 11)}
        >
          {t("Withdraw your funds !")}
        </Txt>
        <p
          className="shrink-0 font-normal text-center"
          style={{
            marginTop: paraTop(752, 11, 18) - textBottom(730, 11),
            marginLeft: 32 - 20,
            width: 366,
            fontSize: 11,
            lineHeight: "18px",
            color: C.grey,
          }}
        >
          {t(
            "You can withdraw your funds with complete ease through one of our Trydos & RDB centers. You can also withdraw your funds to your personal account on RDB.",
          )}
        </p>
        {/* Three lines end at y 793; the first button is at 801. */}
        <InfoButton
          mt={801 - (paraTop(752, 11, 18) + 3 * 18)}
          label={t("Available branches")}
          testId="demo-wallet-branches"
        />
        {/* The file starts "More Info" at x 190: half a px left of centre. */}
        <InfoButton
          mt={845 - (801 + 38)}
          nudge={-0.5}
          label={t("More Info")}
          testId="demo-wallet-more-info"
        />
      </Box>
    </>
  );
}

/** A 366 x 38 button of the grey card: `#F8F8F8`, radius 15, 11 Medium grey. */
function InfoButton({
  mt,
  nudge,
  label,
  testId,
}: {
  mt: number;
  nudge?: number;
  label: string;
  testId: string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col shrink-0 cursor-pointer"
      style={{
        marginTop: mt,
        marginLeft: 32 - 20,
        width: 366,
        height: 38,
        borderRadius: 15,
        background: C.field,
      }}
    >
      {/* Baseline 23 in the button (824 - 801). */}
      <Txt
        center
        nudge={nudge}
        size={11}
        weight="medium"
        color={C.grey}
        mt={gapTo(0, 23, 11)}
      >
        {label}
      </Txt>
    </motion.button>
  );
}

/**
 * `Home Page – 19`, sheet from y 90:
 *   - the brand (24 px) on baseline 180;
 *   - two 193 x 28 tabs at y 213, 4 apart: the chosen one `#79E9B3`, the other
 *     `#FCFCFC` with a line;
 *   - the two recipient fields, 390 x 55 at y 245 and 304, `#FCFCFC`;
 *   - "+ Add Authorized Recipient", 356 x 30 at (32, 363), radius 12;
 *   - the amount field at y 515, white with the blue line of a field in use.
 *     The grey block the file draws from y 582, 12 px under it, stands for
 *     the login's own keypad (`NumericKeypad`).
 *
 * The keypad, as in the login's phone box (`RdbPhoneInput`): on a touch device
 * the amount is typed with the app's keypad, and the field marks itself
 * `data-keyboard-anchor` so the scaled canvas keeps it above the keypad. With a
 * mouse and a keyboard there is no keypad, and the field is a plain input.
 */
function Form() {
  const { t } = useDemoNav();
  const top = TOP.form;
  const [amount, setAmount] = useState("");
  const [typing, setTyping] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const touch = useIsTouchDevice();
  const field = useRef<HTMLDivElement>(null);
  const keys = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const balance = WALLET_BALANCES[0];
  const inUse = touch ? keypad : typing;

  const use = () => {
    if (touch) setKeypad(true);
    else input.current?.focus({ preventScroll: true });
  };

  // The file shows the amount field in use when the form opens.
  useEffect(() => {
    const timer = setTimeout(use, 350);
    return () => clearTimeout(timer);
    // Once per form, and again when the device turns out to be a touch one.
  }, [touch]);

  // A tap outside the field and the keypad puts the keypad away.
  useEffect(() => {
    if (!keypad) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (field.current?.contains(target) || keys.current?.contains(target))
        return;
      setKeypad(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [keypad]);

  const [toMy, bank = ""] = t("To My {bank}").split("{bank}");

  return (
    <>
      <Title top={top} />
      <Brand size={24} mt={gapTo(top + 24 + lineBox(24), 180, 24)} />

      <div
        className="flex shrink-0"
        style={{ marginTop: 213 - textBottom(180, 24), marginLeft: 20 }}
      >
        <Tab chosen testId="demo-wallet-tab-cash">
          {t("Cash Withdrawal")}
        </Tab>
        <Tab ml={4} testId="demo-wallet-tab-bank">
          <span className="font-normal">{toMy}</span>
          <span className="font-bold">{WALLET_BRAND.bank}</span>
          <span className="font-normal">{bank}</span>
        </Tab>
      </div>

      <Recipient
        mt={245 - (213 + 28)}
        label={t("Trydos client phone number")}
        testId="demo-wallet-recipient-phone"
      >
        {/* "+" Bold at x 32, the number from x 44. */}
        <span className="font-bold inline-block" style={{ minWidth: 44 - 32 }}>
          +
        </span>
        {WALLET_RECIPIENT.phone}
      </Recipient>
      <Recipient
        mt={304 - (245 + 55)}
        label={t("Trydos client Full name ( Exact ID )")}
        testId="demo-wallet-recipient-name"
      >
        {WALLET_RECIPIENT.name}
      </Recipient>

      <motion.button
        type="button"
        data-pw="demo-wallet-add-recipient"
        whileTap={{ scale: 0.98 }}
        className="flex flex-col shrink-0 cursor-pointer"
        style={{
          marginTop: 363 - (304 + 55),
          marginLeft: 32,
          width: 356,
          height: 30,
          borderRadius: 12,
          background: C.card,
        }}
      >
        <Txt
          center
          size={11}
          mt={gapTo(363, 382, 11)}
          style={{ whiteSpace: "pre" }}
        >
          <span className="font-medium">{`+ ${t("Add")} `}</span>
          {t("Authorized recipient")}
          {/* The file's line ends with a space, and it is centred with it.
              A plain space at the end of a line takes no room; this one does. */}
          <span className="font-medium">{" "}</span>
        </Txt>
      </motion.button>

      <Box
        w={390}
        h={55}
        mt={515 - (363 + 30)}
        ml={20}
        radius={15}
        fill={C.white}
        stroke={inUse ? C.blue : C.line}
        ref={field}
        data-pw="demo-wallet-amount"
        // While the app's keypad is up, the scaled canvas keeps this box above it.
        data-keyboard-anchor={touch && keypad ? "" : undefined}
        className="flex flex-col cursor-text"
        style={{ padding: "8px 12px 0" }}
        onClick={use}
      >
        <div className="flex items-start shrink-0">
          <Txt size={12} weight="medium" as="label">
            {t("Enter withdrawal amount")}
          </Txt>
          {/* From x 291 in the file; it ends 12 px inside the field. */}
          <Txt
            size={12}
            color={C.placeholder}
            className="ml-auto"
            style={{ width: 398 - 291, whiteSpace: "pre" }}
          >
            {`${t("Available")} `}
            <span className="font-medium">{balance.amount}</span>
            {` ${balance.code}`}
          </Txt>
        </div>
        {/* The value line of every demo field: 23 tall, 3 under the label,
            which puts the 14 px text on the field's baseline 43. The grey
            "0,00 USD" lies in the same cell while the field is empty. */}
        <div className="grid shrink-0" style={{ marginTop: 3, height: 23 }}>
          {amount === "" && (
            <span
              aria-hidden="true"
              className="pointer-events-none font-normal self-center"
              style={{
                gridArea: "1 / 1",
                fontSize: 14,
                lineHeight: `${lineBox(14)}px`,
                color: C.placeholder,
                whiteSpace: "pre",
              }}
            >
              <span className="font-medium">{"0,00 "}</span>
              {balance.code}
            </span>
          )}
          <input
            ref={input}
            data-pw="demo-wallet-amount-input"
            type="text"
            // With the app's keypad the phone's own keyboard stays away.
            inputMode={touch ? "none" : "decimal"}
            readOnly={touch}
            tabIndex={touch ? -1 : undefined}
            value={amount}
            aria-label={t("Enter withdrawal amount")}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            className={`block bg-transparent outline-none font-normal ${touch ? "pointer-events-none" : ""}`}
            style={{
              gridArea: "1 / 1",
              width: 390 - 24,
              height: 23,
              fontSize: 14,
              color: C.ink,
              padding: 0,
              border: 0,
            }}
          />
        </div>
      </Box>

      {touch && (
        <NumericKeypad
          open={keypad}
          keypadRef={keys}
          onPress={(digit) => setAmount((now) => (now + digit).slice(0, 12))}
          onBackspace={() => setAmount((now) => now.slice(0, -1))}
        />
      )}
    </>
  );
}

/** A tab of the form, 193 x 28, radius 8, 13 px text on baseline 19. */
function Tab({
  chosen = false,
  ml,
  children,
  testId,
}: {
  chosen?: boolean;
  ml?: number;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-pw={testId}
      aria-pressed={chosen}
      className="shrink-0 cursor-pointer"
      style={{ marginLeft: ml }}
    >
      <Box
        w={193}
        h={28}
        radius={8}
        fill={chosen ? C.green : C.card}
        stroke={chosen ? undefined : C.line}
        className="flex flex-col"
      >
        {/* The file centres the words half a px right of the tab's centre. */}
        <Txt
          center
          nudge={0.5}
          size={13}
          weight="medium"
          mt={gapTo(213, 232, 13)}
          style={{ whiteSpace: "pre" }}
        >
          {children}
        </Txt>
      </Box>
    </button>
  );
}

/**
 * A recipient field, 390 x 55, `#FCFCFC`: the grey label (12, "Recipient"
 * Medium) on baseline 20 and the value (14) on 43, both 12 px in.
 */
function Recipient({
  mt,
  label,
  children,
  testId,
}: {
  mt: number;
  label: string;
  children: React.ReactNode;
  testId: string;
}) {
  const { t } = useDemoNav();
  return (
    <Box
      w={390}
      h={55}
      mt={mt}
      ml={20}
      radius={15}
      fill={C.card}
      data-pw={testId}
      className="flex flex-col"
      style={{ padding: "8px 12px 0" }}
    >
      <Txt size={12} color={C.grey} style={{ whiteSpace: "pre" }}>
        <span className="font-medium">{t("recipient")}</span>
        {` ${label}`}
      </Txt>
      <Txt size={14} mt={gapTo(8 + lineBox(12), 43, 14)} style={{ whiteSpace: "pre" }}>
        {children}
      </Txt>
    </Box>
  );
}

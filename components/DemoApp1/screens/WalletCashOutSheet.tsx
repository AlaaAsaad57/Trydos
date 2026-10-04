"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NumericKeypad } from "components/Login/Enhanced/ui/NumericKeypad";
import { useIsTouchDevice } from "hooks/useIsTouchDevice";
import { useDemoNav } from "../Demo1Shell";
import { NATIVE_WALLET_KEYBOARD } from "../../DemoApp/demoKeyboard";
import {
  C,
  DESIGN_W,
  SAFE_TOP,
  SHEET,
  UNDER_BAR,
  fill,
  gapTo,
  lineBox,
  paraTop,
  textBottom,
} from "../demo1Layout";
import {
  Box,
  FileLines,
  Icon,
  Sheet,
  Stroke,
  Txt,
  Under,
  useCanvasEnd,
} from "../ui";
import { useKeypadRoom } from "../useKeypadRoom";
import type { XdIconName } from "../../DemoApp/xdIcons";
import {
  WALLET_BANK_ACCOUNT,
  WALLET_BRAND,
  WALLET_PROVIDERS,
  WALLET_RECIPIENT,
  type WalletBalance,
} from "../../DemoApp/demoWallet";
import {
  RequestCode,
  RequestPicture,
  RequestReady,
  type WithdrawalRequest,
} from "./WalletWithdrawalRequest";

/**
 * Cash Out — XD `Home Page – 21` (the ways to cash out), `– 19`, `– 20`,
 * `– 25`, `– 27`, `– 29`, `– 35`, `– 36` (the trydos | rdb form and its states),
 * `– 30` (the code reader), and `– 101`, `– 28`, `– 24` (a withdrawal
 * request, in WalletWithdrawalRequest.tsx).
 *
 * One sheet, five steps. The file draws the first step from y 244 and the
 * others from y 90, all with 50 px top corners. The sheet is laid out at 90
 * and rests 154 px lower while the first step is on show.
 *
 * Every y below is the file's. The handle ends 13 px under the sheet's top
 * edge, so a step's first block has `mt` = its y minus (top + 13).
 *
 * On /demo1 the widths are fluid: a block keeps the file's distance to both
 * edges of the sheet (`fill()`), so on a 430 px phone it is the file's width.
 */

type Step = "ways" | "form" | "scan" | "code" | "request";

const TOP: Record<Step, number> = {
  ways: 244,
  form: 90,
  scan: 90,
  code: 90,
  request: 90,
};

/** The boards of the form and the code reader end at y 930. */
const BOARD_END = 930;

/** Someone else who may collect the money (`Home Page – 25`, `– 27`). */
type Authorized = { phone: string; name: string };

/** The field the shopper is typing in. */
type InUse = "amount" | "phone" | "name" | null;

/** A typed amount as a number. */
const toNumber = (text: string) =>
  Number.parseFloat(text.replace(",", ".")) || 0;

/** A sentence with the bank's name in it, which the file draws Bold. */
export function WithBank({ text }: { text: string }) {
  const [before, after = ""] = text.split("{bank}");
  return (
    <>
      {before}
      <span className="font-bold">{WALLET_BRAND.bank}</span>
      {after}
    </>
  );
}

/** The brand, as the file writes it: "try" and "rdb" Bold, the rest Regular. */
export function Brand({
  size,
  mt,
  nudge,
}: {
  size: number;
  mt: number;
  nudge?: number;
}) {
  return (
    <Txt center nudge={nudge} size={size} mt={mt} style={{ whiteSpace: "pre" }}>
      <span className="font-bold">{WALLET_BRAND.start}</span>
      {WALLET_BRAND.rest}
      <span className="font-bold">{WALLET_BRAND.bank}</span>
    </Txt>
  );
}

/** Moves a block `nudge` px right (or left) of its place by padding one side. */
const offCentre = (nudge = 0): React.CSSProperties =>
  nudge > 0
    ? { paddingLeft: nudge * 2 }
    : nudge < 0
      ? { paddingRight: -nudge * 2 }
      : {};

/**
 * The top row of a wallet sheet: the 30 px picture at x 24, the dollar mark
 * at x 58 (5 px lower), and the title (24 Bold) centred on the sheet.
 */
export function SheetTitle({
  top,
  icon,
  mark,
  label,
  weight = "bold",
  nudge,
}: {
  /** Design y of the sheet's top edge. */
  top: number;
  icon: XdIconName;
  /** The currency's mark. */
  mark: XdIconName;
  label: string;
  /** Bold on every sheet but the ways to cash in (`Home Page – 22`): Medium. */
  weight?: "bold" | "medium";
  /** How far the file puts the title off centre, in px (+ is right). */
  nudge?: number;
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
        <Icon name={mark} mt={5} ml={58 - (24 + 30)} />
      </div>
      <Txt size={24} weight={weight} as="h2" style={offCentre(nudge)}>
        {label}
      </Txt>
    </div>
  );
}

function Title({ top, mark }: { top: number; mark: XdIconName }) {
  const { t } = useDemoNav();
  return (
    <SheetTitle top={top} icon="cashOutBig" mark={mark} label={t("Cash Out")} />
  );
}

export default function WalletCashOutSheet({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  /** The balance the money leaves. */
  balance: WalletBalance;
}) {
  const [step, setStep] = useState<Step>("ways");
  // Kept here, so the form has them again after "Back" on the code reader.
  const [amount, setAmount] = useState("");
  const [authorized, setAuthorized] = useState<Authorized | null>(null);
  /** The picture of the request (`Home Page – 24`) lies over the sheet. */
  const [picture, setPicture] = useState(false);
  /**
   * Set by the form in use on a touch device: the sheet rests this many px
   * under its design top (see `Form`). Null: the sheet is at its design
   * top.
   */
  const [hold, setHold] = useState<number | null>(null);
  const held = step === "form" ? hold : null;

  const request: WithdrawalRequest = {
    amount,
    authorized: authorized?.name.trim() || undefined,
  };
  const head = (
    <>
      <Title top={TOP.form} mark={balance.mark} />
      <Brand size={24} mt={gapTo(TOP.form + 24 + lineBox(24), 180, 24)} />
    </>
  );

  // The sheet opens on its first step every time. The step goes back once
  // the sheet has slid away, so it does not change while it is leaving.
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => {
      setStep("ways");
      setAmount("");
      setAuthorized(null);
      setPicture(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        y={TOP.form}
        lower={TOP[step] - TOP.form + (held ?? 0)}
        radius={SHEET.radiusWallet}
        fit
        testId="demo-wallet-cash-out-sheet"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            data-pw={`demo-wallet-cash-out-${step}`}
            className="flex flex-col"
            // A step fills the sheet down to the screen's end, and never goes
            // past the board's end (y 930). Its head stays in place and only
            // the part under the head scrolls (see `Under`). The sheet keeps
            // room under it for its `lower` and the home bar, so the step
            // ends where the screen does.
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              // It runs on under Safari's bar, as the sheet does.
              maxHeight: BOARD_END - (TOP[step] + 13) + UNDER_BAR,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {step === "ways" && (
              <Ways mark={balance.mark} onPick={() => setStep("form")} />
            )}
            {step === "form" && (
              <Form
                balance={balance}
                amount={amount}
                setAmount={setAmount}
                authorized={authorized}
                setAuthorized={setAuthorized}
                onHold={setHold}
                onNow={() => setStep("scan")}
                onRequest={() => setStep("code")}
              />
            )}
            {step === "scan" && (
              <Scan
                balance={balance}
                amount={amount}
                onBack={() => setStep("form")}
              />
            )}
            {step === "code" && (
              <RequestCode
                head={head}
                balance={balance}
                request={request}
                onVerified={() => setStep("request")}
              />
            )}
            {step === "request" && (
              <RequestReady
                head={head}
                balance={balance}
                request={request}
                onPicture={() => setPicture(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Sheet>
      <RequestPicture
        open={open && picture}
        onClose={() => setPicture(false)}
        head={head}
        balance={balance}
        request={request}
      />
    </>
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
function Ways({ mark, onPick }: { mark: XdIconName; onPick: () => void }) {
  const { t } = useDemoNav();
  const top = TOP.ways;
  return (
    <>
      <Title top={top} mark={mark} />
      <Under testId="demo-wallet-cash-out-ways-under">
        <FileLines
          text={t(
            "You can withdraw your money through the following options easily and securely.",
          )}
          lines={[
            {
              x: 40.13,
              text: "You Can Withdraw Your Money Through The Following ",
            },
            { x: 124.5, text: "Options Easily And Securely." },
          ]}
          left={32}
          ml={32}
          width={fill(32)}
          size={14}
          lineHeight={18}
          mt={paraTop(324, 14, 18) - (top + 24 + lineBox(24))}
        />

        <BrandCard y={366} mt={366 - (310 + 36)} onClick={onPick} />

        {/* The three tiles share the row's width, with the file's 8 and 7 px
            between them: 125 px each on a 430 px phone. The picture fills the
            tile 12 px in, 101 tall, and is cut at its sides on a narrow
            screen. */}
        <div
          className="flex shrink-0"
          style={{
            marginTop: 562 - (366 + 188),
            marginLeft: 20,
            width: fill(20),
          }}
        >
          {WALLET_PROVIDERS.map((provider) => (
            <motion.button
              key={provider.id}
              type="button"
              aria-label={t(provider.name)}
              data-pw={`demo-wallet-way-${provider.id}`}
              whileTap={{ scale: 0.97 }}
              className="cursor-pointer"
              style={{ flex: "1 1 0", minWidth: 0, marginLeft: provider.gap }}
            >
              <Box
                w="100%"
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
                  style={{ width: "100%", height: 101, borderRadius: 15 }}
                />
              </Box>
            </motion.button>
          ))}
        </div>

        <Box
          w={fill(20)}
          h={188}
          mt={707 - (562 + 125)}
          ml={20}
          radius={15}
          fill={C.card}
          stroke={C.line}
          strokeAlign="center"
          className="flex flex-col"
          // The card ends at y 895: 35 px above the artboard's bottom.
          style={{
            height: undefined,
            minHeight: 188,
            paddingBottom: 895 - (845 + 38),
            marginBottom: 930 - 895,
          }}
        >
          <FileLines
            text={t("Withdraw your funds !")}
            lines={[{ x: 157.06, text: "Withdraw Your Funds !" }]}
            left={32}
            ml={32 - 20}
            width={fill(12)}
            size={11}
            lineHeight={lineBox(11)}
            weight="medium"
            color={C.grey}
            mt={gapTo(707, 730, 11)}
          />
          <FileLines
            text={t(
              "You can withdraw your funds with complete ease through one of our Trydos & RDB centers. You can also withdraw your funds to your personal account on RDB.",
            )}
            lines={[
              {
                x: 33.01,
                text: "You Can Withdraw Your Funds With Complete Ease Through One Of Our ",
              },
              {
                x: 48.52,
                text: "Trydos & RDB Centers. You Can Also Withdraw Your Funds To Your ",
              },
              { x: 149.17, text: "Personal Account On RDB." },
            ]}
            left={32}
            ml={32 - 20}
            width={fill(12)}
            size={11}
            lineHeight={18}
            color={C.grey}
            mt={paraTop(752, 11, 18) - textBottom(730, 11)}
          />
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
      </Under>
    </>
  );
}

/**
 * The trydos | rdb card of the ways to cash out (`Home Page – 21`, at y 366)
 * and to cash in (`– 22`, at y 338): 390 x 188 at x 20 with a purple line ON
 * its edge. From the card's top: the "Recommended" tag 94 x 22 at (310, +6),
 * the brand (30 px) on baseline +106, the "Easy . Fast . No Commission" tag
 * 158 x 22 at (136, +122). The card is 20 px from both edges; the
 * "Recommended" tag keeps its 6 px to the card's right edge.
 */
export function BrandCard({
  y,
  mt,
  onClick,
}: {
  /** Design y of the card's top edge. */
  y: number;
  mt: number;
  onClick: () => void;
}) {
  const { t } = useDemoNav();
  return (
    <motion.button
      type="button"
      data-pw="demo-wallet-way-rdb"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="shrink-0 cursor-pointer"
      style={{ marginTop: mt, marginLeft: 20, width: fill(20) }}
    >
      <Box
        w="100%"
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
          mt={6}
          radius={8}
          fill={C.purpleTint}
          className="self-end"
          style={{
            marginRight: 410 - (310 + 94),
            minWidth: 94,
            padding: "0 8px",
          }}
        >
          <Txt center size={11} color={C.purple} mt={gapTo(0, 15, 11)}>
            {t("Recommended")}
          </Txt>
        </Box>
        {/* The file centres the brand on x 216, 1 px right of the card's centre. */}
        <Brand size={30} mt={gapTo(y + 6 + 22, y + 106, 30)} nudge={1} />
        <Box
          w="auto"
          h={22}
          mt={y + 122 - textBottom(y + 106, 30)}
          radius={8}
          fill={C.purpleTint}
          stroke={C.purple}
          className="self-center"
          style={{ minWidth: 158, padding: "0 8px" }}
        >
          <Txt center size={11} color={C.purple} mt={gapTo(0, 15, 11)}>
            {t("Easy . Fast . No commission")}
          </Txt>
        </Box>
      </Box>
    </motion.button>
  );
}

/**
 * A 366 x 38 button of the grey card: `#F8F8F8`, radius 15, 11 Medium grey,
 * 12 px from both edges of the card.
 */
export function InfoButton({
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
        width: fill(12),
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
 * The form, sheet from y 90. On every board:
 *   - the brand (24 px) on baseline 180;
 *   - two 193 x 28 tabs at y 213, 4 apart: the chosen one `#79E9B3`, the other
 *     `#FCFCFC` with a line;
 *   - the two recipient fields, 390 x 55 at y 245 and 304, `#FCFCFC`.
 *
 * Under them, the states the file draws:
 *   - `– 19`, the form as it opens: "+ Add Authorized Recipient", 356 x 30 at
 *     (32, 363), and the amount field in use at y 515 (white, blue line).
 *   - `– 20`, the amount is more than the balance: the amount field is 93
 *     tall with an orange line, and holds "Your Balance Is Insufficient" on a
 *     366 x 30 tint, 55 px down. It still ends at y 570, so it starts at 477.
 *   - `– 25`, after "+ Add": two more fields at y 363 and 422, the first in
 *     use, then "- Remove Authorized Recipient" at (37, 481).
 *   - `– 27`, all filled, with an authorized recipient: every field `#FCFCFC`
 *     with a blue "Edit" in its label, the note at (37, 574) and "Withdrawal
 *     Request" at (20, 835).
 *   - `– 29`, all filled, no authorized recipient: the amount field moves up
 *     to y 397, 4 px under the add button, and "Withdrawal Now" (20, 767)
 *     stands over "Withdrawal Request".
 * `– 27` and `– 29` also draw a grey 15 px eye in the recipient's name field.
 *
 * `– 36` is the other tab, "To My rdb": the client's own account in three
 * fields at y 245, 304 and 363, the amount field right under them at y 422,
 * in use. The tab not chosen is `#F8F8F8` there, with Regular words. `– 35`
 * is the same tab with the amount typed: "Withdrawal To rdb" at (20, 835).
 *
 * The grey block the file draws from y 582, 12 px under the amount field,
 * stands for the login's own keypad (`NumericKeypad`). As in the login's phone
 * box (`RdbPhoneInput`): on a touch device the amount and the phone number are
 * typed with the app's keypad. With a mouse and a keyboard there is no
 * keypad, and the fields are plain inputs.
 *
 * /demo lifts its scaled canvas to keep the field in use above the keypad.
 * /demo1 has no canvas to lift: when the field in use would end under the
 * keypad, the part under the tabs scrolls it up instead (see `lift`).
 */
/**
 * The gap over the amount field while the keypad is up on a short screen:
 * half of the file's 122 px (y 393 to 515).
 */
const SHORT_GAP = 61;

/** The part of the form under the tabs; it scrolls on its own. */
const FORM_UNDER = "demo-wallet-cash-out-form-under";

/** The device's own top inset in px: 0 in a browser tab. */
function useSafeTop(watch: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!watch) return;
    const probe = document.createElement("div");
    probe.style.cssText = `position: fixed; visibility: hidden; height: ${SAFE_TOP}`;
    document.body.appendChild(probe);
    setInset(probe.offsetHeight);
    probe.remove();
  }, [watch]);
  return inset;
}

function Form({
  balance,
  amount,
  setAmount,
  authorized,
  setAuthorized,
  onHold,
  onNow,
  onRequest,
}: {
  balance: WalletBalance;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  authorized: Authorized | null;
  setAuthorized: React.Dispatch<React.SetStateAction<Authorized | null>>;
  /** How far under its design top the sheet rests, or null for the usual place. */
  onHold: (drop: number | null) => void;
  /** "Withdrawal Now": on to the code reader. */
  onNow: () => void;
  /** "Withdrawal Request": on to the code (`Home Page – 101`). */
  onRequest: () => void;
}) {
  const { t } = useDemoNav();
  const top = TOP.form;
  const [active, setActive] = useState<InUse>(null);
  /** The chosen tab: cash from a center, or to the client's own account. */
  const [tab, setTab] = useState<"cash" | "bank">("cash");
  const toBank = tab === "bank";
  /** The authorized recipient is part of the cash tab only. */
  const named = toBank ? null : authorized;
  /**
   * True until the empty form puts its amount field in use, 350 ms after it
   * opens. The field waits at y 515 meanwhile, so it does not move then.
   */
  const [opening, setOpening] = useState(amount === "");
  const touch = useIsTouchDevice();
  /**
   * The app's keypad types the amount and the phone number. Off with the
   * phone's own keyboard (`NATIVE_WALLET_KEYBOARD`): the fields are then
   * plain inputs, as with a mouse and a keyboard.
   */
  const keyed = touch && !NATIVE_WALLET_KEYBOARD;
  const keys = useRef<HTMLDivElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const keypad = keyed && (active === "amount" || active === "phone");

  const use = (field: Exclude<InUse, null>) => {
    if (keyed && field !== "name") {
      nameInput.current?.blur();
      setActive(field);
      return;
    }
    const input =
      field === "amount"
        ? amountInput
        : field === "phone"
          ? phoneInput
          : nameInput;
    input.current?.focus({ preventScroll: true });
  };
  const leave = (field: InUse) =>
    setActive((now) => (now === field ? null : now));

  // The file shows the amount field in use when the form opens. Not after
  // "Back" on the code reader: the amount is typed by then.
  // The phone's own keyboard opens only on a tap, so there the field waits.
  useEffect(() => {
    if (amount !== "") return;
    if (touch && !keyed) {
      setOpening(false);
      return;
    }
    const timer = setTimeout(() => {
      use("amount");
      setOpening(false);
    }, 350);
    return () => clearTimeout(timer);
    // Once per form, and again when the device turns out to be a touch one.
  }, [touch]);

  // A tap outside the keypad and its fields puts the keypad away.
  useEffect(() => {
    if (!keypad) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element;
      if (
        keys.current?.contains(target) ||
        target.closest?.("[data-keypad-field]")
      )
        return;
      setActive(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [keypad]);

  const typing = active === "amount";
  /** `Home Page – 20`: more than the balance holds. */
  const short = toNumber(amount) > toNumber(balance.amount);
  /** The look of `– 27` and `– 29`: `#FCFCFC`, "Edit" in the label. */
  const saved = amount !== "" && !typing && !short;
  const complete = !named || (named.phone !== "" && named.name.trim() !== "");
  const ready = active === null && toNumber(amount) > 0 && !short && complete;

  /**
   * With room for the file's spacing (the field ending at y 570 over the
   * usual keypad), the form keeps it exactly. Only when there is not, the
   * keypad loses its bottom gap, the gap over the field gets smaller and the
   * sheet rests lower by the room that saves (see `drop` below).
   */
  const rooms = useKeypadRoom(keyed);

  // Where the block above the amount field ends, and where the field starts.
  // With the keypad up the field ends at y 570, 12 px over the keypad
  // (`– 19`), 122 px under the block above it. When the screen is too short
  // for that, the gap gets smaller (SHORT_GAP, and never under the 4 px of
  // `– 29`), and the room it saves goes to the sheet: the sheet rests lower
  // (`drop`), so more of the dimmed wallet page shows.
  const above = toBank ? 363 + 55 : named ? 481 + 30 : 363 + 30;
  const amountHeight = short ? 93 : 55;
  /** The file's spacing fits with the usual keypad. */
  const roomy = rooms.full >= 570;
  const room = roomy ? rooms.full : rooms.flush;
  const fits = room >= 570;
  const shortTop = keyed
    ? Math.max(above + 4, Math.min(above + SHORT_GAP, room - amountHeight))
    : above + 4;
  const amountTop = toBank
    ? 422
    : named
      ? 515
      : typing
        ? shortTop
        : opening || amount === ""
          ? 515
          : 397;
  const drop =
    toBank || named || fits ? 0 : Math.max(0, room - (shortTop + amountHeight));

  // On a touch device the sheet stays at its design top (or `drop` px under
  // it), so the dimmed wallet page shows above it as in the file.
  useEffect(() => {
    onHold(!touch ? null : ready ? 0 : drop);
  }, [touch, ready, drop]);

  // The field in use must end over the keypad (design y `room`). It may not:
  // the amount field of `– 25` and `– 27` stays at y 515, and the sheet is
  // lower by the device's top inset in a home-screen app. Then the part under
  // the tabs scrolls up by `lift`. A spacer as tall as the keypad's cover at
  // its end gives it the room to scroll; the keypad hides the spacer.
  const end = useCanvasEnd(keyed);
  const safeTop = useSafeTop(keyed);
  const fieldEnd = active === "phone" ? 363 + 55 : amountTop + amountHeight;
  const lift = keypad ? Math.max(0, fieldEnd + drop + safeTop - room) : 0;
  const spacer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (lift === 0) return;
    spacer.current
      ?.closest(`[data-pw="${FORM_UNDER}"]`)
      ?.scrollTo({ top: lift, behavior: "smooth" });
  }, [lift]);

  const choose = (next: "cash" | "bank") => {
    if (next === tab) return;
    setTab(next);
    // `Home Page – 36`: the empty amount field is the one in use.
    if (amount === "" && (keyed || !touch)) setTimeout(() => use("amount"), 0);
  };

  return (
    <>
      <Title top={top} mark={balance.mark} />
      <Brand size={24} mt={gapTo(top + 24 + lineBox(24), 180, 24)} />

      {/* The two tabs share the row's width, 4 px apart: 193 each on a
          430 px phone. */}
      <div
        className="flex shrink-0"
        style={{
          marginTop: 213 - textBottom(180, 24),
          marginLeft: 20,
          width: fill(20),
        }}
      >
        <Tab
          chosen={!toBank}
          fill={C.field}
          // The file starts the Medium words at x 65.14.
          nudge={toBank ? 0.5 : -0.5}
          onClick={() => choose("cash")}
          testId="demo-wallet-tab-cash"
        >
          {t("Cash Withdrawal")}
        </Tab>
        <Tab
          chosen={toBank}
          fill={C.card}
          // The file starts the words at x 283.33 (Medium) and 283.55 (Regular).
          nudge={toBank ? 0.5 : 1.17}
          ml={4}
          onClick={() => choose("bank")}
          testId="demo-wallet-tab-bank"
        >
          <WithBank text={t("To My {bank}")} />
        </Tab>
      </div>

      {/* With the buttons on show, the part under the tabs is as tall as
          the board (y 241 to 930): the buttons keep the file's place (y 767
          and 835) and its spacing. On a short screen they are under the
          screen's end, and this part scrolls to them. With a field in use it
          ends where the screen ends, so it does not scroll under the
          keyboard. */}
      <Under
        testId={FORM_UNDER}
        minHeight={ready ? BOARD_END - (213 + 28) : undefined}
      >
        {toBank && (
          <Recipient
            mt={245 - (213 + 28)}
            label={<WithBank text={t("{bank} client ID")} />}
            testId="demo-wallet-bank-id"
          >
            {/* The number ends at x 81, the currency starts at 91. */}
            <span className="font-medium">{WALLET_BANK_ACCOUNT.id}</span>
            <span style={{ marginLeft: 91 - 81 }}>
              {t(WALLET_BANK_ACCOUNT.currency[balance.currency])}
            </span>
          </Recipient>
        )}
        <Recipient
          mt={toBank ? 304 - (245 + 55) : 245 - (213 + 28)}
          label={
            toBank ? (
              <WithBank text={t("{bank} client phone number")} />
            ) : (
              <>
                <span className="font-medium">{t("recipient")}</span>
                {` ${t("Trydos client phone number")}`}
              </>
            )
          }
          testId="demo-wallet-recipient-phone"
        >
          {/* "+" Bold at x 32, the number from x 44. */}
          <span
            className="font-bold inline-block"
            style={{ minWidth: 44 - 32 }}
          >
            +
          </span>
          {WALLET_RECIPIENT.phone}
        </Recipient>
        <Recipient
          mt={4}
          label={
            toBank ? (
              <WithBank text={t("{bank} client Full name (Exact ID)")} />
            ) : (
              <>
                <span className="font-medium">{t("recipient")}</span>
                {` ${t("Trydos client Full name ( Exact ID )")}`}
              </>
            )
          }
          testId="demo-wallet-recipient-name"
          // The file draws the eye on the boards of the cash tab with no field
          // in use.
          mark={!toBank && active === null}
        >
          {WALLET_RECIPIENT.name}
        </Recipient>

        {toBank ? null : authorized ? (
          <>
            <Entry
              mt={363 - (304 + 55)}
              label={t("Authorized recipient phone number")}
              filled={authorized.phone !== ""}
              active={active === "phone"}
              onUse={() => use("phone")}
              keypadField
              anchor={touch && active === "phone"}
              testId="demo-wallet-authorized-phone"
            >
              <div
                className="flex items-center shrink-0"
                style={{ marginTop: 3, height: 23 }}
              >
                {/* "+" Bold at x 32, the number from x 44. */}
                <span
                  className="font-bold shrink-0"
                  style={{
                    minWidth: 44 - 32,
                    fontSize: 14,
                    lineHeight: `${lineBox(14)}px`,
                    color: authorized.phone === "" ? C.placeholder : C.ink,
                  }}
                >
                  +
                </span>
                <div className="grid flex-1 min-w-0">
                  {authorized.phone === "" && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none font-light self-center whitespace-nowrap"
                      style={{
                        gridArea: "1 / 1",
                        fontSize: 14,
                        lineHeight: `${lineBox(14)}px`,
                        color: C.placeholder,
                      }}
                    >
                      {t("Enter recipient Phone number")}
                    </span>
                  )}
                  <input
                    ref={phoneInput}
                    data-pw="demo-wallet-authorized-phone-input"
                    type="text"
                    // With the app's keypad the phone's own keyboard stays away.
                    inputMode={keyed ? "none" : "tel"}
                    autoComplete="off"
                    readOnly={keyed}
                    tabIndex={keyed ? -1 : undefined}
                    value={authorized.phone}
                    aria-label={t("Authorized recipient phone number")}
                    onChange={(e) => {
                      const phone = e.target.value.replace(/[^0-9+ ]/g, "");
                      setAuthorized((now) => now && { ...now, phone });
                    }}
                    onFocus={() => setActive("phone")}
                    onBlur={() => leave("phone")}
                    className={`block bg-transparent outline-none font-normal ${touch ? "pointer-events-none" : ""}`}
                    style={{
                      gridArea: "1 / 1",
                      width: "100%",
                      height: 23,
                      fontSize: 14,
                      color: C.ink,
                      padding: 0,
                      border: 0,
                    }}
                  />
                </div>
              </div>
            </Entry>
            <Entry
              mt={422 - (363 + 55)}
              label={t("Authorized recipient Full name ( Exact ID )")}
              filled={authorized.name !== ""}
              active={active === "name"}
              onUse={() => use("name")}
              testId="demo-wallet-authorized-name"
            >
              <input
                ref={nameInput}
                data-pw="demo-wallet-authorized-name-input"
                type="text"
                value={authorized.name}
                aria-label={t("Authorized recipient Full name ( Exact ID )")}
                onChange={(e) => {
                  const name = e.target.value;
                  setAuthorized((now) => now && { ...now, name });
                }}
                onFocus={() => setActive("name")}
                onBlur={() => leave("name")}
                className={`block shrink-0 bg-transparent outline-none font-normal ${touch ? "pointer-events-none" : ""}`}
                style={{
                  marginTop: 3,
                  width: "100%",
                  height: 23,
                  fontSize: 14,
                  color: C.ink,
                  padding: 0,
                  border: 0,
                }}
              />
            </Entry>
            {/* The file draws this button 5 px right of the add button. */}
            <RecipientButton
              mt={481 - (422 + 55)}
              ml={37}
              // The file starts the words at x 134.99.
              nudge={-2.67}
              sign="-"
              verb={t("Remove")}
              testId="demo-wallet-remove-recipient"
              onClick={() => {
                setAuthorized(null);
                setActive(null);
              }}
            />
          </>
        ) : (
          <RecipientButton
            mt={363 - (304 + 55)}
            ml={32}
            // The file starts the words at x 140.06.
            nudge={-2}
            sign="+"
            verb={t("Add")}
            testId="demo-wallet-add-recipient"
            onClick={() => {
              setAuthorized({ phone: "", name: "" });
              // `Home Page – 25`: the new phone field is the one in use.
              setTimeout(() => use("phone"), 0);
            }}
          />
        )}

        <Box
          w={fill(20)}
          h={amountHeight}
          mt={amountTop - above}
          ml={20}
          radius={15}
          fill={saved ? C.card : C.white}
          stroke={short ? C.orange : typing ? C.blue : C.line}
          strokeVisible={!saved}
          data-pw="demo-wallet-amount"
          data-keypad-field=""
          // The /demo mark for the field in use; /demo1 keeps it up with `lift`.
          data-keyboard-anchor={touch && typing ? "" : undefined}
          className="flex flex-col overflow-hidden cursor-text"
          style={{
            padding: "8px 12px 0",
            transition: "margin-top 0.3s, height 0.3s, background-color 0.3s",
          }}
          onClick={() => use("amount")}
        >
          <div className="flex items-start shrink-0">
            {short ? (
              <Txt size={12} weight="medium" as="label">
                {t("Enter Amount")}
              </Txt>
            ) : typing ? (
              <>
                <Txt size={12} weight="medium" as="label">
                  {toBank ? (
                    <WithBank
                      text={t("Enter withdrawal amount to your {bank}")}
                    />
                  ) : (
                    t("Enter withdrawal amount")
                  )}
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
              </>
            ) : saved ? (
              <EditLabel field={t("amount")} />
            ) : (
              <Txt size={12} color={C.grey} as="label">
                {t("amount")}
              </Txt>
            )}
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
            {saved && (
              // The code after the saved amount: "USD" starts at x 58, 5 px
              // after "100". The unseen copy of the amount keeps that room.
              <span
                aria-hidden="true"
                className="pointer-events-none font-normal self-center"
                style={{
                  gridArea: "1 / 1",
                  fontSize: 14,
                  lineHeight: `${lineBox(14)}px`,
                  color: C.ink,
                  whiteSpace: "pre",
                }}
              >
                <span className="font-medium invisible">{amount}</span>
                <span style={{ marginLeft: 5 }}>{balance.code}</span>
              </span>
            )}
            <input
              ref={amountInput}
              data-pw="demo-wallet-amount-input"
              type="text"
              // With the app's keypad the phone's own keyboard stays away.
              inputMode={keyed ? "none" : "decimal"}
              autoComplete="off"
              readOnly={keyed}
              tabIndex={keyed ? -1 : undefined}
              value={amount}
              aria-label={t("Enter withdrawal amount")}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
              }
              onFocus={() => setActive("amount")}
              onBlur={() => leave("amount")}
              className={`block bg-transparent outline-none ${saved ? "font-medium" : "font-normal"} ${touch ? "pointer-events-none" : ""}`}
              style={{
                gridArea: "1 / 1",
                width: "100%",
                height: 23,
                fontSize: 14,
                color: C.ink,
                padding: 0,
                border: 0,
              }}
            />
          </div>
          {short && (
            // 366 x 30 at (32, 532): 55 px down the field, 6 under the value line.
            <Box
              w="100%"
              h={30}
              mt={55 - (8 + lineBox(12) + 3 + 23)}
              radius={15}
              fill={C.orangeTint}
              data-pw="demo-wallet-amount-short"
              className="flex flex-col"
            >
              <Txt center size={11} mt={gapTo(532, 551, 11)}>
                {t("Your Balance is insufficient")}
              </Txt>
            </Box>
          )}
        </Box>

        {named && active === null && (
          // 356 x 30 at (37, 574), 4 px under the amount field, 37 px from
          // both edges. The file centres the words on x 210, 5 px left of the
          // tint's centre.
          <Box
            w={fill(37)}
            h={30}
            mt={574 - (515 + 55)}
            ml={37}
            radius={12}
            fill={C.noteTint}
            data-pw="demo-wallet-named-only"
            className="flex flex-col"
          >
            <Txt center nudge={-5} size={11} mt={gapTo(574, 593, 11)}>
              {t("Only the named person may receive the amount !")}
            </Txt>
          </Box>
        )}

        {/* The buttons end at y 895, 35 px above the board's end. */}
        <div
          className="flex flex-col shrink-0 mt-auto"
          style={{ paddingTop: 8, paddingBottom: BOARD_END - 895 }}
        >
          <AnimatePresence initial={false}>
            {ready && !toBank && !named && (
              <SheetButton
                key="now"
                label={t("Withdrawal Now")}
                fill={C.purple}
                onClick={onNow}
                testId="demo-wallet-withdraw-now"
              />
            )}
            {ready && !toBank && (
              <SheetButton
                key="request"
                mt={835 - (767 + 60)}
                label={t("Withdrawal Request")}
                fill={C.inkSoft}
                onClick={onRequest}
                testId="demo-wallet-withdraw-request"
              />
            )}
            {ready && toBank && (
              // `Home Page – 35`. The file starts the words at x 147: half a px
              // right of centre.
              <SheetButton
                key="bank"
                label={<WithBank text={t("Withdrawal To {bank}")} />}
                nudge={0.5}
                fill={C.inkSoft}
                testId="demo-wallet-withdraw-bank"
              />
            )}
          </AnimatePresence>
        </div>

        {lift > 0 && (
          <div
            ref={spacer}
            aria-hidden="true"
            className="shrink-0"
            style={{ height: end - room }}
          />
        )}
      </Under>

      {keyed && (
        <NumericKeypad
          open={keypad}
          keypadRef={keys}
          // Only when the file's spacing does not fit: no gap between the keys
          // and the browser bar, the room goes to the sheet.
          flushBottom={!roomy}
          onPress={(digit) => {
            if (active === "phone")
              setAuthorized(
                (now) =>
                  now && { ...now, phone: (now.phone + digit).slice(0, 15) },
              );
            else setAmount((now) => (now + digit).slice(0, 12));
          }}
          onBackspace={() => {
            if (active === "phone")
              setAuthorized(
                (now) => now && { ...now, phone: now.phone.slice(0, -1) },
              );
            else setAmount((now) => now.slice(0, -1));
          }}
        />
      )}
    </>
  );
}

/**
 * `Home Page – 30`, sheet from y 90, after "Withdrawal Now":
 *   - the brand (24 px) on baseline 180;
 *   - the black box 350 x 350 at (40, 213), radius 30: the 25 px mark at
 *     (202, 500) and one 11 px line on baseline 548;
 *   - "Cash Withdraw" (16 Medium) on baseline 591 and the amount (24) on 631;
 *   - the grey note, 13 px on an 18 px line, 366 wide, first baseline 662;
 *   - "Back", 390 x 60 at (20, 835), `#FCFCFC` with a dashed line.
 * The black box keeps its 350 px height and its 40 px to both edges, so it
 * is square only on a 430 px phone.
 */
function Scan({
  balance,
  amount,
  onBack,
}: {
  balance: WalletBalance;
  amount: string;
  onBack: () => void;
}) {
  const { t } = useDemoNav();
  const top = TOP.scan;
  const [lead, tail = ""] = t(
    "Please read the code in front of you at the {brand} center, then receive the amount from the employee.",
  ).split("{brand}");
  const stay = t(
    "Do not leave the page or the center until you have confirmed that the transaction is complete.",
  );
  const thanks = t("Thank you.");
  return (
    <>
      <Title top={top} mark={balance.mark} />
      <Brand size={24} mt={gapTo(top + 24 + lineBox(24), 180, 24)} />

      <Under
        testId="demo-wallet-cash-out-scan-under"
        minHeight={BOARD_END - textBottom(180, 24)}
      >
        <Box
          w={fill(40)}
          h={350}
          mt={213 - textBottom(180, 24)}
          ml={40}
          radius={30}
          fill="#000000"
          data-pw="demo-wallet-scan-box"
          className="flex flex-col items-center"
        >
          {/* The file puts the mark half a px left of the box's centre. */}
          <Icon name="scanCode" mt={500 - 213} style={{ marginRight: 1 }} />
          {/* And the line 1 px right of it. */}
          <Txt
            center
            nudge={1}
            size={11}
            color={C.card}
            mt={gapTo(500 + 25, 548, 11)}
          >
            {t("Read the code on the opposite side to take action")}
          </Txt>
        </Box>

        <Txt
          center
          nudge={-0.5}
          size={16}
          weight="medium"
          mt={gapTo(213 + 350, 591, 16)}
        >
          {t("Cash withdraw")}
        </Txt>
        <Txt
          center
          nudge={-0.5}
          size={24}
          mt={gapTo(textBottom(591, 16), 631, 24)}
          data-pw="demo-wallet-scan-amount"
          style={{ whiteSpace: "pre" }}
        >
          <span className="font-medium">{`${amount} `}</span>
          {balance.code}
        </Txt>

        <FileLines
          text={`${lead}${WALLET_BRAND.start}${WALLET_BRAND.rest}${WALLET_BRAND.bank}${tail} ${stay} ${thanks}`}
          lines={[
            {
              x: 42.29,
              text: "Please Read The Code In Front Of You At The trydos | rdb ",
              node: (
                <>
                  {"Please Read The Code In Front Of You At The "}
                  <span className="font-bold">{WALLET_BRAND.start}</span>
                  {WALLET_BRAND.rest}
                  <span className="font-bold">{WALLET_BRAND.bank}</span>
                </>
              ),
            },
            {
              x: 50.33,
              text: "Center, Then Receive The Amount From The Employee. ",
            },
            { x: 0, text: "" },
            {
              x: 54.84,
              text: "Do Not Leave The Page Or The Center Until You Have ",
            },
            { x: 79.81, text: "Confirmed That The Transaction Is Complete." },
            {
              x: 181.34,
              text: "Thank You.",
              node: <span className="font-medium">Thank You.</span>,
            },
          ]}
          left={32}
          ml={32}
          width={fill(32)}
          size={13}
          lineHeight={18}
          color={C.grey}
          mt={paraTop(662, 13, 18) - textBottom(631, 24)}
        >
          {lead}
          <span className="font-bold">{WALLET_BRAND.start}</span>
          {WALLET_BRAND.rest}
          <span className="font-bold">{WALLET_BRAND.bank}</span>
          {tail}
          <br />
          <br />
          {stay}
          <br />
          <span className="font-medium">{thanks}</span>
        </FileLines>

        <div
          className="flex flex-col shrink-0 mt-auto"
          style={{ paddingTop: 8, paddingBottom: BOARD_END - 895 }}
        >
          {/* The file starts "Back" at x 197: half a px right of centre. */}
          <SheetButton
            label={t("Back")}
            nudge={0.5}
            fill={C.card}
            color={C.ink}
            stroke={C.lineDark}
            dash="3 3"
            onClick={onBack}
            testId="demo-wallet-scan-back"
          />
        </div>
      </Under>
    </>
  );
}

/**
 * A wide button of the sheet, 390 x 60 at x 20, radius 20, 16 px words. It
 * keeps 20 px to both edges of the sheet.
 */
export function SheetButton({
  mt,
  label,
  nudge,
  fill: background,
  color = C.white,
  stroke,
  dash,
  onClick,
  testId,
}: {
  mt?: number;
  label: React.ReactNode;
  nudge?: number;
  fill: string;
  color?: string;
  stroke?: string;
  dash?: string;
  onClick?: () => void;
  testId: string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex flex-col shrink-0 cursor-pointer"
      style={{
        marginTop: mt,
        marginLeft: 20,
        width: fill(20),
        height: 60,
        borderRadius: 20,
        background,
      }}
    >
      {/* Baseline 36 in the button (871 - 835). */}
      <Txt center nudge={nudge} size={16} color={color} mt={gapTo(0, 36, 16)}>
        {label}
      </Txt>
      {stroke && <Stroke color={stroke} radius={20} dash={dash} />}
    </motion.button>
  );
}

/**
 * "+ Add Authorized Recipient" or "- Remove Authorized Recipient": 356 x 30,
 * `#FCFCFC`, radius 12, 11 px words on baseline 19. It keeps the file's
 * distance to both edges of the sheet (`ml` on the left).
 */
function RecipientButton({
  mt,
  ml,
  nudge,
  sign,
  verb,
  onClick,
  testId,
}: {
  mt: number;
  ml: number;
  /** How far the file puts the words off the button's centre, in px. */
  nudge?: number;
  sign: "+" | "-";
  verb: string;
  onClick: () => void;
  testId: string;
}) {
  const { t } = useDemoNav();
  return (
    <motion.button
      type="button"
      data-pw={testId}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col shrink-0 cursor-pointer"
      style={{
        marginTop: mt,
        marginLeft: ml,
        width: fill(ml, DESIGN_W - ml - 356),
        height: 30,
        borderRadius: 12,
        background: C.card,
      }}
    >
      <Txt
        center
        nudge={nudge}
        size={11}
        mt={gapTo(363, 382, 11)}
        style={{ whiteSpace: "pre" }}
      >
        <span className="font-medium">{`${sign} ${verb} `}</span>
        {t("Authorized recipient")}
        {/* The file's line ends with a space, and it is centred with it.
            A plain space at the end of a line takes no room; this one does. */}
        <span className="font-medium"> </span>
      </Txt>
    </motion.button>
  );
}

/** The label of a filled field: the field's name in grey, "Edit" in blue. */
function EditLabel({ field }: { field: string }) {
  const { t } = useDemoNav();
  const [before, after = ""] = t("Edit {field}").split("{field}");
  return (
    <Txt size={12} color={C.grey} as="label" style={{ whiteSpace: "pre" }}>
      <span style={{ color: C.blue }}>{before}</span>
      {field}
      <span style={{ color: C.blue }}>{after}</span>
    </Txt>
  );
}

/**
 * A field of the authorized recipient, 390 x 55. Three looks in the file:
 *   - in use (`– 25`, the phone): white, blue line, the label Medium and
 *     dark, starting with "Enter";
 *   - empty and not in use (`– 25`, the name): white, grey line, grey label;
 *   - filled (`– 27`): `#FCFCFC`, no line, "Edit" in blue before the label.
 */
function Entry({
  mt,
  label,
  filled,
  active,
  onUse,
  keypadField = false,
  anchor = false,
  children,
  testId,
}: {
  mt: number;
  label: string;
  filled: boolean;
  active: boolean;
  onUse: () => void;
  /** The app's keypad types in this field. */
  keypadField?: boolean;
  /** The field in use over the keypad (the /demo mark; /demo1 uses `lift`). */
  anchor?: boolean;
  children: React.ReactNode;
  testId: string;
}) {
  const { t } = useDemoNav();
  const saved = filled && !active;
  return (
    <Box
      w={fill(20)}
      h={55}
      mt={mt}
      ml={20}
      radius={15}
      fill={saved ? C.card : C.white}
      stroke={active ? C.blue : C.line}
      strokeVisible={!saved}
      data-pw={testId}
      data-keypad-field={keypadField ? "" : undefined}
      data-keyboard-anchor={anchor ? "" : undefined}
      className="flex flex-col cursor-text transition-[background-color] duration-300"
      style={{ padding: "8px 12px 0" }}
      onClick={onUse}
    >
      {active ? (
        <Txt size={12} weight="medium" as="label">
          {t("Enter {field}").replace("{field}", label)}
        </Txt>
      ) : saved ? (
        <EditLabel field={label} />
      ) : (
        <Txt size={12} color={C.grey} as="label">
          {label}
        </Txt>
      )}
      {children}
    </Box>
  );
}

/**
 * A tab of the form, 193 x 28, radius 8, 13 px text on baseline 19. The
 * chosen one is green with Medium words. The other has a line, Regular words
 * and its own `fill`: `#FCFCFC` on `– 19`, `#F8F8F8` on `– 36`.
 *
 * The tabs of a row share its width (193 each on a 430 px phone), so the row
 * must have a width: 20 px from both edges, `fill(20)`.
 */
export function Tab({
  chosen,
  fill,
  chosenFill = C.green,
  nudge = 0.5,
  ml,
  onClick,
  children,
  testId,
}: {
  chosen: boolean;
  /** The fill while the tab is not chosen. */
  fill: string;
  /** Green on the cash-out form, yellow `#FAE26B` on the cash-in forms. */
  chosenFill?: string;
  /** How far the file puts the words off the tab's centre, in px. */
  nudge?: number;
  ml?: number;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-pw={testId}
      aria-pressed={chosen}
      onClick={onClick}
      className="cursor-pointer"
      style={{ flex: "1 1 0", minWidth: 0, marginLeft: ml }}
    >
      <Box
        w="100%"
        h={28}
        radius={8}
        fill={chosen ? chosenFill : fill}
        stroke={C.line}
        strokeVisible={!chosen}
        className="flex flex-col transition-[background-color] duration-300"
      >
        {/* The cash-out file centres the words half a px right of the tab's centre. */}
        <Txt
          center
          nudge={nudge}
          size={13}
          weight={chosen ? "medium" : "regular"}
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
 * Medium or the bank's name Bold) on baseline 20 and the value (14) on 43, both 12 px in. `mark` adds
 * the grey 15 px eye at (383, 324): 20 px down the field, 12 from its right.
 * The field keeps 20 px to both edges of the sheet.
 */
export function Recipient({
  mt,
  label,
  children,
  mark = false,
  testId,
}: {
  mt: number;
  label: React.ReactNode;
  children: React.ReactNode;
  mark?: boolean;
  testId: string;
}) {
  return (
    <Box
      w={fill(20)}
      h={55}
      mt={mt}
      ml={20}
      radius={15}
      fill={C.card}
      data-pw={testId}
      className="flex items-start"
      style={{ padding: "8px 12px 0" }}
    >
      <div className="flex flex-col shrink-0">
        <Txt size={12} color={C.grey} style={{ whiteSpace: "pre" }}>
          {label}
        </Txt>
        <Txt
          size={14}
          mt={gapTo(8 + lineBox(12), 43, 14)}
          style={{ whiteSpace: "pre" }}
        >
          {children}
        </Txt>
      </div>
      {mark && (
        <Icon
          name="eyeGreySmall"
          mt={324 - (304 + 8)}
          style={{ marginLeft: "auto" }}
        />
      )}
    </Box>
  );
}

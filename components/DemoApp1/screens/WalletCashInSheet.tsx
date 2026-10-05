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
  SF_ROUNDED,
  SHEET,
  UNDER_BAR,
  fill,
  gapTo,
  lineBox,
  paraTop,
  sfTop,
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
  fromCentre,
  useCanvasEnd,
} from "../ui";
import { useKeypadRoom } from "../useKeypadRoom";
import type { XdIconName } from "../../DemoApp/xdIcons";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  WALLET_BANK_ACCOUNT,
  WALLET_BRAND,
  WALLET_CASH_IN,
  WALLET_CASH_IN_WAYS,
  WALLET_CRYPTO,
  WALLET_CRYPTO_APPS,
  WALLET_RECIPIENT,
  type WalletBalance,
} from "../../DemoApp/demoWallet";
import {
  Brand,
  BrandCard,
  InfoButton,
  Recipient,
  SheetButton,
  SheetTitle,
  Tab,
  WithBank,
} from "./WalletCashOutSheet";
import { InfoField } from "./WalletInfoSheet";
import { PictureLayer } from "./WalletWithdrawalRequest";

/**
 * Cash In — XD `Home Page – 22` (the ways to cash in), `– 26` and `– 32` (the
 * trydos | rdb sheet: a deposit code, or money from the client's own rdb
 * account), `– 31` (the picture of the deposit code), `– 33` and `– 34` (cash
 * in with crypto), `– 39` (the safety rules, a second sheet), `– 37` (the
 * crypto code) and `– 38` (its picture).
 *
 * One sheet, four steps. The file draws the first step from y 216 and the
 * others from y 90, all with 50 px top corners. The sheet is laid out at 90
 * and rests 126 px lower while the first step is on show.
 *
 * Every y below is the file's. The handle ends 13 px under the sheet's top
 * edge, so a step's first block has `mt` = its y minus (top + 13).
 *
 * On /demo the widths are fluid: a block keeps the file's distance to both
 * edges of the screen, and a block the file centres stays centred. Icons, the
 * codes, the tiles and the tags keep their size.
 */

type Step = "ways" | "rdb" | "crypto" | "code";

const TOP: Record<Step, number> = { ways: 216, rdb: 90, crypto: 90, code: 90 };

/** The boards end at y 930. */
const BOARD_END = 930;

/** The safety rules lie on a second sheet from y 265 (`Home Page – 39`). */
const RULES_TOP = 265;

/** Where the head of a step (the title row and the line under it) ends. */
const HEAD_END = textBottom(180, 24);

/**
 * The height of a step whose blocks start at design y `from`: it ends with
 * the board (y 930), or with the screen (`end`) when the screen is shorter.
 * The device's top inset (a home-screen app) is taken off, as the sheet
 * starts under it. Then the step runs on under Safari's bar (UNDER_BAR), as
 * the sheet does; the part under the head keeps room at its end to scroll
 * what the bar covers back over it (see `Under`).
 */
const stepHeight = (from: number, end: number) =>
  `calc(min(${BOARD_END - from}px, calc(${end - from}px - ${SAFE_TOP})) + ${UNDER_BAR}px)`;

/**
 * True while the screen is narrower than the artboard (430 px). The file's
 * own line breaks and its one-line texts are then wider than their boxes, so
 * they wrap as normal text, and the box grows if it must.
 */
function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < DESIGN_W,
  );
  useEffect(() => {
    const read = () => setNarrow(window.innerWidth < DESIGN_W);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return narrow;
}

/** The file's lines on a wide screen; none on a narrow one (the text wraps). */
const fileLines = <L,>(narrow: boolean, lines: L[]) => (narrow ? [] : lines);

/** One line of the file on a wide screen; a line that may wrap on a narrow one. */
const wrap = (narrow: boolean): React.CSSProperties => ({
  whiteSpace: narrow ? "pre-wrap" : "pre",
});

/** A typed amount as a number. */
const toNumber = (text: string) =>
  Number.parseFloat(text.replace(",", ".")) || 0;

/** What the crypto top-up costs: 110 USDT for 100 USD in the file. */
const charge = (amount: string) =>
  String(Math.round(toNumber(amount) * (1 + WALLET_CRYPTO.fee) * 100) / 100);

/** The network as a plain name: "USDT Tron TRC 20". */
const NETWORK = `${WALLET_CRYPTO.coin} ${WALLET_CRYPTO.chain} ${WALLET_CRYPTO.standard}`;

/**
 * A sentence with `{slots}` in it: each slot is replaced by its node, so the
 * words round a value keep their own weight and the sentence stays one key.
 */
function Slots({
  text,
  slots,
}: {
  text: string;
  slots: Record<string, React.ReactNode>;
}) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((part, i) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1];
        return (
          <React.Fragment key={i}>
            {name && name in slots ? slots[name] : part}
          </React.Fragment>
        );
      })}
    </>
  );
}

/** The network as the tabs and the tag write it: the coin and the standard Medium. */
function Network() {
  return (
    <>
      <span className="font-medium">{`${WALLET_CRYPTO.coin} `}</span>
      <span className="font-normal">{WALLET_CRYPTO.chain}</span>
      <span className="font-medium">{` ${WALLET_CRYPTO.standard}`}</span>
    </>
  );
}

function Title({
  top,
  mark,
  medium = false,
}: {
  top: number;
  mark: XdIconName;
  medium?: boolean;
}) {
  const { t } = useDemoNav();
  return (
    <SheetTitle
      top={top}
      icon="cashInBig"
      mark={mark}
      label={t("Cash In")}
      weight={medium ? "medium" : "bold"}
      // The file starts the Bold title at x 174: 1 px right of centre.
      nudge={medium ? 0 : 1}
    />
  );
}

/** The line under the title on the crypto steps: "Via Crypto", 24 Bold on baseline 180. */
function ViaCrypto() {
  const { t } = useDemoNav();
  return (
    <Txt
      center
      size={24}
      weight="bold"
      mt={gapTo(TOP.crypto + 24 + lineBox(24), 180, 24)}
    >
      {t("Via crypto")}
    </Txt>
  );
}

export default function WalletCashInSheet({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  /** The balance the money goes to. */
  balance: WalletBalance;
}) {
  const [step, setStep] = useState<Step>("ways");
  // Kept here, so the code (`– 37`) shows what the form asked for.
  const [amount, setAmount] = useState("");
  /** The app's keypad is up on a form. */
  const [typing, setTyping] = useState(false);
  /** Where the screen ends (design y): a step ends there, not at 930, on a short screen. */
  const end = useCanvasEnd(open);
  /** The safety rules (`Home Page – 39`) lie over the crypto form. */
  const [safe, setSafe] = useState(false);
  /** The picture of a code lies over the sheet (`– 31`, `– 38`). */
  const [picture, setPicture] = useState<"deposit" | "crypto" | null>(null);

  // The sheet opens on its first step every time. The step goes back once
  // the sheet has slid away, so it does not change while it is leaving.
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => {
      setStep("ways");
      setAmount("");
      setSafe(false);
      setPicture(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [open]);

  const rdbHead = (
    <>
      <Title top={TOP.rdb} mark={balance.mark} />
      <Brand size={24} mt={gapTo(TOP.rdb + 24 + lineBox(24), 180, 24)} />
    </>
  );
  const cryptoHead = (
    <>
      <Title top={TOP.crypto} mark={balance.mark} />
      <ViaCrypto />
    </>
  );

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        y={TOP.rdb}
        lower={TOP[step] - TOP.rdb}
        radius={SHEET.radiusWallet}
        fit
        testId="demo-wallet-cash-in-sheet"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            data-pw={`demo-wallet-cash-in-${step}`}
            className="flex flex-col shrink-0"
            // A step is as tall as the screen lets it be: its head stays in
            // place and only the part under the head scrolls (see `Under`).
            style={{ height: stepHeight(TOP[step] + 13, end) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {step === "ways" && (
              <Ways
                mark={balance.mark}
                onRdb={() => setStep("rdb")}
                onCrypto={() => setStep("crypto")}
              />
            )}
            {step === "rdb" && (
              <Rdb
                head={rdbHead}
                balance={balance}
                onPicture={() => setPicture("deposit")}
                typing={typing}
                onKeypad={setTyping}
              />
            )}
            {step === "crypto" && (
              <Crypto
                head={cryptoHead}
                balance={balance}
                amount={amount}
                setAmount={setAmount}
                onGenerate={() => setSafe(true)}
                typing={typing}
                onKeypad={setTyping}
              />
            )}
            {step === "code" && (
              <CryptoCode
                head={cryptoHead}
                amount={amount}
                onPicture={() => setPicture("crypto")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Sheet>

      <Sheet
        open={open && safe}
        onClose={() => setSafe(false)}
        y={RULES_TOP}
        radius={SHEET.radiusWallet}
        fit
        outline={C.sheetEdge}
        testId="demo-wallet-cash-in-safe"
      >
        <Safe
          end={end}
          onAgree={() => {
            setSafe(false);
            setStep("code");
          }}
          onCancel={() => setSafe(false)}
        />
      </Sheet>

      <PictureLayer
        open={open && picture === "deposit"}
        onClose={() => setPicture(null)}
        head={rdbHead}
        testId="demo-wallet-cash-in-deposit-picture"
      >
        <DepositPicture balance={balance} />
      </PictureLayer>
      <PictureLayer
        open={open && picture === "crypto"}
        onClose={() => setPicture(null)}
        head={cryptoHead}
        testId="demo-wallet-cash-in-crypto-picture"
      >
        <CryptoPicture amount={amount} />
      </PictureLayer>
    </>
  );
}

/**
 * `Home Page – 22`, sheet from y 216:
 *   - the title "Cash In" 24 Medium (the other boards draw it Bold);
 *   - the note, 14 px on an 18 px line, 366 wide, centred, first baseline 296;
 *   - the trydos | rdb card at y 338 (see `BrandCard`);
 *   - five 125 px tiles at y 534, 8 apart, in a row that slides sideways: the
 *     cards ("Soon Available", its tag 76 x 19 at (45, 650)), crypto, and the
 *     three photos of the cash-out sheet;
 *   - the grey card 390 x 204 at (20, 691) with its two 366 x 38 buttons.
 */
function Ways({
  mark,
  onRdb,
  onCrypto,
}: {
  mark: XdIconName;
  onRdb: () => void;
  onCrypto: () => void;
}) {
  const { t } = useDemoNav();
  const narrow = useNarrow();
  const top = TOP.ways;
  return (
    <>
      <Title top={top} mark={mark} medium />
      <Under testId="demo-wallet-cash-in-ways-under">
        <FileLines
          text={t(
            "You can add funds to an account through the following options easily and securely.",
          )}
          lines={fileLines(narrow, [
            { x: 61.11, text: "You Can Add Funds To An Account Through The " },
            { x: 92.1, text: "Following Options Easily And Securely." },
          ])}
          left={32}
          ml={32}
          width={fill(32)}
          size={14}
          lineHeight={18}
          mt={paraTop(296, 14, 18) - (top + 24 + lineBox(24))}
        />

        {/* Two lines of 18 from y 282 end at 318. */}
        <BrandCard y={338} mt={338 - (282 + 36)} onClick={onRdb} />

        {/* The row starts 1 px above the tiles, so the outer half of their
            lines (ON the edge) is not cut off by the row's own edge. */}
        <div
          data-pw="demo-wallet-cash-in-ways-row"
          className="flex shrink-0 overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={{
            marginTop: 534 - (338 + 188) - 1,
            paddingTop: 1,
            height: 1 + (669 - 534),
            scrollbarWidth: "none",
          }}
        >
          {WALLET_CASH_IN_WAYS.map((way, i) => (
            <div
              key={way.id}
              className="flex flex-col shrink-0"
              style={{
                marginLeft: i === 0 ? 20 : 8,
                // The row ends 20 px after the last tile, as it starts.
                marginRight: i === WALLET_CASH_IN_WAYS.length - 1 ? 20 : 0,
              }}
            >
              <motion.button
                type="button"
                aria-label={
                  way.name === "Visa | Mastercard" ? way.name : t(way.name)
                }
                data-pw={`demo-wallet-cash-in-way-${way.id}`}
                onClick={way.id === "crypto" ? onCrypto : undefined}
                disabled={way.soon}
                whileTap={way.soon ? undefined : { scale: 0.97 }}
                className={`shrink-0 ${way.soon ? "" : "cursor-pointer"}`}
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
                  {way.icon ? (
                    <Box
                      w={101}
                      h={101}
                      radius={15}
                      fill={C.white}
                      stroke={C.line}
                      strokeAlign="center"
                    >
                      <Icon name={way.icon} />
                    </Box>
                  ) : (
                    <img
                      src={`/assets/demo/xd/${way.picture}.jpg`}
                      alt=""
                      draggable={false}
                      width={101}
                      height={101}
                      className="block object-cover select-none pointer-events-none"
                      style={{ width: 101, height: 101, borderRadius: 15 }}
                    />
                  )}
                </Box>
              </motion.button>
              {way.soon && (
                // The tag hangs 9 px over the tile's bottom edge.
                <Box
                  w={76}
                  h={19}
                  mt={650 - (534 + 125)}
                  ml={45 - 20}
                  radius={6.8}
                  fill={C.card}
                  stroke={C.hint}
                  data-pw="demo-wallet-cash-in-soon"
                  className="flex flex-col"
                >
                  <Txt center size={9} mt={gapTo(650, 663, 9)}>
                    {t("Soon available")}
                  </Txt>
                </Box>
              )}
            </div>
          ))}
        </div>

        <Box
          w={fill(20)}
          h={204}
          mt={691 - 669}
          ml={20}
          radius={15}
          fill={C.card}
          stroke={C.line}
          strokeAlign="center"
          className="flex flex-col"
          // The card ends at y 895: 35 px above the artboard's bottom.
          style={{
            height: undefined,
            minHeight: 204,
            paddingBottom: 895 - (845 + 38),
            marginBottom: BOARD_END - 895,
          }}
        >
          <FileLines
            text={t("Add funds !")}
            lines={[{ x: 184.94, text: "Add Funds !" }]}
            left={32}
            ml={32 - 20}
            width={fill(32 - 20)}
            size={11}
            lineHeight={lineBox(11)}
            weight="medium"
            color={C.grey}
            mt={gapTo(691, 714, 11)}
          />
          <FileLines
            text={t(
              "You can deposit your funds with complete ease through one of our Trydos & RDB centers. You can also deposit your funds into your personal account on RDB. Additionally, any person or another account can add funds to your account.",
            )}
            lines={fileLines(narrow, [
              {
                x: 38,
                text: "You Can Deposit Your Funds With Complete Ease Through One Of Our ",
              },
              {
                x: 49.79,
                text: "Trydos & RDB Centers. You Can Also Deposit Your Funds Into Your ",
              },
              {
                x: 34.93,
                text: "Personal Account On RDB. Additionally, Any Person Or Another Account ",
              },
              { x: 133.04, text: "Can Add Funds To Your Account." },
            ])}
            left={32}
            ml={32 - 20}
            width={fill(32 - 20)}
            size={11}
            lineHeight={18}
            color={C.grey}
            mt={paraTop(736, 11, 18) - textBottom(714, 11)}
          />
          {/* Four lines end at y 795; the first button is at 801. */}
          <InfoButton
            mt={801 - (paraTop(736, 11, 18) + 4 * 18)}
            label={t("Available branches")}
            testId="demo-wallet-cash-in-branches"
          />
          {/* The file starts "More Info" at x 190: half a px left of centre. */}
          <InfoButton
            mt={845 - (801 + 38)}
            nudge={-0.5}
            label={t("More Info")}
            testId="demo-wallet-cash-in-more-info"
          />
        </Box>
      </Under>
    </>
  );
}

/** The actions under a code, with the x where the file starts each label. */
type Action = {
  id: "request" | "copy" | "download" | "share";
  icon: XdIconName;
  label: DemoKey;
  x: number;
  /** How far the picture sits off the label's centre, in px. */
  off: number;
};

/** `Home Page – 26`: the four actions of Wallet Info (`– 23`), in the same places. */
const DEPOSIT_ACTIONS: Action[] = [
  { id: "request", icon: "infoRequest", label: "request", x: 65, off: 0.5 },
  { id: "copy", icon: "infoCopy", label: "copy", x: 157, off: 0.5 },
  {
    id: "download",
    icon: "infoDownload",
    label: "download",
    x: 234,
    off: -0.5,
  },
  { id: "share", icon: "infoShare", label: "share", x: 336, off: 0.5 },
];

/** `Home Page – 37`: the three actions of a request (`– 28`), in the same places. */
const CRYPTO_ACTIONS: Action[] = [
  { id: "copy", icon: "infoCopy", label: "copy", x: 111, off: 0.5 },
  {
    id: "download",
    icon: "infoDownload",
    label: "download",
    x: 188,
    off: -0.5,
  },
  { id: "share", icon: "infoShare", label: "share", x: 290, off: 0.5 },
];

/**
 * A row of actions at y 855: a 20 px picture over an 11 px label on baseline
 * 892. The labels end at y 895, 35 px above the artboard's bottom.
 *
 * The file centres the row on the screen. The slots keep their width, and
 * the row keeps the file's distance from the screen's centre.
 */
function Actions({
  mt,
  actions,
  onAct,
  testId,
}: {
  mt: number;
  actions: Action[];
  onAct: (id: Action["id"]) => void;
  testId: string;
}) {
  const { t } = useDemoNav();
  return (
    <div
      className="flex items-start shrink-0"
      style={{
        marginTop: mt,
        marginLeft: fromCentre(actions[0].x, DESIGN_W),
        paddingBottom: BOARD_END - 895,
      }}
    >
      {actions.map((action, i) => (
        // The slot runs from one label's start to the next.
        <div
          key={action.id}
          className="flex shrink-0"
          style={{
            minWidth:
              i < actions.length - 1 ? actions[i + 1].x - action.x : undefined,
          }}
        >
          <motion.button
            type="button"
            data-pw={`${testId}-${action.id}`}
            onClick={() => onAct(action.id)}
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
  );
}

/** "trydos Deposit USD", 16 px: "try" Bold, "dos" Regular, the rest Medium. */
function DepositLine({ mt, balance }: { mt: number; balance: WalletBalance }) {
  const { t } = useDemoNav();
  return (
    // The file starts the line at x 141: half a px left of centre.
    <Txt center nudge={-0.5} size={16} mt={mt} style={{ whiteSpace: "pre" }}>
      <span className="font-bold">{WALLET_BRAND.start}</span>
      {WALLET_BRAND.rest.slice(0, 3)}
      <span className="font-medium">{` ${t("Deposit")} ${balance.code}`}</span>
    </Txt>
  );
}

/** The client's own three fields: name, ID and phone number, 4 px apart. */
function ClientFields({
  mt,
  balance,
  eye,
  testId,
}: {
  mt: number;
  balance: WalletBalance;
  /** The grey eye in the name field (`– 26`, `– 33`; not on the picture `– 31`). */
  eye: boolean;
  testId: string;
}) {
  const { t } = useDemoNav();
  return (
    <>
      <InfoField
        mt={mt}
        label={t("Trydos client Name")}
        testId={`${testId}-name`}
        mark={eye}
      >
        {WALLET_RECIPIENT.name}
      </InfoField>
      <InfoField mt={4} label={t("Trydos client ID")} testId={`${testId}-id`}>
        {/* The number ends at x 81, the currency starts at 91. */}
        <span className="font-medium">{WALLET_CASH_IN.clientId}</span>
        <span style={{ marginLeft: 91 - 81 }}>
          {t(WALLET_BANK_ACCOUNT.currency[balance.currency])}
        </span>
      </InfoField>
      <InfoField
        mt={4}
        label={t("Trydos client Phone Number")}
        testId={`${testId}-phone`}
        medium
      >
        {WALLET_CASH_IN.phone}
      </InfoField>
    </>
  );
}

/**
 * The trydos | rdb sheet, from y 90. Both boards: the title row, the brand on
 * baseline 180, and two 193 x 28 tabs at y 213 (the chosen one `#FAE26B`).
 *   - `– 26`, "Cash Deposit": the code, 300.12 px at (65, 260.41); two page
 *     dots at y 573; "trydos Deposit USD" on baseline 605; the client's three
 *     fields at y 639, 698 and 757; four actions at y 855.
 *   - `– 32`, "From My rdb": the client's rdb account in three fields at y 245,
 *     304 and 363, the amount field at 422, in use, and "Connect & Request
 *     From Your rdb" at (20, 835).
 */
function Rdb({
  head,
  balance,
  onPicture,
  typing,
  onKeypad,
}: {
  head: React.ReactNode;
  balance: WalletBalance;
  /** "Download": on to the picture of the code (`– 31`). */
  onPicture: () => void;
  /** The amount field of "From My rdb" is in use. */
  typing: boolean;
  /** The app's keypad went up or away. */
  onKeypad: (open: boolean) => void;
}) {
  const { t } = useDemoNav();
  const [tab, setTab] = useState<"cash" | "bank">("cash");
  const [amount, setAmount] = useState("");
  const fromBank = tab === "bank";

  const act = (id: Action["id"]) => {
    if (id === "copy")
      navigator.clipboard?.writeText(WALLET_CASH_IN.clientId).catch(() => {});
    if (id === "download") onPicture();
    if (id === "share" && navigator.share)
      navigator.share({ text: WALLET_CASH_IN.clientId }).catch(() => {});
  };

  return (
    <>
      {head}
      {/* The two tabs share the row, 20 px from both edges of the screen. */}
      <div
        className="flex shrink-0"
        style={{ marginTop: 213 - HEAD_END, marginLeft: 20, width: fill(20) }}
      >
        <Tab
          chosen={!fromBank}
          fill={C.card}
          chosenFill={C.yellow}
          // The file starts the words at x 76.8 (Medium) and 77.56 (Regular).
          nudge={fromBank ? 0.5 : -0.5}
          onClick={() => setTab("cash")}
          testId="demo-wallet-cash-in-tab-cash"
        >
          {t("Cash Deposit")}
        </Tab>
        <Tab
          chosen={fromBank}
          fill={C.card}
          chosenFill={C.yellow}
          // The file starts the words at x 274.44 (Medium) and 274.79 (Regular).
          nudge={fromBank ? 0.5 : 1.17}
          ml={4}
          onClick={() => setTab("bank")}
          testId="demo-wallet-cash-in-tab-bank"
        >
          <WithBank text={t("From My {bank}")} />
        </Tab>
      </div>

      {/* "From My rdb" is as tall as the board under the tabs (y 241 to 930),
          so its button keeps the file's place (y 835), while typing too. */}
      <Under
        testId="demo-wallet-cash-in-rdb-under"
        minHeight={fromBank ? BOARD_END - (213 + 28) : undefined}
      >
        {fromBank ? (
          <>
            <Recipient
              mt={245 - (213 + 28)}
              label={<WithBank text={t("{bank} client ID")} />}
              testId="demo-wallet-cash-in-bank-id"
            >
              {/* The number ends at x 81, the currency starts at 91. */}
              <span className="font-medium">{WALLET_BANK_ACCOUNT.id}</span>
              <span style={{ marginLeft: 91 - 81 }}>
                {t(WALLET_BANK_ACCOUNT.currency[balance.currency])}
              </span>
            </Recipient>
            <Recipient
              mt={304 - (245 + 55)}
              label={<WithBank text={t("{bank} client phone number")} />}
              testId="demo-wallet-cash-in-bank-phone"
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
                <WithBank text={t("{bank} client Full name (Exact ID)")} />
              }
              testId="demo-wallet-cash-in-bank-name"
            >
              {WALLET_RECIPIENT.name}
            </Recipient>
            <AmountField
              mt={422 - (363 + 55)}
              label={
                <WithBank text={t("Enter requested amount from your {bank}")} />
              }
              balance={balance}
              amount={amount}
              setAmount={setAmount}
              onKeypad={onKeypad}
            />
            <div
              className="flex flex-col shrink-0 mt-auto"
              style={{ paddingTop: 8, paddingBottom: BOARD_END - 895 }}
            >
              <SheetButton
                label={
                  <WithBank text={t("Connect & request from your {bank}")} />
                }
                fill={C.inkSoft}
                testId="demo-wallet-cash-in-connect"
              />
            </div>
          </>
        ) : (
          <>
            {/* The code keeps its size, centred as in the file. */}
            <Icon
              name="qrCashIn"
              mt={260.41 - (213 + 28)}
              style={{ marginLeft: fromCentre(65, DESIGN_W) }}
            />
            {/* The dots at (205, 573) and (217, 573): 20 wide together, centred. */}
            <div
              className="flex justify-center shrink-0"
              style={{ marginTop: 573 - (260.41 + 300.12) }}
            >
              <Icon name="dotDark" />
              <Icon name="dotBlueOff" ml={4} />
            </div>
            <DepositLine mt={gapTo(573 + 8, 605, 16)} balance={balance} />
            <ClientFields
              mt={639 - textBottom(605, 16)}
              balance={balance}
              eye
              testId="demo-wallet-cash-in-client"
            />
            <Actions
              mt={855 - (757 + 55)}
              actions={DEPOSIT_ACTIONS}
              onAct={act}
              testId="demo-wallet-cash-in-deposit"
            />
          </>
        )}
      </Under>
    </>
  );
}

/**
 * `Home Page – 31`: the picture of the deposit code, on a white page. The
 * blocks of `– 26` without the tabs and the actions, 48 px higher:
 *   - the code, 350.37 px, at (39.99, 167.42);
 *   - "trydos Deposit USD" on baseline 546;
 *   - the client's fields at y 620, 679 and 738, with no eye;
 *   - the note, 390 x 90 at (20, 805), with a line ON its edge.
 */
function DepositPicture({ balance }: { balance: WalletBalance }) {
  const { t } = useDemoNav();
  return (
    <>
      <Icon
        name="qrCashInBig"
        mt={167.42 - textBottom(132, 24)}
        style={{ marginLeft: fromCentre(39.99, DESIGN_W) }}
      />
      <DepositLine mt={gapTo(167.42 + 350.37, 546, 16)} balance={balance} />
      <ClientFields
        mt={620 - textBottom(546, 16)}
        balance={balance}
        eye={false}
        testId="demo-wallet-cash-in-picture-client"
      />
      <Note mt={805 - (738 + 55)} testId="demo-wallet-cash-in-deposit-note">
        <NoteTitle>{t("Your deposit request ready to collect !")}</NoteTitle>
        <NoteText>
          {`${t(
            "Present this code along with your personal ID at any of our branches and pay the amount in complete security.",
          )} `}
          <ThankYou />
        </NoteText>
      </Note>
    </>
  );
}

/**
 * The note at the foot of a picture: 390 x 90 at (20, 805), `#FCFCFC`, with a
 * line ON its edge. Its title (11 Medium) on baseline 828, then 11 px text on
 * a 16 px line from 848. It ends at y 895, 35 px above the artboard's bottom.
 * It is 20 px from both edges of the screen, and it grows when its text wraps
 * to more lines.
 */
function Note({
  mt,
  testId,
  children,
}: {
  mt: number;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      w={fill(20)}
      h={90}
      mt={mt}
      ml={20}
      radius={15}
      fill={C.card}
      stroke={C.line}
      strokeAlign="center"
      data-pw={testId}
      className="flex flex-col"
      style={{
        height: undefined,
        minHeight: 90,
        paddingLeft: 12,
        paddingBottom: 895 - (paraTop(848, 11, 16) + 3 * 16),
        marginBottom: BOARD_END - 895,
      }}
    >
      {children}
    </Box>
  );
}

/** The note's title, 11 Medium on baseline 828. A long one wraps on a narrow screen. */
function NoteTitle({ children }: { children: React.ReactNode }) {
  const narrow = useNarrow();
  return (
    <Txt
      size={11}
      weight="medium"
      mt={gapTo(805, 828, 11)}
      style={narrow ? { whiteSpace: "normal", marginRight: 12 } : undefined}
    >
      {children}
    </Txt>
  );
}

/** The note's text: 366 wide in the file, 12 px from both sides of the note. */
function NoteText({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="shrink-0 font-normal"
      style={{
        marginTop: paraTop(848, 11, 16) - textBottom(828, 11),
        width: fill(0, 12),
        fontSize: 11,
        lineHeight: "16px",
        color: C.ink,
      }}
    >
      {children}
    </p>
  );
}

/** "Thank You | We Are Pleased To Serve You." — the two parts Medium. */
function ThankYou() {
  const { t } = useDemoNav();
  return (
    <>
      <span className="font-medium">{t("Thank you")}</span>
      {" | "}
      <span className="font-medium">{t("we are pleased to serve you")}</span>.
    </>
  );
}

/**
 * The amount field of the cash-in forms, 390 x 55 at x 20, as the file draws
 * it on every board: in use — white, a blue line, the label 12 Medium — with
 * the grey "0,00 USD" while it is empty (`– 32`, `– 33`) and "100 USD" once
 * an amount is typed (`– 34`). `note` grows it to 93 and puts a 342 x 30 blue
 * tag 55 px down it (`– 34`). The field is 20 px from both edges of the
 * screen. On a narrow screen the tag's line may wrap, and the tag and the
 * field grow with it.
 *
 * As on the cash-out form, a touch device types with the login's keypad
 * (`NumericKeypad`), which a tap on the field opens and a tap elsewhere puts
 * away; the file draws these forms with the keypad away. With a mouse and a
 * keyboard the field is a plain input, in use as the form opens.
 *
 * The old scaled demo lifted the whole scaled canvas over the keyboard. On
 * /demo the keyboard moves nothing: the form stays where it is.
 */
function AmountField({
  mt,
  label,
  balance,
  amount,
  setAmount,
  note,
  onKeypad,
}: {
  mt: number;
  label: React.ReactNode;
  balance: WalletBalance;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  note?: React.ReactNode;
  /** The app's keypad went up or away. */
  onKeypad: (open: boolean) => void;
}) {
  const touch = useIsTouchDevice();
  /** The app's keypad types the amount; off with the phone's own keyboard. */
  const keyed = touch && !NATIVE_WALLET_KEYBOARD;
  const [keypad, setKeypad] = useState(false);
  /** The phone's own keyboard is up on this field. */
  const [focused, setFocused] = useState(false);
  const typing = keypad || (touch && focused);
  const rooms = useKeypadRoom(keyed);
  /** The charge tag: 30 tall in the file, taller when its line wraps. */
  const tag = useRef<HTMLDivElement>(null);
  const [tagHeight, setTagHeight] = useState(30);
  const hasNote = Boolean(note);
  useEffect(() => {
    const box = tag.current;
    if (!box) return;
    const watch = new ResizeObserver(() => setTagHeight(box.offsetHeight));
    watch.observe(box);
    return () => watch.disconnect();
  }, [hasNote]);
  /** 55, or 93 with the charge: the tag 55 px down the field and 8 under it. */
  const height = note ? 55 + tagHeight + 8 : 55;
  /**
   * The file's spacing fits over the usual keypad: both forms draw the field
   * at y 422, 55 tall, or 93 with the charge. Only when it does not fit, the
   * keypad gives its bottom gap away.
   */
  const roomy = rooms.full >= 422 + height;

  useEffect(() => {
    onKeypad(typing);
  }, [typing]);
  // A form that leaves takes its keypad with it.
  useEffect(() => () => onKeypad(false), []);
  const keys = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const { t } = useDemoNav();

  // With a keyboard, the field the file shows in use takes the typing.
  useEffect(() => {
    if (touch) return;
    const timer = setTimeout(
      () => input.current?.focus({ preventScroll: true }),
      350,
    );
    return () => clearTimeout(timer);
  }, [touch]);

  // A tap outside the keypad and the field puts the keypad away.
  useEffect(() => {
    if (!keypad) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element;
      if (
        keys.current?.contains(target) ||
        target.closest?.("[data-keypad-field]")
      )
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

  return (
    <>
      <Box
        w={fill(20)}
        h={height}
        mt={mt}
        ml={20}
        radius={15}
        fill={C.white}
        stroke={C.blue}
        data-pw="demo-wallet-cash-in-amount"
        data-keypad-field=""
        // The mark the old scaled demo's canvas read to stay over the keyboard.
        // Nothing reads it on /demo.
        data-keyboard-anchor={touch && typing ? "" : undefined}
        className="flex flex-col overflow-hidden cursor-text"
        style={{ padding: "8px 12px 0", transition: "height 0.3s" }}
        onClick={() => {
          if (keyed) setKeypad(true);
          else input.current?.focus({ preventScroll: true });
        }}
      >
        <Txt size={12} weight="medium" as="label" style={{ whiteSpace: "pre" }}>
          {label}
        </Txt>
        {/* The value line of every demo field: 23 tall, 3 under the label,
            which puts the 14 px text on the field's baseline 43. The code
            after the amount, and the grey "0,00 USD", lie in the same cell. */}
        <div className="grid shrink-0" style={{ marginTop: 3, height: 23 }}>
          <span
            aria-hidden="true"
            className="pointer-events-none font-normal self-center"
            style={{
              gridArea: "1 / 1",
              fontSize: 14,
              lineHeight: `${lineBox(14)}px`,
              color: amount === "" ? C.placeholder : C.ink,
              whiteSpace: "pre",
            }}
          >
            <span className={`font-medium ${amount === "" ? "" : "invisible"}`}>
              {`${amount === "" ? "0,00" : amount} `}
            </span>
            {balance.code}
          </span>
          <input
            ref={input}
            data-pw="demo-wallet-cash-in-amount-input"
            type="text"
            // With the app's keypad the phone's own keyboard stays away.
            inputMode={keyed ? "none" : "decimal"}
            autoComplete="off"
            readOnly={keyed}
            tabIndex={keyed ? -1 : undefined}
            value={amount}
            aria-label={t("Enter requested amount")}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 12))
            }
            className={`block bg-transparent outline-none font-medium ${touch ? "pointer-events-none" : ""}`}
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
        {note && (
          // 342 x 30 at (44, 477): 55 px down the field, 6 under the value
          // line, 12 px from both sides of the field's inside. It is 30 tall
          // with one line, and grows when the line wraps.
          <Box
            ref={tag}
            w={fill(44 - 32)}
            h={30}
            mt={55 - (8 + lineBox(12) + 3 + 23)}
            ml={44 - 32}
            radius={12}
            fill={C.blue}
            data-pw="demo-wallet-cash-in-charge"
            className="flex flex-col"
            style={{
              height: undefined,
              minHeight: 30,
              paddingBottom: 477 + 30 - textBottom(496, 11),
            }}
          >
            {note}
          </Box>
        )}
      </Box>

      {keyed && (
        <NumericKeypad
          open={keypad}
          keypadRef={keys}
          flushBottom={!roomy}
          onPress={(digit) => setAmount((now) => (now + digit).slice(0, 12))}
          onBackspace={() => setAmount((now) => now.slice(0, -1))}
        />
      )}
    </>
  );
}

/**
 * Cash in with crypto, sheet from y 90:
 *   - `– 33`: the title row, "Via Crypto" (24 Bold) on baseline 180, two tabs
 *     at y 213 ("USDT Tron TRC 20" chosen, "ETH"), the client's three fields
 *     at y 245, 304 and 363 (the name with the grey eye), and the amount field
 *     at 422, empty and in use;
 *   - `– 34`: an amount typed. The field is 93 tall and holds the charge on a
 *     blue tag; the grey card 390 x 58 at (20, 519) says what is paid and
 *     what arrives; "Generate QR Code" at (20, 835).
 * The file draws no board for the "ETH" tab, so it does not change the form.
 */
function Crypto({
  head,
  balance,
  amount,
  setAmount,
  onGenerate,
  typing,
  onKeypad,
}: {
  head: React.ReactNode;
  balance: WalletBalance;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  /** "Generate QR Code": the safety rules first (`– 39`). */
  onGenerate: () => void;
  /** The app's keypad went up or away. */
  /** The amount field is in use. */
  typing: boolean;
  onKeypad: (open: boolean) => void;
}) {
  const { t } = useDemoNav();
  const narrow = useNarrow();
  const typed = toNumber(amount) > 0;
  const fee = charge(amount);

  return (
    <>
      {head}
      {/* The two tabs share the row, 20 px from both edges of the screen. */}
      <div
        className="flex shrink-0"
        style={{ marginTop: 213 - HEAD_END, marginLeft: 20, width: fill(20) }}
      >
        <Tab
          chosen
          fill={C.card}
          chosenFill={C.yellow}
          // The file starts the words at x 61.2.
          nudge={1.17}
          onClick={() => {}}
          testId="demo-wallet-cash-in-tab-usdt"
        >
          <Network />
        </Tab>
        <Tab
          chosen={false}
          fill={C.card}
          chosenFill={C.yellow}
          ml={4}
          onClick={() => {}}
          testId="demo-wallet-cash-in-tab-eth"
        >
          {WALLET_CRYPTO.other}
        </Tab>
      </div>

      <Under
        testId="demo-wallet-cash-in-crypto-under"
        // As tall as the board while typing too: the keyboard moves nothing.
        minHeight={BOARD_END - (213 + 28)}
      >
        <ClientFields
          mt={245 - (213 + 28)}
          balance={balance}
          eye
          testId="demo-wallet-cash-in-crypto-client"
        />
        <AmountField
          mt={422 - (363 + 55)}
          label={t("Enter requested amount")}
          balance={balance}
          amount={amount}
          setAmount={setAmount}
          onKeypad={onKeypad}
          note={
            typed ? (
              // The file starts the line at x 53: 3.2 px right of centre. On
              // a narrow screen it wraps, 9 px in from the tag's sides.
              <Txt
                center
                nudge={3.2}
                size={11}
                color={C.card}
                mt={gapTo(477, 496, 11)}
                style={
                  narrow
                    ? { ...wrap(narrow), paddingLeft: 9, paddingRight: 9 }
                    : wrap(narrow)
                }
              >
                <Slots
                  text={t(
                    "We will charge {charge} {coin} for topping up your balance {amount} {code}.",
                  )}
                  slots={{
                    charge: <span className="font-medium">{fee}</span>,
                    coin: WALLET_CRYPTO.coin,
                    amount: <span className="font-medium">{amount}</span>,
                    code: balance.code,
                  }}
                />
              </Txt>
            ) : undefined
          }
        />

        <AnimatePresence initial={false}>
          {typed && (
            <motion.div
              key="summary"
              className="flex flex-col shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 390 x 58 at (20, 519), 4 px under the field, 20 px from
                  both edges of the screen. 58 tall with one line each; it
                  grows when a line wraps on a narrow screen. */}
              <Box
                w={fill(20)}
                h={58}
                mt={519 - (422 + 93)}
                ml={20}
                radius={15}
                fill={C.card}
                stroke={C.line}
                strokeAlign="center"
                data-pw="demo-wallet-cash-in-summary"
                className="flex flex-col"
                style={{
                  height: undefined,
                  minHeight: 58,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingBottom: 519 + 58 - textBottom(562, 11),
                }}
              >
                <Txt
                  size={11}
                  weight="medium"
                  mt={gapTo(519, 542, 11)}
                  style={wrap(narrow)}
                >
                  <Slots
                    text={t(
                      "You will pay {charge} {network} to generated wallet",
                    )}
                    slots={{ charge: fee, network: NETWORK }}
                  />
                </Txt>
                <Txt
                  size={11}
                  mt={gapTo(textBottom(542, 11), 562, 11)}
                  style={wrap(narrow)}
                >
                  <Slots
                    text={t(
                      "We will send to your Trydos balance {amount} {code}",
                    )}
                    slots={{
                      amount: <span className="font-bold">{amount}</span>,
                      code: balance.code,
                    }}
                  />
                </Txt>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex flex-col shrink-0 mt-auto"
          style={{ paddingTop: 8, paddingBottom: BOARD_END - 895 }}
        >
          <AnimatePresence initial={false}>
            {typed && (
              <SheetButton
                key="generate"
                label={t("Generate QR code")}
                fill={C.inkSoft}
                onClick={onGenerate}
                testId="demo-wallet-cash-in-generate"
              />
            )}
          </AnimatePresence>
        </div>
      </Under>
    </>
  );
}

/** A dot of the safety list: a grey ring (0.5 px, inside) round a coloured dot. */
function Bullet({ big, ok }: { big: boolean; ok: boolean }) {
  const size = big ? 14 : 10;
  const half = size / 2;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      className="block shrink-0"
      data-bullet={ok ? "ok" : "care"}
    >
      <circle
        cx={half}
        cy={half}
        r={half - 0.25}
        fill="none"
        stroke={C.ring}
        strokeWidth={0.5}
      />
      <circle
        cx={half}
        cy={half}
        r={big ? 3 : 2}
        fill={ok ? C.safeGreen : C.safeAmber}
      />
    </svg>
  );
}

/**
 * The safety rules, as `Home Page – 39` lists them. A rule's dot is at x 20,
 * a note's 20 px further in; the words start 20 px (a rule) or 16 px (a note)
 * after the dot.
 */
const RULES: {
  rule: DemoKey;
  ok: boolean;
  /** A note's lines as the file breaks them (English). */
  notes: { text: DemoKey; ok: boolean; lines: string[] }[];
}[] = [
  {
    // The file draws this rule's words and its notes 2 px left of the others.
    rule: "Send the exact amount to complete your transaction",
    ok: true,
    notes: [
      {
        text: "The entire amount must be sent at once or in parts according to the specified period.",
        ok: true,
        lines: [
          "The Entire Amount Must Be Sent At Once Or In Parts According To The ",
          "Specified Period.",
        ],
      },
      {
        text: "You can send the amount from different addresses on the same network and the same selected currency.",
        ok: true,
        lines: [
          "You Can Send The Amount From Different Addresses On The Same ",
          "Network And The Same Selected Currency.",
        ],
      },
    ],
  },
  {
    rule: "Send the selected currency to complete your transaction",
    ok: true,
    notes: [
      {
        text: "The transaction must be sent in the same currency selected, otherwise the transaction will be suspended.",
        ok: false,
        lines: [
          "The Transaction Must Be Sent In The Same Currency Selected, ",
          "Otherwise The Transaction Will Be Suspended.",
        ],
      },
      {
        text: "However, if the transaction was made by mistake, contact customer support to start the refund process.",
        ok: true,
        lines: [
          "However, If The Transaction Was Made By Mistake, Contact Customer ",
          "Support To Start The Refund Process.",
        ],
      },
    ],
  },
  {
    rule: "Transaction must be sent within the specified period.",
    ok: true,
    notes: [
      {
        text: "After the expiry of the period, the transaction will be suspended. Contact customer support.",
        ok: false,
        lines: [
          "After The Expiry Of The Period, The Transaction Will Be Suspended. ",
          "Contact Customer Support.",
        ],
      },
    ],
  },
  {
    rule: "Do not transfer to the same address on your own.",
    ok: false,
    notes: [
      {
        text: "The address used is temporary and does not mean that the current address is specific to you.",
        ok: false,
        lines: [
          "The Address Used Is Temporary And Does Not Mean That The Current ",
          "Address Is Specific To You.",
        ],
      },
      {
        text: "However, if the transaction was made by mistake, contact customer support to start the refund process.",
        ok: true,
        lines: [
          "However, If The Transaction Was Made By Mistake, Contact Customer ",
          "Support To Start The Refund Process.",
        ],
      },
    ],
  },
];

/** The file writes the list in SF Pro Rounded, 12 px on an 18 px line. */
const SF_LINE = { fontFamily: SF_ROUNDED, fontSize: 12, lineHeight: "18px" };

/**
 * `Home Page – 39`: the safety rules, on a second sheet from y 265 with a
 * 0.5 px `#707070` line inside its edge. The crypto form lies dimmed under it.
 *   - the 34 x 40 shield at (197.98, 288.91), and "Your Transactions Are
 *     Safe" (14 Medium) on baseline 354;
 *   - four rules from baseline 389, each line 18 tall and 4 px after the one
 *     above: a rule (SF Pro Rounded 12, `#1D1D1D`, a 14 px dot) and its notes
 *     (SF Pro Rounded Light 12, `#8E8E8E`, 351 wide, a 10 px dot). The first
 *     rule and its notes sit 2 px left of the others;
 *   - "I Agree", 370 x 60 at (30, 803), and "I Disagree & Cancel" (16 px)
 *     on baseline 891.
 */
function Safe({
  end,
  onAgree,
  onCancel,
}: {
  /** The design y where the screen ends. */
  end: number;
  onAgree: () => void;
  onCancel: () => void;
}) {
  const { t } = useDemoNav();
  const narrow = useNarrow();
  const first = sfTop(389, 12, 18);
  return (
    <div
      data-pw="demo-wallet-cash-in-safe-rules"
      className="flex flex-col shrink-0"
      // As tall as the screen lets it be: the shield and the title stay in
      // place, and the rules and the buttons scroll under them.
      style={{ height: stepHeight(RULES_TOP + 13, end) }}
    >
      {/* The shield keeps its size, centred as in the file. */}
      <Icon
        name="shieldSafe"
        mt={288.91 - (RULES_TOP + 13)}
        style={{ marginLeft: fromCentre(197.98, DESIGN_W) }}
      />
      {/* The file starts the title at x 126: 1.5 px right of centre. */}
      <Txt
        center
        nudge={1.5}
        size={14}
        weight="medium"
        mt={gapTo(288.91 + 40.09, 354, 14)}
      >
        {t("Your transactions are safe")}
      </Txt>

      <Under
        testId="demo-wallet-cash-in-safe-under"
        minHeight={BOARD_END - textBottom(354, 14)}
      >
        {RULES.map((item, i) => {
          /** Where the notes' words start; they are 351 wide in the file. */
          const x = i === 0 ? 56 : 58;
          /** The gap from the end of the notes to the right edge of the screen. */
          const right = DESIGN_W - x - 351;
          return (
            <React.Fragment key={item.rule}>
              <div
                className="flex items-start shrink-0"
                style={{
                  marginTop: i === 0 ? first - textBottom(354, 14) : 4,
                  marginLeft: 20,
                  marginRight: right,
                }}
              >
                {/* The dot's top is 2 px under the line's top (378 against 376). */}
                <div className="shrink-0" style={{ marginTop: 2 }}>
                  <Bullet big ok={item.ok} />
                </div>
                {/* One line in the file; it wraps on a narrow screen. */}
                <span
                  className={`block font-normal ${narrow ? "min-w-0" : "shrink-0 whitespace-nowrap"}`}
                  style={{
                    ...SF_LINE,
                    color: C.ink,
                    marginLeft: (i === 0 ? 40 : 42) - (20 + 14),
                  }}
                >
                  {t(item.rule)}
                </span>
              </div>
              {item.notes.map((note, n) => {
                return (
                  <div
                    key={`${note.text}-${n}`}
                    className="flex items-start shrink-0"
                    style={{ marginTop: 4, marginLeft: i === 0 ? 40 : 42 }}
                  >
                    {/* The dot's top is 4 px under the line's top (402 against 398). */}
                    <div className="shrink-0" style={{ marginTop: 4 }}>
                      <Bullet big={false} ok={note.ok} />
                    </div>
                    <FileLines
                      text={t(note.text)}
                      lines={fileLines(
                        narrow,
                        note.lines.map((line) => ({ x, text: line })),
                      )}
                      left={x}
                      ml={16 - 10}
                      // 351 in the file: the row starts 16 px before the words.
                      width={fill(16, right)}
                      size={12}
                      lineHeight={18}
                      family={SF_ROUNDED}
                      weight="light"
                      color={C.ring}
                      align="left"
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        <div
          className="flex flex-col shrink-0 mt-auto"
          style={{ paddingTop: 8, paddingBottom: BOARD_END - 895 }}
        >
          <motion.button
            type="button"
            data-pw="demo-wallet-cash-in-agree"
            onClick={onAgree}
            whileTap={{ scale: 0.98 }}
            className="relative flex flex-col shrink-0 cursor-pointer"
            style={{
              marginLeft: 30,
              width: fill(30),
              height: 60,
              borderRadius: 20,
              background: C.cryptoBlue,
            }}
          >
            {/* Baseline 36 in the button (839 - 803). */}
            <Txt center size={16} color={C.white} mt={gapTo(0, 36, 16)}>
              {t("I agree")}
            </Txt>
            <Stroke color={C.agreeLine} radius={20} />
          </motion.button>
          <motion.button
            type="button"
            data-pw="demo-wallet-cash-in-disagree"
            onClick={onCancel}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col shrink-0 cursor-pointer"
            style={{ marginTop: gapTo(803 + 60, 891, 16) }}
          >
            {/* XD's letter spacing 25 is 25 / 1000 em. */}
            <Txt center size={16} style={{ letterSpacing: "0.025em" }}>
              {t("I disagree & cancel")}
            </Txt>
          </motion.button>
        </div>
      </Under>
    </div>
  );
}

/** Seconds as minutes and seconds: "29:59". */
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/** The network tag of the crypto code: 193 x 28, `#FAE26B`, radius 8, centred. */
function NetworkTag({ mt }: { mt: number }) {
  return (
    <Box
      w={193}
      h={28}
      mt={mt}
      style={{ marginLeft: fromCentre(119, DESIGN_W) }}
      radius={8}
      fill={C.yellow}
      data-pw="demo-wallet-cash-in-network"
      className="flex flex-col"
    >
      {/* The file starts the words at x 160.2, as on the chosen tab. */}
      <Txt
        center
        nudge={1.17}
        size={13}
        mt={gapTo(0, 19, 13)}
        style={{ whiteSpace: "pre" }}
      >
        <Network />
      </Txt>
    </Box>
  );
}

/**
 * "110 USDT Deposit" with the 20 px USDT mark 8 px before it, from x 136.
 * The row keeps the file's distance from the screen's centre.
 */
function DepositRow({ mt, amount }: { mt: number; amount: string }) {
  const { t } = useDemoNav();
  return (
    <div
      className="flex items-start shrink-0"
      style={{ marginTop: mt, marginLeft: fromCentre(136, DESIGN_W) }}
    >
      <Icon name="usdtMark" />
      <Txt
        size={16}
        weight="medium"
        ml={164 - (136 + 20)}
        data-pw="demo-wallet-cash-in-deposit-row"
        style={{ whiteSpace: "pre" }}
      >
        <Slots
          text={t("{amount} {coin} deposit")}
          slots={{
            amount: <span className="font-bold">{charge(amount)}</span>,
            coin: <span className="font-normal">{WALLET_CRYPTO.coin}</span>,
          }}
        />
      </Txt>
    </div>
  );
}

/**
 * "Scan QR Code From ..." (12 Medium, `#404040`) with the phone mark at x 34.56.
 * The row keeps the file's distance from the screen's centre. On a narrow
 * screen it starts 20 px in, and the words wrap 20 px before the right edge.
 */
function ScanRow({ mt }: { mt: number }) {
  const { t } = useDemoNav();
  const narrow = useNarrow();
  return (
    <div
      className="flex items-start shrink-0"
      style={{
        marginTop: mt,
        marginLeft: narrow ? 20 : fromCentre(34.56, DESIGN_W),
        marginRight: narrow ? 20 : undefined,
      }}
    >
      <Icon name="scanPhone" />
      <Txt
        size={12}
        weight="medium"
        color={C.inkSoft}
        ml={51 - (34.56 + 10.2)}
        style={
          narrow
            ? { whiteSpace: "normal", minWidth: 0, flexShrink: 1 }
            : undefined
        }
      >
        {t("Scan QR code from your wallet & pay to start processing")}
      </Txt>
    </div>
  );
}

/**
 * The orange lines under a crypto code: two SF Pro Rounded lines on 18, 350
 * wide from x 40 and centred, then the expiry with its clock (the time Bold).
 * `first` is the first line's baseline; the expiry's is 43 lower. The lines
 * keep 40 px to both edges of the screen; the expiry row stays centred.
 */
function Expiry({ mt, first }: { mt: number; first: number }) {
  const { t } = useDemoNav();
  const narrow = useNarrow();
  const paraY = sfTop(first, 12, 18);
  const rowY = sfTop(first + 43, 12, 18);
  return (
    <>
      <FileLines
        text={t(
          "After the specified period has expired, do not transfer any amount. Request a new QR code.",
        )}
        lines={fileLines(narrow, [
          {
            x: 43.28,
            text: "After The Specified Period Has Expired, Do Not Transfer Any Amount. ",
          },
          { x: 150.73, text: "Request A New QR Code." },
        ])}
        left={40}
        ml={40}
        mt={mt}
        width={fill(40)}
        size={12}
        lineHeight={18}
        family={SF_ROUNDED}
        color={C.expiry}
      />
      <div
        className="flex items-start shrink-0"
        style={{
          marginTop: rowY - (paraY + 36),
          marginLeft: fromCentre(128.59, DESIGN_W),
        }}
      >
        {/* The clock's top is 2 px under the line's top. */}
        <Icon name="expiryClock" mt={2} />
        <span
          className="block shrink-0 font-normal whitespace-pre"
          style={{
            ...SF_LINE,
            color: C.expiry,
            marginLeft: 147 - (128.59 + 12.81),
          }}
        >
          <Slots
            text={t("Expiry {date} | {time}")}
            slots={{
              date: WALLET_CRYPTO.expiry.date,
              time: (
                <span className="font-bold">{WALLET_CRYPTO.expiry.time}</span>
              ),
            }}
          />
        </span>
      </div>
    </>
  );
}

/**
 * `Home Page – 37`, after "I Agree": the crypto code, sheet from y 90.
 *   - the network tag 193 x 28 at (119, 213);
 *   - the code, 300.12 px, at (65, 260.41);
 *   - "110 USDT Deposit" on baseline 589, its mark at (136, 573);
 *   - the scan line on baseline 651, the time left (`#3066CC`, its clock at
 *     (137.64, 666)) on 678, "Or Try Direct Link To" on 713;
 *   - three 30 px wallets at y 728, x 140, 200 and 260, radius 5;
 *   - the orange lines on 789 and 807, the expiry on 832;
 *   - three actions at y 855.
 */
function CryptoCode({
  head,
  amount,
  onPicture,
}: {
  head: React.ReactNode;
  amount: string;
  /** "Download": on to the picture of the code (`– 38`). */
  onPicture: () => void;
}) {
  const { t } = useDemoNav();
  const [left, setLeft] = useState<number>(WALLET_CRYPTO.seconds);

  useEffect(() => {
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {head}
      <NetworkTag mt={213 - HEAD_END} />
      <Under testId="demo-wallet-cash-in-code-under">
        {/* The code keeps its size, centred as in the file. */}
        <Icon
          name="qrCashIn"
          mt={260.41 - (213 + 28)}
          style={{ marginLeft: fromCentre(65, DESIGN_W) }}
        />
        <DepositRow mt={573 - (260.41 + 300.12)} amount={amount} />
        <ScanRow mt={639 - (573 + 20)} />

        <div
          className="flex items-start shrink-0"
          style={{
            marginTop: 666 - (639 + 15),
            marginLeft: fromCentre(137.64, DESIGN_W),
          }}
        >
          <Icon name="timerBlue" />
          <Txt
            size={12}
            color={C.cryptoBlue}
            ml={158 - (137.64 + 13.73)}
            data-pw="demo-wallet-cash-in-time-left"
            style={{ whiteSpace: "pre" }}
          >
            <Slots
              text={t("Within {time} minutes")}
              slots={{ time: <span className="font-bold">{clock(left)}</span> }}
            />
          </Txt>
        </div>

        {/* The file starts this line at x 159: half a px right of centre. */}
        <Txt
          center
          nudge={0.5}
          size={12}
          color={C.inkSoft}
          mt={gapTo(666 + 15, 713, 12)}
        >
          {t("Or try direct link to")}
        </Txt>
        {/* x 140 to 290 in the file: centred on the screen. */}
        <div
          className="flex justify-center shrink-0"
          style={{ marginTop: 728 - textBottom(713, 12) }}
        >
          {WALLET_CRYPTO_APPS.map((app, i) => (
            <motion.button
              key={app.id}
              type="button"
              aria-label={app.name}
              data-pw={`demo-wallet-cash-in-app-${app.id}`}
              whileTap={{ scale: 0.94 }}
              className="shrink-0 cursor-pointer overflow-hidden"
              style={{
                marginLeft: i === 0 ? 0 : 30,
                width: 30,
                height: 30,
                borderRadius: 5,
              }}
            >
              {app.icon ? (
                <Icon name={app.icon} />
              ) : (
                <img
                  src={`/assets/demo/xd/${app.picture}`}
                  alt=""
                  draggable={false}
                  width={30}
                  height={30}
                  className="block object-cover select-none pointer-events-none"
                  style={{ width: 30, height: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <Expiry mt={sfTop(789, 12, 18) - (728 + 30)} first={789} />

        <Actions
          mt={855 - (sfTop(832, 12, 18) + 18)}
          actions={CRYPTO_ACTIONS}
          onAct={(id) => {
            if (id === "download") onPicture();
          }}
          testId="demo-wallet-cash-in-code"
        />
      </Under>
    </>
  );
}

/**
 * `Home Page – 38`: the picture of the crypto code, on a white page. The
 * blocks of `– 37` without the time left, the wallets and the actions, from
 * the title row at y 66:
 *   - the network tag at (119, 165), the code, 350.37 px, at (39.99, 212.42);
 *   - "110 USDT Deposit" on baseline 591, the scan line on 648;
 *   - the orange lines on 747 and 765, the expiry on 790;
 *   - the note, 390 x 90 at (20, 805).
 */
function CryptoPicture({ amount }: { amount: string }) {
  const { t } = useDemoNav();
  return (
    <>
      <NetworkTag mt={165 - textBottom(132, 24)} />
      <Icon
        name="qrCashInBig"
        mt={212.42 - (165 + 28)}
        style={{ marginLeft: fromCentre(39.99, DESIGN_W) }}
      />
      <DepositRow mt={575 - (212.42 + 350.37)} amount={amount} />
      <ScanRow mt={636 - (575 + 20)} />
      <Expiry mt={sfTop(747, 12, 18) - (636 + 15)} first={747} />
      <Note
        mt={805 - (sfTop(790, 12, 18) + 18)}
        testId="demo-wallet-cash-in-crypto-note"
      >
        <NoteTitle>
          {t("The wallet above is linked to a payment to a specific account !")}
        </NoteTitle>
        <NoteText>
          {`${t(
            "So once the payment is completed, the balance will be added automatically. It is considered a one-time-use wallet only",
          )} `}
          <ThankYou />
        </NoteText>
      </Note>
    </>
  );
}

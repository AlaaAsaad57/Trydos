"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoAddress } from "../../DemoApp/DemoData";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { countryOf } from "../../DemoApp/demoPlaces";
import { useDemoCase } from "../demoCase";
import { C, SAFE_BOTTOM, SHEET, fill, isFloatingBarSafari, lineBox, paraTop, sliderMove, textBottom, textTop } from "../demo1Layout";
import { Sheet, Stroke, WhyCard } from "../ui";
import { LINE_11, LINE_13, LINE_14 } from "./CartParts";
import type { T } from "./ListingParts";

/**
 * The delivery method sheet of the checkout, opened by "Choose Delivery
 * Method" (`Home Page – 76`). Two steps, as two boards of the file:
 *
 *  - `– 72`, the methods: "Delivery Method" (24 Bold) with the 30 px map at
 *    (24, 114), the line under it and the address's place, then two cards,
 *    390 x 188: "Pickup | Collect Point" (Recommended) and "Delivery to
 *    address" in grey (Coming soon, it cannot be chosen).
 *  - `– 77`, after a tap on Pickup: a back arrow, the title "Pickup | Collect
 *    Point" with the map beside it, the Pickup card chosen (white, a purple
 *    line) with "Select one from our centers", and the three centres, 390 x 65.
 *
 * Under both: the grey "What is the collection point ?" card (`WhyCard`, y 700)
 * and "Done", 188 x 45 at (121, 851), grey.
 *
 * `– 78`, a centre chosen: the tapped centre takes the chosen look of the
 * Pickup card (white, the purple line), and "Done" turns dark. "Done" then
 * closes the sheet with the centre, and the checkout shows it (`– 75`).
 */
export default function DeliveryMethodSheet({
  open,
  address,
  onClose,
  onDone,
}: {
  open: boolean;
  /** The bag's address: its place is the line under the title. */
  address: DemoAddress;
  onClose: () => void;
  /** A centre was chosen and "Done" tapped: the centre's id. */
  onDone: (centre: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} y={SHEET_Y} radius={SHEET.radiusWallet} z={SHEET_Z} testId="demo-delivery-sheet">
      <SheetBody address={address} onDone={onDone} />
    </Sheet>
  );
}

/** Over the checkout's price panel (CartParts' PANEL_Z = layer z 40), as the address sheet. */
export const SHEET_Z = 50;

/** The sheet's top, and where its handle ends (the line at y 101 .. 103). The payment sheet (`– 73`) has the same. */
export const SHEET_Y = 90;
export const HANDLE_END = SHEET_Y + SHEET.handle.top + SHEET.handle.height - 1;

/** The title: 24 Bold on baseline 138. */
export const TITLE = { baseline: 138, size: 24 } as const;
/** The line under it: 14, two lines on baselines 170 and 188. */
const LEAD = { baseline: 170, size: 14, lineHeight: 188 - 170 } as const;
/** The place: 14 on baseline 218. */
const PLACE = { baseline: 218, size: 14 } as const;

/**
 * "Delivery Method" is centred by eye in the file: its ink starts 2/3 px
 * right of the centred place (the ink audit, WebKit). "Pickup | Collect
 * Point" on `– 77` is centred exactly.
 */
const METHODS_TITLE_NUDGE = 2 / 3;

/** The 30 px map: at x 24 on `– 72`; 12.5 left of the title on `– 77` (map ends 83.2, title starts 95.7). */
const MAP = { x: 24, y: 114.08, gap: 12.5 } as const;
/** The back arrow (`back`, 12 x 21): its ink at (24, 119), as the header's at (24, 65). The payment sheet's `– 79` has it there too. */
export const BACK = { x: 23.5, y: 118.5, pad: 10 } as const;

/** The flag before the place: 18 px, 6 left of the words (flag 118 .. 136, words from 142). */
const FLAG = { size: 18, gap: 6 } as const;

/** The line under the title is centred and breaks where the file breaks it. */
const LEAD_WIDTH = 356;

/** The cards: 20 px from both edges. */
export const CARD_X = 20;
export const METHOD_H = 188;
/** A centre (`– 77`) and a way to pay with rdb (`– 79`): 390 x 65. */
export const CHOICE_H = 65;

/** "Done": 188 x 45 at (121, 851), its word on baseline 879. */
const DONE = { y: 851, width: 188, height: 45, baseline: 879 } as const;

/** The grey card from y 700 to 824 (`– 72`, `– 77`, and the payment sheet's `– 79`). */
export const WHY = { y: 700, end: 824 } as const;

/**
 * The file's gap under "Done": 36 px to the SCREEN's end, where the file has
 * the home bar. In iPhone Safari 26 the window ends above Safari's floating
 * bar, which already takes that room, so there "Done" and the grey card go
 * down by the 36 px, as on the address sheet (CartAddressSheet's END_GAP).
 */
const END_GAP = 932 - (DONE.y + DONE.height);

/** Room under the cards, so the last one can scroll out from under the card and the button. */
export const ROOM_WHY = 932 - WHY.y + 12;
export const ROOM = 932 - DONE.y + 12;

/** The title and the chip change in place: a short fade. */
export const FADE = { duration: 0.15 };

/**
 * Under the Pickup card, the steps trade places as two screens do: the
 * centres and the "Delivery to address" card move a full width together,
 * with the Home slider's speed and curve (sliderMove, as Demo1Shell slides
 * a store's page). `dir` 1 goes to the centres (they come from the right),
 * -1 goes back (they leave to the right). Neither side fades. Not gated on
 * "reduce motion": the demo shows the motion; the real app decides that
 * separately.
 */
export const STEP_SLIDE: Variants = {
  enter: (dir: 1 | -1) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 1 }),
  center: (dir: 1 | -1) => sliderMove(dir, false),
  exit: (dir: 1 | -1) => sliderMove(dir, true),
};

/**
 * The file's three centres (`– 77`). `place` is the centre's part of town, as
 * the checkout writes it after "trydos Center" (`– 75`: "Jamiliya"). It is a
 * place name, as the address's own parts, so it is not translated.
 */
export const CENTRES: { id: string; name: DemoKey; place: string }[] = [
  { id: "jamiliya", name: "El Jamiliya Center", place: "Jamiliya" },
  { id: "furkan", name: "El Furkan Center", place: "Furkan" },
  { id: "bab-el-faraj", name: "El Bab El Faraj Center", place: "Bab El Faraj" },
];

/** The grey of the chips that are not purple. */
export const CHIP_GREY = "#F4F4F4";

/**
 * The room under "Done": the file's 36 px to the screen's end, or none in
 * iPhone Safari 26 (see END_GAP). `drop` is how far "Done" and the cards'
 * end go down from the file's place. A sheet is drawn in the browser only
 * (a layer on <body>), so the agent can be read here.
 */
export function useDoneRoom() {
  const [gap] = useState(() => (isFloatingBarSafari(navigator.userAgent) ? 0 : END_GAP));
  return { gap, drop: END_GAP - gap };
}

type Step = "methods" | "pickup";

/** The sheet's content: built anew on every opening, so it always opens on the methods. */
function SheetBody({ address, onDone }: { address: DemoAddress; onDone: (centre: string) => void }) {
  const { t, body } = useDemoCase();
  const [step, setStep] = useState<Step>("methods");
  const [centre, setCentre] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(true);
  const { gap, drop } = useDoneRoom();
  const pickup = step === "pickup";
  // The slide's way: to the centres (1), or back to the methods (-1).
  const dir = pickup ? 1 : -1;
  const done = pickup && centre !== null;

  return (
    <>
      {/* The title, the line under it, and the map and the back arrow: they change with the step. */}
      <div className="relative flex flex-col shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step}
            className="flex flex-col"
            // Not Tailwind's `relative`: the app's Tailwind is `important`, and
            // that class would beat popLayout's `position: absolute` on the
            // leaving title, so both titles would stand in the flow for the
            // fade and the cards under them would jump.
            style={{ position: "relative" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            {pickup ? (
              <button
                type="button"
                aria-label={t("Back")}
                data-pw="demo-delivery-back"
                onClick={() => setStep("methods")}
                className="absolute cursor-pointer [-webkit-tap-highlight-color:transparent] active:opacity-60"
                style={{ left: BACK.x - BACK.pad, top: BACK.y - HANDLE_END - BACK.pad, padding: BACK.pad }}
              >
                <XdIcon name="back" />
              </button>
            ) : (
              <XdIcon name="deliveryMap" className="absolute" style={{ left: MAP.x, top: MAP.y - HANDLE_END }} />
            )}
            <h2
              className="relative self-center font-bold whitespace-nowrap"
              style={{
                left: pickup ? 0 : METHODS_TITLE_NUDGE,
                marginTop: textTop(TITLE.baseline, TITLE.size) - HANDLE_END,
                fontSize: TITLE.size,
                lineHeight: `${lineBox(TITLE.size)}px`,
                color: C.ink,
              }}
            >
              {pickup ? t("pickup | Collect Point") : t("Delivery Method")}
              {pickup && (
                <XdIcon
                  name="deliveryMap"
                  className="absolute"
                  style={{ right: `calc(100% + ${MAP.gap}px)`, top: MAP.y - textTop(TITLE.baseline, TITLE.size) }}
                />
              )}
            </h2>
            <p
              className="self-center text-center font-normal"
              style={{
                marginTop: paraTop(LEAD.baseline, LEAD.size, LEAD.lineHeight) - textBottom(TITLE.baseline, TITLE.size),
                width: `min(${LEAD_WIDTH}px, ${fill(37)})`,
                fontSize: LEAD.size,
                lineHeight: `${LEAD.lineHeight}px`,
                color: C.ink,
              }}
            >
              {pickup
                ? body("Choose the center or point through which you would like to Collect your shipment")
                : body("Choose the Method you would like to Collect your shipment")}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <Place address={address} t={t} />

      {/* Under the place: the cards, with the grey card and "Done" over their end. */}
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ paddingBottom: (showWhy ? ROOM_WHY : ROOM) - drop, scrollbarWidth: "none" }}
        >
          <MethodCard
            testId="demo-delivery-pickup"
            mt={242 - textBottom(PLACE.baseline, PLACE.size)}
            chosen={pickup}
            onClick={pickup ? undefined : () => setStep("pickup")}
            badge={{ label: t("Recommended"), fill: C.purpleTint, color: C.purple, right: 410 - 404, width: 94 }}
            title={t("pickup | Collect Point")}
            titleColor={C.ink}
            chip={{ label: t("You will Collect your shipment yourself"), fill: C.purpleTint, stroke: C.purple, color: C.purple }}
            extra={pickup ? { label: t("Select one from our centers"), fill: CHIP_GREY, stroke: C.ink, color: C.ink } : undefined}
          />

          <div className="relative flex flex-col shrink-0">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              {pickup ? (
                <motion.ul
                  key="centres"
                  className="flex flex-col p-0 list-none"
                  custom={dir}
                  variants={STEP_SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {CENTRES.map((c, i) => (
                    <li key={c.id} className="flex shrink-0">
                      <CentreCard
                        testId={`demo-delivery-centre-${i}`}
                        mt={i === 0 ? 438 - 430 : 507 - (438 + CHOICE_H)}
                        name={t(c.name)}
                        chosen={centre === c.id}
                        onClick={() => setCentre(c.id)}
                      />
                    </li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div
                  key="address"
                  className="flex flex-col"
                  custom={dir}
                  variants={STEP_SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <MethodCard
                    testId="demo-delivery-address"
                    mt={436 - (242 + METHOD_H)}
                    chosen={false}
                    badge={{ label: t("Coming soon !"), fill: CHIP_GREY, color: C.ink, right: 410 - 402, width: 90 }}
                    title={t("Delivery to address")}
                    titleColor={C.hint}
                    chip={{ label: t("Not Available in your Location for now"), fill: CHIP_GREY, stroke: C.line, color: C.ink, weight: "normal" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showWhy && (
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

        <SheetDone testId="demo-delivery-done" label={t("Done")} gap={gap} onDone={done ? () => onDone(centre) : undefined} />
      </div>
    </>
  );
}

/**
 * The address's place under the line, centred: the flag, then the country
 * (Medium) and "| province | town", as "Syria | Aleppo | El Jamiliya".
 * Syria has no flag of its own yet (demoPlaces.ts): the file draws the Turkish
 * one there, so Syria shows none.
 */
function Place({ address, t }: { address: DemoAddress; t: T }) {
  // The address stores street, neighbourhood, district, province.
  const [, town, , province] = address.area;
  const country = countryOf(address.country);
  return (
    <div
      className="flex items-start self-center shrink-0 whitespace-nowrap"
      data-pw="demo-delivery-place"
      style={{
        marginTop:
          textTop(PLACE.baseline, PLACE.size) -
          (paraTop(LEAD.baseline, LEAD.size, LEAD.lineHeight) + 2 * LEAD.lineHeight),
        color: C.ink,
        ...LINE_14,
      }}
    >
      {country.flag && (
        <XdIcon name={country.flag} size={FLAG.size} className="shrink-0" style={{ marginRight: FLAG.gap }} />
      )}
      {/* One text line: a flex item drops its leading space, so the two parts share one span. */}
      <span className="font-normal">
        <span className="font-medium">{t(country.name)}</span>
        {` | ${province} | ${town}`}
      </span>
    </div>
  );
}

/**
 * "Done", 188 x 45 at (121, 851), centred, or wider for longer words. It is
 * grey and takes no tap until there is something to confirm (`onDone`), then
 * it is dark. `gap`: its distance from the window's end (useDoneRoom).
 */
export function SheetDone({
  testId,
  label,
  gap,
  onDone,
}: {
  testId: string;
  label: string;
  gap: number;
  onDone?: () => void;
}) {
  const done = onDone !== undefined;
  return (
    <motion.button
      type="button"
      data-pw={testId}
      disabled={!done}
      onClick={onDone}
      whileTap={done ? { scale: 0.98 } : undefined}
      className="absolute flex justify-center font-normal whitespace-nowrap [-webkit-tap-highlight-color:transparent]"
      style={{
        // Centred, 188 wide, or wider for longer words.
        left: 0,
        right: 0,
        marginInline: "auto",
        width: "fit-content",
        bottom: `calc(${gap}px + ${SAFE_BOTTOM})`,
        minWidth: DONE.width,
        height: DONE.height,
        paddingTop: textTop(DONE.baseline, 13) - DONE.y,
        paddingLeft: 20,
        paddingRight: 20,
        // XD stops a corner at half the short side: the file's 30 draws 22.5.
        borderRadius: `${DONE.height / 2}px ${DONE.height / 2}px 14px 14px`,
        background: done ? C.ink : C.hint,
        color: C.white,
        cursor: done ? "pointer" : "default",
        transition: "background-color 0.2s",
        zIndex: 5,
        ...LINE_13,
      }}
    >
      {label}
    </motion.button>
  );
}

export type ChipLook = {
  label: React.ReactNode;
  fill: string;
  color: string;
  stroke?: string;
  weight?: "normal" | "medium";
};

/**
 * A chip: 22 tall, round 8, its 11 px words centred; at least the file's
 * width. `pad` is the room at each side when the words are longer than that.
 */
export function Chip({
  label,
  fill: background,
  color,
  stroke,
  weight = "normal",
  minWidth,
  pad = 8,
}: ChipLook & { minWidth?: number; pad?: number }) {
  return (
    <span
      className={`relative flex items-center justify-center shrink-0 whitespace-nowrap ${weight === "medium" ? "font-medium" : "font-normal"}`}
      style={{ minWidth, height: 22, paddingInline: pad, borderRadius: 8, background, color, ...LINE_11 }}
    >
      {label}
      {stroke && <Stroke color={stroke} radius={8} />}
    </span>
  );
}

/**
 * A method card, 390 x 188, round 15: `#FCFCFC` with a grey 0.5 line, or
 * chosen (`– 77`) white with a purple one. The badge sits 6 from its top
 * right; the 30 Bold title on baseline 100 from its top; the chip 8 under the
 * title (214 x 22), and on `– 77` the second chip 12 under that (164 x 22).
 */
function MethodCard({
  testId,
  mt,
  chosen,
  onClick,
  badge,
  title,
  titleColor,
  chip,
  extra,
}: {
  testId: string;
  mt: number;
  chosen: boolean;
  /** No tap: the card cannot be chosen (or already is). */
  onClick?: () => void;
  /** `width`: the file's box (94 and 90); the words are centred in it, as the file draws them. */
  badge: ChipLook & { right: number; width: number };
  title: string;
  titleColor: string;
  chip: ChipLook;
  extra?: ChipLook;
}) {
  const card = (
    <>
      <Stroke color={chosen ? C.purple : C.line} radius={15} align="center" />
      <span className="absolute" style={{ top: 248 - 242, right: badge.right }}>
        <Chip {...badge} weight="medium" minWidth={badge.width} pad={7} />
      </span>
      <span
        className="block shrink-0 font-bold whitespace-nowrap"
        style={{ marginTop: textTop(342, 30) - 242, fontSize: 30, lineHeight: `${lineBox(30)}px`, color: titleColor }}
      >
        {title}
      </span>
      <span className="flex shrink-0" style={{ marginTop: 358 - textBottom(342, 30) }}>
        <Chip {...chip} minWidth={214} />
      </span>
      <AnimatePresence initial={false}>
        {extra && (
          <motion.span
            key="extra"
            className="flex shrink-0"
            style={{ marginTop: 392 - (358 + 22) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            <Chip {...extra} minWidth={164} />
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
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
  return onClick ? (
    <motion.button type="button" data-pw={testId} onClick={onClick} whileTap={{ scale: 0.98 }} className={`${className} cursor-pointer`} style={style}>
      {card}
    </motion.button>
  ) : (
    <div data-pw={testId} aria-disabled={chosen ? undefined : true} aria-current={chosen ? true : undefined} className={className} style={style}>
      {card}
    </div>
  );
}

/**
 * A choice, 390 x 65, round 15, as an unchosen method card: its first line
 * (14) 12 in and on baseline 26, the second line (12) on baseline 50. A
 * centre (`– 77`) writes the "trydos" mark ("try" Bold) and the centre's
 * name; the payment sheet's `– 79` writes a way to pay with rdb.
 *
 * `chosen` draws it white with a purple line. With no `onClick` it takes no
 * tap (the ways on `– 79`: their next boards are not built yet).
 */
export function ChoiceCard({
  testId,
  mt,
  title,
  line,
  chosen,
  onClick,
}: {
  testId: string;
  mt: number;
  title: React.ReactNode;
  line: React.ReactNode;
  chosen: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Stroke color={chosen ? C.purple : C.line} radius={15} align="center" />
      <span className="block font-normal whitespace-nowrap" style={{ marginTop: textTop(464, 14) - 438, marginLeft: 32 - CARD_X, color: C.ink, ...LINE_14 }}>
        {title}
      </span>
      <span
        className="block font-normal whitespace-nowrap"
        style={{
          marginTop: textTop(488, 12) - textBottom(464, 14),
          marginLeft: 32 - CARD_X,
          fontSize: 12,
          lineHeight: `${lineBox(12)}px`,
          color: C.ink,
        }}
      >
        {line}
      </span>
    </>
  );
  const style: React.CSSProperties = {
    marginTop: mt,
    marginLeft: CARD_X,
    width: fill(CARD_X),
    height: CHOICE_H,
    borderRadius: 15,
    background: chosen ? C.white : C.card,
    transition: "background-color 0.2s",
  };
  const className = "relative flex flex-col items-start shrink-0 text-left [-webkit-tap-highlight-color:transparent]";
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

/** A centre (`– 77`): the "trydos" mark and the centre's name. */
function CentreCard({
  testId,
  mt,
  name,
  chosen,
  onClick,
}: {
  testId: string;
  mt: number;
  name: string;
  chosen: boolean;
  onClick: () => void;
}) {
  return (
    <ChoiceCard
      testId={testId}
      mt={mt}
      chosen={chosen}
      onClick={onClick}
      // The brand's mark, as the file draws it: not a word to translate.
      title={
        <span aria-hidden="true">
          <span className="font-bold">{BRAND[0]}</span>
          {BRAND[1]}
        </span>
      }
      line={name}
    />
  );
}

/** "trydos", its first half Bold: the brand, not a word to translate. */
export const BRAND = ["try", "dos"] as const;

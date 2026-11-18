"use client";

import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { C, textTop } from "../demo1Layout";
import { Box, ScreenPage, Stroke, Txt } from "../ui";
import type { BagItemView, BagLabel, BagView } from "../bagView";
import EmptyTabScreen from "./EmptyTabScreen";
import { BagHeader, BagPanel, LINE_11, LINE_13, Rule } from "./CartParts";
import { FlipTurns, Rich, StoreMark, Weighted, type T } from "./ListingParts";

/**
 * The bag, XD `Home Page – 50`: the cart tab.
 *
 *  - The header with the count and the sum (CartParts), and a grey note under
 *    it (y 100 to 138).
 *  - One row per item: the 80 x 120 photo at x 12, the store's logo and five
 *    lines of text from x 104, the item's number at the end side, and under
 *    the photo the quantity box (delete, the count, add one more) with the
 *    item's labels beside it: the product's labels taking turns in one place,
 *    then "Hurry up" always on show. A grey hairline between two rows.
 *  - Under a dark hairline, the items whose time in the bag ran out: a chip
 *    that says so, then the item drawn faint, with the time it has left and
 *    "Add again" at the end side.
 *  - The bottom panel with the sum and "Confirm & continue", on the tab bar.
 *
 * With nothing in the bag the screen is the empty cart it was before the file
 * had this design (EmptyTabScreen).
 *
 * The design draws plain data only (BagView). Positions are on the start and
 * end sides, so a right-to-left page is the file's mirror (A-13).
 */
export function BagPage({
  bag,
  onTake,
  onAdd,
  onAddAgain,
  onConfirm,
  t,
}: {
  bag: BagView;
  /** The bin: one less; the last one takes the item out. */
  onTake: (id: string) => void;
  onAdd: (id: string) => void;
  onAddAgain: (id: string) => void;
  onConfirm: () => void;
  t: T;
}) {
  const { items, out, sums } = bag;
  if (items.length === 0 && out.length === 0)
    return (
      <EmptyTabScreen
        title="Cart"
        message="Your cart is empty"
        hint="Items you add to your cart will show here"
      />
    );
  return (
    <ScreenPage testId="demo-cart" header={<BagHeader sums={sums} t={t} />} tabBar>
      <Note t={t} />
      <ul className="flex flex-col p-0 m-0 list-none">
        {items.map((item, i) => (
          <BagRow
            key={item.id}
            item={item}
            index={i + 1}
            first={i === 0}
            last={i === items.length - 1}
            onTake={() => onTake(item.id)}
            onAdd={() => onAdd(item.id)}
            t={t}
          />
        ))}
      </ul>
      {out.length > 0 && (
        <section aria-label={t("<b>Out of Bag ! </b>time running out").replace(/<\/?b>/g, "")} className="flex flex-col">
          {/* The dark line, 8 px under the last row's box (y 490), then the chip 20 px under it (y 510). */}
          <Rule color={C.ink} mt={items.length > 0 ? 490 - 482 : 0} />
          <OutChip t={t} />
          <ul className="flex flex-col p-0 m-0 list-none">
            {out.map((item) => (
              <OutRow key={item.id} item={item} onAddAgain={() => onAddAgain(item.id)} t={t} />
            ))}
          </ul>
        </section>
      )}
      {/* Room for the panel over the tab bar, so the last row scrolls out from under it. */}
      <div aria-hidden="true" className="shrink-0" style={{ height: 859 - 790 + 12 }} />
      {items.length > 0 && (
        <BagPanel
          sums={sums}
          tabBar
          testId="demo-bag-panel"
          button={{
            label: t("Confirm & continue"),
            fill: C.purple,
            onClick: onConfirm,
            testId: "demo-bag-confirm",
          }}
          t={t}
        />
      )}
    </ScreenPage>
  );
}

/** The grey note under the header: `#F4F4F4`, 38 tall, the blue mark at (26, 112) and the blue line at x 46. */
function Note({ t }: { t: T }) {
  return (
    <p
      data-pw="demo-bag-note"
      className="flex items-start shrink-0 w-full m-0 font-normal whitespace-nowrap"
      style={{ height: 138 - 100, background: "#F4F4F4", color: C.blue, ...LINE_11 }}
    >
      <XdIcon name="cartInfo" className="shrink-0" style={{ marginInlineStart: 26, marginTop: 112 - 100 }} />
      <span className="overflow-hidden text-ellipsis" style={{ marginInlineStart: 46 - 26 - 14.01, marginTop: textTop(123, 11) - 100 }}>
        {t("Item Availability and pricing are not guaranteed until payment is final")}
      </span>
    </p>
  );
}

/** The photo of an item: 80 x 120, round 6, cut as XD fills it (cover, centred). */
function ItemPhoto({ item, line, faint = false }: { item: BagItemView; line: string; faint?: boolean }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width: 80, height: 120, borderRadius: 6, opacity: faint ? 0.4995 : 1 }}
    >
      {item.photo && (
        <img
          src={item.photo}
          alt={item.name.join(" ")}
          draggable={false}
          decoding="async"
          className="block w-full h-full object-cover"
        />
      )}
      <Stroke color={line} width={faint ? 0.3 : 0.5} radius={6} />
    </div>
  );
}

/** "Women . Pajama . Pantaloon": the item's words with a Medium dot between two of them. */
function ItemName({ item, color }: { item: BagItemView; color: string }) {
  return (
    <Txt as="h2" size={11} color={color} mt={6.28} className="overflow-hidden text-ellipsis">
      {item.name.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          {i > 0 && (
            <>
              {" "}
              <span className="font-medium">.</span>{" "}
            </>
          )}
          {word}
        </React.Fragment>
      ))}
    </Txt>
  );
}

/** "Color . Denim Blue": the label grey, the dot and the value Medium in the row's ink. */
function Detail({
  label,
  value,
  grey,
  ink,
}: {
  label: string;
  value: string;
  grey: string;
  ink: string;
}) {
  return (
    <Txt size={11} color={ink} mt={6} className="overflow-hidden text-ellipsis">
      <span style={{ color: grey }}>{label} </span>
      <span className="font-medium">.</span> <span className="font-medium">{value}</span>
    </Txt>
  );
}

/** The text column of a row, from x 104: the logo at +6 and five lines on baselines +31, +51, +71, +91 and the last one. */
function ItemText({
  item,
  grey,
  ink,
  last,
  t,
}: {
  item: BagItemView;
  grey: string;
  ink: string;
  /** The last line: the price line, or the time left. */
  last: React.ReactNode;
  t: T;
}) {
  return (
    <div className="flex flex-col min-w-0 grow" style={{ marginInlineStart: 104 - 92 }}>
      <div className="shrink-0" style={{ marginTop: 6, height: 7.72, opacity: ink === C.grey ? 0.5 : 1 }}>
        <StoreMark store={item.mark} h={7.72} maxW={220} />
      </div>
      <ItemName item={item} color={ink} />
      {item.color && <Detail label={t("Color")} value={item.color} grey={grey} ink={ink} />}
      {item.size && <Detail label={t("Size")} value={item.size} grey={grey} ink={ink} />}
      {item.pieces && <Detail label={t("Composed of")} value={item.pieces} grey={grey} ink={ink} />}
      {last}
    </div>
  );
}

/** Why an item cannot be bought now (S7d-11): the red of the old cart, the file's 11 px line. */
const PROBLEM_RED = "#FD445D";

/**
 * One item in the bag. The first row starts 20 px under the note, the others
 * 12 px under the hairline above them; the hairline is 12 px under the row's
 * boxes (the file's y 314 and 490 pitch of 168).
 */
function BagRow({
  item,
  index,
  first,
  last,
  onTake,
  onAdd,
  t,
}: {
  item: BagItemView;
  index: number;
  first: boolean;
  last: boolean;
  onTake: () => void;
  onAdd: () => void;
  t: T;
}) {
  return (
    <li
      data-pw={`demo-bag-item-${item.id}`}
      className="relative flex flex-col shrink-0"
      style={{ paddingTop: first ? 158 - 138 : 326 - 314, paddingBottom: 314 - 302 }}
    >
      <div className="flex items-start" style={{ marginInline: 12 }}>
        <ItemPhoto item={item} line={C.line} />
        <ItemText
          item={item}
          grey={C.grey}
          ink={C.ink}
          last={
            <>
              <Txt size={11} mt={6} data-pw="demo-bag-item-price">
                <Rich
                  text={t("<m>{count}</m> item <m>.</m> <m>{price}</m> {currency}")}
                  values={{ count: item.qty, price: item.price, currency: item.currency }}
                />
              </Txt>
              {item.problem && (
                <Txt size={11} weight="medium" color={PROBLEM_RED} mt={6} className="overflow-hidden text-ellipsis" data-pw="demo-bag-item-problem">
                  {item.problem}
                </Txt>
              )}
            </>
          }
          t={t}
        />
        {/* The item's number, Bold 11 on baseline +14, ending at the row's end edge. */}
        <span
          className="absolute font-bold whitespace-nowrap"
          style={{ insetInlineEnd: 12, top: (first ? 158 - 138 : 326 - 314) + textTop(14, 11), color: C.ink, ...LINE_11 }}
        >
          {index}
        </span>
      </div>
      <div className="flex items-start" style={{ marginTop: 280 - 278 }}>
        <QtyBox count={item.qty} busy={item.busy === true} onTake={onTake} onAdd={onAdd} t={t} />
        <LabelRow labels={item.labels} t={t} />
      </div>
      {!last && (
        // The grey line's centre is on the row's end (y 314): the 1 px box hangs half under it.
        <div aria-hidden="true" className="absolute left-0 right-0" style={{ bottom: -0.5 }}>
          <Rule color={C.line} mt={0.5} />
        </div>
      )}
    </li>
  );
}

/**
 * The quantity box under the photo: 80 x 22, round 6, a grey line; the red
 * bin at (18, 285), the count 13 Medium at x 50, the plus at (74, 285). The
 * bin and the plus each take a third of the box as their target. While a
 * change is on its way (`busy`) the box is faint and takes no tap, as the
 * old cart's box.
 */
function QtyBox({
  count,
  busy,
  onTake,
  onAdd,
  t,
}: {
  count: number;
  busy: boolean;
  onTake: () => void;
  onAdd: () => void;
  t: T;
}) {
  return (
    <Box
      w={80}
      h={22}
      ml={12}
      radius={6}
      fill={C.white}
      stroke={C.line}
      className="flex items-start"
      style={busy ? { opacity: 0.4, pointerEvents: "none" } : undefined}
      aria-busy={busy || undefined}
      data-pw="demo-bag-qty"
    >
      <button
        type="button"
        aria-label={t("Delete")}
        data-pw="demo-bag-take"
        onClick={onTake}
        className="absolute top-0 h-full cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
        style={{ insetInlineStart: 0, width: 30 }}
      >
        <XdIcon name="cartTrash" className="absolute" style={{ insetInlineStart: 18 - 12, top: 285 - 280 }} />
      </button>
      <span
        data-pw="demo-bag-count"
        className="absolute font-medium whitespace-nowrap"
        style={{ insetInlineStart: 50 - 12, top: textTop(296, 13) - 280, color: C.ink, ...LINE_13 }}
      >
        {count}
      </span>
      <button
        type="button"
        aria-label={t("Add one more")}
        data-pw="demo-bag-add"
        onClick={onAdd}
        className="absolute top-0 h-full cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
        style={{ insetInlineEnd: 0, width: 30 }}
      >
        <XdIcon name="cartPlus" className="absolute" style={{ insetInlineEnd: 92 - 86, top: 285 - 280 }} />
      </button>
    </Box>
  );
}

/**
 * An item's labels beside the quantity box, from x 104, 6 apart, in a row
 * that scrolls sideways past the screen's edge (the file cuts "Hurry up" at
 * the edge).
 *
 *  - First, at x 104, the product's labels ("Best price", "Trend color",
 *    "Best sell"). They take turns in that one place, as the store page's
 *    labels do (FlipTurns); one label would stay still.
 *  - Then "Hurry up", always on show beside them, as in the file (x 241).
 */
function LabelRow({ labels, t }: { labels: readonly BagLabel[]; t: T }) {
  const isHurry = (label: BagLabel) => label.kind === "hurry" || label.kind === "hurryTime";
  const turning = labels.filter((label) => !isHurry(label));
  const hurry = labels.filter(isHurry);
  return (
    <ul
      // No `p-0` / `m-0` here: the site's Tailwind utilities are `!important` and would beat the inline padding.
      className="flex min-w-0 grow list-none overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ gap: 241 - 235, paddingInlineStart: 104 - 92, paddingInlineEnd: 12, height: 22, overscrollBehaviorX: "contain" }}
    >
      {turning.length > 0 && (
        <li className="flex shrink-0">
          <FlipTurns
            testId="demo-bag-labels"
            fit
            style={{ height: 22 }}
            items={turning.map((label, i) => (
              // A row, so the label keeps its own width and does not sit on a line of text.
              <div key={i} className="flex">
                <Label label={label} t={t} />
              </div>
            ))}
          />
        </li>
      )}
      {hurry.map((label, i) => (
        <li key={i} className="flex shrink-0">
          <Label label={label} t={t} />
        </li>
      ))}
    </ul>
  );
}

/**
 * One label: the blue best-price pill (131 x 22), or the yellow running-out
 * one with its clock (238 x 22, a 0.3 px line). The trend and best-sell
 * labels are not in the file: they take the best-price pill's look (22 tall,
 * round 6, no mark) with the product page's colours and words. The time
 * running out (`hurryTime`) is the running-out pill with the old cart's
 * words for a timer.
 */
function Label({ label, t }: { label: BagLabel; t: T }) {
  if (label.kind === "trend" || label.kind === "sell")
    return (
      <p
        data-pw={`demo-bag-label-${label.kind}`}
        className="relative m-0 font-normal whitespace-nowrap"
        style={{
          height: 22,
          paddingTop: 4,
          paddingInline: 6,
          borderRadius: 6,
          ...(label.kind === "trend" ? { background: "#FFF9EF", color: "#FF631A" } : { background: "#F0EFFF", color: C.purple }),
          ...LINE_11,
        }}
      >
        {label.kind === "trend" ? (
          <Rich text={t("<b>Trend </b>color<b> !</b>")} />
        ) : (
          <Rich text={t("<b>Best sell </b>last week<b> !</b>")} />
        )}
      </p>
    );
  if (label.kind === "best")
    return (
      <p
        data-pw="demo-bag-label-best"
        className="relative m-0 font-normal whitespace-nowrap"
        style={{
          height: 22,
          minWidth: 131,
          paddingTop: 4,
          paddingInlineStart: 6,
          paddingInlineEnd: 3,
          borderRadius: 6,
          background: "#EFF6FF",
          color: C.blue,
          ...LINE_11,
        }}
      >
        <span className="font-bold">{t("! Best price")} </span>
        <Weighted text={t("last {days} days!")} values={{ days: String(label.days) }} medium={["days"]} />
      </p>
    );
  return (
    <p
      data-pw="demo-bag-label-hurry"
      className="relative m-0 font-normal whitespace-nowrap"
      style={{
        height: 22,
        minWidth: 238,
        paddingTop: 4,
        paddingInlineStart: 26,
        paddingInlineEnd: 3,
        borderRadius: 6,
        background: "#FDFDEF",
        color: "#A28E5C",
        ...LINE_11,
      }}
    >
      <XdIcon name="cartClock" className="absolute" style={{ insetInlineStart: 247 - 241, top: 452.71 - 448 }} />
      <Rich
        text={
          label.kind === "hurryTime"
            ? t("<b>Hurry up ! </b>time running out.<b> -{time}</b>")
            : t("<b>Hurry up ! </b>quantity running out.<b> -{time}</b>")
        }
        values={{ time: label.time }}
      />
      <Stroke color={C.line} width={0.3} radius={6} />
    </p>
  );
}

/** The chip over the items whose time ran out: (12, 510), 192 x 22, grey with an orange 0.3 px line, the dark help mark 6 px from its end. */
function OutChip({ t }: { t: T }) {
  return (
    <p
      data-pw="demo-bag-out-chip"
      className="relative flex items-start self-start font-normal whitespace-nowrap"
      // 20 px under the dark line, which is 0.5 px tall and starts at y 490.
      style={{
        marginTop: 510 - 490.5,
        marginInlineStart: 12,
        height: 22,
        minWidth: 192,
        paddingTop: 4,
        paddingInline: 6,
        borderRadius: 6,
        background: "#F4F4F4",
        color: C.ink,
        ...LINE_11,
      }}
    >
      <span style={{ marginInlineEnd: 184 - 172 }}>
        <Rich text={t("<b>Out of Bag ! </b>time running out")} />
      </span>
      {/* At the chip's end, 6 px in (x 184 in the file), whatever width the browser gives the words. */}
      <span role="img" aria-label={t("Help")} className="block shrink-0 ms-auto">
        <XdIcon name="cartOutHelp" />
      </span>
      <Stroke color="#FF7C38" width={0.3} radius={6} />
    </p>
  );
}

/**
 * An item whose time ran out: drawn faint and grey, the time it has left in
 * orange, and "Add again" at the end of that line. Once the time is over
 * (`outTime` empty) the line keeps "Out of Bag !" without a time, as the old
 * cart hides only its counter.
 */
function OutRow({ item, onAddAgain, t }: { item: BagItemView; onAddAgain: () => void; t: T }) {
  return (
    <li data-pw={`demo-bag-out-${item.id}`} className="flex items-start shrink-0" style={{ marginTop: 544 - 532, marginInline: 12 }}>
      <ItemPhoto item={item} line="#FF6200" faint />
      <ItemText
        item={item}
        grey={C.grey}
        ink={C.grey}
        last={
          <div className="flex items-start" style={{ marginTop: 6 }}>
            <Txt size={11} weight="medium" color="#FF7D38" className="overflow-hidden text-ellipsis" data-pw="demo-bag-out-time">
              {item.outTime ? (
                <Rich text={t("<b>Out of Bag ! </b>time running out<m> -{time}</m>")} values={{ time: item.outTime }} />
              ) : (
                <Rich text={t("<b>Out of Bag ! </b>time running out")} />
              )}
            </Txt>
            <button
              type="button"
              data-pw="demo-bag-add-again"
              onClick={onAddAgain}
              disabled={item.busy}
              className="flex items-start shrink-0 ms-auto cursor-pointer active:opacity-60 disabled:opacity-40 [-webkit-tap-highlight-color:transparent] font-normal whitespace-nowrap"
              style={{ color: C.ink, ...LINE_11 }}
            >
              <XdIcon name="cartAddAgain" className="shrink-0" style={{ marginTop: 644 - textTop(655, 11) }} />
              <span style={{ marginInlineStart: 372 - 366 }}>{t("ADD AGAIN")}</span>
            </button>
          </div>
        }
        t={t}
      />
    </li>
  );
}

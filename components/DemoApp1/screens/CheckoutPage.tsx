"use client";

import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { C, fill, lineBox, paraTop, textBottom, textTop } from "../demo1Layout";
import { Box, ScreenPage, Txt } from "../ui";
import type { BagSums } from "../bagView";
import { BRAND, CHIP_GREY } from "./DeliveryMethodSheet";
import { BagHeader, BagPanel, BagSum, LINE_13 } from "./CartParts";
import { Rich, type T } from "./ListingParts";

/** "trydos | rdb": the brand's mark, as the file draws it (not words to translate). */
const RDB_BRAND = { start: "try", rest: "dos | ", bank: "rdb" } as const;

/** A photo of the bag's card: 43 x 64. */
export type BagPhoto = { id: string; src: string; alt: string };

/**
 * The chosen address, as the checkout's card writes it (`– 76`): the title,
 * the place's first parts (Regular) and the rest with the country (Medium),
 * and the detail.
 */
export type CheckoutAddress = {
  title: string;
  /** "El Jamiliya": Regular, before the " |". Empty: no Regular part. */
  regular: string;
  /** "Aleppo | Syria": Medium. */
  medium: string;
  detail: string;
};

/** The chosen pickup centre (`– 75`, /demo only: the backend has no centres). */
export type PickupView = {
  /** After "trydos Center": "Jamiliya | Aleppo | Syria". */
  place: string;
  /** Who collects the bag: "name . phone". */
  receiver: string;
};

/** The way to pay that was chosen. */
export type CheckoutPayment = "wallet" | "invoice";

/**
 * The checkout, XD `Home Page – 56`: opened by "Confirm & continue" on the bag.
 *
 *  - The same header as the bag.
 *  - A card (12, 112), 406 x 80: the small bag, "Shopping bag" and the count
 *    with the sum at the start; the items' photos, 43 x 64, at the end.
 *  - The shipping section: the rocket and the map, the title with its help
 *    mark, a purple line asking for the address, and a dashed purple box
 *    holding the dark "Choose delivery Address" button.
 *  - The bottom panel with the sum and "Checkout / Complete", grey until the
 *    whole checkout is done.
 *
 * With an address chosen the screen is `– 76`: the purple line turns into
 * "We will send your Package to below address" in black, the address card
 * (406 x 76 at y 284) comes under it, and the dashed box moves 8 under the
 * card with "Choose Delivery Method".
 *
 * With a way to deliver chosen, the payment section comes under the card
 * with "Choose Payment Method": a pickup centre turns the address card into
 * the pickup card (`– 75`, /demo); "Delivery to address" keeps the address
 * card and drops the dashed box (the real app, S7d-2).
 *
 * With a way to pay chosen, the dashed box becomes the wallet card (`– 80`,
 * or `– 83` when the balance does not cover the bag) or the rdb invoice card
 * (`– 85`). The terms section comes under it when `showTerms` (the invoice on
 * /demo; every way on the real app, S7d-6): a tap on its row opens
 * "Policies And Terms", and once agreed the row turns `#FCFCFC` with the
 * grey line and a blue mark (`– 86`).
 *
 * "Checkout / Complete" is purple and takes a tap when `ready`.
 *
 * The screen draws plain data. The wrapper owns the sheets (`sheets`) and
 * what each tap does. Positions are on the start and end sides, so a
 * right-to-left page is the file's mirror (A-13).
 */
export function CheckoutPage({
  sums,
  photos,
  address,
  pickup,
  delivered,
  payment,
  wallet,
  showTerms,
  agreed,
  ready,
  onChooseAddress,
  onChooseMethod,
  onChoosePayment,
  onTopUp,
  onReadTerms,
  onComplete,
  sheets,
  t,
  body,
}: {
  sums: BagSums;
  photos: readonly BagPhoto[];
  address: CheckoutAddress | null;
  pickup: PickupView | null;
  /** "Delivery to address" was chosen: the address card stays, with no dashed box. */
  delivered: boolean;
  payment: CheckoutPayment | null;
  /** The wallet card: the balance (null: "Soon available", S7d-3) and whether it covers the bag. */
  wallet: { balance: string | null; currency: string; covered: boolean };
  showTerms: boolean;
  agreed: boolean;
  ready: boolean;
  onChooseAddress: () => void;
  onChooseMethod: () => void;
  onChoosePayment: () => void;
  onTopUp: () => void;
  onReadTerms: () => void;
  onComplete: () => void;
  /** The address, delivery, payment and terms sheets. */
  sheets: React.ReactNode;
  t: T;
  body: T;
}) {
  const deliveryChosen = address !== null && (pickup !== null || delivered);
  return (
    <ScreenPage testId="demo-checkout" header={<BagHeader sums={sums} t={t} />}>
      {/* The card: `#FCFCFC`, a grey 0.5 px line, round 15. */}
      <Box
        mt={112 - 100}
        ml={12}
        w={fill(12)}
        h={80}
        radius={15}
        fill={C.card}
        stroke={C.line}
        className="flex flex-col"
        data-pw="demo-checkout-bag-card"
      >
        <XdIcon name="cartCardBag" className="shrink-0" style={{ marginInlineStart: 24 - 12, marginTop: 120 - 112 }} />
        <Txt size={11} color={C.grey} ml={24 - 12} mt={textTop(159, 11) - 140}>
          <Rich text={t("Shopping <b>bag</b>")} />
        </Txt>
        <Txt size={13} ml={24 - 12} mt={textTop(181, 13) - (textTop(159, 11) + 14)} data-pw="demo-checkout-bag-sum">
          <BagSum sums={sums} t={t} />
        </Txt>
        <BagPhotos photos={photos} />
      </Box>

      <Shipping
        t={t}
        address={address}
        pickup={pickup}
        delivered={delivered}
        onChoose={onChooseAddress}
        onChooseMethod={onChooseMethod}
        helpX={payment ? 200 : 201}
      />
      {deliveryChosen && (
        <Payment
          t={t}
          body={body}
          method={payment}
          wallet={wallet}
          onChoose={onChoosePayment}
          onTopUp={onTopUp}
        />
      )}
      {deliveryChosen && payment && showTerms && <Terms t={t} agreed={agreed} onRead={onReadTerms} />}
      {sheets}

      {/* Room for the panel, so the box above it is never under it. */}
      <div aria-hidden="true" className="shrink-0" style={{ height: 931 - 818 + 12 }} />
      <BagPanel
        sums={sums}
        tabBar={false}
        testId="demo-checkout-panel"
        button={{
          label: t("Checkout / Complete"),
          fill: ready ? C.purple : C.hint,
          disabled: !ready,
          onClick: ready ? onComplete : undefined,
          testId: "demo-checkout-complete",
        }}
        t={t}
      />
    </ScreenPage>
  );
}

/**
 * The bag's photos, 43 x 64, round 6, 2 apart, 8 px from the card's top and
 * end side; the first item at the far end (the checkout's bag card, and the
 * purchase done's, `– 103`).
 */
export function BagPhotos({ photos }: { photos: readonly BagPhoto[] }) {
  return (
    <ul className="absolute flex flex-row-reverse p-0 m-0 list-none" style={{ insetInlineEnd: 418 - 410, top: 120 - 112, gap: 367 - 365 }}>
      {photos.map((photo) => (
        <li key={photo.id} className="shrink-0 overflow-hidden" style={{ width: 43, height: 64, borderRadius: 6, background: C.card }}>
          {photo.src && (
            <img src={photo.src} alt={photo.alt} draggable={false} decoding="async" className="block w-full h-full object-cover" />
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * The shipping section: the marks at y 212, the title on baseline 253, the
 * line on 273, then the dashed box at y 284 (`– 56`); or the address card at
 * y 284 and the dashed box at y 368 (`– 76`); or the pickup card at y 284
 * and no box (`– 75`); or, with "Delivery to address" chosen, the address
 * card and no box.
 */
function Shipping({
  t,
  address,
  pickup,
  delivered,
  onChoose,
  onChooseMethod,
  helpX,
}: {
  t: T;
  address: CheckoutAddress | null;
  pickup: PickupView | null;
  delivered: boolean;
  onChoose: () => void;
  onChooseMethod: () => void;
  /** The help mark's x: 201 (`– 56` to `– 76`), 200 with a way to pay chosen (`– 80`, `– 83`). */
  helpX: number;
}) {
  return (
    <section aria-label={t("Shipping & delivery Address")} className="flex flex-col shrink-0">
      <SectionHead
        marks={
          <>
            <XdIcon name="cartRocket" className="shrink-0" />
            <XdIcon name="cartMap" className="shrink-0" style={{ marginInlineStart: 50 - (24.16 + 19.68), marginTop: 212.15 - 212.44 }} />
          </>
        }
        marksMt={212.44 - 192}
        marksX={24.16}
        marksEnd={212.44 + 20}
        title={t("Shipping & delivery Address")}
        titleBaseline={253}
        helpX={helpX}
        helpLabel={t("Help")}
        line={
          address
            ? t("We will send your Package to below address")
            : t("Please Select your shipping address to receive Your Package")
        }
        lineColor={address ? C.ink : C.purple}
        lineTestId="demo-checkout-address-line"
      />
      {address && pickup && <PickupCard pickup={pickup} t={t} />}
      {address && !pickup && <AddressCard address={address} />}
      {!pickup && !(address && delivered) && (
        <ChooseBox
          mt={address ? 368 - 360 : 284 - textBottom(273, 11)}
          boxTestId="demo-checkout-address-box"
          testId={address ? "demo-checkout-choose-method" : "demo-checkout-choose-address"}
          onClick={address ? onChooseMethod : onChoose}
          label={address ? t("Choose Delivery Method") : t("Choose delivery Address")}
        />
      )}
    </section>
  );
}

/**
 * The payment section, `– 75`: the 20 px phone at (24, 400), 20 under the
 * pickup card; then, as in the shipping section, the title on baseline 441
 * with the help mark at x 135, the purple line on 461, and the dashed box at
 * y 472 with "Choose Payment Method".
 *
 * With a way chosen (`– 80`, `– 83`, `– 85`) the help mark is at x 137, the
 * line is "your payment method about your bag" in black, and the wallet card
 * or the invoice card takes the box's place.
 */
function Payment({
  t,
  body,
  method,
  wallet,
  onChoose,
  onTopUp,
}: {
  t: T;
  body: T;
  method: CheckoutPayment | null;
  wallet: { balance: string | null; currency: string; covered: boolean };
  onChoose: () => void;
  onTopUp: () => void;
}) {
  const paid = method !== null;
  return (
    <section aria-label={t("Payment Method")} className="flex flex-col shrink-0">
      <SectionHead
        marks={<XdIcon name="payPhoneSmall" className="shrink-0" />}
        // 20 under the card above: the pickup card (`– 75`) or the address card.
        marksMt={400 - (284 + 96)}
        marksX={24.06}
        marksEnd={400 + 20}
        title={t("Payment Method")}
        titleBaseline={441}
        helpX={paid ? 137 : 135}
        helpLabel={t("Help")}
        line={paid ? t("your payment method about your bag") : t("Please choose your payment method about your bag")}
        lineColor={paid ? C.ink : C.purple}
        lineTestId="demo-checkout-payment-line"
      />
      {method === "wallet" && (
        <WalletPayCard t={t} body={body} wallet={wallet} onTopUp={onTopUp} onOther={onChoose} />
      )}
      {method === "invoice" && <InvoiceCard mt={472 - textBottom(461, 11)} t={t} />}
      {!paid && (
        <ChooseBox
          mt={472 - textBottom(461, 11)}
          boxTestId="demo-checkout-payment-box"
          testId="demo-checkout-choose-payment"
          onClick={onChoose}
          label={t("Choose Payment Method")}
        />
      )}
    </section>
  );
}

/** Paying an invoice by QR: the hours the file gives (`– 85`). */
const INVOICE_HOURS = 2;

/**
 * The rdb invoice, `– 85`: a card 406 x 80, `#FCFCFC`, round 15, with the
 * 20 px invoice at (24.11, 480) and the QR at (52, 480.3), "trydos | rdb" (13,
 * "try" and "rdb" Bold, baseline 521) and "Pay invoice within 2 hours in many
 * easy way" (11, baseline 541). The checkout draws the grey 0.5 px line; the
 * purchase done (`– 103`) draws none (`line`).
 */
export function InvoiceCard({ mt, t, line = true }: { mt: number; t: T; line?: boolean }) {
  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={80}
      radius={15}
      fill={C.card}
      stroke={line ? C.line : undefined}
      className="flex flex-col"
      data-pw="demo-checkout-invoice"
    >
      <div className="flex items-start shrink-0" style={{ marginInlineStart: 24.11 - 12, marginTop: 480 - 472 }}>
        <XdIcon name="payInvoice" className="shrink-0" />
        <XdIcon name="payQrSmall" className="shrink-0" style={{ marginInlineStart: 52 - (24.11 + 19.78), marginTop: 480.3 - 480 }} />
      </div>
      <Txt size={13} ml={24.22 - 12} mt={textTop(521, 13) - (480 + 20)} style={{ whiteSpace: "pre" }}>
        {/* The brand's mark, as the file draws it: not words to translate. */}
        <span className="font-bold">{RDB_BRAND.start}</span>
        {RDB_BRAND.rest}
        <span className="font-bold">{RDB_BRAND.bank}</span>
      </Txt>
      <Txt size={11} ml={24 - 12} mt={textTop(541, 11) - textBottom(521, 13)} className="truncate" style={{ width: fill(12) }}>
        <Rich text={t("Pay invoice within {hours} hours in many easy way")} values={{ hours: INVOICE_HOURS }} />
      </Txt>
    </Box>
  );
}

/**
 * The terms section, `– 85` and `– 86`: the 20 px pen at (24, 569.44), 17
 * under the invoice card; "Terms & Conditions" (13) on baseline 610 with no
 * help mark; the line (11, "policies" and "terms" Medium) on 632; and the
 * agree row, 406 x 40 at y 643, round 15, its 0.5 px line on the edge: the
 * 16 px mark at (70, 655) and "I read and agree to the policies and terms"
 * (13, "read" and "agree" Medium, "policies" and "terms" blue) from x 96 on
 * baseline 668.
 *
 * Not agreed (`– 85`): the line is purple, the row white with a purple line,
 * the mark grey. Agreed (`– 86`): the line is black, the row `#FCFCFC` with
 * the grey line, the mark blue.
 */
function Terms({ t, agreed, onRead }: { t: T; agreed: boolean; onRead: () => void }) {
  const markEnd = 569.44 + 19.12;
  return (
    <section aria-label={t("Terms & Conditions")} className="flex flex-col shrink-0">
      <XdIcon name="termsPen" className="shrink-0" style={{ marginInlineStart: 24, marginTop: 569.44 - (472 + 80) }} />
      <Txt size={13} ml={24} mt={textTop(610, 13) - markEnd}>
        {t("Terms & Conditions")}
      </Txt>
      <Txt
        size={11}
        color={agreed ? C.ink : C.purple}
        ml={24}
        mt={textTop(632, 11) - textBottom(610, 13)}
        className="truncate"
        style={{ width: fill(24) }}
        data-pw="demo-checkout-terms-line"
      >
        <Rich
          text={
            agreed
              ? t("You read and agreed to the <m>policies</m> and <m>terms</m>")
              : t("Read and agree to the <m>policies</m> and <m>terms</m>")
          }
        />
      </Txt>
      <button
        type="button"
        data-pw="demo-checkout-agree"
        aria-pressed={agreed}
        onClick={onRead}
        className="block shrink-0 p-0 text-start cursor-pointer active:opacity-80 [-webkit-tap-highlight-color:transparent]"
        style={{ marginTop: 643 - textBottom(632, 11), marginInlineStart: 12, width: fill(12) }}
      >
        <Box
          w="100%"
          h={40}
          radius={15}
          fill={agreed ? C.card : C.white}
          stroke={agreed ? C.line : C.purple}
          strokeAlign="center"
          // At the file's x on a screen as wide as the file (430 px) or wider.
          // On a narrower one the words do not fit from x 96, so the mark and
          // the words are centred in the row.
          className="flex items-start ps-[58px] pe-3 max-[429.98px]:justify-center max-[429.98px]:ps-3"
        >
          <XdIcon name={agreed ? "agreeOn" : "agreeOff"} className="shrink-0" style={{ marginTop: 655 - 643 }} />
          <Txt size={13} ml={96 - (70 + 16)} mt={textTop(668, 13) - 643} className="min-w-0 truncate">
            <Rich text={t("I <m>read</m> and <m>agree</m> to the <a>policies</a> and <a>terms</a>")} />
          </Txt>
        </Box>
      </button>
    </section>
  );
}

/** The warning in the wallet card (`– 83`): 11, two lines on baselines 569 and 587, centred in a 366 px box. */
const SHORT = { baseline: 569, size: 11, lineHeight: 587 - 569 } as const;

/**
 * The wallet card, `– 80` and `– 83`: a card at y 472, `#FCFCFC`, round 15,
 * with the 20 px wallet at (24, 480), "trydos Balance" (13, "try" Bold,
 * baseline 521) and the balance (11, the amount Medium, baseline 541).
 *
 * `– 80` (the balance covers the bag): 406 x 80, the grey 0.5 px line.
 * `– 83` (it does not): 406 x 231, an orange 0.5 px line, and the grey box
 * (382 x 145 at (24, 550), round 15) with the warning and two dark buttons,
 * 364 x 40, at y 603 and 647.
 *
 * A balance of null is not known yet: the line says "Soon available" in its
 * place (S7d-3), and the card is `– 80`.
 */
export function WalletPayCard({
  t,
  body,
  wallet,
  onTopUp,
  onOther,
  mt = 472 - textBottom(461, 11),
  line = true,
}: {
  t: T;
  body: T;
  wallet: { balance: string | null; currency: string; covered: boolean };
  onTopUp: () => void;
  onOther: () => void;
  mt?: number;
  /** The 0.5 px line; the purchase done (`– 103`) draws none. */
  line?: boolean;
}) {
  const covered = wallet.balance === null || wallet.covered;
  const shortTop = paraTop(SHORT.baseline, SHORT.size, SHORT.lineHeight);
  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={80}
      radius={15}
      fill={C.card}
      stroke={!line ? undefined : covered ? C.line : C.lowBalance}
      className="flex flex-col"
      // `– 83`: as tall as its content, 8 under the grey box (231 on a 430 px screen), so a longer warning never spills out.
      style={covered ? undefined : { height: "auto", paddingBottom: 703 - 695 }}
      data-pw="demo-checkout-wallet"
    >
      <XdIcon name="payWalletSmall" className="shrink-0" style={{ marginInlineStart: 24.04 - 12, marginTop: 480 - 472 }} />
      <Txt size={13} ml={24 - 12} mt={textTop(521, 13) - (480 + 20)}>
        {/* The brand's mark, as the file draws it: not a word to translate. */}
        <span className="font-bold">{BRAND[0]}</span>
        {`${BRAND[1]} ${t("Balance")}`}
      </Txt>
      <Txt size={11} ml={24 - 12} mt={textTop(541, 11) - textBottom(521, 13)} data-pw="demo-checkout-wallet-balance">
        {wallet.balance === null ? (
          <Rich text={t("your balance <m>{amount}</m> {currency}")} values={{ amount: t("Soon available"), currency: "" }} />
        ) : (
          <Rich text={t("your balance <m>{amount}</m> {currency}")} values={{ amount: wallet.balance, currency: wallet.currency }} />
        )}
      </Txt>
      {!covered && (
        <Box
          mt={550 - textBottom(541, 11)}
          ml={24 - 12}
          w="calc(100% - 24px)"
          h={695 - 550}
          radius={15}
          fill={CHIP_GREY}
          className="flex flex-col items-center"
          // As tall as its content, 8 under the last button (145 on a 430 px screen).
          style={{ height: "auto", paddingBottom: 695 - (647 + 40) }}
          data-pw="demo-checkout-wallet-short"
        >
          <p
            className="shrink-0 text-center font-normal"
            style={{
              marginTop: shortTop - 550,
              width: "calc(100% - 16px)",
              fontSize: SHORT.size,
              lineHeight: `${SHORT.lineHeight}px`,
              color: C.ink,
            }}
          >
            <FileBreak
              text={body("{brand} Balance is insufficient to pay for the order Please <m>top up</m> or\nuse other <m>payment methods & Solutions</m>")}
              // The brand's mark, as the file draws it: "try" Bold, not a word to translate.
              values={{ brand: `<b>${BRAND[0]}</b>${BRAND[1]}` }}
            />
          </p>
          <DarkButton mt={603 - (shortTop + 2 * SHORT.lineHeight)} testId="demo-checkout-top-up" onClick={onTopUp} label={t("top up | Cash in")} />
          <DarkButton mt={647 - (603 + 40)} testId="demo-checkout-other" onClick={onOther} label={t("Other Solutions")} />
        </Box>
      )}
    </Box>
  );
}

/**
 * A line with the file's own line break, a "\n" in the key (the English
 * warning of `– 83` breaks after "or"). The break holds on a screen as wide
 * as the file (430 px) or wider. On a narrower screen it is gone, and the
 * words wrap where they fit, so no short line is left alone. A translation
 * has no break of its own and always wraps where its words fit.
 */
function FileBreak({ text, values }: { text: string; values?: Record<string, string | number> }) {
  const [first, ...rest] = text.split("\n");
  if (!rest.length) return <Rich text={text} values={values} />;
  return (
    <>
      <Rich text={first} values={values} />{" "}
      <br className="max-[429.98px]:hidden" />
      <Rich text={rest.join(" ")} values={values} />
    </>
  );
}

/** A dark button in the wallet card (`– 83`): 364 x 40, round 15, 9 px from the grey box's sides; its 13 px words on baseline +25, centred. */
function DarkButton({ mt, testId, onClick, label }: { mt: number; testId: string; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      data-pw={testId}
      onClick={onClick}
      className="flex justify-center shrink-0 cursor-pointer active:opacity-80 [-webkit-tap-highlight-color:transparent] font-normal whitespace-nowrap"
      style={{
        marginTop: mt,
        width: "calc(100% - 18px)",
        height: 40,
        paddingTop: textTop(628, 13) - 603,
        borderRadius: 15,
        background: C.ink,
        color: C.white,
        fontSize: 13,
        lineHeight: `${lineBox(13)}px`,
      }}
    >
      {label}
    </button>
  );
}

/**
 * A section's head: its marks (20 px tall), the title (13) with the grey help
 * mark 6 px after it, and the 11 px line on the baseline 20 px under the
 * title's.
 */
function SectionHead({
  marks,
  marksMt,
  marksX,
  marksEnd,
  title,
  titleBaseline,
  helpX,
  helpLabel,
  line,
  lineColor,
  lineTestId,
}: {
  marks: React.ReactNode;
  /** From the block above to the marks' top. */
  marksMt: number;
  marksX: number;
  /** Design y of the marks' bottom edge. */
  marksEnd: number;
  title: string;
  titleBaseline: number;
  /** The help mark's x in the file. */
  helpX: number;
  helpLabel: string;
  line: string;
  lineColor: string;
  lineTestId: string;
}) {
  return (
    <>
      <div className="flex items-start" style={{ marginTop: marksMt, marginInlineStart: marksX }}>
        {marks}
      </div>
      <div className="flex items-start" style={{ marginTop: textTop(titleBaseline, 13) - marksEnd, marginInlineStart: 24 }}>
        {/* The help mark sits at the file's x: the title keeps that room, whatever width the browser gives the words. */}
        <h2 className="m-0 font-normal whitespace-nowrap" style={{ minWidth: helpX - 6 - 24, color: C.ink, ...LINE_13 }}>
          {title}
        </h2>
        <span role="img" aria-label={helpLabel} className="block shrink-0" style={{ marginInlineStart: 6 }}>
          <XdIcon name="cartHelpGrey" />
        </span>
      </div>
      <Txt
        size={11}
        color={lineColor}
        ml={24}
        mt={textTop(titleBaseline + 20, 11) - (textTop(titleBaseline, 13) + 16)}
        className="overflow-hidden text-ellipsis"
        data-pw={lineTestId}
      >
        {line}
      </Txt>
    </>
  );
}

/** The dashed box: `#FCFCFC`, a purple 0.5 px line dashed 3 3, round 15; the dark button 20 px in and 15 down. */
function ChooseBox({
  mt,
  boxTestId,
  testId,
  onClick,
  label,
}: {
  mt: number;
  boxTestId: string;
  testId: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={70}
      radius={15}
      fill={C.card}
      stroke={C.purple}
      strokeDash="3 3"
      strokeDashCap="round"
      className="flex flex-col"
      data-pw={boxTestId}
    >
      <button
        type="button"
        data-pw={testId}
        onClick={onClick}
        className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-80 [-webkit-tap-highlight-color:transparent] font-medium whitespace-nowrap"
        style={{
          marginTop: 299 - 284,
          marginInlineStart: 32 - 12,
          width: `calc(100% - ${2 * (32 - 12)}px)`,
          height: 40,
          borderRadius: 15,
          background: C.ink,
          color: C.white,
          ...LINE_13,
        }}
      >
        {label}
      </button>
    </Box>
  );
}

/**
 * The chosen pickup centre, `– 75`: a 406 x 96 card at y 284, `#FCFCFC` with
 * a grey 0.5 px line, round 15, the 16 px map at its top right (390, 292).
 * From x 24: "Pickup | Collect Point" (13, "Pickup" Medium, baseline 305),
 * the centre's place (13, baseline 329: "trydos Center | Jamiliya | Aleppo |
 * Syria", "try" Medium), who collects it (11, baseline 349), and "You will
 * collect your shipment yourself from center" (11 Medium, baseline 369).
 */
export function PickupCard({
  pickup,
  t,
  mt = 284 - textBottom(273, 11),
  line = true,
}: {
  pickup: PickupView;
  t: T;
  mt?: number;
  /** The grey 0.5 px line; the purchase done (`– 103`) draws none. */
  line?: boolean;
}) {
  // "Pickup | Collect Point": the method's name is Medium, the rest Regular.
  const [method, ...rest] = t("pickup | Collect Point").split(" | ");
  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={96}
      radius={15}
      fill={C.card}
      stroke={line ? C.line : undefined}
      className="flex flex-col"
      data-pw="demo-checkout-pickup"
    >
      <XdIcon name="payCardMap" className="absolute" style={{ insetInlineEnd: 418 - (390 + 16), top: 292.12 - 284 }} />
      <Txt size={13} ml={12} mt={textTop(305, 13) - 284} className="truncate" style={{ width: fill(12) }}>
        <span className="font-medium">{method}</span>
        {rest.length > 0 && ` | ${rest.join(" | ")}`}
      </Txt>
      <Txt size={13} ml={12} mt={textTop(329, 13) - textBottom(305, 13)} className="truncate" style={{ width: fill(12) }}>
        {/* The brand's mark, as the file draws it: not a word to translate. */}
        <span className="font-medium">{BRAND[0]}</span>
        {`${BRAND[1]} ${t("Center")} | ${pickup.place}`}
      </Txt>
      <Txt size={11} ml={12} mt={textTop(349, 11) - textBottom(329, 13)} className="truncate" style={{ width: fill(12) }}>
        {pickup.receiver}
      </Txt>
      <Txt size={11} weight="medium" ml={12} mt={textTop(369, 11) - textBottom(349, 11)} className="truncate" style={{ width: fill(12) }}>
        {t("You will Collect your shipment yourself from center")}
      </Txt>
    </Box>
  );
}

/**
 * The chosen address, `– 76`: a 406 x 76 card at y 284, `#FCFCFC` with a grey
 * 0.5 px line, round 15. From x 24: the title (13 Medium, baseline 305), the
 * place (13, baseline 329: the neighbourhood Regular, "province | country"
 * Medium, as "El Jamiliya | Aleppo | Syria") and the detail (11, baseline 349).
 * The purchase done (`– 103`) draws it with no line (`line`).
 */
export function AddressCard({
  address,
  mt = 284 - textBottom(273, 11),
  line = true,
}: {
  address: CheckoutAddress;
  mt?: number;
  line?: boolean;
}) {
  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={76}
      radius={15}
      fill={C.card}
      stroke={line ? C.line : undefined}
      className="flex flex-col"
      data-pw="demo-checkout-address"
    >
      <Txt size={13} weight="medium" ml={12} mt={textTop(305, 13) - 284} className="truncate" style={{ width: fill(12) }}>
        {address.title}
      </Txt>
      <Txt size={13} ml={12} mt={textTop(329, 13) - textBottom(305, 13)} className="truncate" style={{ width: fill(12) }}>
        {address.regular && `${address.regular} |`}
        <span className="font-medium">{`${address.regular ? " " : ""}${address.medium}`}</span>
      </Txt>
      <Txt size={11} ml={12} mt={textTop(349, 11) - textBottom(329, 13)} className="truncate" style={{ width: fill(12) }}>
        {address.detail}
      </Txt>
    </Box>
  );
}

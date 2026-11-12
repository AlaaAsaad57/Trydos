"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData } from "../../DemoApp/DemoData";
import { useDemoCase } from "../demoCase";
import { C, SAFE_BOTTOM, SHEET, fill, isFloatingBarSafari, textBottom, textTop } from "../demo1Layout";
import { InfoBanner, Sheet, WhyCard, WideButton, useScreenHeight } from "../ui";
import { useAddressForm } from "./AddressFormScreen";
import { AddressLines, DESIGN_TOP, EmptyAddresses, WHY_CARD_TOP_FROM_END } from "./AddressListScreen";
import { LINE_13, LINE_14 } from "./CartParts";
import { Rich } from "./ListingParts";

/**
 * The address sheet of the checkout, XD `Home Page – 70`: opened by
 * "Choose delivery Address" (`– 56`).
 *
 *  - The sheet from y 90, round 50, over the page dimmed to `#1D1D1D` at 90%.
 *  - "Your Address" (14, "Your" Regular, "Address" Medium) on baseline 136
 *    with the 18 px map at y 122, the pair centred.
 *  - The grey note at y 156, 48 tall, as on the profile's address screens.
 *  - The empty list, the "Why add a address?" card at y 699 and the dark
 *    "Add Shipping Address" button, 188 x 45 at (121, 851): the profile's
 *    `– 96` again, with a smaller button.
 *
 * The file has no board for the next steps; they reuse the profile's:
 *  - "Add Shipping Address" turns the sheet into the profile's address form
 *    (`– 94` to `– 99`: the map card, the four fields, "Add & save") under
 *    the same title and note. The saved address is the bag's address: the
 *    sheet closes on the checkout of `– 76`.
 *  - With addresses in the list, the sheet shows them as the profile's cards
 *    (`– 98`) without the edit and delete marks; a tap chooses one.
 */
export default function CartAddressSheet({
  open,
  onClose,
  onChosen,
}: {
  open: boolean;
  onClose: () => void;
  /** An address was chosen (or added): its id. */
  onChosen: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} y={90} radius={SHEET.radiusWallet} z={SHEET_Z} testId="demo-cart-address-sheet">
      <SheetBody onChosen={onChosen} />
    </Sheet>
  );
}

/**
 * Over the checkout's price panel (CartParts' PANEL_Z = layer z 40): the file
 * draws the sheet over it. The form's own pickers come over the sheet.
 */
const SHEET_Z = 50;
const PICKER_Z = 60;

/** The sheet's top, and where its handle ends (the line at y 101 .. 103). */
const SHEET_Y = 90;
const HANDLE_END = SHEET_Y + SHEET.handle.top + SHEET.handle.height - 1;

/** The note under the title: y 156, 48 tall. */
const NOTE_Y = 156;
const NOTE_END = NOTE_Y + 48;

/** The dark button: 188 x 45 at (121, 851), its words on baseline 879. */
const ADD = { y: 851, width: 188, height: 45, baseline: 879 } as const;

/**
 * The file's gap under the bottom buttons ("Add Shipping Address", and
 * "Add & save" at y 836 + 60): 36 px to the SCREEN's end, where the file has
 * the home bar. In iPhone Safari 26 the window ends above Safari's floating
 * bar, and the bar and the room under it already take about 97 px; the 36 px
 * then stood on top of that (seen on the client's iPhone). So there the
 * buttons and the "Why" card above them go down by the 36 px, to the
 * window's end. Everywhere else the window ends at the screen's end, and the
 * file's 36 px stay.
 */
const END_GAP = 932 - (ADD.y + ADD.height);

/** Room under a list or the form, so its end can scroll out from under the button. */
const listRoom = (gap: number) => ADD.height + gap + 12;
const formRoom = (gap: number) => 60 + gap + 12;

/** The list and the form trade places as the place sheet's steps do. */
const SWAP = { duration: 0.2 };

/** The sheet's content: built anew on every opening, so it always opens on the list. */
function SheetBody({ onChosen }: { onChosen: (id: string) => void }) {
  const { t, body } = useDemoCase();
  const { profile } = useDemoData();
  const [adding, setAdding] = useState(false);
  const [showWhy, setShowWhy] = useState(true);
  // The sheet is drawn in the browser only (a layer on <body>), so the agent can be read here.
  const [gap] = useState(() => (isFloatingBarSafari(navigator.userAgent) ? 0 : END_GAP));
  const drop = END_GAP - gap;
  const height = useScreenHeight();
  const form = useAddressForm({
    editingId: null,
    onSaved: (address) => onChosen(address.id),
    sheetZ: PICKER_Z,
  });
  const list = profile.addresses;

  return (
    <>
      {/* The title and its map, side by side, centred (the file draws them at x 160.5 .. 270). */}
      <h2
        className="flex items-start self-center shrink-0 font-normal whitespace-nowrap"
        style={{ marginTop: textTop(136, 14) - HANDLE_END, color: C.ink, ...LINE_14 }}
      >
        <Rich text={t("Your <m>Address</m>")} />
        <XdIcon name="titleAddress" className="shrink-0" style={{ marginLeft: TITLE_GAP, marginTop: 122 - textTop(136, 14) }} />
      </h2>
      <div className="shrink-0" style={{ marginTop: NOTE_Y - textBottom(136, 14) }}>
        <InfoBanner t={body} />
      </div>

      {/* Under the note: the list or the form, with the button over its end. */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence mode="wait" initial={false}>
          {adding ? (
            <motion.div
              key="form"
              data-pw="demo-cart-address-form"
              className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
              style={{ paddingBottom: formRoom(gap), scrollbarWidth: "none" }}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={SWAP}
            >
              {form.fields}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
              style={{ paddingBottom: list.length > 0 ? listRoom(gap) : 0, scrollbarWidth: "none" }}
              exit={{ x: -40, opacity: 0 }}
              transition={SWAP}
            >
              {list.length === 0 ? (
                <EmptyAddresses
                  from={NOTE_END}
                  // From the note's end down to the "Why" card's top, in this window.
                  room={height === undefined ? undefined : height - (WHY_CARD_TOP_FROM_END - drop) - (NOTE_END - DESIGN_TOP)}
                  t={t}
                  body={body}
                />
              ) : (
                list.map((address, i) => (
                  <motion.button
                    key={address.id}
                    type="button"
                    data-pw={`demo-cart-address-${i}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChosen(address.id)}
                    className="flex items-start shrink-0 cursor-pointer text-left"
                    style={{
                      marginTop: i === 0 ? 12 : 4,
                      marginLeft: 12,
                      width: fill(12),
                      height: 79,
                      borderRadius: 15,
                      background: C.card,
                    }}
                  >
                    <AddressLines address={address} color={C.ink} />
                  </motion.button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 700 .. 824 in the file (drawn there; the dump says 699): 108 above the screen's end, as on the profile. */}
        <AnimatePresence>
          {!adding && list.length === 0 && showWhy && (
            <WhyCard key="why" bottom={932 - 824 - drop} t={t} body={body} onClose={() => setShowWhy(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!adding && (
            <motion.button
              key="add"
              type="button"
              data-pw="demo-cart-address-add"
              onClick={() => setAdding(true)}
              initial={false}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              whileTap={{ scale: 0.98 }}
              className="absolute flex justify-center font-normal whitespace-nowrap cursor-pointer [-webkit-tap-highlight-color:transparent]"
              style={{
                // Centred, 188 wide, or wider for longer words.
                left: 0,
                right: 0,
                marginInline: "auto",
                width: "fit-content",
                bottom: `calc(${gap}px + ${SAFE_BOTTOM})`,
                minWidth: ADD.width,
                height: ADD.height,
                paddingTop: textTop(ADD.baseline, 13) - ADD.y,
                // Room at the sides only for words longer than the file's.
                paddingLeft: 20,
                paddingRight: 20,
                // XD stops a corner at half the short side: the file's 30 draws 22.5.
                borderRadius: `${ADD.height / 2}px ${ADD.height / 2}px 14px 14px`,
                background: C.ink,
                color: C.white,
                zIndex: 5,
                ...LINE_13,
              }}
            >
              {t("Add Shipping Address")}
            </motion.button>
          )}
        </AnimatePresence>

        <WideButton testId="demo-cart-address-save" label={t("Add & save")} bottom={gap} visible={adding && form.complete} onClick={form.save} />
        {form.sheets}
      </div>
    </>
  );
}

/** From the end of "Your Address" to the map's box (its ink starts 1.5 in): ink 245 to 252.5 in the file. */
const TITLE_GAP = 6;

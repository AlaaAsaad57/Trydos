"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../Demo1Shell";
import { useDemoData, type DemoAddress } from "../../DemoApp/DemoData";
import { countryOf } from "../../DemoApp/demoPlaces";
import { C, fill, gapTo, textBottom, top } from "../demo1Layout";
import {
  Icon,
  InfoBanner,
  Layer,
  ScreenHeader,
  ScreenPage,
  Stroke,
  Txt,
  WhyCard,
  WideButton,
} from "../ui";

/**
 * Address — XD `Home Page – 96` (empty), `– 98` (the list) and `– 100` (the
 * delete question).
 *
 * Empty: the grey help mark and two grey lines centred at y 432 .. 492, the
 * "Why add a address?" card at y 700 (it closes), and the dark
 * "Add Shipping Address" button (`#404040`).
 *
 * The list: 406 x 79 cards from y 160 (12 under the banner), 4 px apart,
 * `#FCFCFC`. Title 12 Medium, a 15 px map mark 12 px after it; the area line
 * (12, the last three parts Medium); the detail line; edit and delete marks at
 * the top right.
 *
 * Delete: the whole screen dims to `#1D1D1D` at 90%, the big white bin at
 * (190, 380), "Delete below address ?", the card again drawn in white lines,
 * a white X top right, and a white "Sure, Delete" button.
 *
 * On /demo1 the cards keep 12 px to both edges of the screen (fluid, 406 on a
 * 430 px phone), and the edit and delete marks keep their distance to the
 * card's right edge. The card and the button are pinned to the bottom of
 * the screen in the page's footer. The delete question is a layer on <body>
 * over the whole screen (`Layer`).
 */
export default function AddressListScreen() {
  const { t, back, navigate } = useDemoNav();
  const { profile, update } = useDemoData();
  const [showWhy, setShowWhy] = useState(true);
  const [deleting, setDeleting] = useState<DemoAddress | null>(null);
  const list = profile.addresses;

  const open = (id: string | null) => {
    update({ editingAddress: id });
    navigate("settings/profile/address/new");
  };

  return (
    <ScreenPage
      testId="demo-address-list"
      contentHeight={Math.max(932, 160 + list.length * 83 + 120)}
      header={
        <ScreenHeader
          crumb={["Profile", "Address"]}
          nudge={1}
          icon="titleAddress"
          onBack={back}
          t={t}
        />
      }
      footer={
        <>
          {/* 700 .. 824 in the file, 12 above the button. The delete
              question below is a layer on <body>; it only lives here. */}
          <AnimatePresence>
            {list.length === 0 && showWhy && (
              <WhyCard
                key="why"
                bottom={108}
                t={t}
                onClose={() => setShowWhy(false)}
              />
            )}
          </AnimatePresence>
          <WideButton
            testId="demo-address-add"
            label={t("Add Shipping Address")}
            fill={C.inkSoft}
            onClick={() => open(null)}
          />
          <DeleteQuestion
            address={deleting}
            onClose={() => setDeleting(null)}
            onDelete={() => {
              update({ addresses: list.filter((a) => a.id !== deleting?.id) });
              setDeleting(null);
            }}
          />
        </>
      }
    >
      <InfoBanner t={t} />

      <AnimatePresence initial={false}>
        {list.map((address, i) => (
          <motion.div
            key={address.id}
            layout
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60, transition: { duration: 0.25 } }}
            className="flex items-start shrink-0"
            style={{
              marginTop: i === 0 ? 12 : 4,
              marginLeft: 12,
              width: fill(12),
              height: 79,
              borderRadius: 15,
              background: C.card,
            }}
            data-pw={`demo-address-${i}`}
          >
            <AddressLines address={address} color={C.ink} />
            {/* The marks at (356, 172) and (383, 172), each in a 31 px target
                4 px down. The lines run under them to 12 px from the card's
                right edge (394 of 406), so the targets step back over the
                lines' end. The delete target ends 4 px from the right edge
                on every screen width. */}
            <button
              type="button"
              aria-label={t("Edit")}
              onClick={() => open(address.id)}
              className="shrink-0 cursor-pointer active:opacity-60"
              style={{
                marginTop: 4,
                marginLeft: 344 - 394,
                width: 31,
                height: 31,
                padding: 8,
              }}
            >
              <XdIcon name="edit" />
            </button>
            <button
              type="button"
              aria-label={t("Delete")}
              data-pw={`demo-address-delete-${i}`}
              onClick={() => setDeleting(address)}
              className="shrink-0 cursor-pointer active:opacity-60"
              style={{
                marginTop: 4,
                marginLeft: 371 - (344 + 31),
                width: 31,
                height: 31,
                padding: 8,
              }}
            >
              <XdIcon name="trash" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {list.length === 0 && (
          <motion.div
            key="empty"
            className="flex flex-col shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* The 19 px mark at y 432.5, centred; the lines on 472 and 492. */}
            <Icon
              name="helpBig"
              mt={432.5 - 148}
              style={{ alignSelf: "center" }}
            />
            {/* The file puts this line 2.67 px left of centre (x 135). XD shows
                the gaps as 7 and 5 from its own text boxes; placed by baseline
                they are 7.5 and 6 here, the same pixels. */}
            <Txt
              center
              nudge={-2.67}
              mt={gapTo(451.5, 472, 13)}
              size={13}
              weight="medium"
              color={C.hint}
            >
              {t("Your address list is empty")}
            </Txt>
            <Txt
              center
              mt={gapTo(textBottom(472, 13), 492, 11)}
              size={11}
              color={C.hint}
            >
              {t("You can also create multiple addresses to use")}
            </Txt>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenPage>
  );
}

/**
 * Title with its map mark, the area line and the detail line — the card and
 * the delete question share it. In the card: the title row (15 tall) 12 px
 * down, the lines on baselines +45 and +64, all 12 px in and 12 px from the
 * card's right edge (382 wide in a 406 card).
 */
export function AddressLines({
  address,
  color,
  mark = true,
}: {
  address: DemoAddress;
  color: string;
  mark?: boolean;
}) {
  const { t } = useDemoNav();
  const country = t(countryOf(address.country).name);
  // Street and town Regular, the rest Medium — "Cendere | Ayazağa | Sariyer | İstanbul | Turkiye".
  const [street, town, district, province] = address.area;
  return (
    <div
      className="flex flex-col shrink-0"
      style={{ marginLeft: 12, width: fill(12) }}
    >
      <span
        className="flex items-center shrink-0"
        style={{ marginTop: 12, height: 15 }}
      >
        <span
          className="font-medium whitespace-nowrap"
          style={{ fontSize: 12, color }}
        >
          {address.title}
        </span>
        {mark && <Icon name="mapTiny" ml={12} />}
      </span>
      <Txt
        mt={gapTo(12 + 15, 45, 12)}
        size={12}
        color={color}
        className="truncate"
        style={{ width: "100%" }}
      >
        {`${street} | ${town} | `}
        <span className="font-medium">{`${district} | ${province} | ${country}`}</span>
      </Txt>
      <Txt
        mt={gapTo(textBottom(45, 12), 64, 12)}
        size={12}
        color={color}
        className="truncate"
        style={{ width: "100%" }}
      >
        {address.detail}
      </Txt>
    </div>
  );
}

/**
 * The delete question, over the whole screen: the white X at (384.5, 59.7) in
 * a 36 px target, the 50 px bin centred at y 380, the question on baseline
 * 456, and the card again in white lines at y 472.
 *
 * A layer on <body> (`Layer`), so it stays over the screen while the page
 * under it is held still. The dimmed colour covers the whole window, like a
 * sheet's; the question itself is in the page's column.
 */
function DeleteQuestion({
  address,
  onClose,
  onDelete,
}: {
  address: DemoAddress | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t } = useDemoNav();
  return (
    <AnimatePresence>
      {address && (
        <Layer key="delete" testId="demo-address-delete">
          <motion.div
            className="fixed inset-0"
            style={{ background: C.backdrop }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className="absolute inset-0 flex flex-col"
            // The column starts at design y 50, the top of the app.
            style={{ paddingTop: top(50) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              aria-label={t("Close")}
              onClick={onClose}
              className="shrink-0 self-end cursor-pointer"
              style={{
                marginTop: 59.7 - 10 - 50,
                marginRight: 430 - (384.5 - 10 + 36),
                width: 36,
                height: 36,
                padding: 10,
              }}
            >
              <XdIcon name="closeWhite" />
            </button>
            <motion.div
              className="flex flex-col shrink-0"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Icon
                name="trashBig"
                mt={380 - (59.7 - 10 + 36)}
                style={{ alignSelf: "center" }}
              />
              <Txt center mt={gapTo(430, 456, 14)} size={14} color={C.white}>
                {t("Delete below address ?")}
              </Txt>
              <div
                className="relative flex shrink-0"
                style={{
                  marginTop: 472 - textBottom(456, 14),
                  marginLeft: 12,
                  width: fill(12),
                  height: 79,
                  borderRadius: 15,
                }}
              >
                {/* The same lines as the card, in white; the file drops the map mark here. */}
                <AddressLines address={address} color={C.white} mark={false} />
                <Stroke color={C.white} radius={15} />
              </div>
            </motion.div>
            <WideButton
              testId="demo-address-delete-confirm"
              label={t("Sure, Delete")}
              fill={C.card}
              color={C.ink}
              weight="medium"
              onClick={onDelete}
            />
          </motion.div>
        </Layer>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useAppStore } from "store";
import order from "services/order";
import { getLocalizedCountryName } from "utils/countryData";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { useDemoNav } from "../screenNav";
import { usePageDir } from "../rtl";
import { useProfileData, type ProfileAddress } from "../useProfileData";
import { PlaceParts } from "../placeParts";
import { C, WINDOW_COVER, fill, gapTo, textBottom, top } from "../demo1Layout";
import {
  DIMMED,
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
 * Real data (Stage 4): the shopper's saved addresses (services/order, the
 * same list checkout uses). Edit opens the form on the address, the way the
 * old list did (`startUpdateAddress`); "Add" opens it empty. "Sure, Delete"
 * does what checkout's delete does: `address_deleted`, the delete call, and
 * the address out of the store. The default address is the backend's
 * `is_default`, used as it is; the screen adds no control for it (D-29).
 *
 * On /demo the cards keep 12 px to both edges of the screen (fluid, 406 on a
 * 430 px phone), and the edit and delete marks keep their distance to the
 * card's end edge. The card and the button are pinned to the bottom of
 * the screen in the page's footer. The delete question is a layer on <body>
 * over the whole screen (`Layer`).
 */
export default function AddressListScreen() {
  const { t, back, navigate } = useDemoNav();
  const profile = useProfileData();
  // A card comes in from the end side and goes out to the start side.
  const side = usePageDir() === "rtl" ? -1 : 1;
  const [showWhy, setShowWhy] = useState(true);
  const [deleting, setDeleting] = useState<ProfileAddress | null>(null);
  const list = profile.addresses;
  // "Empty" only once the list has answered: before that it is not known yet.
  const empty = profile.addressesLoaded && list.length === 0;

  /** Opens the form: on an address to edit it, or empty for a new one. */
  const open = (address: ProfileAddress | null) => {
    const store = useAppStore.getState();
    if (address) store.startUpdateAddress(address.raw);
    else store.initAddressForm();
    navigate("settings/profile/address/new");
  };

  /** The same steps as checkout's delete (OrdersPage). */
  const remove = (address: ProfileAddress) => {
    trackOrder(ORDER_EVENTS.ADDRESS_DELETED, { address_id: address.id });
    void order.DeleteAddressList({ address: address.id });
    useAppStore.getState().deleteAddress(address.id);
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
            {empty && showWhy && (
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
              if (deleting) remove(deleting);
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
            initial={{ opacity: 0, x: 30 * side }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * side, transition: { duration: 0.25 } }}
            className="flex items-start shrink-0"
            style={{
              marginTop: i === 0 ? 12 : 4,
              marginInlineStart: 12,
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
                end edge (394 of 406), so the targets step back over the
                lines' end. The delete target ends 4 px from the end edge
                on every screen width. */}
            <button
              type="button"
              aria-label={t("Edit")}
              onClick={() => open(address)}
              className="shrink-0 cursor-pointer active:opacity-60"
              style={{
                marginTop: 4,
                marginInlineStart: 344 - 394,
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
                marginInlineStart: 371 - (344 + 31),
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
        {empty && (
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
 * card's end edge (382 wide in a 406 card).
 */
export function AddressLines({
  address,
  color,
  mark = true,
}: {
  address: ProfileAddress;
  color: string;
  mark?: boolean;
}) {
  const { locale } = useDemoNav();
  // The country in the page's language; the backend's name when it has no code.
  const country =
    (address.countryIso &&
      getLocalizedCountryName(address.countryIso, locale.split("-")[1])) ||
    address.country;
  // Street and town Regular, the rest Medium — "Cendere | Ayazağa | Sariyer |
  // İstanbul | Turkiye". Only the parts the address has are written.
  const regular = address.area.slice(0, 2);
  const medium = [...address.area.slice(2), country].filter(Boolean);
  return (
    <div
      className="flex flex-col shrink-0"
      style={{ marginInlineStart: 12, width: fill(12) }}
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
        {regular.length > 0 && (
          <>
            <PlaceParts parts={regular} />
            {" | "}
          </>
        )}
        <span className="font-medium">
          <PlaceParts parts={medium} />
        </span>
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
  address: ProfileAddress | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t } = useDemoNav();
  return (
    <AnimatePresence>
      {address && (
        <Layer key="delete" testId="demo-address-delete" tint={DIMMED}>
          <motion.div
            style={{ ...WINDOW_COVER, background: C.backdrop }}
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
                marginInlineEnd: 430 - (384.5 - 10 + 36),
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
                  marginInlineStart: 12,
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

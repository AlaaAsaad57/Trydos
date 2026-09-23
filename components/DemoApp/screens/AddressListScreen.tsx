"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData, type DemoAddress } from "../DemoData";
import { countryOf } from "../demoPlaces";
import { C, headerTop, top } from "../demoLayout";
import {
  Icon,
  InfoBanner,
  ScreenHeader,
  ScreenPage,
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
 * The list: 406 x 79 cards from y 160, 4 px apart, `#FCFCFC`. Title 12 Medium,
 * a 15 px map mark 12 px after it; the area line (12, the last three parts
 * Medium); the detail line; edit and delete marks at the top right.
 *
 * Delete: the whole screen dims to `#1D1D1D` at 90%, the big white bin at
 * (190, 380), "Delete below address ?", the card again drawn in white lines,
 * a white X top right, and a white "Sure, Delete" button.
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
          icon="titleAddress"
          onBack={back}
          t={t}
        />
      }
      footer={
        <>
          {/* 700 .. 824 in the file, 12 above the button. */}
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
            className="absolute"
            style={{
              left: 12,
              top: 160 + i * 83,
              width: 406,
              height: 79,
              borderRadius: 15,
              background: C.card,
            }}
            data-pw={`demo-address-${i}`}
          >
            <AddressLines address={address} color={C.ink} />
            <button
              type="button"
              aria-label={t("Edit")}
              onClick={() => open(address.id)}
              className="absolute cursor-pointer active:opacity-60"
              style={{ left: 344, top: 4, width: 31, height: 31 }}
            >
              <XdIcon
                name="edit"
                style={{ position: "absolute", left: 8, top: 8 }}
              />
            </button>
            <button
              type="button"
              aria-label={t("Delete")}
              data-pw={`demo-address-delete-${i}`}
              onClick={() => setDeleting(address)}
              className="absolute cursor-pointer active:opacity-60"
              style={{ left: 371, top: 4, width: 31, height: 31 }}
            >
              <XdIcon
                name="trash"
                style={{ position: "absolute", left: 8, top: 8 }}
              />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {list.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Icon name="helpBig" x={205.5} y={432.5} />
            <Txt center baseline={472} size={13} weight="medium" color={C.hint}>
              {t("Your address list is empty")}
            </Txt>
            <Txt center baseline={492} size={11} color={C.hint}>
              {t("You can also create multiple addresses to use")}
            </Txt>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenPage>
  );
}

/** Title with its map mark, the area line and the detail line — the card and the delete question share it. */
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
    <>
      <span
        className="absolute flex items-center"
        style={{ left: 12, top: 184 - 12 - 160, height: 15 }}
      >
        <span
          className="font-medium whitespace-nowrap"
          style={{ fontSize: 12, color }}
        >
          {address.title}
        </span>
        {mark && <XdIcon name="mapTiny" style={{ marginLeft: 12 }} />}
      </span>
      <Txt
        x={12}
        baseline={205 - 160}
        size={12}
        color={color}
        width={382}
        className="truncate"
      >
        {`${street} | ${town} | `}
        <span className="font-medium">{`${district} | ${province} | ${country}`}</span>
      </Txt>
      <Txt
        x={12}
        baseline={224 - 160}
        size={12}
        color={color}
        width={382}
        className="truncate"
      >
        {address.detail}
      </Txt>
    </>
  );
}

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
        <motion.div
          key="delete"
          data-pw="demo-address-delete"
          className="absolute inset-0 z-30 font-quicksand"
          style={{ background: C.backdrop }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label={t("Close")}
            onClick={onClose}
            className="absolute cursor-pointer"
            style={{
              left: 384.5 - 10,
              top: headerTop(59.7 - 10),
              width: 36,
              height: 36,
            }}
          >
            <XdIcon
              name="closeWhite"
              style={{ position: "absolute", left: 10, top: 10 }}
            />
          </button>
          <motion.div
            className="absolute left-0 w-full"
            style={{ top: top(0), height: 932 }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Icon name="trashBig" x={190} y={380} />
            <Txt center baseline={456} size={14} color={C.white}>
              {t("Delete below address ?")}
            </Txt>
            <div
              className="absolute"
              style={{
                left: 12,
                top: 472,
                width: 406,
                height: 79,
                borderRadius: 15,
                boxShadow: "inset 0 0 0 0.5px #FFFFFF",
              }}
            >
              {/* The same lines as the card, in white; the file drops the map mark here. */}
              <AddressLines address={address} color={C.white} mark={false} />
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
      )}
    </AnimatePresence>
  );
}

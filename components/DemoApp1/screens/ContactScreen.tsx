"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { CHAT, CHAT_PHOTOS, CONTACT } from "../../DemoApp/demoChat";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  ROW,
  SF_ROUNDED,
  STATUS_BAR,
  fill,
  lineBox,
  sfTop,
  textBottom,
  textTop,
} from "../demo1Layout";
import { ScreenPage, Stroke, Txt } from "../ui";

/**
 * A contact — XD `Home Page – 45`. A white page with no header strip:
 *
 *   - the blue chevron (3 px line, 8 x 20 at 20, 65) scrolls with the page;
 *   - the photo 131 x 150, radius 30, 1 px purple line, centred at y 102;
 *   - the name 16 Medium on baseline 280 and the number 16 Regular on 304,
 *     both centred;
 *   - Call, Video and Search: 26 px icons at y 358 in three 133 px columns
 *     from x 16.5, their words 13 Medium on baseline 405;
 *   - three 406 x 60 rows (`#FCFCFC`, radius 15) from y 458, 2 px apart: an
 *     18 px icon at x 24, the words 14 Regular at x 54 on baseline 35, and
 *     "ALWAYS" ending 6 px before the row's right edge;
 *   - "Enable Call" and "Desible Call" (the file's spelling), SF Pro Rounded
 *     12 on baselines 670 and 686, ending at x 408;
 *   - Delete Chat (x 79), Block (x 240) and Share, SF Pro Rounded 12 on
 *     baseline 814 with 25 px icons at y 768; UnBlock under Block, its grey
 *     icon at y 829 and its word on baseline 875.
 *
 * The file stacks both states of the call switch and of block / unblock;
 * the demo draws them as the file does.
 */
export default function ContactScreen() {
  const { t, navigate, back } = useDemoNav();
  const actionsTop = 358;
  const labelTop = textTop(405, 13);
  return (
    <ScreenPage testId="demo-contact" scrollTop={STATUS_BAR}>
      <button
        type="button"
        data-pw="demo-back"
        aria-label={t("Back")}
        onClick={back}
        className="flex self-start shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 18.5, marginTop: 63.5 - 50 }}
      >
        <XdIcon name="contactBackBlue" />
      </button>

      <div
        data-pw="demo-contact-photo"
        className="relative shrink-0 self-center overflow-hidden"
        style={{
          marginTop: 102 - (63.5 + 23),
          width: 131,
          height: 150,
          borderRadius: 30,
        }}
      >
        <img
          src={CHAT_PHOTOS.contact}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <Stroke color={C.purple} width={1} radius={30} />
      </div>
      <Txt center size={16} weight="medium" mt={textTop(280, 16) - 252}>
        {CONTACT.name}
      </Txt>
      <Txt center size={16} mt={textTop(304, 16) - textBottom(280, 16)}>
        {CONTACT.phone}
      </Txt>

      <div
        className="flex items-start shrink-0"
        style={{
          marginLeft: 16.5,
          width: fill(16.5, 14.5),
          marginTop: actionsTop - textBottom(304, 16),
        }}
      >
        <Action icon="chatHeaderCall" label="Call" onClick={() => navigate("chat/call")} labelTop={labelTop - actionsTop} t={t} />
        <Action icon="chatHeaderVideo" label="Video" onClick={() => navigate("chat/call")} labelTop={labelTop - actionsTop} t={t} />
        <Action icon="contactSearch" label="Search" labelTop={labelTop - actionsTop} t={t} />
      </div>

      <Row icon="rowMedia" label="Media & Files" mt={458 - (labelTop + lineBox(13))} t={t} />
      <Row icon="rowGallery" label="Save To Gallery" value="ALWAYS" mt={2} t={t} />
      <Row icon="rowGallery" label="Notification" value="ALWAYS" mt={2} t={t} />

      {/* Two SF Pro Rounded 12 lines, 17 px apart, ending 22 px before the right edge. */}
      <div
        className="flex flex-col items-end shrink-0"
        style={{ marginTop: sfTop(670, 12, 17) - 642, marginRight: 430 - 408 }}
      >
        <SfLine label="Enable Call" testId="demo-contact-enable-call" t={t} />
        <SfLine label="Desible Call" testId="demo-contact-disable-call" t={t} />
      </div>

      <div
        className="flex items-start shrink-0"
        style={{ marginTop: 768 - (sfTop(670, 12, 17) + 34) }}
      >
        <BottomAction
          icon="deleteChat"
          label="Delete Chat"
          color={CHAT.greyText}
          ml={61}
          width={125 - 61}
          iconLeft={79 - 61}
          t={t}
        />
        <div className="flex flex-col items-center shrink-0" style={{ marginLeft: 238 - 125, width: 268 - 238 }}>
          <BottomAction icon="blockRed" label="Block" color={C.red} ml={0} width={30} iconLeft={2} t={t} />
          <BottomAction
            icon="blockGrey"
            label="UnBlock"
            color={C.red}
            ml={0}
            width={30}
            iconLeft={2}
            mt={829 - (sfTop(814, 12, 17) + 17)}
            t={t}
          />
        </div>
        <SfLine
          label="Share"
          testId="demo-contact-share"
          style={{ marginLeft: 339 - 268, marginTop: sfTop(814, 12, 17) - 768 }}
          t={t}
        />
      </div>
      <div className="shrink-0" style={{ height: 60 }} />
    </ScreenPage>
  );
}

/** One of the three columns: the icon centred, its word 13 Medium centred under it. */
function Action({
  icon,
  label,
  onClick,
  labelTop,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  onClick?: () => void;
  labelTop: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={`demo-contact-${label.toLowerCase()}`}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center cursor-pointer"
      style={{ flex: "1 1 0", minWidth: 0 }}
    >
      <XdIcon name={icon} />
      <Txt
        size={13}
        weight="medium"
        mt={labelTop - 26}
        style={{ letterSpacing: "0.01em" }}
      >
        {t(label)}
      </Txt>
    </motion.button>
  );
}

/** A 406 x 60 row: the 18 px icon 12 px in, the words at x 54, a value ending 6 px before the right edge. */
function Row({
  icon,
  label,
  value,
  mt,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  value?: DemoKey;
  mt: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={`demo-contact-row-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      whileTap={{ scale: 0.985 }}
      className="flex items-start shrink-0 cursor-pointer text-left"
      style={{
        marginTop: mt,
        marginLeft: ROW.x,
        width: fill(ROW.x),
        height: 60,
        borderRadius: ROW.radius,
        background: C.card,
      }}
    >
      <XdIcon name={icon} style={{ marginLeft: 12, marginTop: 21 }} />
      <Txt size={14} ml={54 - 24 - 18} mt={textTop(35, 14)}>
        {t(label)}
      </Txt>
      {value && (
        <Txt size={14} className="ml-auto" mt={textTop(35, 14)} style={{ marginRight: 6 }}>
          {t(value)}
        </Txt>
      )}
    </motion.button>
  );
}

/** One SF Pro Rounded 12 line (17 px tall) with the file's 0.01 em spacing. */
function SfLine({
  label,
  color = C.ink,
  testId,
  style,
  t,
}: {
  label: DemoKey;
  color?: string;
  testId: string;
  style?: React.CSSProperties;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={testId}
      className="block shrink-0 whitespace-nowrap cursor-pointer active:opacity-60"
      style={{
        fontFamily: SF_ROUNDED,
        fontSize: 12,
        lineHeight: "17px",
        letterSpacing: "0.01em",
        color,
        ...style,
      }}
    >
      {t(label)}
    </button>
  );
}

/** A 25 px icon with its word under it, 8.5 px lower than the icon's bottom. */
function BottomAction({
  icon,
  label,
  color,
  ml,
  width,
  iconLeft,
  mt = 0,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  color: string;
  ml: number;
  width: number;
  iconLeft: number;
  mt?: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={`demo-contact-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      className="flex flex-col shrink-0 cursor-pointer active:opacity-60"
      style={{ marginLeft: ml, marginTop: mt, width }}
    >
      <XdIcon name={icon} style={{ marginLeft: iconLeft }} />
      <span
        className="block text-center whitespace-nowrap"
        style={{
          marginTop: sfTop(814, 12, 17) - (768 + 25),
          fontFamily: SF_ROUNDED,
          fontSize: 12,
          lineHeight: "17px",
          letterSpacing: "0.01em",
          color,
        }}
      >
        {t(label)}
      </span>
    </button>
  );
}

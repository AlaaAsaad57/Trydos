"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../Demo1Shell";
import { useDemoData } from "../../DemoApp/DemoData";
import { C, DESIGN_W, fill, gapTo, lineBox, textBottom } from "../demo1Layout";
import { Box, Icon, MenuRow, ScreenPage, Stroke, Txt } from "../ui";
import { XD_ICON_SIZE, type XdIconName } from "../../DemoApp/xdIcons";

/**
 * The profile tab — XD `Home Page – 9`, the one tall artboard (430 x 1129).
 *
 * The whole page scrolls, the wordmark with it; only the tab bar stays. Every
 * y below is the file's. The page opens:
 *   - the wordmark (23.5, 69.5) and the Web / lock switches on the right;
 *   - the client card 406 x 140 at (12, 124): QR, id, name, phone, address and
 *     the photo box with its dark "Add photo" strip;
 *   - three 406 x 108 cards that scroll sideways at y 268, 4 px apart, the
 *     second one peeking in at the right edge;
 *   - Orders and Trydos Wallet, 201 x 94, side by side at y 380;
 *   - the menu: eight 60 px rows, 18 px icons at x 24, text at x 54.
 *
 * Every block is spaced from the one above it by the file's own gap (see
 * MENU for the one row the file overlaps).
 *
 * On /demo the page is the document, and the widths are fluid: the cards
 * keep the file's 12 px to both edges of the screen, the switches keep their
 * distance to the right edge, and Orders and Wallet share their row. On a
 * 430 px screen every width is the file's.
 */

type Promo = {
  bg: string;
  button: string;
  /** Where the button's content starts, from the button's left edge (the file does not centre it). */
  contentX: number;
  /** The button's left edge in the card: 12 in the first, 13 in the other two. */
  buttonX: number;
  icon?: XdIconName;
  buttonIcon?: XdIconName;
  title: DemoKey;
  text: DemoKey;
  action: DemoKey;
};

const PROMOS: Promo[] = [
  {
    bg: "#FFF9F0",
    button: "#FFF2DE",
    contentX: 131,
    buttonX: 12,
    icon: "size",
    buttonIcon: "size",
    title: "Setup your size profile",
    text: "To get smart recommendations that fit you.",
    action: "Setup size now",
  },
  {
    bg: "#F0F6FD",
    button: "#E0EDFF",
    contentX: 143,
    buttonX: 13,
    icon: "verifiedDark",
    buttonIcon: "verifiedBlue",
    title: "Unverified account",
    text: "Tap verify, skip the line, and enjoy exclusive offers.",
    action: "Verify now",
  },
  {
    bg: "#F0FCFD",
    button: "#E0F7FF",
    contentX: 128,
    buttonX: 13,
    title: "Get trydos Business",
    text: "Tap verify, skip the line, and enjoy exclusive offers.",
    action: "Start Your Business now",
  },
];

/**
 * The menu rows, 60 tall, from y 486 (12 under Orders and Wallet), 4 px apart
 * — except "About Us", which the file puts 58 below "Legal Information": the
 * two overlap by 2 px, invisible on white, so its margin is -2.
 */
const MENU: { icon: XdIconName; label: DemoKey | "English"; mt: number }[] = [
  { icon: "menuSettings", label: "Settings", mt: 12 },
  { icon: "menuTerms", label: "Terms & Conditions", mt: 4 },
  { icon: "menuLegal", label: "Legal Information", mt: 4 },
  { icon: "menuAbout", label: "About Us", mt: -2 },
  { icon: "menuShare", label: "Share App", mt: 4 },
  { icon: "menuLanguage", label: "English", mt: 4 },
  { icon: "menuHistory", label: "Login history", mt: 4 },
  { icon: "menuLogout", label: "logout", mt: 4 },
];

/**
 * The language row names the language the app is in, in that language — the
 * file shows "English". A language's own name is never translated.
 */
const LANGUAGE_NAME: Record<string, string> = {
  en: "English",
  ar: "العربية",
  tr: "Türkçe",
  ku: "کوردی",
};

/** The top row: the wordmark at (23.49, 69.5), then Web and lock, 26 wide, at x 335.49 and 380.49. */
const SWITCHES = [
  { icon: "web", label: "Web", x: 335.49, textX: 338 },
  { icon: "lock", label: "lock", x: 380.49, textX: 382 },
] as const;

export default function ProfileScreen() {
  const { t, navigate, locale } = useDemoNav();
  const { profile } = useDemoData();
  const address = profile.addresses[0];

  const shareApp = () => {
    const data = { title: "Trydos", url: window.location.origin };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard?.writeText(data.url).catch(() => {});
  };

  return (
    <ScreenPage
      scrollTop={50}
      contentHeight={1129}
      testId="demo-profile"
      tabBar
    >
      {/* 69.5 .. 113.5: the wordmark (43 tall) and the two 44 px switches.
          The switches keep the file's 23.51 px to the right edge. */}
      <div className="flex items-start shrink-0" style={{ marginTop: 19.5 }}>
        <Icon name="wordmark" ml={23.49} />
        {SWITCHES.map((item, i) => (
          <motion.button
            key={item.label}
            type="button"
            whileTap={{ scale: 0.92 }}
            className="flex flex-col shrink-0 cursor-pointer text-left"
            style={{
              marginLeft: i === 0 ? "auto" : item.x - (SWITCHES[0].x + 26),
              marginRight:
                i === SWITCHES.length - 1 ? DESIGN_W - (item.x + 26) : 0,
              width: 26,
              height: 44,
            }}
          >
            <XdIcon name={item.icon} className="shrink-0" />
            {/* The 10 px label on baseline 109. */}
            <Txt
              ml={item.textX - item.x}
              mt={gapTo(69.5 + XD_ICON_SIZE[item.icon].h, 109, 10)}
              size={10}
            >
              {t(item.label)}
            </Txt>
          </motion.button>
        ))}
      </div>

      {/* The client card, 406 x 140 at (12, 124), 12 px from both edges.
          Tapping it opens the profile. */}
      <Box
        mt={124 - 113.5}
        ml={12}
        w={fill(12)}
        h={140}
        radius={15}
        fill={C.card}
        data-pw="demo-profile-card"
        className="flex items-start cursor-pointer"
        style={{ padding: "12px 12px 0" }}
        onClick={() => navigate("settings/profile")}
      >
        {/* min-w-0: on a narrow screen the text gives way to the photo box,
            and the address is cut with "…" before it reaches the box. */}
        <div className="flex flex-col min-w-0">
          <button
            type="button"
            aria-label={t("client ID")}
            data-pw="demo-profile-qr"
            onClick={(e) => {
              e.stopPropagation();
              navigate("settings/client-id");
            }}
            className="shrink-0 self-start cursor-pointer active:opacity-70"
            style={{ width: 50, height: 50 }}
          >
            <XdIcon name="qrBig" size={50} />
          </button>
          {/* The id on baseline 207, the name on 229. */}
          <Txt mt={gapTo(124 + 62, 207, 13)} size={13}>
            <span className="font-bold">{profile.clientId}</span> {t("ID")}
          </Txt>
          <Txt
            mt={gapTo(textBottom(207, 13), 229, 13)}
            size={13}
            color={profile.name ? C.ink : C.hint}
          >
            {profile.name || t("Enter Your Name !")}
          </Txt>
          {/* The phone and the address: 14 px marks at x 24 and 147, y 238,
              the 11 px text 6 after each mark, on baseline 249. The phone
              is a slot as wide as the step to the map mark. */}
          <div
            className="flex items-start shrink-0"
            style={{ marginTop: 238 - textBottom(229, 13) }}
          >
            <span
              className="flex items-start shrink-0"
              style={{ minWidth: 147 - 24 }}
            >
              <Icon name="phone" />
              <Txt ml={6} size={11}>
                {profile.phone}
              </Txt>
            </span>
            <Icon name="mapSmall" />
            <Txt
              ml={6}
              size={11}
              color={address ? C.ink : C.hint}
              className="min-w-0 overflow-hidden text-ellipsis"
              style={{ flexShrink: 1 }}
            >
              {address ? address.title : t("Enter Address !")}
            </Txt>
          </div>
        </div>

        {/* The photo box, 116 x 115 at (290, 136): 12 down, 12 in from the
            card's right edge. It opens the photo screen. */}
        <motion.button
          type="button"
          data-pw="demo-profile-photo"
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate("settings/photo");
          }}
          // Clipped only round a photo: with none, the dark strip (230 .. 252 in
          // the file) must show its own round corners 1 px below the box.
          className={`relative flex flex-col shrink-0 ml-auto cursor-pointer ${profile.photo ? "overflow-hidden" : ""}`}
          // 116 x 115 in the file, not a square; the dark strip at 230 ends 1 below it.
          style={{
            width: 116,
            height: 115,
            borderRadius: 15,
            background: C.card,
          }}
        >
          {/* First, so the photo and the dark strip are drawn over it. */}
          <Stroke color={C.hint} radius={15} />
          {profile.photo ? (
            <img
              src={profile.photo}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <Icon name="avatarSmall" ml={21} mt={13.75} />
              {/* 22 tall from 94: it covers the user's last 7.24 px, as
                  drawn. Relative, so it is drawn over the line. */}
              <span
                className="relative flex items-start shrink-0"
                style={{
                  marginTop: 94 - (13.75 + XD_ICON_SIZE.avatarSmall.h),
                  height: 22,
                  background: C.inkSoft,
                  borderRadius: "0 0 15px 15px",
                }}
              >
                <Icon name="addPhoto" ml={26} mt={5} />
                <Txt ml={43 - 26 - 13} mt={5} size={10} color={C.card}>
                  {t("Add photo")}
                </Txt>
              </span>
            </>
          )}
        </motion.button>
      </Box>

      {/* The three cards of the file's horizontal scroll group, as a slider. */}
      <PromoSlider
        onOpen={(promo) => {
          if (promo.icon === "size") navigate("settings/profile/body");
          else if (promo.icon === "verifiedDark")
            navigate("settings/profile/personal-info");
        }}
        t={t}
      />

      {/* Orders and Trydos Wallet, 201 x 94 at y 380, 4 apart. The two share
          the row, which keeps 12 px to both edges. */}
      <div
        className="flex shrink-0"
        style={{ marginTop: 4, marginLeft: 12, width: fill(12), gap: 4 }}
      >
        {(
          [
            {
              icon: "orders",
              title: "Orders",
              value: `${profile.orderActions} ${t("action")}`,
            },
            {
              icon: "wallet",
              title: "Trydos Wallet",
              value: `${profile.walletUsd} USD`,
            },
          ] as const
        ).map((card) => (
          <motion.button
            key={card.title}
            type="button"
            data-pw={`demo-profile-${card.icon}`}
            onClick={
              card.icon === "wallet"
                ? () => navigate("settings/wallet")
                : undefined
            }
            whileTap={{ scale: 0.98 }}
            className="flex flex-col cursor-pointer text-left"
            style={{
              flex: "1 1 0",
              minWidth: 0,
              height: 94,
              borderRadius: 15,
              background: C.card,
              padding: "12px 12px 0",
            }}
          >
            <Icon name={card.icon} />
            {/* Baselines 61 and 81 in the card. */}
            <Txt mt={gapTo(12 + 30, 61, 13)} size={13} weight="medium">
              {t(card.title)}
            </Txt>
            <Txt mt={gapTo(textBottom(61, 13), 81, 11)} size={11}>
              {card.value}
            </Txt>
          </motion.button>
        ))}
      </div>

      {MENU.map((row, i) => (
        <MenuRow
          key={row.label}
          mt={row.mt}
          icon={row.icon}
          iconSize={18}
          label={
            row.label === "English"
              ? (LANGUAGE_NAME[locale.split("-")[1]] ?? row.label)
              : t(row.label)
          }
          textX={54}
          testId={`demo-menu-${i}`}
          onClick={row.icon === "menuShare" ? shareApp : undefined}
        />
      ))}
    </ScreenPage>
  );
}

/** The space between two cards. */
const PROMO_GAP = 4;

/**
 * The file's "Scroll Group 88": three 406 x 108 cards at y 268 (4 under the
 * client card), 4 px apart, the first at x 12 and the next one peeking in at
 * the right edge.
 *
 * The shopper moves it by hand: swipe, and it snaps to the nearest card. The
 * design will later show one card at a time; three are shown for the demo.
 *
 * In a card: the 14 px mark at (12, 12), the title 11 Medium from x 32 on
 * baseline 23, the help mark (15 px) at (379.5, 11.5), the text on baseline
 * 43, and the 382 x 38 button at (12, 58).
 *
 * On /demo a card keeps 12 px to both edges of the screen (406 on a 430 px
 * screen), so the next card still peeks in by the file's 8 px. One step of a
 * swipe is a card and the gap, read from the slider's width.
 */
function PromoSlider({
  onOpen,
  t,
}: {
  onOpen: (promo: Promo) => void;
  t: (key: DemoKey) => string;
}) {
  const [index, setIndex] = useState(0);
  const dragged = useRef(false);
  const x = useMotionValue(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  // A card is the slider less 12 px on each side; one step is a card and the gap.
  const [step, setStep] = useState(DESIGN_W - 24 + PROMO_GAP);

  useLayoutEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const read = () => setStep(slider.clientWidth - 24 + PROMO_GAP);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(slider);
    return () => observer.disconnect();
  }, []);

  // Runs again when the screen changes width, so the card on show moves to
  // its new place.
  useEffect(() => {
    const controls = animate(x, -index * step, {
      type: "spring",
      stiffness: 260,
      damping: 32,
    });
    return () => controls.stop();
  }, [index, step, x]);

  return (
    <div
      ref={sliderRef}
      data-pw="demo-profile-slider"
      className="w-full shrink-0 overflow-hidden"
      style={{ marginTop: 4, height: 108 }}
    >
      <motion.div
        className="flex"
        // No padding here: a card's % width is of this track, which is as wide
        // as the slider. The first card's margin gives the 12 px instead.
        style={{ gap: PROMO_GAP, x, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: -(PROMOS.length - 1) * step, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          // Where the swipe left the track, pushed half a card on by a flick.
          const moved = -x.get() / step;
          const flick =
            info.velocity.x < -400 ? 0.5 : info.velocity.x > 400 ? -0.5 : 0;
          const next = Math.min(
            PROMOS.length - 1,
            Math.max(0, Math.round(moved + flick)),
          );
          setIndex(next);
          // The same frame's click must not open the card.
          setTimeout(() => (dragged.current = false), 0);
          // The spring runs even when the index did not change.
          animate(x, -next * step, {
            type: "spring",
            stiffness: 260,
            damping: 32,
          });
        }}
      >
        {PROMOS.map((promo, i) => (
          <div
            key={promo.title}
            className="flex flex-col shrink-0"
            style={{
              marginLeft: i === 0 ? 12 : 0,
              width: fill(12),
              height: 108,
              borderRadius: 15,
              background: promo.bg,
              paddingTop: 12,
            }}
          >
            <div
              className="flex items-start shrink-0"
              style={{ paddingLeft: 12 }}
            >
              {promo.icon && <Icon name={promo.icon} />}
              <Txt
                ml={32 - 12 - (promo.icon ? XD_ICON_SIZE[promo.icon].w : 0)}
                size={11}
                weight="medium"
              >
                {t(promo.title)}
              </Txt>
              {/* 0.5 px higher than the title and 1 px taller: the negative
                  margins keep the row the title's 14 px. It keeps the file's
                  11.5 px to the card's right edge. */}
              <Icon
                name="helpGrey"
                mt={-0.5}
                style={{
                  marginLeft: "auto",
                  marginRight: 406 - 394.5,
                  marginBottom: -0.5,
                }}
              />
            </div>
            <Txt ml={32} mt={gapTo(12 + 14, 43, 11)} size={11}>
              {t(promo.text)}
            </Txt>
            {/* 382 wide in a 406 card: the button keeps the file's gaps to
                both edges of the card. Its content keeps its distance from
                the button's centre (`contentX` on a 430 px screen). A
                padding's % is of the card, which is 24 px wider than the
                button. */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // A swipe that ends on the button is not a tap.
                if (!dragged.current) onOpen(promo);
              }}
              className="flex items-center shrink-0 cursor-pointer"
              style={{
                marginTop: 58 - textBottom(43, 11),
                marginLeft: promo.buttonX,
                width: fill(promo.buttonX, 406 - promo.buttonX - 382),
                height: 38,
                borderRadius: 15,
                background: promo.button,
                paddingLeft: `calc((100% - 24px) / 2 - ${382 / 2 - promo.contentX}px)`,
              }}
            >
              {promo.buttonIcon && (
                <XdIcon name={promo.buttonIcon} style={{ marginRight: 6 }} />
              )}
              <span
                className="font-medium"
                style={{
                  fontSize: 11,
                  lineHeight: `${lineBox(11)}px`,
                  color: C.ink,
                }}
              >
                {t(promo.action)}
              </span>
            </motion.button>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

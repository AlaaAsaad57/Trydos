"use client";

import type { DemoKey } from "../demoKeys";
import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData } from "../DemoData";
import { C } from "../demoLayout";
import { Box, Icon, MenuRow, ScreenPage, Txt } from "../ui";
import type { XdIconName } from "../xdIcons";

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
 * The rows step 64 px apart except "About Us", which the file puts 58 below
 * "Legal Information" (the two overlap by 2 px, invisible on white). The y
 * values are kept exactly as drawn.
 */

type Promo = {
  bg: string;
  button: string;
  /** Where the button's content starts, from the button's left edge (the file does not centre it). */
  contentX: number;
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
    title: "Get trydos Business",
    text: "Tap verify, skip the line, and enjoy exclusive offers.",
    action: "Start Your Business now",
  },
];

const MENU: { icon: XdIconName; label: DemoKey | "English"; y: number }[] = [
  { icon: "menuSettings", label: "Settings", y: 486 },
  { icon: "menuTerms", label: "Terms & Conditions", y: 550 },
  { icon: "menuLegal", label: "Legal Information", y: 614 },
  { icon: "menuAbout", label: "About Us", y: 672 },
  { icon: "menuShare", label: "Share App", y: 736 },
  { icon: "menuLanguage", label: "English", y: 800 },
  { icon: "menuHistory", label: "Login history", y: 864 },
  { icon: "menuLogout", label: "logout", y: 928 },
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
    <ScreenPage scrollTop={50} contentHeight={1129} testId="demo-profile">
      <Icon name="wordmark" x={23.49} y={69.5} />

      {(
        [
          { icon: "web", x: 335.49, label: "Web", textX: 338 },
          { icon: "lock", x: 380.49, label: "lock", textX: 382 },
        ] as const
      ).map((item) => (
        <motion.button
          key={item.label}
          type="button"
          whileTap={{ scale: 0.92 }}
          className="absolute cursor-pointer"
          style={{ left: item.x, top: 69.5, width: 26, height: 44 }}
        >
          <XdIcon
            name={item.icon}
            style={{ position: "absolute", left: 0, top: 0 }}
          />
          <Txt x={item.textX - item.x} baseline={109 - 69.5} size={10}>
            {t(item.label)}
          </Txt>
        </motion.button>
      ))}

      {/* The client card. Tapping it opens the profile. */}
      <Box
        x={12}
        y={124}
        w={406}
        h={140}
        radius={15}
        fill={C.card}
        data-pw="demo-profile-card"
        className="cursor-pointer"
        onClick={() => navigate("settings/profile")}
      >
        <button
          type="button"
          aria-label={t("client ID")}
          data-pw="demo-profile-qr"
          onClick={(e) => {
            e.stopPropagation();
            navigate("settings/client-id");
          }}
          className="absolute cursor-pointer active:opacity-70"
          style={{ left: 12, top: 12, width: 50, height: 50 }}
        >
          <XdIcon name="qrBig" size={50} />
        </button>
        <Txt x={12} baseline={207 - 124} size={13}>
          <span className="font-bold">{profile.clientId}</span> {t("ID")}
        </Txt>
        <Txt
          x={12}
          baseline={229 - 124}
          size={13}
          color={profile.name ? C.ink : C.hint}
        >
          {profile.name || t("Enter Your Name !")}
        </Txt>
        <Icon name="phone" x={12} y={238 - 124} />
        <Txt x={32} baseline={249 - 124} size={11}>
          {profile.phone}
        </Txt>
        <Icon name="mapSmall" x={135} y={238 - 124} />
        <Txt
          x={155}
          baseline={249 - 124}
          size={11}
          color={address ? C.ink : C.hint}
        >
          {address ? address.title : t("Enter Address !")}
        </Txt>
      </Box>

      {/* The photo box sits on the card; it opens the photo screen. */}
      <motion.button
        type="button"
        data-pw="demo-profile-photo"
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("settings/photo")}
        className="absolute cursor-pointer overflow-hidden"
        style={{
          left: 290,
          top: 136,
          width: 116,
          height: 116,
          borderRadius: 15,
          background: C.card,
          boxShadow: "inset 0 0 0 0.5px #C3C3C3",
        }}
      >
        {profile.photo ? (
          <img
            src={profile.photo}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <XdIcon
              name="avatarSmall"
              style={{ position: "absolute", left: 21, top: 13.75 }}
            />
            <span
              className="absolute left-0 w-full"
              style={{
                top: 94,
                height: 22,
                background: C.inkSoft,
                borderRadius: "0 0 15px 15px",
              }}
            >
              <XdIcon
                name="addPhoto"
                style={{ position: "absolute", left: 26, top: 5 }}
              />
              <Txt x={43} baseline={15} size={10} color={C.card}>
                {t("Add photo")}
              </Txt>
            </span>
          </>
        )}
      </motion.button>

      {/* The three cards of the file's horizontal scroll group, as a slider. */}
      <PromoSlider
        onOpen={(promo) => {
          if (promo.icon === "size") navigate("settings/profile/body");
          else if (promo.icon === "verifiedDark")
            navigate("settings/profile/personal-info");
        }}
        t={t}
      />

      {(
        [
          {
            x: 12,
            icon: "orders",
            title: "Orders",
            value: `${profile.orderActions} ${t("action")}`,
          },
          {
            x: 217,
            icon: "wallet",
            title: "Trydos Wallet",
            value: `${profile.walletUsd} USD`,
          },
        ] as const
      ).map((card) => (
        <motion.button
          key={card.title}
          type="button"
          whileTap={{ scale: 0.98 }}
          className="absolute cursor-pointer text-left"
          style={{
            left: card.x,
            top: 380,
            width: 201,
            height: 94,
            borderRadius: 15,
            background: C.card,
          }}
        >
          <Icon name={card.icon} x={12} y={12} />
          <Txt x={12} baseline={61} size={13} weight="medium">
            {t(card.title)}
          </Txt>
          <Txt x={12} baseline={81} size={11}>
            {card.value}
          </Txt>
        </motion.button>
      ))}

      {MENU.map((row, i) => (
        <MenuRow
          key={row.label}
          y={row.y}
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

/** Card width plus the 4 px between cards: 422 - 12 in the file. */
const PROMO_STEP = 410;

/**
 * The file's "Scroll Group 88": three 406 x 108 cards at y 268, 4 px apart,
 * the first at x 12 and the next one peeking in at the right edge.
 *
 * The shopper moves it by hand: swipe, and it snaps to the nearest card. The
 * design will later show one card at a time; three are shown for the demo.
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

  useEffect(() => {
    const controls = animate(x, -index * PROMO_STEP, {
      type: "spring",
      stiffness: 260,
      damping: 32,
    });
    return () => controls.stop();
  }, [index, x]);

  return (
    <div
      data-pw="demo-profile-slider"
      className="absolute left-0 w-full overflow-hidden"
      style={{ top: 268, height: 108 }}
    >
      <motion.div
        className="absolute top-0 flex"
        style={{ left: 12, gap: 4, x, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: -(PROMOS.length - 1) * PROMO_STEP, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          // Where the swipe left the track, pushed half a card on by a flick.
          const moved = -x.get() / PROMO_STEP;
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
          animate(x, -next * PROMO_STEP, {
            type: "spring",
            stiffness: 260,
            damping: 32,
          });
        }}
      >
        {PROMOS.map((promo) => (
          <div
            key={promo.title}
            className="relative shrink-0"
            style={{
              width: 406,
              height: 108,
              borderRadius: 15,
              background: promo.bg,
            }}
          >
            {promo.icon && <Icon name={promo.icon} x={12} y={12} />}
            <Txt x={32} baseline={23} size={11} weight="medium">
              {t(promo.title)}
            </Txt>
            <Txt x={32} baseline={43} size={11}>
              {t(promo.text)}
            </Txt>
            <Icon name="helpGrey" x={379.5} y={11.5} />
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // A swipe that ends on the button is not a tap.
                if (!dragged.current) onOpen(promo);
              }}
              className="absolute flex items-center cursor-pointer"
              style={{
                left: 12,
                top: 58,
                width: 382,
                height: 38,
                borderRadius: 15,
                background: promo.button,
                paddingLeft: promo.contentX,
              }}
            >
              {promo.buttonIcon && (
                <XdIcon name={promo.buttonIcon} style={{ marginRight: 6 }} />
              )}
              <span
                className="font-medium"
                style={{ fontSize: 11, color: C.ink }}
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

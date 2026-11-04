"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../screenNav";
import { useProfileData } from "../useProfileData";
import { usePageDir } from "../rtl";
import {
  C,
  SAFE_BOTTOM,
  fill,
  gapTo,
  lineBox,
  textBottom,
} from "../demo1Layout";
import { Box, Icon, ScreenHeader, ScreenPage, Txt } from "../ui";
import { XD_ICON_SIZE, type XdIconName } from "../../DemoApp/xdIcons";

/**
 * Client ID — XD `Home Page – 81`, and the picture it saves (`Home Page – 82`).
 *
 * The 250 x 250 QR at (90, 120), the id under it ("1012-3456" Medium and "ID"
 * Regular, 16, centred on baseline 394), two 382 x 55 cards at (24, 448) and
 * (24, 507) — name with the blue verified badge, phone — and copy / download /
 * share at the bottom.
 *
 * The id, name and phone are the shopper's (useProfileData). The QR is still
 * the one drawn in the file: what a real code should hold is not decided yet.
 *
 * "download" saves `Home Page – 82` as a PNG: the 300 x 300 QR at (65, 245),
 * and the id, name and phone from y 615 — all drawn on a canvas in the
 * browser, nothing is sent anywhere. The picture keeps the file's 430 x 932
 * size on every screen. On a right-to-left page its text is drawn from the
 * right edge.
 *
 * On /demo the two cards keep the file's 24 px to both edges of the screen,
 * and the three actions are a group centred on the screen at the bottom.
 */

export default function ClientIdScreen() {
  const { t, back } = useDemoNav();
  const profile = useProfileData();
  const rtl = usePageDir() === "rtl";
  const name = profile.name || t("Enter Your Name !");

  const copy = () => {
    navigator.clipboard?.writeText(profile.clientId).catch(() => {});
  };

  const share = () => {
    const data = {
      title: t("Trydos"),
      text: `${t("client ID")}: ${profile.clientId}`,
    };
    if (navigator.share) navigator.share(data).catch(() => {});
    else copy();
  };

  const download = async () => {
    const png = await drawCard(profile.clientId, name, profile.phone, t("ID"), rtl);
    const link = document.createElement("a");
    link.href = png;
    link.download = `trydos-${profile.clientId}.png`;
    link.click();
  };

  // Each action is a 60 x 50 target, the targets 30 apart from x 94, 32 above
  // the bottom (850 .. 900 in the file). The icon sits `iconX` in the file and
  // 5.5 down; the label is centred on the target, its line box 32 down. The
  // group (94 .. 334) sits 1 px left of the artboard's middle; on /demo it
  // stays centred that way on any screen width.
  const actions: {
    icon: XdIconName;
    label: DemoKey;
    x: number;
    iconX: number;
    onClick: () => void;
  }[] = [
    {
      icon: "copy",
      label: "copy",
      // The file centres "copy" on 124 and "share" on 304 (text at 111 and 290).
      x: 124,
      iconX: 114.5,
      onClick: copy,
    },
    {
      icon: "download",
      label: "download",
      x: 214,
      iconX: 203.49,
      onClick: download,
    },
    { icon: "share", label: "share", x: 304, iconX: 295, onClick: share },
  ];

  return (
    <ScreenPage
      testId="demo-client-id"
      header={
        <ScreenHeader title="client ID" nudge={-1.67} onBack={back} t={t} />
      }
      footer={
        // Pinned to the bottom like the login's buttons. The 2 px of padding
        // at the end put the group's centre 1 px before the middle.
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{ bottom: `calc(32px + ${SAFE_BOTTOM})`, paddingInlineEnd: 2 }}
        >
          {actions.map((action, i) => (
            <motion.button
              key={action.icon}
              type="button"
              data-pw={`demo-client-id-${action.icon}`}
              whileTap={{ scale: 0.9 }}
              onClick={action.onClick}
              className="flex flex-col shrink-0 cursor-pointer"
              style={{
                marginInlineStart: i === 0 ? 0 : 30,
                width: 60,
                height: 50,
              }}
            >
              <Icon
                name={action.icon}
                ml={action.iconX - (action.x - 30)}
                mt={5.5}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={action.label}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="block self-stretch text-center font-normal whitespace-nowrap"
                  style={{
                    marginTop:
                      893 - 11 - 850 - (5.5 + XD_ICON_SIZE[action.icon].h),
                    fontSize: 11,
                    lineHeight: `${lineBox(11)}px`,
                    color: C.ink,
                  }}
                >
                  {t(action.label)}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      }
    >
      <Icon name="qrBig" mt={120 - 100} style={{ alignSelf: "center" }} />
      <Txt center mt={gapTo(370, 394, 16)} size={16}>
        <bdi dir="ltr" className="font-medium">
          {profile.clientId}
        </bdi>{" "}
        {t("ID")}
      </Txt>

      <Box
        mt={448 - textBottom(394, 16)}
        ml={24}
        w={fill(24)}
        h={55}
        radius={15}
        fill={C.card}
        className="flex flex-col"
        style={{ padding: "8px 12px 0" }}
      >
        {/* The file puts the label 0.3 px left of the value. */}
        <Txt ml={-0.3} size={12} color={C.grey}>
          {t("client name")}
        </Txt>
        <Txt
          mt={6}
          size={14}
          weight="medium"
          color={profile.name ? C.ink : C.hint}
        >
          <span className="inline-flex items-center">
            {name}
            {profile.name && (
              <XdIcon
                name="verifiedBadge"
                style={{ marginInlineStart: 3, marginTop: -2 }}
              />
            )}
          </span>
        </Txt>
      </Box>
      <Box
        mt={4}
        ml={24}
        w={fill(24)}
        h={55}
        radius={15}
        fill={C.card}
        className="flex flex-col"
        style={{ padding: "8px 12px 0" }}
      >
        <Txt ml={-0.3} size={12} color={C.grey}>
          {t("client Phone Number")}
        </Txt>
        <Txt mt={6} size={14} weight="medium">
          <bdi dir="ltr">{profile.phone}</bdi>
        </Txt>
      </Box>
    </ScreenPage>
  );
}

/** `Home Page – 82`, drawn on a canvas at 3x and returned as a PNG data URL. */
async function drawCard(
  clientId: string,
  name: string,
  phone: string,
  idWord: string,
  rtl = false,
): Promise<string> {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = 430 * scale;
  canvas.height = 932 * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(scale, scale);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 430, 932);

  const qr = new Image();
  qr.src = "/assets/demo/xd/qrBig.svg";
  await qr.decode();
  ctx.drawImage(qr, 65, 245, 300, 300);

  // Each Quicksand weight is its own font family here (see the [lang] layout),
  // so the canvas has to name the family of the weight it wants.
  const root = getComputedStyle(document.documentElement);
  const face = (name: string) =>
    root.getPropertyValue(name).trim() || "Quicksand, sans-serif";
  const regular = face("--Quicksand-Regular");
  ctx.fillStyle = "#1D1D1D";
  // On a right-to-left page the lines start at the right edge, 64 in, as the
  // page does. The id and the phone stay left to right (A-30).
  const start = rtl ? 430 - 64 : 64;
  ctx.textAlign = rtl ? "right" : "left";
  // The id first, then the word after it, as on the screen.
  ctx.font = `700 13px ${face("--Quicksand-Bold")}`;
  ctx.fillText(clientId, start, 628);
  const idWidth = ctx.measureText(`${clientId} `).width;
  ctx.font = `400 13px ${regular}`;
  ctx.fillText(idWord, rtl ? start - idWidth : start + idWidth, 628);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.fillText(name, start, 650);
  ctx.direction = "ltr";
  ctx.font = `400 11px ${regular}`;
  ctx.fillText(phone, start, 670);
  return canvas.toDataURL("image/png");
}

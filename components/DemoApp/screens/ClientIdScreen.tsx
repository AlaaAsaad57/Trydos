"use client";

import type { DemoKey } from "../demoKeys";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData } from "../DemoData";
import { C } from "../demoLayout";
import { Box, Icon, ScreenHeader, ScreenPage, Txt } from "../ui";
import type { XdIconName } from "../xdIcons";

/**
 * Client ID — XD `Home Page – 81`, and the picture it saves (`Home Page – 82`).
 *
 * The 250 x 250 QR at (90, 120), the id under it ("1012-3456" Medium and "ID"
 * Regular, 16, centred on baseline 394), two 382 x 55 cards (name with the
 * blue verified badge, phone), and copy / download / share at the bottom.
 *
 * The QR is the one drawn in the file. There is no service behind the id yet,
 * so a real code would point nowhere; it is swapped for a generated one when
 * the client id comes from the backend.
 *
 * "download" saves `Home Page – 82` as a PNG: the 300 x 300 QR at (65, 245),
 * and the id, name and phone from y 615 — all drawn on a canvas in the
 * browser, nothing is sent anywhere.
 */

export default function ClientIdScreen() {
  const { t, back } = useDemoNav();
  const { profile } = useDemoData();
  const name = profile.name || t("Enter Your Name !");

  const copy = () => {
    navigator.clipboard?.writeText(profile.clientId).catch(() => {});
  };

  const share = () => {
    const data = {
      title: "Trydos",
      text: `${t("client ID")}: ${profile.clientId}`,
    };
    if (navigator.share) navigator.share(data).catch(() => {});
    else copy();
  };

  const download = async () => {
    const png = await drawCard(profile.clientId, name, profile.phone, t("ID"));
    const link = document.createElement("a");
    link.href = png;
    link.download = `trydos-${profile.clientId}.png`;
    link.click();
  };

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
      x: 125,
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
    { icon: "share", label: "share", x: 305, iconX: 295, onClick: share },
  ];

  return (
    <ScreenPage
      testId="demo-client-id"
      header={<ScreenHeader title="client ID" onBack={back} t={t} />}
      footer={
        <>
          {actions.map((action) => (
            <motion.button
              key={action.icon}
              type="button"
              data-pw={`demo-client-id-${action.icon}`}
              whileTap={{ scale: 0.9 }}
              onClick={action.onClick}
              className="absolute cursor-pointer"
              // Pinned to the bottom like the login's buttons: 850 .. 900 in the file.
              style={{ left: action.x - 30, bottom: 32, width: 60, height: 50 }}
            >
              <XdIcon
                name={action.icon}
                style={{
                  position: "absolute",
                  left: action.iconX - (action.x - 30),
                  top: 5.5,
                }}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={action.label}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 w-full text-center font-normal whitespace-nowrap"
                  style={{ top: 893 - 11 - 850, fontSize: 11, color: C.ink }}
                >
                  {t(action.label)}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ))}
        </>
      }
    >
      <Icon name="qrBig" x={90} y={120} />
      <Txt center baseline={394} size={16}>
        <span className="font-medium">{profile.clientId}</span> {t("ID")}
      </Txt>

      <Box x={24} y={448} w={382} h={55} radius={15} fill={C.card}>
        <Txt x={11.7} baseline={20} size={12} color={C.grey}>
          {t("client name")}
        </Txt>
        <Txt
          x={12}
          baseline={43}
          size={14}
          weight="medium"
          color={profile.name ? C.ink : C.hint}
        >
          <span className="inline-flex items-center">
            {name}
            {profile.name && (
              <XdIcon
                name="verifiedBadge"
                style={{ marginLeft: 3, marginTop: -2 }}
              />
            )}
          </span>
        </Txt>
      </Box>
      <Box x={24} y={507} w={382} h={55} radius={15} fill={C.card}>
        <Txt x={11.7} baseline={20} size={12} color={C.grey}>
          {t("client Phone Number")}
        </Txt>
        <Txt x={12} baseline={43} size={14} weight="medium">
          {profile.phone}
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
  ctx.font = `700 13px ${face("--Quicksand-Bold")}`;
  ctx.fillText(clientId, 64, 628);
  const idWidth = ctx.measureText(`${clientId} `).width;
  ctx.font = `400 13px ${regular}`;
  ctx.fillText(idWord, 64 + idWidth, 628);
  ctx.fillText(name, 64, 650);
  ctx.font = `400 11px ${regular}`;
  ctx.fillText(phone, 64, 670);
  return canvas.toDataURL("image/png");
}

"use client";

import type { DemoKey } from "../demoKeys";
import React from "react";
import { motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData } from "../DemoData";
import { C, lineBox } from "../demoLayout";
import { Box, ScreenHeader, ScreenPage, Txt } from "../ui";

/**
 * client Information — XD `Home Page – 87`.
 *
 * Six read-only cards, 55 tall, radius 15, `#FCFCFC`, 4 px apart: the id
 * (406 wide, with the QR on its right, which opens the client ID screen),
 * status and "client since", type and verified (201 wide, in pairs), and the
 * phone (406, with a 0.5 `#D3D3D3` line). Label 12 Regular `#C3C3C3` on
 * baseline +20, value 14 Medium on +43 — except "23 days", where the file
 * draws only the number Medium and the word Regular.
 *
 * At the bottom, two 406 x 56 request buttons (0.5 `#C3C3C3` line, text 14
 * Medium, centred), pinned to the bottom of the page like the login's buttons.
 * No service takes these requests yet.
 */
export default function ClientInfoScreen() {
  const { t, back, navigate } = useDemoNav();
  const { profile } = useDemoData();

  const cards: {
    x: number;
    y: number;
    w: number;
    label: DemoKey;
    value: React.ReactNode;
    /** The file draws every value Medium except "23 days": the number Medium, the word Regular. */
    weight?: "regular" | "medium";
    line?: boolean;
  }[] = [
    { x: 12, y: 171, w: 201, label: "client Status", value: t("Active") },
    {
      x: 217,
      y: 171,
      w: 201,
      label: "client since",
      value: (
        <>
          <span className="font-medium">{profile.clientSince}</span>{" "}
          {t("days")}
        </>
      ),
      weight: "regular",
    },
    { x: 12, y: 230, w: 201, label: "client type", value: t("Personal") },
    { x: 217, y: 230, w: 201, label: "client Verified", value: t("Verified") },
    {
      x: 12,
      y: 289,
      w: 406,
      label: "client Phone Number",
      value: profile.phone,
      line: true,
    },
  ];

  return (
    <ScreenPage
      testId="demo-client-info"
      header={
        <ScreenHeader
          title="client Information"
          nudge={-2}
          onBack={back}
          t={t}
        />
      }
      footer={
        <>
          {(
            [
              "Change my Phone Number Request",
              "Delete my account Request",
            ] as const
          ).map((label, i) => (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.98 }}
              className="absolute cursor-pointer font-medium"
              style={{
                left: 12,
                bottom: 36 + (1 - i) * 64,
                width: 406,
                height: 56,
                borderRadius: 15,
                background: C.card,
                boxShadow: `inset 0 0 0 0.5px ${C.hint}`,
                fontSize: 14,
                lineHeight: `${lineBox(14)}px`,
                color: C.ink,
                // The file puts both words 1 px (and 1.33 px) right of centre.
                paddingLeft: i === 0 ? 2.67 : 2,
              }}
            >
              {t(label)}
            </motion.button>
          ))}
        </>
      }
    >
      <Box x={12} y={112} w={406} h={55} radius={15} fill={C.card}>
        <Txt x={12} baseline={20} size={12} color={C.hint}>
          {t("client ID")}
        </Txt>
        <Txt x={12} baseline={43} size={14} weight="medium">
          {profile.clientId}
        </Txt>
        <button
          type="button"
          aria-label={t("client ID")}
          data-pw="demo-client-info-qr"
          onClick={() => navigate("settings/client-id")}
          className="absolute cursor-pointer active:opacity-70"
          style={{ left: 355, top: 8, width: 39, height: 39 }}
        >
          <XdIcon name="qrBig" size={39} />
        </button>
      </Box>

      {cards.map((card) => (
        <Box
          key={card.label}
          x={card.x}
          y={card.y}
          w={card.w}
          h={55}
          radius={15}
          fill={C.card}
          stroke={card.line ? C.line : undefined}
        >
          <Txt x={12} baseline={20} size={12} color={C.hint}>
            {t(card.label)}
          </Txt>
          <Txt x={12} baseline={43} size={14} weight={card.weight ?? "medium"}>
            {card.value}
          </Txt>
        </Box>
      ))}
    </ScreenPage>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../Demo1Shell";
import { useDemoData } from "../../DemoApp/DemoData";
import { C, SAFE_BOTTOM, fill, lineBox } from "../demo1Layout";
import { Box, ScreenHeader, ScreenPage, Stroke, Txt } from "../ui";

/** One card of a pair: half the row, less half the 4 px gap (201 of 406). */
const HALF = "calc((100% - 4px) / 2)";

/**
 * client Information — XD `Home Page – 87`.
 *
 * Six read-only cards, 55 tall, radius 15, `#FCFCFC`, from y 112 (12 under the
 * header), 4 px apart down and across: the id
 * (406 wide, with the QR on its right, which opens the client ID screen),
 * status and "client since", type and verified (201 wide, in pairs), and the
 * phone (406, with a 0.5 `#D3D3D3` line). Label 12 Regular `#C3C3C3` on
 * baseline +20, value 14 Medium on +43 — except "23 days", where the file
 * draws only the number Medium and the word Regular.
 *
 * At the bottom, two 406 x 56 request buttons (0.5 `#C3C3C3` line, text 14
 * Medium, centred), pinned to the bottom of the page like the login's buttons.
 * No service takes these requests yet.
 *
 * On /demo1 the widths are fluid: every card and button keeps 12 px to both
 * edges of the screen, and the two cards of a pair share the width with the
 * file's 4 px gap. On a 430 px phone they are the file's 406 and 201.
 */
export default function ClientInfoScreen() {
  const { t, back, navigate } = useDemoNav();
  const { profile } = useDemoData();

  const since = (
    <>
      <span className="font-medium">{profile.clientSince}</span> {t("days")}
    </>
  );

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
        // 56 tall, 8 apart, the lower one 36 above the bottom, 12 px from
        // both edges.
        <div
          className="absolute flex flex-col"
          style={{
            left: 12,
            right: 12,
            bottom: `calc(36px + ${SAFE_BOTTOM})`,
          }}
        >
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
              className="relative shrink-0 cursor-pointer font-medium"
              style={{
                marginTop: i === 0 ? 0 : 8,
                width: "100%",
                height: 56,
                borderRadius: 15,
                background: C.card,
                fontSize: 14,
                lineHeight: `${lineBox(14)}px`,
                color: C.ink,
                // The file puts both words 1 px (and 1.33 px) right of centre.
                paddingLeft: i === 0 ? 2.67 : 2,
              }}
            >
              {t(label)}
              <Stroke color={C.hint} radius={15} />
            </motion.button>
          ))}
        </div>
      }
    >
      <Box
        mt={12}
        ml={12}
        w={fill(12)}
        h={55}
        radius={15}
        fill={C.card}
        className="flex items-start"
        style={{ padding: "8px 12px 0" }}
      >
        <div className="flex flex-col">
          <Txt size={12} color={C.hint}>
            {t("client ID")}
          </Txt>
          <Txt size={14} weight="medium" mt={6}>
            {profile.clientId}
          </Txt>
        </div>
        <button
          type="button"
          aria-label={t("client ID")}
          data-pw="demo-client-info-qr"
          onClick={() => navigate("settings/client-id")}
          // 39 x 39 at (367, 120): 8 down, 12 in from the right.
          className="shrink-0 ml-auto cursor-pointer active:opacity-70"
          style={{ width: 39, height: 39 }}
        >
          <XdIcon name="qrBig" size={39} />
        </button>
      </Box>

      {/* Two cards in a row share the row's width, 4 px apart. */}
      <div
        className="flex shrink-0"
        style={{ marginTop: 4, marginLeft: 12, width: fill(12) }}
      >
        <InfoCard w={HALF} label={t("client Status")} value={t("Active")} />
        <InfoCard
          ml={4}
          w={HALF}
          label={t("client since")}
          value={since}
          weight="regular"
        />
      </div>
      <div
        className="flex shrink-0"
        style={{ marginTop: 4, marginLeft: 12, width: fill(12) }}
      >
        <InfoCard w={HALF} label={t("client type")} value={t("Personal")} />
        <InfoCard
          ml={4}
          w={HALF}
          label={t("client Verified")}
          value={t("Verified")}
        />
      </div>
      <InfoCard
        mt={4}
        ml={12}
        w={fill(12)}
        label={t("client Phone Number")}
        value={profile.phone}
        line
      />
    </ScreenPage>
  );
}

/** A read-only card: the 12 px label on baseline +20, the 14 px value on +43. */
function InfoCard({
  mt,
  ml,
  w,
  label,
  value,
  weight = "medium",
  line = false,
}: {
  mt?: number;
  ml?: number;
  w: number | string;
  label: string;
  value: React.ReactNode;
  /** The file draws every value Medium except "23 days": the number Medium, the word Regular. */
  weight?: "regular" | "medium";
  line?: boolean;
}) {
  return (
    <Box
      mt={mt}
      ml={ml}
      w={w}
      h={55}
      radius={15}
      fill={C.card}
      stroke={line ? C.line : undefined}
      className="flex flex-col"
      style={{ padding: "8px 12px 0" }}
    >
      <Txt size={12} color={C.hint}>
        {label}
      </Txt>
      <Txt size={14} weight={weight} mt={6}>
        {value}
      </Txt>
    </Box>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { useDemoNav } from "../Demo1Shell";
import { useDemoData } from "../../DemoApp/DemoData";
import { C, SHEET, fill, gapTo, lineBox, textBottom } from "../demo1Layout";
import { Box, Icon, Sheet, Txt, Under, fromCentre, useCanvasEnd } from "../ui";
import type { XdIconName } from "../../DemoApp/xdIcons";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  WALLET_BRAND,
  WALLET_RECIPIENT,
  type WalletBalance,
} from "../../DemoApp/demoWallet";
import { SheetTitle } from "./WalletCashOutSheet";

/**
 * Wallet Info — XD `Home Page – 23`. A sheet from y 90 with 50 px top corners.
 *
 * Top to bottom (design y):
 *   - the title row at y 114 and the client ID (24 Bold) on baseline 180;
 *   - the QR code, 350.21 px, at (39.93, 210.32);
 *   - two 8 px page dots at y 573 and "trydos USD" (16 px) on baseline 605;
 *   - three 390 x 55 fields at y 639, 698 and 757, `#FCFCFC`: a grey 12 px
 *     label on baseline 20 and a 14 px value on 43;
 *   - four actions at y 855: a 20 px picture over an 11 px label. The labels
 *     start at x 65, 157, 234 and 336.
 *
 * On /demo1 the sheet is as wide as the screen. The fields keep 20 px to both
 * edges. The QR code and the row of actions keep their size and stay centred
 * the way the file centres them.
 */

const TOP = 90;

/** The actions, left to right, with the x where the file starts each label. */
const ACTIONS: {
  id: "request" | "copy" | "download" | "share";
  icon: XdIconName;
  label: DemoKey;
  x: number;
  /** How far the picture sits off the label's centre, in px. */
  off: number;
}[] = [
  { id: "request", icon: "infoRequest", label: "request", x: 65, off: 0.5 },
  { id: "copy", icon: "infoCopy", label: "copy", x: 157, off: 0.5 },
  {
    id: "download",
    icon: "infoDownload",
    label: "download",
    x: 234,
    off: -0.5,
  },
  { id: "share", icon: "infoShare", label: "share", x: 336, off: 0.5 },
];

export default function WalletInfoSheet({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  /** The balance the code is for. */
  balance: WalletBalance;
}) {
  const { t } = useDemoNav();
  const { profile } = useDemoData();
  /** Where the screen ends (design y). */
  const end = useCanvasEnd(open);
  // The file shows a client with a name; a new demo client has none yet.
  const name = profile.name || WALLET_RECIPIENT.name;

  const act = (id: (typeof ACTIONS)[number]["id"]) => {
    if (id === "copy")
      navigator.clipboard?.writeText(profile.clientId).catch(() => {});
    if (id === "share" && navigator.share)
      navigator.share({ text: profile.clientId }).catch(() => {});
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      y={TOP}
      radius={SHEET.radiusWallet}
      fit
      testId="demo-wallet-info-sheet"
    >
      {/* As tall as the screen lets it be: the title and the client ID stay
          in place, and the part under them scrolls. */}
      <div
        className="flex flex-col shrink-0"
        style={{ height: Math.min(930, end) - (TOP + 13) }}
      >
        <SheetTitle
          top={TOP}
          icon="qrDark"
          mark={balance.mark}
          label={t("Wallet Info")}
        />
        <Txt
          center
          size={24}
          weight="bold"
          mt={gapTo(TOP + 24 + lineBox(24), 180, 24)}
        >
          {profile.clientId}
        </Txt>

        <Under
          testId="demo-wallet-info-under"
          minHeight={930 - textBottom(180, 24)}
        >
          {/* The code at x 39.93 on the 430 board, kept at that distance from
              the centre. It keeps its 350 px on every phone. */}
          <Icon
            name="qrWallet"
            mt={210.32 - textBottom(180, 24)}
            style={{ marginLeft: fromCentre(39.93, 430) }}
          />

          {/* The dots at (205, 573) and (217, 573): 20 wide together, centred. */}
          <div
            className="flex justify-center shrink-0"
            style={{ marginTop: 573 - (210.32 + 350.21) }}
          >
            <Icon name="dotDark" />
            <Icon name="dotBlueOff" ml={4} />
          </div>
          {/* The file starts this line at x 172: half a px left of centre. */}
          <Txt
            center
            nudge={-0.5}
            size={16}
            mt={gapTo(573 + 8, 605, 16)}
            style={{ whiteSpace: "pre" }}
          >
            <span className="font-bold">{WALLET_BRAND.start}</span>
            {WALLET_BRAND.rest.slice(0, 3)}
            <span className="font-medium">{` ${balance.code}`}</span>
          </Txt>

          <InfoField
            mt={639 - textBottom(605, 16)}
            label={t("Trydos client Name")}
            testId="demo-wallet-info-name"
            mark
          >
            {name}
          </InfoField>
          <InfoField
            mt={698 - (639 + 55)}
            label={t("Trydos client ID")}
            testId="demo-wallet-info-id"
            medium
          >
            {profile.clientId}
          </InfoField>
          <InfoField
            mt={757 - (698 + 55)}
            label={t("Trydos client Phone Number")}
            testId="demo-wallet-info-phone"
            medium
          >
            {profile.phone}
          </InfoField>

          <div
            className="flex items-start shrink-0"
            // The labels end at y 895: 35 px above the artboard's bottom. The
            // row keeps the file's slots and stays centred as in the file.
            style={{
              marginTop: 855 - (757 + 55),
              marginLeft: fromCentre(ACTIONS[0].x, 430),
              paddingBottom: 930 - 895,
            }}
          >
            {ACTIONS.map((action, i) => (
              // The slot runs from one label's start to the next.
              <div
                key={action.id}
                className="flex shrink-0"
                style={{
                  minWidth:
                    i < ACTIONS.length - 1
                      ? ACTIONS[i + 1].x - action.x
                      : undefined,
                }}
              >
                <motion.button
                  type="button"
                  data-pw={`demo-wallet-info-${action.id}`}
                  onClick={() => act(action.id)}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-center shrink-0 cursor-pointer"
                >
                  <Icon
                    name={action.icon}
                    style={
                      action.off > 0
                        ? { marginLeft: action.off * 2 }
                        : { marginRight: -action.off * 2 }
                    }
                  />
                  <Txt size={11} mt={gapTo(855 + 20, 892, 11)}>
                    {t(action.label)}
                  </Txt>
                </motion.button>
              </div>
            ))}
          </div>
        </Under>
      </div>
    </Sheet>
  );
}

/**
 * A field of the sheet, 55 tall, 20 px from both edges (the file's 390 at
 * x 20). `mark` adds the grey 16 px eye of the name field, 12 px from the
 * field's right edge (at (362, 20) in the file).
 */
export function InfoField({
  mt,
  label,
  children,
  medium = false,
  mark = false,
  testId,
}: {
  mt: number;
  label: React.ReactNode;
  children: React.ReactNode;
  /** The file writes the ID and the phone number Medium, the name Regular. */
  medium?: boolean;
  mark?: boolean;
  testId: string;
}) {
  return (
    <Box
      w={fill(20)}
      h={55}
      mt={mt}
      ml={20}
      radius={15}
      fill={C.card}
      data-pw={testId}
      className="flex items-start"
      style={{ padding: "8px 12px 0" }}
    >
      <div className="flex flex-col shrink-0">
        <Txt size={12} color={C.grey}>
          {label}
        </Txt>
        <Txt
          size={14}
          weight={medium ? "medium" : "regular"}
          mt={gapTo(8 + lineBox(12), 43, 14)}
          style={{ whiteSpace: "pre" }}
        >
          {children}
        </Txt>
      </div>
      {mark && (
        <Icon name="eyeGrey" mt={20 - 8} style={{ marginLeft: "auto" }} />
      )}
    </Box>
  );
}

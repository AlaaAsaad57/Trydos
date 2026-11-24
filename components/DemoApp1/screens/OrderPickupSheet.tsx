"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import type { DemoOrder } from "../../DemoApp/demoOrders";
import { XD_ICON_SIZE, type XdIconName } from "../../DemoApp/xdIcons";
import {
  C,
  DESIGN_W,
  SHEET,
  UNDER_BAR,
  fill,
  gapTo,
  lineBox,
  textBottom,
  textTop,
} from "../demo1Layout";
import { Box, Icon, Sheet, Txt, Under, fromCentre, useCanvasEnd } from "../ui";

const TOP = 90;

/**
 * Pickup Order QR bottom sheet — XD `Home Page – 65`.
 *
 * Opens from `Pickup Now` (`Home Page – 64`) or the shipment QR mark (`– 61`,
 * `– 64`, `– 66`). Top edge at y 90 with 50 px top corners, grabber handle at
 * y 101..103, "Pickup Order" (24 Bold) on baseline 138, "trydos" (24 Bold/Reg)
 * on baseline 180, the 300.91 px QR code at (65, 215.01), "# TTISA10012" (16
 * Medium) on baseline 544, three 390 x 55 info tiles at y 560, 619 and 678,
 * "+ Add Authorized Recipient The Shipment" (390 x 30) at y 739, and Copy /
 * Download / Share at the bottom (icons y 851.75..855, labels baseline 892).
 */
export default function OrderPickupSheet({
  open,
  onClose,
  order,
  t,
}: {
  open: boolean;
  onClose: () => void;
  order: DemoOrder;
  t: (key: DemoKey) => string;
}) {
  const end = useCanvasEnd(open);
  const [hidePhone, setHidePhone] = useState(false);
  const [hideName, setHideName] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(order.id).catch(() => {});
  };

  const shareOrder = () => {
    const data = {
      title: "Trydos",
      text: `${t("Pickup Order")} # ${order.id} — ${order.pickupCenter}`,
    };
    if (navigator.share) navigator.share(data).catch(() => {});
    else copyCode();
  };

  const actions: {
    id: "copy" | "download" | "share";
    icon: XdIconName;
    label: DemoKey;
    slotCenterX: number;
    iconX: number;
    iconY: number;
    onClick: () => void;
  }[] = [
    {
      id: "copy",
      icon: "infoCopy",
      label: "Copy",
      slotCenterX: 124,
      iconX: 115,
      iconY: 855,
      onClick: copyCode,
    },
    {
      id: "download",
      icon: "infoDownload",
      label: "download",
      slotCenterX: 214,
      iconX: 204,
      iconY: 855,
      onClick: copyCode,
    },
    {
      id: "share",
      icon: "infoShare",
      label: "share",
      slotCenterX: 304,
      iconX: 295,
      iconY: 855,
      onClick: shareOrder,
    },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      y={TOP}
      radius={SHEET.radiusWallet}
      fit
      testId="demo-order-pickup-sheet"
    >
      <div
        className="flex flex-col shrink-0"
        style={{ height: Math.min(930, end) - (TOP + 13) + UNDER_BAR }}
      >
        {/* "Pickup Order" (24 Bold, baseline 138) */}
        <Txt
          center
          size={24}
          weight="bold"
          color={C.ink}
          mt={textTop(138, 24) - (TOP + 13)}
        >
          {t("Pickup Order")}
        </Txt>

        {/* "trydos" (24 Bold/Regular, baseline 180) */}
        <Txt
          center
          size={24}
          weight="regular"
          color={C.ink}
          mt={gapTo(textBottom(138, 24), 180, 24)}
        >
          <span className="font-bold">try</span>dos
        </Txt>

        <Under
          testId="demo-order-pickup-under"
          minHeight={930 - textBottom(180, 24)}
        >
          {/* Stylized QR code: 300.91 x 300.91 at (65, 215.01) */}
          <Icon
            name="orderQrBig"
            mt={215.01 - textBottom(180, 24)}
            style={{ marginLeft: fromCentre(65, DESIGN_W) }}
          />

          {/* "# TTISA10012" on baseline 544 */}
          <Txt
            center
            size={16}
            weight="medium"
            color={C.ink}
            mt={gapTo(215.01 + XD_ICON_SIZE.orderQrBig.h, 544, 16)}
          >
            {`# ${order.id}`}
          </Txt>

          {/* Info Card 1: Recipient Package Phone Number (y 560, h 55) */}
          <Box
            mt={560 - textBottom(544, 16)}
            ml={20}
            w={fill(20)}
            h={55}
            radius={15}
            fill={C.card}
            className="flex flex-col"
          >
            <Txt
              size={12}
              color={C.grey}
              ml={12}
              mt={textTop(580, 12) - 560}
            >
              <span className="font-medium">{t("Recipient")}</span>
              {t("Recipient Package Phone Number").slice("Recipient".length)}
            </Txt>
            <div
              className="flex items-baseline shrink-0"
              style={{
                marginLeft: 12,
                marginTop: gapTo(textBottom(580, 12), 603, 14),
              }}
            >
              <Txt size={14} weight="bold" color={C.ink}>
                +
              </Txt>
              <Txt size={14} weight="regular" color={C.ink} ml={4}>
                {hidePhone ? "•• ••• ••• ••••" : order.recipientPhoneNoPlus}
              </Txt>
            </div>
            <button
              type="button"
              aria-label="Toggle phone visibility"
              data-pw="demo-pickup-toggle-phone"
              onClick={() => setHidePhone((v) => !v)}
              className="absolute flex items-center justify-center cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
              style={{ right: 4, top: 12, width: 32, height: 32 }}
            >
              <XdIcon name="eyeGrey" />
            </button>
          </Box>

          {/* Info Card 2: Recipient Package Full Name ( Exact ID ) (y 619, h 55) */}
          <Box
            mt={619 - (560 + 55)}
            ml={20}
            w={fill(20)}
            h={55}
            radius={15}
            fill={C.card}
            className="flex flex-col"
          >
            <Txt
              size={12}
              color={C.grey}
              ml={12}
              mt={textTop(639, 12) - 619}
            >
              <span className="font-medium">{t("Recipient")}</span>
              {t("Recipient Package Full Name ( Exact ID )").slice(
                "Recipient".length,
              )}
            </Txt>
            <Txt
              size={14}
              weight="regular"
              color={C.ink}
              ml={12}
              mt={gapTo(textBottom(639, 12), 662, 14)}
            >
              {hideName ? "•••••••• •••••••" : order.recipient}
            </Txt>
            <button
              type="button"
              aria-label="Toggle name visibility"
              data-pw="demo-pickup-toggle-name"
              onClick={() => setHideName((v) => !v)}
              className="absolute flex items-center justify-center cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
              style={{ right: 4, top: 12, width: 32, height: 32 }}
            >
              <XdIcon name="eyeGrey" />
            </button>
          </Box>

          {/* Info Card 3: Package Pickup Address (y 678, h 55) */}
          <Box
            mt={678 - (619 + 55)}
            ml={20}
            w={fill(20)}
            h={55}
            radius={15}
            fill={C.card}
            className="flex flex-col"
          >
            <Txt
              size={12}
              color={C.grey}
              ml={12}
              mt={textTop(698, 12) - 678}
            >
              {t("Package Pickup Address")}
            </Txt>
            <Txt
              size={14}
              weight="regular"
              color={C.ink}
              ml={12}
              mt={gapTo(textBottom(698, 12), 721, 14)}
            >
              {order.pickupCenter}
            </Txt>
          </Box>

          {/* "+ Add Authorized Recipient The Shipment" button (y 739, h 30) */}
          <button
            type="button"
            data-pw="demo-pickup-add-recipient"
            className="flex justify-center shrink-0 cursor-pointer active:opacity-75 [-webkit-tap-highlight-color:transparent]"
            style={{
              marginTop: 739 - (678 + 55),
              marginLeft: 20,
              width: fill(20),
              height: 30,
              borderRadius: 12,
              background: "#F4F4F4",
            }}
          >
            <Txt size={11} color={C.ink} mt={textTop(758, 11) - 739 - 1}>
              <span className="font-medium">{`${t("+ Add")} `}</span>
              {t("Authorized Recipient")}{" "}
              {t("The Shipment")}
            </Txt>
          </button>

          {/* Bottom actions: Copy / Download / Share (y 850 .. 900) */}
          <div
            className="flex justify-center shrink-0"
            style={{
              marginTop: 850 - (739 + 30),
              paddingRight: 2,
              paddingBottom: 24,
            }}
          >
            {actions.map((a, i) => (
              <motion.button
                key={a.id}
                type="button"
                data-pw={`demo-pickup-${a.id}`}
                whileTap={{ scale: 0.9 }}
                onClick={a.onClick}
                className="relative flex flex-col shrink-0 cursor-pointer [-webkit-tap-highlight-color:transparent]"
                style={{
                  marginLeft: i === 0 ? 0 : 30,
                  width: 60,
                  height: 50,
                }}
              >
                <XdIcon
                  name={a.icon}
                  className="shrink-0"
                  style={{
                    marginLeft: a.iconX - (a.slotCenterX - 30),
                    marginTop: a.iconY - 850,
                  }}
                />
                <span
                  className="absolute inset-x-0 text-center font-normal whitespace-nowrap"
                  style={{
                    top: textTop(892, 11) - 850,
                    fontSize: 11,
                    lineHeight: `${lineBox(11)}px`,
                    color: C.ink,
                  }}
                >
                  {a.id === "copy"
                    ? t("Copy")
                    : a.id === "download"
                      ? "Download"
                      : "Share"}
                </span>
              </motion.button>
            ))}
          </div>
        </Under>
      </div>
    </Sheet>
  );
}

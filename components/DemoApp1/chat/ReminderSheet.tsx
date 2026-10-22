"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { reminderLabel, reminderOptions } from "../../DemoApp/demoChatModel";
import { C } from "../demo1Layout";
import { Txt } from "../ui";
import PickSheet, { PickBox, PickRow } from "./PickSheet";

/**
 * "Remind me": the sheet the menu's re-remind opens. Three rows — in an
 * hour, tomorrow at 9, next week at 9 — with the menu's own bell mark in
 * the row's box and the time the row means, 12 Regular grey, under its
 * words. When the message already carries a reminder, a last row in red
 * takes it off.
 */
export default function ReminderSheet({
  open,
  current,
  locale,
  onPick,
  onClose,
  t,
}: {
  open: boolean;
  /** The reminder the message carries now, in ms since the epoch, if any. */
  current?: number;
  locale: string;
  onPick: (at: number | null) => void;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const options = reminderOptions();
  return (
    <PickSheet open={open} title={t("Remind me")} testId="demo-reminder-sheet" y={500} onClose={onClose}>
      {options.map((o, i) => (
        <PickRow
          key={o.key}
          testId={`demo-reminder-${o.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          first={i === 0}
          onClick={() => onPick(o.at)}
        >
          <PickBox background={C.purpleTint}>
            <XdIcon name="menuRemind" size={18} />
          </PickBox>
          <span className="flex flex-col min-w-0 grow" style={{ marginLeft: 12 }}>
            <Txt size={14} weight="medium">
              {t(o.key)}
            </Txt>
            <Txt size={12} color={C.grey}>
              {reminderLabel(o.at, locale)}
            </Txt>
          </span>
        </PickRow>
      ))}
      {current !== undefined && (
        <PickRow testId="demo-reminder-remove" onClick={() => onPick(null)}>
          <PickBox background="#FFE6E5">
            <XdIcon name="menuRemind" size={18} />
          </PickBox>
          <span className="flex flex-col min-w-0 grow" style={{ marginLeft: 12 }}>
            <Txt size={14} weight="medium" color={C.red}>
              {t("Remove")}
            </Txt>
            <Txt size={12} color={C.grey}>
              {reminderLabel(current, locale)}
            </Txt>
          </span>
        </PickRow>
      )}
    </PickSheet>
  );
}

"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import type { Category } from "../../DemoApp/demoChatModel";
import { C } from "../demo1Layout";
import { Txt } from "../ui";
import { CheckIcon } from "./chatIcons";
import PickSheet, { PickBox, PickRow } from "./PickSheet";

/**
 * "Category": the sheet the menu's tag opens. One row per category, its
 * colour as a 14 px dot in the row's box and its name 14 Medium; the
 * category the message carries shows a check in its colour at the right.
 * The last row, "None", takes the tag off.
 */
export default function CategorySheet({
  open,
  categories,
  chosen,
  onPick,
  onClose,
  t,
}: {
  open: boolean;
  categories: Category[];
  /** The category the message carries now, if any. */
  chosen?: string;
  onPick: (category: string | null) => void;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <PickSheet open={open} title={t("Category")} testId="demo-category-sheet" onClose={onClose}>
      {categories.map((c, i) => (
        <PickRow key={c.id} testId={`demo-category-${c.id}`} first={i === 0} onClick={() => onPick(c.id)}>
          <PickBox>
            <span className="block" style={{ width: 14, height: 14, borderRadius: 7, background: c.color }} />
          </PickBox>
          <Txt size={14} weight="medium" ml={12} className="grow">
            {t(c.name as DemoKey)}
          </Txt>
          {chosen === c.id && (
            <span data-pw="demo-category-chosen" className="flex shrink-0" style={{ marginRight: 16 }}>
              <CheckIcon color={c.color} />
            </span>
          )}
        </PickRow>
      ))}
      <PickRow testId="demo-category-none" onClick={() => onPick(null)}>
        <PickBox>
          <span
            className="block"
            style={{ width: 14, height: 14, borderRadius: 7, border: `1.5px solid ${C.line}` }}
          />
        </PickBox>
        <Txt size={14} weight="medium" color={C.grey} ml={12}>
          {t("None")}
        </Txt>
      </PickRow>
    </PickSheet>
  );
}

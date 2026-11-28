"use client";

import React from "react";
import { motion } from "framer-motion";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { C, fill } from "../demo1Layout";
import { Icon, Stroke, Txt } from "../ui";

/**
 * A row's country: the design's flag (`flag`) for the four design countries,
 * or the standard flag file (`flagSrc`, components/DemoApp1/countryFlag.ts)
 * for a country of the real list that the design does not draw.
 */
export type RowCountry = {
  id: string;
  name: string;
  flag?: XdIconName;
  flagSrc?: string;
};

/**
 * One country row, as `Home Page – 95` (the address form's country sheet) and
 * `Ramaaz pay signin – 15` / `– 16` (the country picker at the start) both draw
 * it: a 406 x 60 box with radius 15, 12 px from both edges of the screen, the
 * 30 px flag 12 px in, and the name (14 Regular) from x 66.
 *
 * Not chosen, the box is `#FCFCFC`. Chosen, it is `#F8F8F8` with a 0.5 px
 * `#402CDD` line on the inside of its edge.
 *
 * The files draw Syria with the Turkish flag, a placeholder; Syria shows its
 * own flag, drawn in the same style (see COUNTRIES in demoPlaces.ts). A
 * country the design does not draw shows its standard flag, 30 px wide, in
 * the same place.
 */
export default function CountryRow({
  country,
  on,
  label,
  mt,
  testId,
  onPick,
}: {
  country: RowCountry;
  on: boolean;
  /** The country's name in the page's language. */
  label: string;
  mt: number;
  testId: string;
  onPick: () => void;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      aria-pressed={on}
      whileTap={{ scale: 0.98 }}
      onClick={onPick}
      className="relative flex items-center shrink-0 cursor-pointer text-left"
      style={{
        marginTop: mt,
        // Logical: on an RTL page the column starts on the right, and a
        // physical left margin put the row 12 px too far right.
        marginInlineStart: 12,
        width: fill(12),
        height: 60,
        borderRadius: 15,
        background: on ? C.field : C.card,
      }}
    >
      {country.flag ? (
        <Icon name={country.flag} ml={12} />
      ) : (
        <img
          src={country.flagSrc}
          alt=""
          aria-hidden="true"
          width={30}
          height={20}
          className="shrink-0"
          style={{ marginInlineStart: 12, width: 30, height: 20, objectFit: "cover" }}
        />
      )}
      <Txt ml={66 - 12 - 12 - 30} size={14}>
        {label}
      </Txt>
      <Stroke color="#402CDD" radius={15} visible={on} />
    </motion.button>
  );
}

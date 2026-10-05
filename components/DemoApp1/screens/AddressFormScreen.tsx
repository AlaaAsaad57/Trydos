"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../Demo1Shell";
import { useDemoData, type DemoCountry } from "../../DemoApp/DemoData";
import {
  COUNTRIES,
  LEVELS,
  choicesAt,
  countryOf,
} from "../../DemoApp/demoPlaces";
import { C, ROW, fill, gapTo, lineBox, textBottom } from "../demo1Layout";
import {
  Box,
  Field,
  FieldInput,
  fromCentre,
  Icon,
  InfoBanner,
  ScreenHeader,
  ScreenPage,
  Sheet,
  Stroke,
  Txt,
  WideButton,
} from "../ui";

/**
 * Add / edit an address — XD `Home Page – 94` (the form), `– 95` (the country
 * sheet), `– 97` (the place sheet) and `– 99` (filled in).
 *
 * The map card (406 x 121 at y 160, 12 under the banner) holds the map
 * (382 x 79, radius 15) and the black "Locate your location on map" pill.
 * Tapping it drops the pin: the card grows to 186, the map to 162, the pill
 * turns `#4A31E7` and reads "your location on map", and every field under it
 * moves down 65 with the card — exactly the difference between 94 and 99.
 *
 * Fields, 55 tall, 4 px under the card and 4 px apart: country (opens the country sheet),
 * "Select from list" (opens the place sheet), detailed address, title. Until
 * the whole form is filled, every field is white with its grey line, filled or
 * not, as 94, 95 and 97 draw it. A field in use (focused, or its sheet open)
 * turns its line blue `#388CFF` and its label Medium: a product rule. When the
 * whole form is filled "Add & save" rises, every field turns `#FCFCFC` and every
 * line goes, the map card's too, as on 99 — at once, even while the last field
 * still has focus. The field in use keeps its blue line: a product rule.
 *
 * Nothing is looked up: the map is the picture in the file and the places are
 * the mock list in demoPlaces.ts.
 *
 * On /demo the page is the document, and the widths are fluid: the map card,
 * the fields, and the rows and the search box of the sheets keep 12 px to
 * both edges (406 on a 430 px phone). The pill, the pin and the caption are
 * centred on the map in the file, so they stay centred on it.
 */

/** How much the map card grows when the map opens: 186 - 121. */
const MAP_GROWTH = 65;

/** The map's width in the file (12 px in from both sides of the 406 card). */
const MAP_W = 382;

export default function AddressFormScreen() {
  const { t, back } = useDemoNav();
  const { profile, update } = useDemoData();
  const editing =
    profile.addresses.find((a) => a.id === profile.editingAddress) ?? null;

  const [country, setCountry] = useState<DemoCountry>(editing?.country ?? "tr");
  // Province first — the order the picker walks. The address stores it street first.
  const [picked, setPicked] = useState<string[]>(
    editing ? [...editing.area].reverse() : [],
  );
  const [detail, setDetail] = useState(editing?.detail ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [located, setLocated] = useState(editing !== null);
  const [sheet, setSheet] = useState<"country" | "place" | null>(null);

  const placeDone = picked.length === LEVELS.length;
  const complete = placeDone && detail.trim() !== "" && title.trim() !== "";
  // The map card's line goes the moment the form is complete, even with a
  // field still focused. An open sheet keeps it, as on 95 and 97.
  const done = complete && sheet === null;
  const countryName = t(countryOf(country).name);

  const save = () => {
    const address = {
      id: editing?.id ?? `a${Date.now()}`,
      title: title.trim(),
      country,
      area: [...picked].reverse(),
      detail: detail.trim(),
    };
    update({
      addresses: editing
        ? profile.addresses.map((a) => (a.id === editing.id ? address : a))
        : [...profile.addresses, address],
      editingAddress: null,
    });
    back();
  };

  // A field whose sheet is open is in use: blue line, Medium label.
  const fieldLook = (id: "country" | "place") => ({
    editing: !complete,
    focused: sheet === id,
  });

  return (
    <ScreenPage
      testId="demo-address-form"
      header={
        <ScreenHeader
          crumb={["Profile", "Address"]}
          nudge={1}
          icon="titleAddress"
          onBack={back}
          action="Cancel"
          onAction={back}
          t={t}
        />
      }
      footer={
        <>
          <WideButton
            testId="demo-address-save"
            label={t("Add & save")}
            visible={complete}
            onClick={save}
          />
          <CountrySheet
            open={sheet === "country"}
            value={country}
            onClose={() => setSheet(null)}
            onPick={(id) => {
              if (id !== country) setPicked([]);
              setCountry(id);
              setSheet(null);
            }}
          />
          <PlaceSheet
            open={sheet === "place"}
            country={country}
            picked={picked}
            onPicked={setPicked}
            onClose={() => setSheet(null)}
          />
        </>
      }
    >
      <InfoBanner t={t} />

      {/* The map card, 12 under the banner. Its height is animated, so the
          fields under it move down with it. */}
      <motion.div
        data-pw="demo-address-map"
        className="relative flex flex-col shrink-0 overflow-hidden"
        initial={false}
        animate={{ height: located ? 121 + MAP_GROWTH : 121 }}
        transition={GROW}
        style={{
          marginTop: 12,
          marginLeft: 12,
          width: fill(12),
          borderRadius: 15,
          background: C.card,
        }}
      >
        {/* The map at (12, 12), 12 px from both edges of the card (382 wide
            in a 406 card). */}
        <motion.div
          className="relative flex flex-col shrink-0 overflow-hidden"
          initial={false}
          animate={{ height: located ? 162 : 79 }}
          transition={GROW}
          style={{
            marginTop: 12,
            marginLeft: 12,
            width: fill(12),
            borderRadius: 15,
          }}
        >
          {}
          <img
            src="/assets/demo/map.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* The file's 382 px map, kept centred on the real map. The pill
              and the pin are laid out on it, from its top-left corner, so
              they keep the file's x on a 430 px phone and stay centred on
              every other width. */}
          <div
            data-pw="demo-address-map-frame"
            className="flex flex-col shrink-0"
            style={{ marginLeft: `calc(50% - ${MAP_W / 2}px)`, width: MAP_W }}
          >
            {/* 198 x 30 at (104, 37) in the card, black; located, 159 wide at
              (124, 58) and `#4A31E7` with a 1 px `#388CFF` line. */}
            <motion.button
              type="button"
              data-pw="demo-address-locate"
              onClick={() => setLocated(true)}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center self-start shrink-0 cursor-pointer"
              initial={false}
              animate={
                located
                  ? {
                      marginLeft: 124 - 12,
                      marginTop: 58 - 12,
                      width: 159,
                      background: C.purple,
                    }
                  : {
                      marginLeft: 104 - 12,
                      marginTop: 37 - 12,
                      width: 198,
                      background: C.ink,
                    }
              }
              transition={GROW}
              style={{
                height: 30,
                borderRadius: 10,
                paddingLeft: 12,
                boxShadow: "0 2px 2px rgba(0,0,0,0.16)",
              }}
            >
              <span
                className="font-medium whitespace-nowrap"
                style={{
                  fontSize: 11,
                  lineHeight: `${lineBox(11)}px`,
                  color: "#F4F4F4",
                }}
              >
                {t(
                  located
                    ? "your location on map"
                    : "Locate your location on map",
                )}
              </span>
              {/* 15 px, 11.5 in from the pill's right end. */}
              <XdIcon
                name="navigation"
                className="shrink-0"
                style={{ marginLeft: "auto", marginRight: 11.5 }}
              />
              <Stroke
                color={located ? C.blue : C.line}
                width={located ? 1 : 0.2}
                radius={10}
              />
            </motion.button>

            {/* The pin at (188.5, 90.5) in the card: 2.5 under the pill. */}
            <AnimatePresence>
              {located && (
                <motion.span
                  key="pin"
                  // Relative, so it is drawn over the map picture (a positioned layer).
                  className="relative block self-start shrink-0"
                  style={{ marginLeft: 188.5 - 12, marginTop: 90.5 - 58 - 30 }}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 18,
                    delay: 0.2,
                  }}
                >
                  <XdIcon name="pin" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* The line goes over the picture: on the box itself the picture covers it. */}
          <Stroke color={C.line} radius={15} />
        </motion.div>

        {/* 11 Medium on baseline 110 in the card, from x 52: centred on the
            card in the file, so it keeps that distance from the centre. */}
        <AnimatePresence>
          {!located && (
            <motion.span
              key="caption"
              className="block shrink-0"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Txt
                mt={gapTo(12 + 79, 110, 11)}
                size={11}
                weight="medium"
                color={C.label}
                style={{ marginLeft: fromCentre(52, ROW.width) }}
              >
                {t("location is accurate, making it easy to receive shipments")}
              </Txt>
            </motion.span>
          )}
        </AnimatePresence>

        <Stroke color={C.line} radius={15} visible={!done} />
      </motion.div>

      <Field
        mt={4}
        label={t("Country | Region")}
        {...fieldLook("country")}
        {...sheetField(() => setSheet("country"))}
        testId="demo-address-country"
      >
        {/* The 18 px flag at (12, 29), the name from x 38 on baseline 43. */}
        <div className="flex items-start shrink-0" style={{ marginTop: 6 }}>
          {countryOf(country).flag && (
            <Icon name={countryOf(country).flag!} size={18} />
          )}
          <Txt ml={countryOf(country).flag ? 8 : 26} size={14} weight="medium">
            {countryName}
          </Txt>
        </div>
      </Field>

      <Field
        mt={4}
        label={t("Select from list")}
        {...fieldLook("place")}
        {...sheetField(() => setSheet("place"))}
        testId="demo-address-place"
      >
        <div className="flex items-start shrink-0" style={{ marginTop: 6 }}>
          <Icon name={placeDone ? "radioOn" : "radio"} />
          <Txt
            ml={8}
            size={14}
            color={placeDone ? C.ink : C.placeholder}
            className="truncate"
            // The rest of the field after the 18 px mark and its 8 px gap
            // (356 in a 406 field).
            style={{ width: fill(18 + 8, 0) }}
          >
            {placeDone
              ? [...[...picked].reverse(), countryName].join(" | ")
              : LEVELS.map((l) => t(l)).join(" | ")}
          </Txt>
        </div>
      </Field>

      <Field mt={4} label={t("Detailed address")} editing={!complete}>
        <FieldInput
          testId="demo-address-detail"
          value={detail}
          onChange={setDetail}
          editing
          placeholder={t("Street address, building, Flat, Door, unit.")}
        />
      </Field>

      <Field mt={4} label={t("Address title")} editing={!complete}>
        <FieldInput
          testId="demo-address-title"
          value={title}
          onChange={setTitle}
          editing
          placeholder={t("Ex: Home, my office, 2 home ect.")}
        />
      </Field>
    </ScreenPage>
  );
}

/** The map card and the map grow together. */
const GROW = { duration: 0.35, ease: [0.4, 0, 0.2, 1] } as const;

/** A field that opens a sheet instead of taking text: a button to the keyboard too. */
const sheetField = (onClick: () => void) => ({
  role: "button",
  tabIndex: 0,
  onClick,
  onKeyDown: (e: React.KeyboardEvent) =>
    (e.key === "Enter" || e.key === " ") && onClick(),
});

/**
 * `Home Page – 95`: the sheet from y 539 with the four countries. "Select"
 * (30 Bold) on baseline 593, "Country | Region" (16 Medium) on 629, then the
 * 406 x 60 rows from y 645, 4 apart: a 30 px flag 12 in, the name from x 54.
 */
function CountrySheet({
  open,
  value,
  onClose,
  onPick,
}: {
  open: boolean;
  value: DemoCountry;
  onClose: () => void;
  onPick: (id: DemoCountry) => void;
}) {
  const { t } = useDemoNav();
  return (
    <Sheet open={open} onClose={onClose} y={539} testId="demo-country-sheet">
      {/* The file centres both lines by eye: "Select" 1 px right of centre,
          the second line 1 px left. */}
      <Txt
        center
        nudge={1}
        mt={gapTo(539 + 13, 593, 30)}
        size={30}
        weight="bold"
      >
        {t("Select")}
      </Txt>
      <Txt
        center
        nudge={-1}
        mt={gapTo(textBottom(593, 30), 629, 16)}
        size={16}
        weight="medium"
      >
        {t("Country | Region")}
      </Txt>
      {COUNTRIES.map((c, i) => {
        const on = c.id === value;
        return (
          <motion.button
            key={c.id}
            type="button"
            data-pw={`demo-country-${c.id}`}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(c.id)}
            className="relative flex items-center shrink-0 cursor-pointer text-left"
            style={{
              marginTop: i === 0 ? 645 - textBottom(629, 16) : 4,
              marginLeft: 12,
              width: fill(12),
              height: 60,
              borderRadius: 15,
              background: on ? C.field : C.card,
            }}
          >
            {c.flag ? (
              <Icon name={c.flag} ml={12} />
            ) : (
              <span
                className="block shrink-0"
                style={{
                  marginLeft: 12,
                  width: 30,
                  height: 30,
                  borderRadius: 5,
                  background: "#EFEFEF",
                }}
              />
            )}
            <Txt ml={54 - 12 - 30} size={14}>
              {t(c.name)}
            </Txt>
            <Stroke color="#402CDD" radius={15} visible={on} />
          </motion.button>
        );
      })}
    </Sheet>
  );
}

/**
 * `Home Page – 97`: the sheet from y 451 that walks down province, district,
 * town and street. The line under the title shows where the walk is: the
 * country and the names picked so far Regular, the level being picked Medium,
 * the levels still to come `#D3D3D3`. Tapping a name already picked walks back
 * to that level.
 *
 * "Select" on baseline 505, the levels on 541, the walk (18 tall) at y 551,
 * the 406 x 42 search box at y 581, and the list from y 631: 406 x 50 rows,
 * 4 apart, the name from x 24.
 */
function PlaceSheet({
  open,
  country,
  picked,
  onPicked,
  onClose,
}: {
  open: boolean;
  country: DemoCountry;
  picked: string[];
  onPicked: (next: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useDemoNav();
  const [walk, setWalk] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const level = Math.min(walk.length, LEVELS.length - 1);
  const choices = choicesAt(country, walk).filter((name) =>
    name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const flag = countryOf(country).flag;

  // Every opening starts from the top level, the way the file shows it.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setWalk(picked.length === LEVELS.length ? [] : picked);
      setQuery("");
    }
  }

  const pick = (name: string) => {
    const next = [...walk, name];
    setQuery("");
    if (next.length === LEVELS.length) {
      onPicked(next);
      onClose();
    } else setWalk(next);
  };

  return (
    <Sheet open={open} onClose={onClose} y={451} testId="demo-place-sheet">
      {/* The file centres these three lines by eye, right of true centre by
          3, 1 and 1.33 px. */}
      <Txt
        center
        nudge={3}
        mt={gapTo(451 + 13, 505, 30)}
        size={30}
        weight="bold"
      >
        {t("Select")}
      </Txt>
      <Txt
        center
        nudge={1}
        mt={gapTo(textBottom(505, 30), 541, 16)}
        size={16}
        weight="medium"
      >
        {LEVELS.map((l) => t(l)).join(" | ")}
      </Txt>

      <div
        className="flex justify-center items-center shrink-0"
        style={{
          marginTop: 551 - textBottom(541, 16),
          height: 18,
          paddingLeft: 1.33 * 2,
        }}
      >
        {flag && <Icon name={flag} size={18} />}
        <span
          className="whitespace-nowrap"
          style={{
            marginLeft: 6,
            fontSize: 14,
            lineHeight: `${lineBox(14)}px`,
            color: C.ink,
          }}
        >
          <span className="font-normal">{t(countryOf(country).name)}</span>
          {LEVELS.map((l, i) => {
            const name = walk[i];
            const current = i === level && !name;
            return (
              <span
                key={l}
                className={current ? "font-medium" : "font-normal"}
                style={{ color: name || current ? C.ink : C.placeholder }}
              >
                {" | "}
                {name ? (
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() => setWalk(walk.slice(0, i))}
                  >
                    {name}
                  </button>
                ) : (
                  t(l)
                )}
              </span>
            );
          })}
        </span>
      </div>

      <Box
        mt={581 - (551 + 18)}
        ml={12}
        w={fill(12)}
        h={42}
        radius={12}
        fill={C.card}
        // Blue while it has focus, like every demo field.
        stroke={searching ? C.blue : C.line}
        className="flex items-start cursor-text"
        onClick={() => searchInput.current?.focus({ preventScroll: true })}
      >
        <Icon name="searchSmall" ml={12} mt={12} />
        <input
          ref={searchInput}
          data-pw="demo-place-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearching(true)}
          onBlur={() => setSearching(false)}
          placeholder={t("Search Province | District | Town | Street")}
          className="block shrink-0 bg-transparent outline-none font-light placeholder:text-[#C4C2C2]"
          style={{
            marginLeft: 38 - 12 - 18,
            marginTop: 11,
            // From x 38 in the box to 12 px from its right edge (356 of 406).
            width: fill(38, 12),
            height: 20,
            fontSize: 14,
            color: C.ink,
            padding: 0,
            border: 0,
          }}
        />
      </Box>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ marginTop: 631 - (581 + 42), scrollbarWidth: "none" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={walk.join("/")}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {choices.map((name, i) => (
              <motion.button
                key={name}
                type="button"
                data-pw={`demo-place-${i}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => pick(name)}
                className="flex items-center shrink-0 cursor-pointer text-left"
                style={{
                  marginTop: i === 0 ? 0 : 4,
                  marginLeft: 12,
                  width: fill(12),
                  height: 50,
                  borderRadius: 12,
                  background: C.card,
                }}
              >
                <Txt ml={12} size={14}>
                  {name}
                </Txt>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

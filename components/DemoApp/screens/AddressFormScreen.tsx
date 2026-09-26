"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData, type DemoCountry } from "../DemoData";
import { COUNTRIES, LEVELS, choicesAt, countryOf } from "../demoPlaces";
import { C, lineBox } from "../demoLayout";
import {
  Field,
  FieldInput,
  InfoBanner,
  ScreenHeader,
  ScreenPage,
  Sheet,
  Txt,
  WideButton,
} from "../ui";

/**
 * Add / edit an address — XD `Home Page – 94` (the form), `– 95` (the country
 * sheet), `– 97` (the place sheet) and `– 99` (filled in).
 *
 * The map card (406 x 121 at y 160) holds the map (382 x 79, radius 15) and
 * the black "Locate your location on map" pill. Tapping it drops the pin: the
 * card grows to 186, the map to 162, the pill turns `#4A31E7` and reads
 * "your location on map", and every field under it moves down 65 — exactly the
 * difference between 94 and 99.
 *
 * Fields, 55 tall, 4 px apart from y 285: country (opens the country sheet),
 * "Select from list" (opens the place sheet), detailed address, title. A field
 * with a value turns `#FCFCFC`; the field in use (focused, or its sheet open)
 * stays white with its line, as on 95 and 97. When the whole form is filled
 * "Add & save" rises and the lines go, the map card's included, as on 99 —
 * at once, even while the last field still has focus.
 *
 * Nothing is looked up: the map is the picture in the file and the places are
 * the mock list in demoPlaces.ts.
 */

/** How much the fields move when the map opens: 186 - 121. */
const MAP_GROWTH = 65;

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
  const [focused, setFocused] = useState<"detail" | "title" | null>(null);
  // The field in use: the text field with focus, or the one whose sheet is open.
  const active = focused ?? sheet;

  const placeDone = picked.length === LEVELS.length;
  const complete = placeDone && detail.trim() !== "" && title.trim() !== "";
  // The lines go the moment the form is complete, even with a field still
  // focused. An open sheet keeps them, as on 95 and 97.
  const done = complete && sheet === null;
  const shift = located ? MAP_GROWTH : 0;
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

  const fieldLook = (id: "country" | "place", filled: boolean) => ({
    editing: !done && (active === id || !filled),
    filledLine: !done,
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

      {/* The map card. */}
      <motion.div
        data-pw="demo-address-map"
        className="absolute overflow-hidden"
        initial={false}
        animate={{
          height: located ? 186 : 121,
          boxShadow: done
            ? "inset 0 0 0 0px #D3D3D3"
            : "inset 0 0 0 0.5px #D3D3D3",
        }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          left: 12,
          top: 160,
          width: 406,
          borderRadius: 15,
          background: C.card,
        }}
      >
        <motion.div
          className="absolute overflow-hidden"
          initial={false}
          animate={{ height: located ? 162 : 79 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{
            left: 12,
            top: 12,
            width: 382,
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
          {/* The line goes over the picture: on the box itself the picture covers it. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: 15, boxShadow: "inset 0 0 0 0.5px #D3D3D3" }}
          />
        </motion.div>

        <motion.button
          type="button"
          data-pw="demo-address-locate"
          onClick={() => setLocated(true)}
          whileTap={{ scale: 0.96 }}
          className="absolute flex items-center cursor-pointer"
          initial={false}
          animate={
            located
              ? {
                  left: 124,
                  top: 58,
                  width: 159,
                  background: C.purple,
                  boxShadow:
                    "0 2px 2px rgba(0,0,0,0.16), inset 0 0 0 1px #388CFF",
                }
              : {
                  left: 104,
                  top: 37,
                  width: 198,
                  background: C.ink,
                  boxShadow:
                    "0 2px 2px rgba(0,0,0,0.16), inset 0 0 0 0.2px #D3D3D3",
                }
          }
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: 30, borderRadius: 10, paddingLeft: 12 }}
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
              located ? "your location on map" : "Locate your location on map",
            )}
          </span>
          <XdIcon
            name="navigation"
            style={{ position: "absolute", right: 11.5, top: 7.5 }}
          />
        </motion.button>

        <AnimatePresence>
          {located && (
            <motion.span
              key="pin"
              className="absolute"
              style={{ left: 188.5, top: 90.5 }}
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

        <AnimatePresence>
          {!located && (
            <motion.span
              key="caption"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Txt
                x={52}
                baseline={110}
                size={11}
                weight="medium"
                color={C.label}
              >
                {t("location is accurate, making it easy to receive shipments")}
              </Txt>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="absolute left-0 top-0 w-full"
        initial={false}
        animate={{ y: shift }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <FieldShell
          y={285}
          label={t("Country | Region")}
          {...fieldLook("country", true)}
          onClick={() => setSheet("country")}
          testId="demo-address-country"
        >
          {countryOf(country).flag && (
            <XdIcon
              name={countryOf(country).flag!}
              size={18}
              style={{ position: "absolute", left: 12, top: 29 }}
            />
          )}
          <Txt x={38} baseline={43} size={14} weight="medium">
            {countryName}
          </Txt>
        </FieldShell>

        <FieldShell
          y={344}
          label={t("Select from list")}
          {...fieldLook("place", placeDone)}
          onClick={() => setSheet("place")}
          testId="demo-address-place"
        >
          <XdIcon
            name={placeDone ? "radioOn" : "radio"}
            style={{ position: "absolute", left: 12, top: 29 }}
          />
          <Txt
            x={38}
            baseline={43}
            size={14}
            color={placeDone ? C.ink : C.placeholder}
            width={356}
            className="truncate"
          >
            {placeDone
              ? [...[...picked].reverse(), countryName].join(" | ")
              : LEVELS.map((l) => t(l)).join(" | ")}
          </Txt>
        </FieldShell>

        <Field
          y={403}
          label={t("Detailed address")}
          {...fieldEditing(done, detail, focused === "detail")}
        >
          <FieldInput
            testId="demo-address-detail"
            value={detail}
            onChange={setDetail}
            onFocus={() => setFocused("detail")}
            onBlur={() => setFocused(null)}
            editing
            placeholder={t("Street address, building, Flat, Door, unit.")}
          />
        </Field>

        <Field
          y={462}
          label={t("Address title")}
          {...fieldEditing(done, title, focused === "title")}
        >
          <FieldInput
            testId="demo-address-title"
            value={title}
            onChange={setTitle}
            onFocus={() => setFocused("title")}
            onBlur={() => setFocused(null)}
            editing
            placeholder={t("Ex: Home, my office, 2 home ect.")}
          />
        </Field>
      </motion.div>
    </ScreenPage>
  );
}

/**
 * A text field is white with a line while empty or in use, `#FCFCFC` once it
 * has text, and `#FCFCFC` with no line when the form is done — focused or not,
 * since a white field with no line is lost on the white page.
 */
const fieldEditing = (done: boolean, value: string, inUse: boolean) => ({
  editing: !done && (inUse || value.trim() === ""),
  line: !done,
});

/** A field that opens a sheet instead of taking text. */
function FieldShell({
  y,
  label,
  editing,
  filledLine,
  onClick,
  testId,
  children,
}: {
  y: number;
  label: string;
  editing: boolean;
  filledLine: boolean;
  onClick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-pw={testId}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="absolute cursor-pointer transition-[background-color,box-shadow] duration-300"
      style={{
        left: 12,
        top: y,
        width: 406,
        height: 55,
        borderRadius: 15,
        background: editing ? C.white : C.card,
        boxShadow:
          editing || filledLine ? `inset 0 0 0 0.5px ${C.line}` : undefined,
      }}
    >
      <Txt x={12} baseline={20} size={12} color={C.label}>
        {label}
      </Txt>
      {children}
    </div>
  );
}

/** `Home Page – 95`: the sheet from y 539 with the four countries. */
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
      <Txt center baseline={593} size={30} weight="bold" style={{ left: 1 }}>
        {t("Select")}
      </Txt>
      <Txt
        center
        baseline={629}
        size={16}
        weight="medium"
        style={{ left: -1 }}
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
            className="absolute cursor-pointer text-left"
            style={{
              left: 12,
              top: 645 + i * 64,
              width: 406,
              height: 60,
              borderRadius: 15,
              background: on ? C.field : C.card,
              boxShadow: on ? "inset 0 0 0 0.5px #402CDD" : undefined,
            }}
          >
            {c.flag ? (
              <XdIcon
                name={c.flag}
                style={{ position: "absolute", left: 12, top: 15 }}
              />
            ) : (
              <span
                className="absolute"
                style={{
                  left: 12,
                  top: 15,
                  width: 30,
                  height: 30,
                  borderRadius: 5,
                  background: "#EFEFEF",
                }}
              />
            )}
            <Txt x={54} baseline={35} size={14}>
              {t(c.name)}
            </Txt>
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
      <Txt center baseline={505} size={30} weight="bold" style={{ left: 3 }}>
        {t("Select")}
      </Txt>
      <Txt
        center
        baseline={541}
        size={16}
        weight="medium"
        style={{ left: 1 }}
      >
        {LEVELS.map((l) => t(l)).join(" | ")}
      </Txt>

      <div
        className="absolute w-full flex justify-center items-center"
        style={{ left: 1.33, top: 551, height: 18 }}
      >
        {flag && <XdIcon name={flag} size={18} />}
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

      <div
        className="absolute"
        style={{
          left: 12,
          top: 581,
          width: 406,
          height: 42,
          borderRadius: 12,
          background: C.card,
          boxShadow: `inset 0 0 0 0.5px ${C.line}`,
        }}
      >
        <XdIcon
          name="searchSmall"
          style={{ position: "absolute", left: 12, top: 12 }}
        />
        <input
          data-pw="demo-place-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search Province | District | Town | Street")}
          className="absolute bg-transparent outline-none font-light placeholder:text-[#C4C2C2]"
          style={{
            left: 38,
            top: 11,
            width: 356,
            height: 20,
            fontSize: 14,
            color: C.ink,
            padding: 0,
            border: 0,
          }}
        />
      </div>

      <div
        className="absolute left-0 w-full overflow-y-auto overscroll-contain"
        style={{ top: 631, height: 932 - 631, scrollbarWidth: "none" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={walk.join("/")}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
            style={{ height: choices.length * 54 }}
          >
            {choices.map((name, i) => (
              <motion.button
                key={name}
                type="button"
                data-pw={`demo-place-${i}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => pick(name)}
                className="absolute cursor-pointer text-left"
                style={{
                  left: 12,
                  top: i * 54,
                  width: 406,
                  height: 50,
                  borderRadius: 12,
                  background: C.card,
                }}
              >
                <Txt x={12} baseline={30} size={14}>
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

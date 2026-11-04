"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "store";
import order from "services/order";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";
import { getLocalizedCountryName } from "utils/countryData";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoNav } from "../screenNav";
import { useProfileData } from "../useProfileData";
import { PlaceParts } from "../placeParts";
import Toast, { useToast } from "../chat/Toast";
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

// The live map (Google Maps), the one checkout's address form uses (D-29).
// It draws nothing on the server; the map card's grey stays under it while
// it loads.
const MapElement = dynamic(
  () => import("components/Cart/MapElement").then((mod) => mod.MapElement),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0" style={{ background: C.card }} />,
  },
);

/**
 * Add / edit an address — XD `Home Page – 94` (the form), `– 95` (the country
 * sheet), `– 97` (the place sheet) and `– 99` (filled in).
 *
 * The map card (406 x 121 at y 160, 12 under the banner) holds the map
 * (382 x 79, radius 15) and the black "Locate your location on map" pill.
 * Tapping it opens the map: the card grows to 186, the map to 162, the pill
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
 * Real data (Stage 4):
 *  - The form is the store's `addressDetails`, the same state checkout's
 *    form and the old address list use: the list opens it on an address
 *    (`startUpdateAddress`) or empty (`initAddressForm`).
 *  - The map is the live map (D-29). Open, a tap on it sets the latitude and
 *    the longitude, inside the country's border; its own marker is the pin.
 *  - The country is the page's country only (S4-7): its sheet lists it alone.
 *  - The place sheet lists the backend's provinces; a tap on one, or two
 *    letters typed, searches the live address index, as the old picker does.
 *    A picked row fills province / city / town / street and centres the map.
 *  - The contact name and phone of a new address are the shopper's (D-29).
 *  - "Add & save" sends it with services/order (`address_saved` /
 *    `address_save_failed` fire there), then goes back to the list.
 *
 * On /demo the page is the document, and the widths are fluid: the map card,
 * the fields, and the rows and the search box of the sheets keep 12 px to
 * both edges (406 on a 430 px phone). The pill and the caption are centred on
 * the map in the file, so they stay centred on it.
 */

/** How much the map card grows when the map opens: 186 - 121. */
const MAP_GROWTH = 65;

/** The map's width in the file (12 px in from both sides of the 406 card). */
const MAP_W = 382;

/** The four levels of a place, as the design names them. */
const LEVELS = ["Province", "District", "Town", "Street"] as const;

/** A row of the live address index. */
type PlaceRow = {
  province?: string;
  city?: string;
  town?: string;
  street?: string;
  building?: string;
  coordinates?: { lat?: number | string; lon?: number | string }[];
};

const known = (value: unknown) =>
  typeof value === "string" && value !== "" && value !== "null" && value !== "Not Entered";

/** A place's parts, province first, as far as they are known. */
const partsOf = (place: PlaceRow | null | undefined): string[] =>
  [place?.province, place?.city, place?.town, place?.street].filter(known) as string[];

/** The country's border from the live index, so the map takes only points inside it. */
function useCountryBorder(iso: string) {
  const [border, setBorder] = useState<{ lat: number; lon: number }[] | null>(null);
  useEffect(() => {
    let gone = false;
    fetchData({
      url: `/api/addresses/CountryBoundaryByIso/${iso.toUpperCase()}`,
      reqTitle: REQUESTS_DATA.COUNTRY_MAP_BORDERS,
      server: "elastic",
      method: "GET",
    })
      .then((res: any) => {
        if (!res?.success) throw new Error(res?.message);
        if (!gone) setBorder(res.country.boundary.coordinates);
      })
      .catch((error) => {
        LogError({ error, scenario: "AddressFormScreen country border", country: iso });
      });
    return () => {
      gone = true;
    };
  }, [iso]);
  return border;
}

export default function AddressFormScreen() {
  const { t, back, locale } = useDemoNav();
  const [countryIso, language] = locale.split("-");
  const profile = useProfileData();
  const [toast, showToast] = useToast();
  const details = useAppStore((s) => s.addressDetails);
  const setDetails = useAppStore((s) => s.setAddressDetails);
  const center = useAppStore((s) => s.center);
  const border = useCountryBorder(countryIso);

  const location = details?.location;
  const hasPoint =
    known(String(location?.latitude ?? "")) && known(String(location?.longitude ?? ""));
  const [located, setLocated] = useState(hasPoint);
  const [sheet, setSheet] = useState<"country" | "place" | null>(null);
  const [saving, setSaving] = useState(false);

  const picked = partsOf(details?.region_details);
  const detail = details?.address_detail ?? "";
  const title = details?.address ?? "";
  const placeDone = picked.length > 0;
  const complete = placeDone && detail.trim() !== "" && title.trim() !== "";
  // The map card's line goes the moment the form is complete, even with a
  // field still focused. An open sheet keeps it, as on 95 and 97.
  const done = complete && sheet === null;
  const countryName = getLocalizedCountryName(countryIso, language);

  // The form is always in the page's country (S4-7).
  useEffect(() => {
    if (details?.Country?.code !== countryIso)
      setDetails({ Country: { name: countryName, code: countryIso } });
  }, [countryIso]);

  // Where the map looks: the saved point, the picked place, or the middle of
  // the country's border.
  const mapCenter = hasPoint
    ? { lat: Number(location.latitude), lng: Number(location.longitude) }
    : center?.lat && center?.lng
      ? { lat: Number(center.lat), lng: Number(center.lng) }
      : border?.length
        ? {
            lat: border.reduce((sum, p) => sum + Number(p.lat), 0) / border.length,
            lng: border.reduce((sum, p) => sum + Number(p.lon), 0) / border.length,
          }
        : undefined;

  const save = async () => {
    if (saving) return;
    const contact: Record<string, string | undefined> =
      details?.contact_info ?? {};
    const contactName =
      contact.contact_person_name || contact.name || profile.name;
    if (!contactName) {
      // The contact name comes from the profile (D-29), and it has none yet.
      showToast(t("Enter Your Name !"));
      return;
    }
    const address = {
      ...details,
      address: title.trim(),
      address_detail: detail.trim(),
      contact_info: {
        ...contact,
        contact_person_name: contactName,
        phone: contact.phone || profile.phoneRaw,
      },
    };
    setSaving(true);
    try {
      if (address.id) {
        await order.UpdateAddressList({ address, callback: () => {} });
        await order.GetAddressList();
        back();
      } else {
        // The callback runs only when the backend took the address.
        let added = false;
        await order.AddAddressList({
          address,
          callback: () => {
            added = true;
          },
        });
        if (added) back();
      }
    } finally {
      setSaving(false);
    }
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
            visible={complete && !saving}
            onClick={() => void save()}
          />
          <CountrySheet
            open={sheet === "country"}
            iso={countryIso}
            name={countryName}
            onClose={() => setSheet(null)}
          />
          <PlaceSheet
            open={sheet === "place"}
            iso={countryIso}
            countryName={countryName}
            picked={picked}
            onPick={(place) => {
              const lat = Number(place.coordinates?.[0]?.lat);
              const lng = Number(place.coordinates?.[0]?.lon);
              if (lat && lng) useAppStore.getState().setMapCenter({ lat, lng });
              setDetails({
                region_details: {
                  province: place.province,
                  city: place.city,
                  town: place.town,
                  street: place.street,
                  building: place.building,
                },
                region: [countryName, ...partsOf(place)].join(" | "),
              });
              setSheet(null);
            }}
            onClose={() => setSheet(null)}
          />
          <Toast text={toast} bottom={140} fixed />
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
          marginInlineStart: 12,
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
            marginInlineStart: 12,
            width: fill(12),
            borderRadius: 15,
          }}
        >
          <div className="absolute inset-0" dir="ltr">
            <MapElement
              center={mapCenter as any}
              cordinates={border}
              // Closed, the map is a picture of the place; open, a tap sets it.
              expanded={located}
              setLocation={(point) => setDetails({ location: point })}
            />
          </div>

          {/* The file's 382 px map, kept centred on the real map. The pill
              is laid out on it, from its top-left corner, so it keeps the
              file's x on a 430 px phone and stays centred on every other
              width. Closed, it covers the map: the first tap opens it. */}
          {!located && (
            <div
              data-pw="demo-address-map-frame"
              className="relative flex flex-col shrink-0"
              dir="ltr"
              style={{ marginLeft: `calc(50% - ${MAP_W / 2}px)`, width: MAP_W }}
            >
              {/* 198 x 30 at (104, 37) in the card, black. */}
              <motion.button
                type="button"
                data-pw="demo-address-locate"
                onClick={() => setLocated(true)}
                whileTap={{ scale: 0.96 }}
                className="relative flex items-center self-start shrink-0 cursor-pointer"
                style={{
                  marginLeft: 104 - 12,
                  marginTop: 37 - 12,
                  width: 198,
                  background: C.ink,
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
                  {t("Locate your location on map")}
                </span>
                {/* 15 px, 11.5 in from the pill's right end. */}
                <XdIcon
                  name="navigation"
                  className="shrink-0"
                  style={{ marginLeft: "auto", marginRight: 11.5 }}
                />
                <Stroke color={C.line} width={0.2} radius={10} />
              </motion.button>
            </div>
          )}

          {/* The line goes over the map: on the box itself the map covers it. */}
          <Stroke color={C.line} radius={15} />
        </motion.div>

        {/* Open: the purple pill on the map, 159 wide, `#4A31E7` with a
            1 px `#388CFF` line. It closes the map again. */}
        <AnimatePresence>
          {located && (
            <motion.button
              key="located"
              type="button"
              data-pw="demo-address-located"
              onClick={() => setLocated(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute flex items-center cursor-pointer"
              style={{
                insetInlineStart: `calc(50% - ${159 / 2}px)`,
                // (124, 58) in the card, as the file draws it.
                top: 58,
                width: 159,
                height: 30,
                borderRadius: 10,
                paddingInlineStart: 12,
                background: C.purple,
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
                {t("your location on map")}
              </span>
              <XdIcon
                name="navigation"
                className="shrink-0"
                style={{ marginInlineStart: "auto", marginInlineEnd: 11.5 }}
              />
              <Stroke color={C.blue} width={1} radius={10} />
            </motion.button>
          )}
        </AnimatePresence>

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
                style={{ marginInlineStart: fromCentre(52, ROW.width) }}
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
          <img
            src={`/icons/flag/${countryIso}.svg`}
            alt=""
            width={18}
            height={18}
            className="shrink-0 object-contain"
            style={{ width: 18, height: 18 }}
          />
          <Txt ml={8} size={14} weight="medium">
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
              ? <PlaceParts parts={[...[...picked].reverse(), countryName]} />
              : LEVELS.map((l) => t(l)).join(" | ")}
          </Txt>
        </div>
      </Field>

      <Field mt={4} label={t("Detailed address")} editing={!complete}>
        <FieldInput
          testId="demo-address-detail"
          value={detail}
          onChange={(value) => setDetails({ address_detail: value })}
          editing
          placeholder={t("Street address, building, Flat, Door, unit.")}
        />
      </Field>

      <Field mt={4} label={t("Address title")} editing={!complete}>
        <FieldInput
          testId="demo-address-title"
          value={title}
          onChange={(value) => setDetails({ address: value })}
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
 * `Home Page – 95`: the sheet from y 539. "Select" (30 Bold) on baseline 593,
 * "Country | Region" (16 Medium) on 629, then the 406 x 60 rows from y 645,
 * 4 apart: a 30 px flag 12 in, the name from x 54.
 *
 * An address is always in the page's country (S4-7), so the sheet lists that
 * country alone, chosen.
 */
function CountrySheet({
  open,
  iso,
  name,
  onClose,
}: {
  open: boolean;
  iso: string;
  name: string;
  onClose: () => void;
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
      <motion.button
        type="button"
        data-pw={`demo-country-${iso}`}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        className="relative flex items-center shrink-0 cursor-pointer text-start"
        style={{
          marginTop: 645 - textBottom(629, 16),
          marginInlineStart: 12,
          width: fill(12),
          height: 60,
          borderRadius: 15,
          background: C.field,
        }}
      >
        <img
          src={`/icons/flag/${iso}.svg`}
          alt=""
          width={30}
          height={30}
          className="shrink-0 object-contain"
          style={{ marginInlineStart: 12, width: 30, height: 30 }}
        />
        <Txt ml={54 - 12 - 30} size={14}>
          {name}
        </Txt>
        <Stroke color="#402CDD" radius={15} />
      </motion.button>
    </Sheet>
  );
}

/**
 * `Home Page – 97`: the sheet from y 451. The line under the title shows the
 * country and the place picked so far (or the levels still to come, in
 * `#D3D3D3`).
 *
 * "Select" on baseline 505, the levels on 541, the line (18 tall) at y 551,
 * the 406 x 42 search box at y 581, and the list from y 631: 406 x 50 rows,
 * 4 apart, the name from x 24.
 *
 * The list is the live one (S4-7), as in checkout's picker: with nothing
 * typed it lists the backend's provinces (GetProvinces); a tap on one, or two
 * letters typed, searches the live address index. A row of the answer is a
 * whole place, and tapping it picks it.
 */
function PlaceSheet({
  open,
  iso,
  countryName,
  picked,
  onPick,
  onClose,
}: {
  open: boolean;
  iso: string;
  countryName: string;
  picked: string[];
  onPick: (place: PlaceRow) => void;
  onClose: () => void;
}) {
  const { t } = useDemoNav();
  const provinces = useAppStore((s) => s.provinces) as string[] | null;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  /** Counts the searches, so an older answer is dropped. */
  const asked = useRef(0);

  // Every opening starts from the provinces.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setResults(null);
    }
  }

  // The provinces come with the address list; read them if they are not here.
  useEffect(() => {
    if (open && !provinces?.length) void order.GetProvinces();
  }, [open]);

  const search = (text: string) => {
    const mine = ++asked.current;
    fetchData({
      url: `/api/addresses/get-address-by-text`,
      method: "POST",
      body: JSON.stringify({ query: text }),
      server: "elastic",
      reqTitle: REQUESTS_DATA.GET_ADDRESS_BY_TEXT,
    })
      .then((res: any) => {
        if (!res?.success) throw new Error(res?.message);
        if (mine === asked.current) setResults(res.results || []);
      })
      .catch((error) => {
        LogError({ error, scenario: "AddressFormScreen place search", search_text: text });
      });
  };

  const onType = (text: string) => {
    setQuery(text);
    if (text.trim().length >= 2) search(text.trim());
    else setResults(null);
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
          paddingInlineStart: 1.33 * 2,
        }}
      >
        <img
          src={`/icons/flag/${iso}.svg`}
          alt=""
          width={18}
          height={18}
          className="shrink-0 object-contain"
          style={{ width: 18, height: 18 }}
        />
        <span
          className="whitespace-nowrap"
          style={{
            marginInlineStart: 6,
            fontSize: 14,
            lineHeight: `${lineBox(14)}px`,
            color: C.ink,
          }}
        >
          <span className="font-normal">{countryName}</span>
          {LEVELS.map((l, i) => {
            const name = picked[i];
            const current = i === picked.length;
            return (
              <span
                key={l}
                className={current ? "font-medium" : "font-normal"}
                style={{ color: name || current ? C.ink : C.placeholder }}
              >
                {" | "}
                {name ? <bdi>{name}</bdi> : t(l)}
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
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setSearching(true)}
          onBlur={() => setSearching(false)}
          placeholder={t("Search Province | District | Town | Street")}
          className="block shrink-0 bg-transparent outline-none font-light placeholder:text-[#C4C2C2]"
          style={{
            marginInlineStart: 38 - 12 - 18,
            marginTop: 11,
            // From x 38 in the box to 12 px from its end edge (356 of 406).
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
            key={results ? "places" : "provinces"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {(results
              ? results.map((place) => ({
                  label: <PlaceParts parts={partsOf(place)} />,
                  onClick: () => onPick(place),
                }))
              : (provinces ?? []).map((province) => ({
                  label: province,
                  onClick: () => {
                    setQuery(province);
                    search(province);
                  },
                }))
            ).map((row, i) => (
              <motion.button
                key={i}
                type="button"
                data-pw={`demo-place-${i}`}
                whileTap={{ scale: 0.98 }}
                onClick={row.onClick}
                className="flex items-center shrink-0 cursor-pointer text-start"
                style={{
                  marginTop: i === 0 ? 0 : 4,
                  marginInlineStart: 12,
                  width: fill(12),
                  height: 50,
                  borderRadius: 12,
                  background: C.card,
                }}
              >
                <Txt ml={12} size={14} className="truncate">
                  {row.label}
                </Txt>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

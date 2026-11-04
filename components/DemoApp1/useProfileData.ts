"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "store";
import order from "services/order";
import { fetchOrdersCount } from "services/orders";
import { GetImageUrl } from "utils/tinyUtils";
import { formatPhoneInternational } from "utils/formatPhone";
import { isValidPhone } from "utils/phone";
import { WALLET_BALANCES } from "../DemoApp/demoWallet";

/**
 * The shopper the profile screens show (Stage 4 of UI-MIGRATION-PLAN.md, A-16).
 *
 * One hook for the profile area. It reads the store (`userProfile`, the
 * address list) and calls the existing services; the screens get only plain
 * values from it. A field with no real source is empty (A-8). The one mock
 * left is the wallet balance, which follows the wallet screen (A-17, S4-5).
 */

/** The backend's gender numbers (the old personal info form). */
export type ProfileGender = "man" | "women" | "other";
const GENDER_FROM_BACKEND: Record<string, ProfileGender> = {
  "1": "man",
  "2": "women",
  "3": "other",
};
export const GENDER_TO_BACKEND: Record<ProfileGender, number> = {
  man: 1,
  women: 2,
  other: 3,
};

/** A saved address, as the profile screens show it. */
export type ProfileAddress = {
  id: number;
  title: string;
  /**
   * Street, town, city and province, as far as they are known: the order the
   * design writes them in. The country comes after them (countryIso).
   */
  area: string[];
  /** The country's ISO code ("sy"), to name it in the page's language. */
  countryIso: string;
  /** The country as the backend wrote it, for a row with no ISO code. */
  country: string;
  detail: string;
  isDefault: boolean;
  /** The backend row, for the edit form. */
  raw: any;
};

export type ProfileData = {
  /** Signed in with a phone. A guest never sees these screens (S4-4). */
  signedIn: boolean;
  /** The market user id, as text. Empty before the profile is loaded. */
  clientId: string;
  name: string;
  /** The raw phone digits, for the API. */
  phoneRaw: string;
  /** The phone for the screen: "+963 900 000 001". */
  phone: string;
  email: string;
  gender: ProfileGender | null;
  /** The photo's full URL, or null. */
  photo: string | null;
  /** The backend's `image` sub path, for the save. */
  imagePath: string | null;
  height: string;
  weight: string;
  phoneVerified: boolean;
  /** Days since the account was made, or null when the profile has no date. */
  clientSince: number | null;
  addresses: ProfileAddress[];
  /**
   * True once the address list has answered (or the store already held
   * addresses). Until then an empty list means "not known yet", not "none".
   */
  addressesLoaded: boolean;
  /** The default address (`is_default`, used as it is: D-29), or null. */
  defaultAddress: ProfileAddress | null;
  /** The number of orders, or null while unknown. */
  ordersCount: number | null;
  /** The USD balance the wallet screen shows (mock, A-17). */
  walletUsd: string;
};

const NOT_SET = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  value === "null" ||
  value === "Not Entered";

const text = (value: unknown) => (NOT_SET(value) ? "" : String(value));

/**
 * An address row in the shape the address form (the store's
 * `addressDetails`) and checkout read: the place under `region_details`, the
 * contact under `contact_info`, the point under `location`. A row that has
 * them nested is kept as it is; a flat row (the fields at the top, as some
 * answers send them) gets them built from its own fields.
 */
export function toFormAddress(row: any): any {
  return {
    ...row,
    region_details: row?.region_details ?? {
      province: row?.province,
      city: row?.city,
      town: row?.town,
      street: row?.street,
      building: row?.building,
    },
    contact_info: row?.contact_info ?? {
      contact_person_name: row?.contact_person_name,
      phone: row?.phone,
      alternative_phone: row?.alternative_phone,
    },
    location: row?.location ?? {
      latitude: row?.latitude ?? null,
      longitude: row?.longitude ?? null,
    },
  };
}

/** The address row of the market backend, as the profile screens show it. */
export function toProfileAddress(row: any): ProfileAddress {
  const form = toFormAddress(row);
  const place = form.region_details;
  return {
    id: row?.id,
    title: text(row?.address),
    area: [place?.street, place?.town, place?.city, place?.province]
      .map(text)
      .filter(Boolean),
    countryIso: text(
      row?.country_iso ?? row?.iso ?? row?.Country?.code,
    ).toLowerCase(),
    country: text(row?.country ?? row?.Country?.name),
    detail: text(row?.address_detail),
    isDefault: Number(row?.is_default) === 1,
    raw: form,
  };
}

const daysSince = (date: unknown): number | null => {
  if (NOT_SET(date)) return null;
  const at = Date.parse(String(date).replace(" ", "T"));
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((Date.now() - at) / 86_400_000));
};

/** Names the backend gives a guest; they are not a real name (services/home). */
const GUEST_NAMES = new Set(["guest", "verified_guest"]);

export function useProfileData(): ProfileData {
  const profile = useAppStore((s) => s.userProfile);
  const addressRows = useAppStore((s) => s.addressLists);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [listAnswered, setListAnswered] = useState(false);

  const phoneRaw = text(profile?.phone);
  const signedIn = isValidPhone(phoneRaw);

  // The address list and the orders count are read once the shopper is
  // known; a guest has neither.
  useEffect(() => {
    if (!signedIn) return;
    let gone = false;
    if (useAppStore.getState().addressLists?.length) setListAnswered(true);
    else
      void order.GetAddressList().finally(() => {
        if (!gone) setListAnswered(true);
      });
    fetchOrdersCount().then((count) => {
      if (!gone && count !== null) setOrdersCount(count);
    });
    return () => {
      gone = true;
    };
  }, [signedIn]);

  const addresses = (Array.isArray(addressRows) ? addressRows : []).map(
    toProfileAddress,
  );
  const rawName = text(profile?.name);
  const rawEmail = text(profile?.email);
  const gender = profile?.gender?.value ?? profile?.gender;

  return {
    signedIn,
    clientId: text(profile?.id),
    name: GUEST_NAMES.has(rawName.toLowerCase()) ? "" : rawName,
    phoneRaw,
    phone: signedIn ? formatPhoneInternational(phoneRaw) : "",
    // A guest account carries a made-up address on @guest.com.
    email: rawEmail.includes("@guest.com") ? "" : rawEmail,
    gender: GENDER_FROM_BACKEND[String(gender)] ?? null,
    photo: profile?.image ? GetImageUrl(profile.image) || null : null,
    imagePath: text(profile?.image) || null,
    height: text(profile?.tall),
    weight: text(profile?.weight),
    // Same rule as the bar (useShellData): `is_phone_verified` is reset by
    // register-guest, so a valid phone on record is what counts.
    phoneVerified: signedIn,
    clientSince: daysSince(profile?.created_at),
    addresses,
    addressesLoaded: listAnswered || addresses.length > 0,
    defaultAddress: addresses.find((a) => a.isDefault) ?? null,
    ordersCount,
    walletUsd:
      WALLET_BALANCES.find((balance) => balance.currency === "usd")?.amount ?? "",
  };
}

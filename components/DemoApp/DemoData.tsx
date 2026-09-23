"use client";

import React, { createContext, useContext, useState } from "react";

/**
 * The shopper the demo shows.
 *
 * Nothing here talks to a backend. The design is not approved yet, so every
 * screen reads and writes this one object, and it lives in the demo shell
 * (DemoShell), which stays mounted across every /demo route. A change made on
 * one screen is still there on the next one, the way the real app will behave
 * once each field is wired to its service.
 *
 * The starting values are the ones the XD file shows.
 */

export type DemoCountry = "tr" | "sy" | "iq" | "lb";

export type DemoAddress = {
  id: string;
  title: string;
  country: DemoCountry;
  /** Street, neighbourhood, district and province, in the order the design writes them. */
  area: string[];
  detail: string;
};

export type DemoGender = "man" | "women" | "other";

export type DemoProfile = {
  clientId: string;
  phone: string;
  name: string;
  email: string;
  emailVerified: boolean;
  gender: DemoGender;
  /** An object URL of the picked photo, or null. */
  photo: string | null;
  height: string;
  weight: string;
  foot: string;
  addresses: DemoAddress[];
  /** Days since the account was made. */
  clientSince: number;
  walletUsd: number;
  orderActions: number;
  /** The address the form opens with, or null for a new one. */
  editingAddress: string | null;
};

export const DEMO_PROFILE: DemoProfile = {
  clientId: "1012-3456",
  phone: "+90 552 800 2000",
  name: "",
  email: "",
  emailVerified: false,
  gender: "man",
  photo: null,
  height: "",
  weight: "",
  foot: "",
  addresses: [],
  clientSince: 23,
  walletUsd: 120,
  orderActions: 1,
  editingAddress: null,
};

type DemoData = {
  profile: DemoProfile;
  update: (patch: Partial<DemoProfile>) => void;
};

const Ctx = createContext<DemoData | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<DemoProfile>(DEMO_PROFILE);
  const update = (patch: Partial<DemoProfile>) =>
    setProfile((prev) => ({ ...prev, ...patch }));
  return <Ctx.Provider value={{ profile, update }}>{children}</Ctx.Provider>;
}

export function useDemoData(): DemoData {
  const value = useContext(Ctx);
  if (!value)
    throw new Error("useDemoData must be used inside DemoDataProvider");
  return value;
}

import type { DemoKey } from "./demoKeys";
import type { XdIconName } from "./xdIcons";

/**
 * What the wallet screens show. Nothing here talks to a backend: the values
 * are the ones the XD file draws (`Home Page – 11`, `– 17`, `– 21`, `– 19`).
 *
 * The notes, dates and names are data, written the way the file shows them.
 * The titles and the statuses are the app's own words, so they are keys.
 */

export type WalletCurrency = "usd" | "syp";

export type WalletBalance = {
  currency: WalletCurrency;
  icon: XdIconName;
  name: DemoKey;
  amount: string;
  code: string;
};

export const WALLET_BALANCES: WalletBalance[] = [
  {
    currency: "usd",
    icon: "dollarWhite",
    name: "Amerikan dollars",
    amount: "1000",
    code: "USD",
  },
  {
    currency: "syp",
    icon: "flagSy",
    name: "syrian pounds",
    amount: "1000",
    code: "SYP",
  },
];

export type WalletEntry = {
  id: string;
  icon: XdIconName;
  /** Money in (down, dark) or money out (up, orange). */
  arrow: "arrowDown" | "arrowUp";
  title: DemoKey;
  date: string;
  note: string;
  amount: string;
  unit: string;
  /** The first row of the file: a 0.5 px line round it and a Bold amount. */
  latest?: boolean;
  /** The entry has a receipt (`Home Page – 18`); a tap on it opens it. */
  receipt?: boolean;
  /** Grey title, note and amount (a blocked or a waiting entry). */
  muted?: boolean;
  status?: DemoKey;
  /** A waiting entry: the time and the day it is due. */
  due?: { time: string; day: string; month: string };
  /** The design x where the status starts. It ends at 406. */
  statusX: number;
};

export const WALLET_ENTRIES: WalletEntry[] = [
  {
    id: "deposit",
    icon: "txDeposit",
    arrow: "arrowDown",
    title: "Cash Deposit",
    date: "03.march",
    note: "Jamilya Center Office 20019rf",
    amount: "1000",
    unit: "$",
    latest: true,
    receipt: true,
    status: "Success",
    statusX: 366,
  },
  {
    id: "withdrawal",
    icon: "txWithdrawal",
    arrow: "arrowUp",
    title: "Cash Withdrawal",
    date: "03.march",
    note: "Jamilya Center Office 20019rf",
    amount: "10",
    unit: "$",
    status: "Success",
    statusX: 366,
  },
  {
    id: "order",
    icon: "txOrder",
    arrow: "arrowUp",
    title: "Order Invoice Payment",
    date: "03.march",
    note: "TR200 Order",
    amount: "-1010",
    unit: "SYP",
    muted: true,
    status: "Blocked",
    statusX: 366,
  },
  {
    id: "refund",
    icon: "txRefund",
    arrow: "arrowDown",
    title: "Refund Order",
    date: "03.march",
    note: "TR200 Order Refund",
    amount: "410",
    unit: "$",
    statusX: 366,
  },
  {
    id: "request",
    icon: "txRequest",
    arrow: "arrowDown",
    title: "Cash in request",
    date: "03.march",
    note: "Via Crypto TRC 20",
    amount: "100",
    unit: "$",
    muted: true,
    status: "Waiting Due in",
    due: { time: "13:59", day: "3", month: "March 2026" },
    statusX: 231,
  },
];

/** `Home Page – 11` lists the first four entries, `– 17` all five. */
export const entriesFor = (currency: WalletCurrency | null) =>
  currency === null ? WALLET_ENTRIES.slice(0, 4) : WALLET_ENTRIES;

/** Who the cash-out form sends to, as `Home Page – 19` fills it. */
export const WALLET_RECIPIENT = {
  phone: "90 552 800 2000",
  name: "Mohamad Katmawi",
} as const;

/** The other ways to cash out on `Home Page – 21`, left to right. */
export const WALLET_PROVIDERS: {
  id: string;
  name: DemoKey;
  picture: string;
  /** The gap before the tile: the file has 8 then 7. */
  gap: number;
}[] = [
  { id: "sham", name: "Sham Cash", picture: "payShamCash", gap: 0 },
  { id: "syriatel", name: "Syriatel Cash", picture: "paySyriatelCash", gap: 8 },
  { id: "irsal", name: "Irsal", picture: "payIrsal", gap: 7 },
];

/**
 * The brand on the cash-out sheet, a name and not a sentence, so it is the
 * same in every language. The file writes "rdb" in small letters, and draws
 * `start` and `bank` Bold.
 */
export const WALLET_BRAND = {
  start: "try",
  rest: "dos | ",
  bank: "rdb",
} as const;

/** The receipt of the cash deposit, as `Home Page – 18` fills it. */
export const WALLET_RECEIPT = {
  number: "200192",
  date: "03.march | 14:55",
  reference: "TSCR10012",
  amount: "100,000",
  code: "USD",
  sender: "Trydos Jamilya Center Office",
  receiver: "+963988222592",
} as const;

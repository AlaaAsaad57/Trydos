import React from "react";
import fs from "node:fs";
import path from "node:path";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/*
  Stage 5 of UI-MIGRATION-PLAN.md (A-13, A-15): the wallet screens mirror on a
  right-to-left page (`ar`, `ku`). Their places are set from the start side,
  and the card slider runs the other way.
*/

// The locale segment the page is on.
const page = vi.hoisted(() => ({ lang: "sy-ar" }));
vi.mock("next/navigation", () => ({ useParams: () => ({ lang: page.lang }) }));

// The screens read the shell's words and its back step; nothing else of it.
vi.mock("components/DemoApp1/Demo1Shell", () => ({
  useDemoNav: () => ({
    shown: null,
    navigate: () => {},
    back: () => {},
    locale: page.lang,
    t: (key: string) => key,
  }),
}));

// jsdom has no ResizeObserver; the cards' row and FileLines measure with one.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

import { DEMO_PROFILE, DemoDataProvider } from "components/DemoApp/DemoData";
import {
  WALLET_BALANCES,
  WALLET_BANK_ACCOUNT,
  WALLET_CASH_IN,
  WALLET_ENTRIES,
  WALLET_RECEIPT,
  WALLET_RECIPIENT,
  WALLET_REQUEST,
} from "components/DemoApp/demoWallet";
import WalletScreen, { cardsRest, slideTo } from "components/DemoApp1/screens/WalletScreen";
import WalletCashInSheet from "components/DemoApp1/screens/WalletCashInSheet";
import WalletCashOutSheet from "components/DemoApp1/screens/WalletCashOutSheet";
import WalletInfoSheet from "components/DemoApp1/screens/WalletInfoSheet";
import WalletReceipt from "components/DemoApp1/screens/WalletReceipt";
import { RequestReady } from "components/DemoApp1/screens/WalletWithdrawalRequest";

// jsdom lays nothing out, so every box is 0 px wide. A 1000 px box lets
// FileLines draw the file's lines, as on a phone.
let widthSpy: ReturnType<typeof vi.spyOn> | undefined;
beforeAll(() => {
  widthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
});
afterAll(() => widthSpy?.mockRestore());

/**
 * Every place in the tree that is set by the physical left or right: an inline
 * margin or padding on one side, or a Tailwind class for one. Such a place stays
 * where it is on a right-to-left page, so the screen is not mirrored there.
 * (The same check as tests/components/DemoApp1/ui.test.tsx.)
 */
const physicalSides = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>("*")].flatMap((el) => {
    const style = el.getAttribute("style") ?? "";
    const classes = String(el.getAttribute("class") ?? "");
    return [
      ...(style.match(/(margin|padding)-(left|right)\s*:[^;]*/g) ?? []),
      ...(classes.match(/(^|\s)(-?m[lr]|p[lr])-\S+|(^|\s)text-(left|right)\b/g) ?? []),
    ].map((found) => `${el.tagName.toLowerCase()} ${found.trim()}`);
  });

const usd = WALLET_BALANCES[0];
const noop = () => {};
const inData = (ui: React.ReactElement) => render(<DemoDataProvider>{ui}</DemoDataProvider>);

describe("the wallet screens on an Arabic page — placed from the start side, so they mirror", () => {
  it.each<[string, () => React.ReactElement]>([
    ["the balance screen (two cards)", () => <WalletScreen />],
    ["Cash In, its first step", () => <WalletCashInSheet open onClose={noop} balance={usd} />],
    ["Cash Out, its first step", () => <WalletCashOutSheet open onClose={noop} balance={usd} />],
    ["Wallet Info", () => <WalletInfoSheet open onClose={noop} balance={usd} />],
    ["the receipt", () => <WalletReceipt open onClose={noop} />],
  ])("%s sets no margin or padding by the physical left or right", (_name, ui) => {
    inData(ui());
    // The sheets open on <body>, outside the render's own box.
    expect(physicalSides(document.body), "these places stay on the left on a right-to-left page").toEqual([]);
  });

  it("the balance screen with a card grown (Cash In, Cash Out, the entries) sets no physical side", () => {
    inData(<WalletScreen />);
    const card = document.querySelector(`[data-pw="demo-wallet-card-${usd.currency}"]`);
    expect(card, "the balance screen shows no USD card to grow").not.toBeNull();
    act(() => {
      fireEvent.click(card!);
    });
    expect(
      document.querySelector(`[data-pw="demo-wallet-cash-in-${usd.currency}"]`),
      "a tap on the USD card did not grow it (no Cash In on it)",
    ).not.toBeNull();
    expect(physicalSides(document.body), "these places stay on the left on a right-to-left page").toEqual([]);
  });
});

/*
  The sheets have deeper steps (the forms, the code, the QR, the withdrawal
  request) that a render reaches only after a long walk of taps. So each wallet
  file is also read as text: a physical side written anywhere in it is a place
  that does not mirror.
*/
describe("the wallet screens' files — no place written by the physical left or right", () => {
  const SCREENS = path.join(process.cwd(), "components/DemoApp1/screens");
  const PHYSICAL =
    /\b(margin|padding)(Left|Right)\b|["'`\s](-?m[lr]|p[lr])-[\w[]|\btext-(left|right)\b/g;

  it.each([
    "WalletScreen.tsx",
    "WalletCashInSheet.tsx",
    "WalletCashOutSheet.tsx",
    "WalletInfoSheet.tsx",
    "WalletReceipt.tsx",
    "WalletWithdrawalRequest.tsx",
  ])("%s", (file) => {
    const lines = fs.readFileSync(path.join(SCREENS, file), "utf8").split("\n");
    const found = lines.flatMap((line, i) =>
      (line.match(PHYSICAL) ?? []).map((hit) => `line ${i + 1}: ${hit.trim()}`),
    );
    expect(found, `${file} places these by the physical left or right`).toEqual([]);
  });
});

describe("the card slider (WalletScreen) — runs from the start side", () => {
  it("on an English page the row moves left to bring a later card in", () => {
    // toBeCloseTo: a rest of -0 moves nothing, the same as 0.
    expect(cardsRest(null, 430, "ltr"), "the two small cards are moved").toBeCloseTo(0);
    expect(cardsRest(0, 430, "ltr"), "the first grown card is moved").toBeCloseTo(0);
    expect(cardsRest(1, 430, "ltr"), "the second card is not brought in from the right").toBe(-430);
  });

  it("on an Arabic page the row moves right to bring a later card in", () => {
    // The cards run from the right on a right-to-left page, so the second one waits on the left.
    expect(cardsRest(0, 430, "rtl"), "the first grown card is moved").toBeCloseTo(0);
    expect(cardsRest(1, 430, "rtl"), "the second card is not brought in from the left").toBe(430);
  });

  it("on an English page a slide to the left goes to the next card, to the right goes back", () => {
    expect(slideTo(0, -80, 0, "ltr"), "a far slide to the left did not go to the next card").toBe(1);
    expect(slideTo(0, -10, -500, "ltr"), "a fast flick to the left did not go to the next card").toBe(1);
    expect(slideTo(1, 80, 0, "ltr"), "a far slide to the right did not go back a card").toBe(0);
    expect(slideTo(1, 10, 0, "ltr"), "a short slow slide changed the card").toBe(1);
  });

  it("on an Arabic page a slide to the right goes to the next card, to the left goes back", () => {
    expect(slideTo(0, 80, 0, "rtl"), "a far slide to the right did not go to the next card").toBe(1);
    expect(slideTo(0, 10, 500, "rtl"), "a fast flick to the right did not go to the next card").toBe(1);
    expect(slideTo(1, -80, 0, "rtl"), "a far slide to the left did not go back a card").toBe(0);
    expect(slideTo(1, -10, 0, "rtl"), "a short slow slide changed the card").toBe(1);
  });

  it("a slide never goes past the first or the last card", () => {
    const last = WALLET_BALANCES.length - 1;
    expect(slideTo(0, 80, 0, "ltr"), "a slide back from the first card left the row").toBe(0);
    expect(slideTo(last, -80, 0, "ltr"), "a slide on from the last card left the row").toBe(last);
    expect(slideTo(0, -80, 0, "rtl"), "a slide back from the first card left the row").toBe(0);
    expect(slideTo(last, 80, 0, "rtl"), "a slide on from the last card left the row").toBe(last);
  });
});

/*
  A value made of digits and signs (a phone, an amount, a date, an id) has no
  direction of its own, so on a right-to-left page the browser orders it by the
  page: "+90 552 800 2000" shows as "2000 800 552 90+", and "-1010 SYP" as
  "SYP 1010-". Each such value must sit in its own left-to-right run.
*/
describe("the wallet's values on an Arabic page — each one reads left to right", () => {
  /** The innermost element whose text holds `text`, in the whole page (sheets are on <body>). */
  const holder = (text: string) => {
    const all = [...document.body.querySelectorAll<HTMLElement>("*")].filter((el) =>
      el.textContent?.includes(text),
    );
    return all.find((el) => ![...el.children].some((child) => child.textContent?.includes(text)));
  };

  /** Checks that `parts` are shown, and that all of them sit in one left-to-right run. */
  const expectLtr = (what: string, ...parts: string[]) => {
    const first = holder(parts[0]);
    expect(first, `${what} ("${parts.join(" ")}") is not shown`).toBeDefined();
    const run = first!.closest('[dir="ltr"]');
    expect(run, `${what} ("${parts.join(" ")}") is not in a left-to-right run, so it is reordered`).not.toBeNull();
    for (const part of parts.slice(1))
      expect(run!.textContent, `${what}: "${part}" is outside the run of "${parts[0]}"`).toContain(part);
  };

  it("the balance screen: each entry's amount with its unit, its date, and the due time", () => {
    inData(<WalletScreen />);
    // The grown USD card lists every entry, the waiting one with its due time too.
    const card = document.querySelector(`[data-pw="demo-wallet-card-${usd.currency}"]`);
    expect(card, "the balance screen shows no USD card to grow").not.toBeNull();
    act(() => {
      fireEvent.click(card!);
    });
    for (const entry of WALLET_ENTRIES) {
      const row = document.querySelector(`[data-pw="demo-wallet-entry-${entry.id}"]`);
      expect(row, `the entry "${entry.id}" is not shown`).not.toBeNull();
      const run = [...row!.querySelectorAll('[dir="ltr"]')].find((el) =>
        el.textContent?.includes(entry.amount),
      );
      expect(run, `the amount of "${entry.id}" (${entry.amount} ${entry.unit}) is not in a left-to-right run`).toBeDefined();
      expect(run!.textContent, `the unit of "${entry.id}" is outside its amount's run`).toContain(entry.unit);
      const date = [...row!.querySelectorAll('[dir="ltr"]')].some((el) => el.textContent === entry.date);
      expect(date, `the date of "${entry.id}" (${entry.date}) is not in its own left-to-right run`).toBe(true);
      if (entry.due) {
        const due = [...row!.querySelectorAll('[dir="ltr"]')].find((el) =>
          el.textContent?.includes(entry.due!.time),
        );
        expect(due, `the due time of "${entry.id}" is not in a left-to-right run`).toBeDefined();
        expect(due!.textContent, `the due day of "${entry.id}" is outside the due time's run`).toContain(entry.due.month);
      }
    }
  });

  it("the balance card: its amount", () => {
    inData(<WalletScreen />);
    const card = document.querySelector(`[data-pw="demo-wallet-card-${usd.currency}"]`);
    expect(card, "the balance screen shows no USD card").not.toBeNull();
    const run = [...card!.querySelectorAll('[dir="ltr"]')].some((el) => el.textContent === usd.amount);
    expect(run, `the card's amount (${usd.amount}) is not in a left-to-right run`).toBe(true);
  });

  it("Wallet Info: the client's id and phone", () => {
    inData(<WalletInfoSheet open onClose={noop} balance={usd} />);
    expectLtr("the client's phone", DEMO_PROFILE.phone);
    expectLtr("the client's id", DEMO_PROFILE.clientId);
  });

  it("the receipt: its number, date, reference, amount with code, and receiver", () => {
    inData(<WalletReceipt open onClose={noop} />);
    expectLtr("the receipt number", WALLET_RECEIPT.number);
    expectLtr("the receipt date", WALLET_RECEIPT.date);
    expectLtr("the receipt reference", WALLET_RECEIPT.reference);
    expectLtr("the receipt amount", WALLET_RECEIPT.amount, WALLET_RECEIPT.code);
    expectLtr("the receiver", WALLET_RECEIPT.receiver);
  });

  it("Cash In through trydos | rdb: the client's id and phone", async () => {
    inData(<WalletCashInSheet open onClose={noop} balance={usd} />);
    const way = document.querySelector('[data-pw="demo-wallet-way-rdb"]');
    expect(way, "Cash In shows no trydos | rdb way").not.toBeNull();
    act(() => {
      fireEvent.click(way!);
    });
    // The steps change in turn: the next one comes in once the last has faded out.
    await waitFor(() =>
      expect(document.querySelector('[data-pw="demo-wallet-cash-in-rdb"]'), "a tap on trydos | rdb did not open its step").not.toBeNull(),
    );
    expectLtr("the client's id", WALLET_CASH_IN.clientId);
    expectLtr("the client's phone", WALLET_CASH_IN.phone);
  });

  it("the Cash Out form: the client's phone, the balance, the recipient's phone field, and the bank account", async () => {
    inData(<WalletCashOutSheet open onClose={noop} balance={usd} />);
    const way = document.querySelector('[data-pw="demo-wallet-way-rdb"]');
    expect(way, "Cash Out shows no trydos | rdb way").not.toBeNull();
    act(() => {
      fireEvent.click(way!);
    });
    // The steps change in turn: the next one comes in once the last has faded out.
    await waitFor(() =>
      expect(document.querySelector('[data-pw="demo-wallet-add-recipient"]'), "a tap on trydos | rdb did not open the form").not.toBeNull(),
    );
    // The file draws the "+" in its own span, before the number.
    expectLtr("the client's phone", WALLET_RECIPIENT.phone, "+");
    // "Available 1000 USD" shows while the amount field is in use.
    const amount = document.querySelector('[data-pw="demo-wallet-amount-input"]');
    expect(amount, "the Cash Out form has no amount field").not.toBeNull();
    act(() => {
      fireEvent.focus(amount!);
    });
    expectLtr("the balance left", usd.amount, usd.code);
    const add = document.querySelector('[data-pw="demo-wallet-add-recipient"]');
    expect(add, "the Cash Out form has no button to add a recipient").not.toBeNull();
    act(() => {
      fireEvent.click(add!);
    });
    const phone = document.querySelector('[data-pw="demo-wallet-authorized-phone-input"]');
    expect(phone, "adding a recipient shows no phone field").not.toBeNull();
    expect(phone!.closest('[dir="ltr"]'), "the recipient's phone field types right to left, so its number is reordered").not.toBeNull();
    // Left to right inside, but it still starts on the right, where its placeholder is.
    expect((phone as HTMLInputElement).style.textAlign, "the recipient's phone field is not aligned to the right on a right-to-left page").toBe("right");
    // The bank's client id shows on the bank tab only.
    const bank = document.querySelector('[data-pw="demo-wallet-tab-bank"]');
    expect(bank, "the Cash Out form has no bank tab").not.toBeNull();
    act(() => {
      fireEvent.click(bank!);
    });
    expectLtr("the bank account id", WALLET_BANK_ACCOUNT.id);
  });

  it("the withdrawal request: its amount with code, reference and date", () => {
    inData(
      <RequestReady head={null} balance={usd} request={{ amount: "250" }} onPicture={noop} />,
    );
    expectLtr("the request amount", "250", usd.code);
    expectLtr("the request reference", WALLET_REQUEST.reference);
    expectLtr("the request date", WALLET_REQUEST.date);
  });
});

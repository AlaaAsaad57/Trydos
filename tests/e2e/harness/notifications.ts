// Everything the app told the shopper, kept until a case asks.
//
// ---------------------------------------------------------------------------
// Why a recorder and not an assertion on the toast
//
// `components/global/NotificationsContainer.tsx` removes a message from the page
// **five seconds** after it appears. A case that acts and then asserts is racing
// that timer: it passes on a fast machine, fails on a loaded one, and the
// failure says "the app said nothing" when the app did say something. Worse, a
// step in between — a re-read, a screen change — can spend the whole five
// seconds on its own.
//
// So this watches the page from before the first navigation and keeps what it
// saw. A case then asks at the end, in its own time, and the answer covers the
// whole case rather than the instant it happened to look.
//
// ---------------------------------------------------------------------------
// What it is for, and what it is not
//
// It answers "was the shopper told anything at all, and what". That matters
// here because several branches on the money path are *silent* failures by
// design — the order is simply not placed — and "the shopper was told" is the
// only difference between a handled refusal and a dead button.
//
// It is **not** a way to assert on wording. Every message goes through
// `translateFunction`, so matching a sentence ties the case to English. Cases
// assert that something was said, and print what it was so the reader can see
// it; they do not require particular words.

import type { Page } from "@playwright/test";

/** The global the page script writes into. Namespaced so it cannot collide with
 *  anything the app owns. */
const STORE = "__trydosE2ENotifications";

/** Start collecting. Call before the first navigation.
 *
 *  `addInitScript` runs on every document this page loads, so the recorder
 *  survives a full page navigation — which the checkout journey does more than
 *  once. */
export const recordNotifications = async (page: Page): Promise<void> => {
  await page.addInitScript((store) => {
    const seen: string[] = [];
    (window as unknown as Record<string, unknown>)[store] = seen;

    const collect = (root: ParentNode): void => {
      root
        .querySelectorAll?.('[data-pw="notification-text"]')
        .forEach((node) => {
          const text = (node.textContent ?? "").trim();
          if (text !== "" && !seen.includes(text)) seen.push(text);
        });
    };

    const start = (): void => {
      collect(document);
      new MutationObserver((records) => {
        for (const record of records) {
          for (const added of record.addedNodes) {
            if (added.nodeType !== 1) continue;
            const element = added as Element;
            if (element.matches?.('[data-pw="notification-text"]')) {
              const text = (element.textContent ?? "").trim();
              if (text !== "" && !seen.includes(text)) seen.push(text);
            }
            collect(element);
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    };

    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start);
  }, STORE);
};

/** Everything the app has said on this page so far, oldest first.
 *
 *  Empty when nothing was said — which is itself a finding for a branch that is
 *  supposed to explain itself. */
export const messagesShown = async (page: Page): Promise<string[]> =>
  await page.evaluate(
    (store) =>
      ((window as unknown as Record<string, unknown>)[store] as string[]) ?? [],
    STORE,
  );

// Where the notification message is painted, relative to an open overlay.
//
// THE BUG THIS FILE PINS
// Adding to the cart, or changing a quantity, can fail. The app then calls
// `showErrorNotification` and the message is drawn by `NotificationsContainer`.
// While the add-to-cart bottom sheet is open, that message was painted BEHIND
// the sheet, so the shopper never saw why the change did not go through.
//
// WHY IT HAPPENED — IT IS NOT "THE Z-INDEX IS TOO LOW"
// `z-index` is a 32-bit signed integer. Every value above 2147483647 is clamped
// down to it. Checked in a real Chromium (the one Playwright 1.62 ships):
// three fixed elements asking for
// 9999999999, 9999999999 and 99999999999999 all report a computed `z-index` of
// "2147483647", and the LAST one in the document is the one `elementFromPoint`
// returns.
//
// This app asks for numbers in the billions everywhere. The bottom sheet asks
// for 9999999999 (components/global/BottomSheet.tsx) and the message asks for
// 9999999999 (components/global/NotificationsContainer.tsx). Both clamp to the
// same number, so they share one layer and document order alone decides. The
// sheet portals itself into <body> when the shopper opens it, which is after the
// layout rendered the message container — so the sheet wins.
//
// So the test does not look at the raw numbers. It checks the two things the
// browser actually uses, in the order the browser uses them: the clamped layer,
// and then document order.
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BottomSheet from "components/global/BottomSheet";
import NotificationsContainer from "components/global/NotificationsContainer";
import {
  showErrorNotification,
  useNotificationStore,
} from "store/notifications/reducer";

// The incoming-call widget is a `.js` file that contains JSX, and the test
// transform refuses to parse JSX out of a `.js` file. It has nothing to do with
// where a message is painted, so it is stood down for this file.
vi.mock("components/Chat/components/CallComponent", () => ({
  default: () => null,
}));

/** The largest `z-index` a browser keeps. Anything above is clamped to it. */
const MAX_Z_INDEX = 2147483647;

/**
 * The layer the browser will really put this element on.
 *
 * Reads the number from the inline style when there is one, and otherwise from
 * the `z-<number>` utility class — jsdom loads no stylesheet, so the class name
 * is the only record of what Tailwind would have written.
 */
const paintLayer = (element: HTMLElement): number => {
  const inline = element.style.zIndex;
  const fromClass = Array.from(element.classList)
    .map((name) => /^z-\[?(\d+)\]?$/.exec(name)?.[1])
    .find(Boolean);
  const asked = Number(inline || fromClass);
  if (!Number.isFinite(asked)) return Number.NaN;
  return Math.min(asked, MAX_Z_INDEX);
};

/** True when `later` is painted after `earlier` on a shared layer. */
const comesAfterInDocument = (earlier: HTMLElement, later: HTMLElement) =>
  Boolean(
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

beforeEach(() => {
  useNotificationStore.getState().clearNotifications();
});

describe("a failure message shown while the add-to-cart sheet is open", () => {
  it("is painted above the sheet, not behind it", () => {
    // The order here is the order of the real flow, and it is the whole point.
    // The layout renders the message container on every page load; the sheet
    // only enters the page later, when the shopper opens it.
    render(<NotificationsContainer />);
    render(
      <BottomSheet isOpen onClose={() => {}}>
        <p>add to cart</p>
      </BottomSheet>,
    );

    act(() => {
      showErrorNotification("Could not update the cart");
    });

    const sheet = document.querySelector<HTMLElement>(
      "div.fixed.inset-0.z-9999999999",
    );
    expect(
      sheet,
      "the add-to-cart bottom sheet did not render its overlay, so this test never compared anything",
    ).not.toBeNull();

    // `data-pw` is this app's test hook. The unit runner leaves Testing
    // Library on its own `data-testid`, so the lookup is done by hand here.
    const message = document
      .querySelector('[data-pw="notification-text"]')
      ?.closest<HTMLElement>("div[style*='z-index']");
    expect(
      message,
      "the failure message did not reach the page at all — showErrorNotification produced nothing to look at",
    ).toBeInstanceOf(HTMLElement);

    expect(
      paintLayer(message!),
      `the message and the sheet no longer share a paint layer (message ${paintLayer(
        message!,
      )}, sheet ${paintLayer(
        sheet!,
      )}), so document order no longer decides and this test proves nothing — re-check both z-index values`,
    ).toBe(paintLayer(sheet!));

    expect(
      comesAfterInDocument(sheet!, message!),
      "the cart failure message is painted BEHIND the add-to-cart sheet: both sit on the same clamped z-index layer, and the message comes before the sheet in the document",
    ).toBe(true);
  });
});

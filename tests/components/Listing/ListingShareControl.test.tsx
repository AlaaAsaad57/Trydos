// The share widget in the listing bar. It shares the address of the listing the
// shopper is looking at — filters, search and sort included, because those all
// live in the address.
//
// It is deliberately much smaller than the product page's share widget: no
// tracking call, no analytics event, no share-to-chat. So what is left to get
// wrong is the address it hands out, and the two places the browser does not
// behave the same everywhere:
//
//   • the native share sheet does not exist in every browser, and asking for it
//     where it does not exist throws;
//   • `mailto:` is blocked on desktop unless it follows a user gesture the
//     browser accepts, which is why desktop opens a compose page instead.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ListingShareControl from "components/Listing/ListingShareControl";

import { restoreLocation, stubLocation } from "tests/mocks/location";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const showSuccessNotification = vi.fn();

vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  showSuccessNotification: (...args: any[]) => showSuccessNotification(...args),
}));

/** A phone, as the browser reports itself. */
const A_PHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
/** A desktop, as the browser reports itself. */
const A_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120";

async function renderShareControl({
  search = "",
  userAgent = A_DESKTOP,
  canNativeShare = false,
}: {
  search?: string;
  userAgent?: string;
  canNativeShare?: boolean;
} = {}) {
  Object.defineProperty(navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
  if (canNativeShare) {
    (navigator as any).share = vi.fn().mockResolvedValue(undefined);
  } else {
    delete (navigator as any).share;
  }

  return renderWithProviders(<ListingShareControl language="en" />, {
    path: "/filters/categories/shoes",
    search,
  });
}

const openTheSheet = async () => {
  await userEvent.click(
    screen.getByRole("button", { name: "Share this page" }),
  );
};

describe("the listing's share widget", () => {
  beforeEach(() => {
    showSuccessNotification.mockReset();
    (navigator as any).clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
  });

  afterEach(() => {
    restoreLocation();
    vi.unstubAllGlobals();
    delete (navigator as any).share;
  });

  describe("copying the link", () => {
    it("copies the whole address, filters and search included", async () => {
      await renderShareControl({ search: "search=shirt&sort=price_asc" });
      await openTheSheet();

      await userEvent.click(
        document.querySelector('[data-pw="copy_link_button"]') as HTMLElement,
      );

      const copied = (navigator.clipboard.writeText as any).mock.calls[0][0];
      expect(
        copied,
        "the filters live in the path, so a copied link that loses them opens an unfiltered listing for whoever receives it",
      ).toContain("/gb-en/filters/categories/shoes");
      expect(
        copied,
        "the search and the sort live in the query, and they are just as much part of what the shopper is looking at",
      ).toContain("search=shirt");
    });

    it("tells the shopper the link was copied", async () => {
      await renderShareControl();
      await openTheSheet();

      await userEvent.click(
        document.querySelector('[data-pw="copy_link_button"]') as HTMLElement,
      );

      await waitFor(() =>
        expect(
          showSuccessNotification,
          "a copy that says nothing is the bug this widget replaced — the old control copied in silence and the shopper could not tell it had worked",
        ).toHaveBeenCalled(),
      );
    });
  });

  describe("sharing by email", () => {
    it("hands a phone the mail app", async () => {
      await renderShareControl({ userAgent: A_PHONE });
      await openTheSheet();

      // jsdom will not follow a `mailto:`, so the navigation is recorded rather
      // than performed. See tests/mocks/location.ts.
      const location = stubLocation({
        pathname: "/gb-en/filters/categories/shoes",
      });

      await userEvent.click(
        document.querySelector('[data-pw="Email"] button') as HTMLElement,
      );

      expect(
        location.href,
        "a phone has a mail app and honours `mailto:`, which is fewer taps than a web compose page",
      ).toContain("mailto:");
      expect(
        decodeURIComponent(location.href ?? ""),
        "the listing's own address has to be in the body, or the mail is empty",
      ).toContain("/gb-en/filters/categories/shoes");
    });

    it("gives a desktop a compose page instead of a mailto the browser would block", async () => {
      await renderShareControl({ userAgent: A_DESKTOP });
      await openTheSheet();

      const opened: string[] = [];
      const realClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        opened.push(this.href);
      };

      await userEvent.click(
        document.querySelector('[data-pw="Email"] button') as HTMLElement,
      );

      HTMLAnchorElement.prototype.click = realClick;

      expect(
        opened[0],
        "desktop browsers block `mailto:` unless it follows a gesture they accept, so a shopper on a laptop would press Email and have nothing happen at all",
      ).toContain("mail.google.com");
      expect(
        decodeURIComponent(opened[0] ?? ""),
        "and the listing's address still has to be in the body",
      ).toContain("/gb-en/filters/categories/shoes");
    });
  });

  describe("the native share sheet", () => {
    it("is not offered in a browser that has none", async () => {
      await renderShareControl({ canNativeShare: false });
      await openTheSheet();

      expect(
        document.querySelector('[data-pw="NativeShare"]'),
        "asking a browser without a share sheet to open one throws, so the button must not be there — the explicit app buttons are the fallback",
      ).not.toBeInTheDocument();
    });

    it("is offered in a browser that has one", async () => {
      await renderShareControl({ canNativeShare: true });
      await openTheSheet();

      await waitFor(() =>
        expect(
          document.querySelector('[data-pw="NativeShare"]'),
          "where the browser does have a share sheet it reaches every app the shopper has installed, which no fixed list of buttons can match",
        ).toBeInTheDocument(),
      );
    });

    it("hands the sheet the listing's own address", async () => {
      await renderShareControl({ canNativeShare: true });
      await openTheSheet();
      await waitFor(() =>
        expect(document.querySelector('[data-pw="NativeShare"]')).toBeInTheDocument(),
      );

      await userEvent.click(
        document.querySelector('[data-pw="NativeShare"] div') as HTMLElement,
      );

      await waitFor(() =>
        expect((navigator as any).share).toHaveBeenCalled(),
      );
      expect(
        (navigator as any).share.mock.calls[0][0].url,
        "the whole point is to share this listing, so the address handed to the sheet must be this listing's",
      ).toContain("/gb-en/filters/categories/shoes");
    });

    it("says nothing when the shopper closes the sheet without sharing", async () => {
      await renderShareControl({ canNativeShare: true });
      const dismissed = Object.assign(new Error("dismissed"), {
        name: "AbortError",
      });
      (navigator as any).share = vi.fn().mockRejectedValue(dismissed);
      await openTheSheet();
      await waitFor(() =>
        expect(document.querySelector('[data-pw="NativeShare"]')).toBeInTheDocument(),
      );

      await userEvent.click(
        document.querySelector('[data-pw="NativeShare"] div') as HTMLElement,
      );

      await waitFor(() => expect((navigator as any).share).toHaveBeenCalled());
      expect(
        showSuccessNotification,
        "changing your mind is not an error and not a success — the shopper dismissed the sheet on purpose and must not be told anything happened",
      ).not.toHaveBeenCalled();
    });
  });

  describe("the apps on offer", () => {
    it("offers every app the widget promises", async () => {
      await renderShareControl();
      await openTheSheet();

      for (const app of ["Facebook", "Twitter", "Whatsapp", "Telegram", "Email"]) {
        expect(
          document.querySelector(`[data-pw="${app}"]`),
          `the ${app} button is missing, so that way of sharing the listing is simply gone from the sheet`,
        ).toBeInTheDocument();
      }
    });
  });
});

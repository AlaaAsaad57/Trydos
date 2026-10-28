// SHELL-01 to SHELL-07 — the new bottom bar on the real pages (Stage 3).
//
//   SHELL-01  Home -> Profile -> Home: each tab opens its page and is the one lit
//   SHELL-02  browser back from the settings page returns home, with Home lit
//   SHELL-03  a deep link to the cart page, and a reload of it, keep the cart
//             page with Cart lit
//   SHELL-04  a product from home and back: no tab lit on the product, Home lit
//             after back, the browser keeps its own scroll restore, and the
//             home page comes back where it was
//   SHELL-05  an old `?cart=true` address lands on the cart page
//   SHELL-06  the add-to-cart sheet covers the bar
//   SHELL-07  a guest's Chat tab opens the sign-in, not the chat
//
// `components/DemoApp1/AppShell.tsx` draws the bar on every page and
// `appRoutes.ts` decides which tab is lit. Their unit tests prove the parts.
// These cases prove the parts work together in a real build, on real pages,
// with the real router and the real browser history.
//
// ---------------------------------------------------------------------------
// Nobody signs in here, and nothing real is written
//
// Every case is a fresh guest, and every case runs closed, the same way as
// `checkout.scripted.spec.ts`: a browser call that changes something and that
// this file did not name is refused and recorded, and each case asserts at the
// end that nothing was refused. These journeys only move between pages, so a
// refused call means a page wrote something nobody expected.
//
// The boot calls that need a market credential are faked, and only those
// (`guestBoot` in `scenarios/`, which says why each one is there): the
// browser's own guest registration, "who is this visitor" (answered as a
// guest, `phone: "0"`), and the two bag reads (empty). The pages, the bar, the
// router and the browser history are all real.
//
// ---------------------------------------------------------------------------
// Every address is under `sy-en`
//
// `gb` is not in the region list, so a `gb-en` page opens the "Select Your
// Region" picker over everything and every tap lands on it (CLAUDE.md, "Opening
// the app by hand"). The country cookie is saved as `sy` before the first page
// too, so the proxy has no reason to send the page anywhere else.
//
// ---------------------------------------------------------------------------
// How a tab is judged
//
// The lit tab carries `aria-current="page"`. "The right tab is lit" is judged
// as two facts, each with its own message: that tab has the mark, and each of
// the other four does not. A bar with two lit tabs is a bug a single check
// would miss.

import { expect, test } from "./fixtures";
import { openAddToBagSheet } from "./actions/cart";
import { closeUnnamedCalls, mockBackend } from "./actions/mock";
import {
  gotoFirstProduct,
  openProductFromLastBoutique,
  readScrollPosition,
  readScrollRestoration,
  scrollHomeToLastBoutique,
  seedLocale,
} from "./actions/nav";
import { newLiveContext } from "./harness/liveSession";
import { openPage } from "./harness/pageOpen";
import { waitForRenewalSettled } from "./harness/renewalGate";
import { guestBoot } from "./scenarios";
import { addToCartSheet, auth, cart, chat, shell, type ShellTab } from "./selectors";

/** The country and language every case shops in. See the header. */
const SHOP = "sy-en";
const SHOP_COUNTRY = "sy";

const HOME_PATH = `/${SHOP}`;
const SETTINGS_PATH = `/${SHOP}/settings`;
const CART_PATH = `/${SHOP}/cart`;

const ALL_TABS: ShellTab[] = ["home", "search", "cart", "chat", "settings"];

/** The tab as the shopper reads it. The Profile tab's id is `settings`. */
const TAB_NAME: Record<ShellTab, string> = {
  home: "Home",
  search: "Search",
  cart: "Cart",
  chat: "Chat",
  settings: "Profile",
};

/** A path with or without its last slash, so `/sy-en` and `/sy-en/` agree. */
const samePath = (url: URL, path: string): boolean =>
  url.pathname.replace(/\/$/, "") === path;

/** A fresh guest with the guard on. Same order as `checkout.scripted.spec.ts`:
 *  the guard is a `context` route and goes in first, then the boot fakes,
 *  before the first page. */
const openGuest = async (browser: Parameters<typeof newLiveContext>[0]) => {
  const context = await newLiveContext(browser);
  const guard = await closeUnnamedCalls(context);
  const page = await context.newPage();
  await mockBackend(page, guestBoot);
  await seedLocale(page, SHOP_COUNTRY);
  return { context, page, guard };
};

/** Open a storefront address, as a shopper typing it or following a link. */
const openAt = async (
  page: Parameters<typeof openPage>[0],
  address: string,
): Promise<void> => {
  await waitForRenewalSettled(page);
  await openPage(page, address);
};

/** The bar is on screen: its Home tab is. The `<nav>` itself has no width, so
 *  it can never read as visible (see `shell` in `selectors.ts`). */
const expectBar = async (
  page: Parameters<typeof openPage>[0],
  where: string,
): Promise<void> => {
  await expect(
    shell.tab(page, "home"),
    `${where} drew no bottom bar: the Home tab is not on screen`,
  ).toBeVisible();
};

/** `tab` is lit on this page, and no other tab is. */
const expectLit = async (
  page: Parameters<typeof openPage>[0],
  tab: ShellTab,
  where: string,
): Promise<void> => {
  await expect(
    shell.tab(page, tab),
    `on ${where} the ${TAB_NAME[tab]} tab is not lit`,
  ).toHaveAttribute("aria-current", "page");

  for (const other of ALL_TABS.filter((t) => t !== tab)) {
    await expect(
      shell.tab(page, other),
      `on ${where} the ${TAB_NAME[other]} tab is lit too, beside ${TAB_NAME[tab]}`,
    ).not.toHaveAttribute("aria-current", "page");
  }
};

/** No tab is lit: the page belongs to no tab. */
const expectNoneLit = async (
  page: Parameters<typeof openPage>[0],
  where: string,
): Promise<void> => {
  for (const tab of ALL_TABS) {
    await expect(
      shell.tab(page, tab),
      `on ${where} the ${TAB_NAME[tab]} tab is lit, but this page belongs to no tab`,
    ).not.toHaveAttribute("aria-current", "page");
  }
};

/** The address is `path`. The predicate form lets `/sy-en` and `/sy-en/`
 *  agree; the message says which path was wanted. */
const expectPath = async (
  page: Parameters<typeof openPage>[0],
  path: string,
  message: string,
): Promise<void> => {
  await expect(page, `${message} (expected the path ${path})`).toHaveURL(
    (url) => samePath(url, path),
    { timeout: 45_000 },
  );
};

/** The guard's verdict, asked at the end of every case. */
const expectNothingRefused = (guard: { blocked: () => string[] }): void => {
  expect(
    guard.blocked(),
    "this case reached calls it never named that change something, and each one was refused",
  ).toEqual([]);
};

// Each case has its own guest, its own context and its own page, and nothing
// below is shared between cases. So they may run side by side in the solo
// lane. On the default single worker this changes nothing.
test.describe.configure({ mode: "parallel" });

test("SHELL-01 Home -> Profile -> Home lights the right tab on each page", async ({
  browser,
}) => {
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("the home page shows the bar with Home lit", async () => {
      await openAt(page, HOME_PATH);
      await expectBar(page, "the home page");
      await expectLit(page, "home", "the home page");
    });

    await test.step("the Profile tab opens the settings page", async () => {
      await shell.tab(page, "settings").click();
      await expectPath(
        page,
        SETTINGS_PATH,
        "pressing the Profile tab did not open the settings page",
      );
    });

    await test.step("Profile is lit on the settings page", async () => {
      await expectLit(page, "settings", "the settings page");
    });

    await test.step("the Home tab opens the home page", async () => {
      await shell.tab(page, "home").click();
      await expectPath(
        page,
        HOME_PATH,
        "pressing the Home tab on the settings page did not open the home page",
      );
    });

    await test.step("Home is lit again on the home page", async () => {
      await expectLit(page, "home", "the home page after the Home tab");
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

test("SHELL-02 browser back from the settings page returns home with Home lit", async ({
  browser,
}) => {
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("the shopper starts on the home page", async () => {
      await openAt(page, HOME_PATH);
      await expectBar(page, "the home page");
    });

    await test.step("the Profile tab opens the settings page", async () => {
      await shell.tab(page, "settings").click();
      await expectPath(
        page,
        SETTINGS_PATH,
        "pressing the Profile tab did not open the settings page",
      );
      await expectLit(page, "settings", "the settings page");
    });

    await test.step("browser back returns to the home page", async () => {
      await waitForRenewalSettled(page);
      await page.goBack();
      await expectPath(
        page,
        HOME_PATH,
        "browser back from the settings page did not return to the home page",
      );
    });

    await test.step("Home is lit after back", async () => {
      await expectBar(page, "the home page after back");
      await expectLit(page, "home", "the home page after back");
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

test("SHELL-03 a deep link to the cart page, and a reload, keep the cart page with Cart lit", async ({
  browser,
}) => {
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("the deep link opens the cart page", async () => {
      await openAt(page, CART_PATH);
      await expectPath(
        page,
        CART_PATH,
        "a deep link to the cart page did not stay on the cart page",
      );
      await expect(
        cart.page(page),
        "the address is the cart page, but the page drew no cart",
      ).toBeVisible();
    });

    await test.step("Cart is lit on the deep-linked cart page", async () => {
      await expectBar(page, "the cart page");
      await expectLit(page, "cart", "the cart page");
    });

    await test.step("a reload keeps the cart page", async () => {
      await waitForRenewalSettled(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expectPath(
        page,
        CART_PATH,
        "a reload of the cart page did not stay on the cart page",
      );
      await expect(
        cart.page(page),
        "after a reload the address is the cart page, but the page drew no cart",
      ).toBeVisible();
    });

    await test.step("Cart is still lit after the reload", async () => {
      await expectBar(page, "the cart page after a reload");
      await expectLit(page, "cart", "the cart page after a reload");
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

test("SHELL-04 a product from home and back: no tab lit on it, Home lit after, the home page back where it was", async ({
  browser,
}) => {
  test.setTimeout(3 * 60 * 1000);
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("the shopper starts on the home page", async () => {
      await openAt(page, HOME_PATH);
      await expectBar(page, "the home page");
    });

    // Down the page first, so "back where it was" means something: at the top
    // it would pass whatever the app did. One round of the boutique list is
    // enough for that and keeps the case short; GUEST-42 walks the whole list.
    let parked = 0;
    await test.step("the shopper scrolls down the home page", async () => {
      const reached = await scrollHomeToLastBoutique(page, { maxRounds: 1 });
      parked = reached.scrollY;
      expect(
        parked,
        `the home page only scrolled ${parked}px, which is too little for coming back to mean anything`,
      ).toBeGreaterThan(400);
    });

    await test.step("a product opens from the home page", async () => {
      // Names its own faults: no product tile, no product address, no title.
      await openProductFromLastBoutique(page);
    });

    await test.step("the bar is on the product page and no tab is lit", async () => {
      await expectBar(page, "the product page");
      await expectNoneLit(page, "the product page");
    });

    await test.step("browser back returns to the home page", async () => {
      await waitForRenewalSettled(page);
      await page.goBack();
      await expectPath(
        page,
        HOME_PATH,
        "browser back from the product page did not return to the home page",
      );
    });

    await test.step("Home is lit after back", async () => {
      await expectBar(page, "the home page after back");
      await expectLit(page, "home", "the home page after back");
    });

    await test.step("the browser keeps its own scroll restore", async () => {
      // The shell must never take this over (A-4). The product overlay takes it
      // for its own journey and has to give it back, so it is polled.
      await expect
        .poll(async () => await readScrollRestoration(page), {
          timeout: 10_000,
          message:
            "history.scrollRestoration is not \"auto\" on the home page after " +
            "back, so the browser no longer puts the page back where it was",
        })
        .toBe("auto");
    });

    await test.step("the home page is back where the shopper left it", async () => {
      // Polled: the place is put back after the page is shown again, a later
      // frame than the address change. Same 150 px allowance as GUEST-42.
      await expect
        .poll(async () => await readScrollPosition(page), { timeout: 15_000 })
        .toBeGreaterThan(parked - 150)
        .catch(() => undefined);
      const returned = await readScrollPosition(page);
      expect(
        Math.abs(returned - parked),
        `the home page came back at ${returned}px after being left at ${parked}px`,
      ).toBeLessThanOrEqual(150);
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

test("SHELL-05 an old ?cart=true address lands on the cart page", async ({
  browser,
}) => {
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("the old cart address moves to the cart page", async () => {
      await openAt(page, `${HOME_PATH}?cart=true`);
      await expectPath(
        page,
        CART_PATH,
        "the old ?cart=true address did not move to the cart page",
      );
    });

    await test.step("the cart page drops the old cart key", async () => {
      expect(
        new URL(page.url()).searchParams.has("cart"),
        `the cart page still carries the old cart key: ${page.url()}`,
      ).toBe(false);
    });

    await test.step("the cart page is drawn with Cart lit", async () => {
      await expect(
        cart.page(page),
        "the address moved to the cart page, but the page drew no cart",
      ).toBeVisible();
      await expectBar(page, "the cart page");
      await expectLit(page, "cart", "the cart page");
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

test("SHELL-06 the add-to-cart sheet covers the bar", async ({ browser }) => {
  test.setTimeout(3 * 60 * 1000);
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("a product opens from the home page", async () => {
      await openAt(page, HOME_PATH);
      await expectBar(page, "the home page");
      await gotoFirstProduct(page);
    });

    await test.step("Buy opens the add-to-cart sheet", async () => {
      // Opens the sheet and waits until it has read the product. Adds nothing.
      await openAddToBagSheet(page);
    });

    await test.step("the add-to-cart sheet covers the bar", async () => {
      // The sheet is a modal: `BottomSheet` draws it on <body> over the whole
      // screen, above the bar. So a tap where the Cart tab is must land in the
      // sheet. A tap is not sent, because the sheet's own buttons sit there and
      // one of them adds to the bag. The browser is asked what a tap would hit
      // instead, at the centre of the Cart tab.
      const box = await shell.tab(page, "cart").boundingBox();
      expect(
        box,
        "the Cart tab has no box on the product page, so there is no place to test",
      ).not.toBeNull();
      const x = box!.x + box!.width / 2;
      const y = box!.y + box!.height / 2;

      // The sheet's panel is the parent of `add-to-cart-sheet`: `BottomSheet`
      // puts its children straight into the panel, and the fixed bottom row
      // with the price and "Add To Bag" is a sibling of that marker. The
      // browser is asked from inside the panel and from inside the bar, so no
      // marker is named here.
      const readHit = async () => {
        const fromSheet = await addToCartSheet.sheet(page).evaluate(
          (marker, at) => {
            const hit = document.elementFromPoint(at.x, at.y);
            const named = hit?.closest("[data-pw]")?.getAttribute("data-pw");
            return {
              inSheet: Boolean(hit && marker.parentElement?.contains(hit)),
              what: hit
                ? `<${hit.tagName.toLowerCase()}> inside data-pw="${named ?? "none"}"`
                : "nothing",
            };
          },
          { x, y },
        );
        const inBar = await shell.bar(page).evaluate((bar, at) => {
          const hit = document.elementFromPoint(at.x, at.y);
          return Boolean(hit && bar.contains(hit));
        }, { x, y });
        return { ...fromSheet, inBar };
      };

      // Polled, because the panel slides up for 0.3 s after it opens. The
      // poll only waits; the two checks below judge, with what was hit.
      let last = { inSheet: false, inBar: false, what: "not read yet" };
      await expect
        .poll(
          async () => {
            last = await readHit();
            return last.inSheet && !last.inBar;
          },
          { timeout: 10_000 },
        )
        .toBe(true)
        .catch(() => undefined);

      expect(
        last.inBar,
        `a tap at the centre of the Cart tab reaches the bar while the ` +
          `add-to-cart sheet is open: it hits ${last.what}`,
      ).toBe(false);
      expect(
        last.inSheet,
        `a tap at the centre of the Cart tab does not land in the open ` +
          `add-to-cart sheet, so the sheet does not cover the bar: it hits ${last.what}`,
      ).toBe(true);
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

test("SHELL-07 a guest's Chat tab opens the sign-in, not the chat", async ({
  browser,
}) => {
  const { context, page, guard } = await openGuest(browser);

  try {
    await test.step("the shopper starts on the home page", async () => {
      await openAt(page, HOME_PATH);
      await expectBar(page, "the home page");
    });

    await test.step("the Chat tab asks the guest to sign in", async () => {
      await shell.tab(page, "chat").click();
      await expect(
        auth.getStartedTitle(page),
        "pressing the Chat tab as a guest did not open the sign-in widget",
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step("the chat did not open for the guest", async () => {
      await expect(
        chat.window(page),
        "pressing the Chat tab as a guest opened the chat window, but a guest has no chat",
      ).toBeHidden();
    });
  } finally {
    expectNothingRefused(guard);
    await context.close();
  }
});

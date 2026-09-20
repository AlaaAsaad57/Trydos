// SD-01 to SD-12 — the seller dashboard: getting in, moving around, and the
// two sections a seller changes by hand.
//
//   SD-01  settings -> the shop list -> this shop's dashboard
//   SD-02  every section tile opens its own section
//   SD-03  the slide-out menu opens a section, and back walks out again
//   SD-04  the locations list shows what the backend holds
//   SD-05  the status filter narrows the list to what the backend returns
//   SD-06  a location created through the form exists on the backend
//   SD-07  an edit made through the form reaches the backend
//   SD-08  Deactivate then Activate, and the backend holds each new status
//   SD-09  the location form refuses a bad value without asking any backend
//   SD-10  the shop-info form is filled from the shop's own record
//   SD-11  shop info refuses an empty and a non-numeric contact
//   SD-12  a contact and address change reaches the backend, and is put back
//
// ---------------------------------------------------------------------------
// This file signs nobody in
//
// The QA seed (`harness/qaSeed.ts`) already signed in as the QA seller before
// any case here started, and it now hands its cookie jar on
// (`QA_SELLER_SESSION_PATH`). Every case opens that jar. A second sign-in would
// send another one-time code for the same account, against limits that are not
// ours — and it would prove nothing this suite is about.
//
// So a failure that says "there is no saved signed-in session" is **the seed's**
// failure, not this file's. Read the setup project's own line first.
//
// ---------------------------------------------------------------------------
// What is proved on screen, and what is proved at the backend
//
// Every scenario is acted through the real form. The judgement is a direct read
// of the same endpoint afterwards. The two are different claims and no message
// here mixes them: the screen redrawing proves the browser's copy changed, and
// only the read proves the core backend stored anything. A save that answers
// 200, updates the screen and writes nothing passes the first and fails the
// second — which is exactly the failure worth catching.
//
// ---------------------------------------------------------------------------
// SD-02 judges navigation and nothing else, on purpose
//
// It proves each tile puts its own section in the address and that the content
// area followed. It does **not** wait for that section's data. A dead comments
// backend is a real finding, but it belongs to the comments spec — turning a
// navigation case red for it would tell the reader the wrong thing, which is
// the one outcome this suite exists to prevent.
//
// ---------------------------------------------------------------------------
// Every write lands on a row this suite owns
//
// A location **cannot be deleted** — the API exposes none. So SD-06 creates one
// with a name carrying the run's own timestamp, SD-07 and SD-08 change that same
// row, and the group deactivates it at the end. Those three run in order for
// that reason, and for no other.
//
// SD-12 is the one case that writes to the shop's own record. It changes the
// contact and the address only, never the name (the seed finds its shop by
// name) and never the logo or banner (a media upload cannot be undone). It puts
// back exactly what it found, media included.
//
// ---------------------------------------------------------------------------
// SD-12 IS RED, and it is red for the backend. Do not "fix" it here.
//
//   PUT /shop/info -> 422
//   "The image field must be a string."   detailed_error: image, banner
//
// Measured on 2026-09-20, and nothing in this repository can make it pass.
// The QA shop has no logo, so `GET /shop/info` answers with the FOLDER and no
// filename — `https://…/image/upload/seller/`. `ShopInfo.handleSubmit` sends
// the last path segment of whatever it was given (`normializeImage`), which for
// that value is the empty string, and the backend refuses it. Sending `null`
// instead is refused by the same rule, measured with a direct call.
//
// So **`PUT /shop/info` offers no value that means "leave the media alone"**,
// and a seller whose shop has no logo cannot save their contact or their
// address at all. That is a contract gap in the core backend, not a defect in
// this file and not one in `ShopInfo.tsx`.
//
// It stays red on purpose, naming the backend and quoting it. Do not skip it,
// do not loosen it, and do not give the QA shop a logo to make it green — the
// logo would hide the finding, which is the whole value of the case. It turns
// green by itself the day the backend accepts a shop with no media.

import { expect, test } from "./fixtures";
import { gotoAbout } from "./actions/nav";
import {
  currentTab,
  DASHBOARD_HOME,
  enterDashboardFromShopCard,
  gotoSellerDashboard,
  offeredTabs,
  openSellerProfileFromSettings,
  openTab,
  openTabFromMenu,
  pressDashboardBack,
  shopCard,
  tabInUrl,
} from "./actions/sellerDashboard";
import {
  attemptLocationSave,
  cardStatus,
  deactivateLocationQuietly,
  fillLocationForm,
  fieldValidity,
  filterLocationsByStatus,
  listedLocationIds,
  locationCard,
  locationCountryOptions,
  newQaLocationName,
  openCreateLocationForm,
  openEditLocationForm,
  openLocations,
  readLocation,
  readLocationForm,
  readLocations,
  saveLocationForm,
  toggleLocationStatus,
} from "./actions/shopLocations";
import {
  attemptShopInfoSave,
  bareMediaName,
  fillShopInfo,
  openShopInfo,
  readShopInfo,
  readShopInfoForm,
  restoreShopInfoQuietly,
  saveShopInfo,
  type BackendShopInfo,
} from "./actions/shopInfo";
import { shopLocations, shopInfo as shopInfoSelectors } from "./selectors";
import { handOnSession, openSignedInSession } from "./harness/liveSession";
import {
  QA_SELLER_SESSION_PATH,
  readQaSeedState,
  qaSellerSessionSaved,
} from "./harness/qaSeedState";
import { hasQaSeed } from "./harness/env";

/** The country the QA shop is priced and seeded in. The dashboard endpoints
 *  read the country from the **header**, so every case must be on the same one
 *  the seed used or the two look as if they disagree. */
const QA_COUNTRY = "sy";

/** The case that was supposed to leave the session behind. Named in every
 *  "there is nothing to run against" message, so a reader never comes looking
 *  for a fault here. */
const SESSION_OWNER = "the QA seed (setup project)";

test.beforeEach(() => {
  test.skip(
    !hasQaSeed(),
    "the seller dashboard suite needs the QA seed — Shopper B, the admin login, the media store and QA_VIEW_SECRET. See tests/e2e/README.md.",
  );
  test.skip(
    !qaSellerSessionSaved(),
    "the QA seed left no signed-in session, so it skipped or stopped before it signed in. Read the setup project's own line — it names the setting that is missing.",
  );
});

/** Open the QA seller's session and land on a storefront page.
 *
 *  Every case starts here. The storefront page is not decoration: the locale
 *  prefix only exists once the app has chosen a country, and every dashboard
 *  address is built from it. */
const openSellerPage = async (browser: import("@playwright/test").Browser) => {
  const context = await openSignedInSession(
    browser,
    QA_SELLER_SESSION_PATH,
    SESSION_OWNER,
  );
  const page = await context.newPage();
  await gotoAbout(page, { country: QA_COUNTRY });
  return { context, page };
};

/** Write the session back as it is **now**, then close the browser.
 *
 *  **Not tidiness — the fix for a measured failure.** On the first run of this
 *  file SD-01 passed and the other nine cases failed, all of them showing
 *  "Member", "Access Denied" and the app's own "your session has expired"
 *  screen. Nothing was wrong with the dashboard: a saved cookie jar is a
 *  snapshot, SD-01 did authenticated work, the app exchanged the credential for
 *  a fresh pair, and every later case then opened a pair the backend had
 *  already superseded. The app recovered the only way it can — as a guest.
 *
 *  `handOnSession` writes the jar back **only while it is still this account**,
 *  so a case that failed its way down to a guest cannot hand that on as if it
 *  were a session. `profile.live.spec.ts` and `auth.live.spec.ts` have done
 *  this from the start; this file simply did not, and the nine red cases were
 *  the whole of the difference.
 *
 *  Called from every `finally`, so a failing case still hands on what it had. */
const closeSellerPage = async (
  context: import("@playwright/test").BrowserContext,
  page: import("@playwright/test").Page,
): Promise<void> => {
  await handOnSession(context, page, QA_SELLER_SESSION_PATH);
  await context.close();
};

// ---------------------------------------------------------------------------
// SD-01 — the route a seller actually takes
// ---------------------------------------------------------------------------

test("SD-01 a seller reaches their own dashboard from the settings screen", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await test.step("the settings screen offers the seller's own entrance", async () => {
      await openSellerProfileFromSettings(page);
    });

    await test.step("the shop list holds the QA shop", async () => {
      const card = await shopCard(page, { sellerId: seed.sellerId });
      const name = (await card.innerText()).trim();
      expect(
        name,
        `the card for seller ${seed.sellerId} rendered with no text at all, so the shop list drew an empty row`,
      ).not.toBe("");
    });

    await test.step("Enter Dashboard opens this shop's dashboard", async () => {
      await enterDashboardFromShopCard(page, { sellerId: seed.sellerId });
    });

    await test.step("the dashboard opens on its home screen", async () => {
      const opened = await currentTab(page);
      expect(
        opened,
        `the dashboard opened straight into the "${opened}" section instead of its home screen`,
      ).toBe(DASHBOARD_HOME);
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// SD-02 / SD-03 — moving between sections
// ---------------------------------------------------------------------------

test("SD-02 every section tile opens its own section", async ({ browser }) => {
  test.setTimeout(240_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await gotoSellerDashboard(page, { sellerId: seed.sellerId });

    const tabs = await offeredTabs(page);

    // The list is permission filtered by the app, so it is a fact about this
    // account rather than a number this suite may assume. Asserted as "there
    // is at least one", never as a count — a count breaks the day a section is
    // added and says nothing about which one is missing.
    expect(
      tabs.join(", "),
      "the dashboard home offered this seller no section at all, so its permissions call returned nothing usable",
    ).not.toBe("");

    // The two sections this file goes on to cover must be among them, by name.
    // Without this, a run where the account lost those permissions would report
    // every later case as a broken screen.
    for (const needed of ["locations", "shopInfo"] as const) {
      expect(
        tabs,
        `the QA seller is not offered the "${needed}" section, so the cases below have nothing to open — this account's permissions changed`,
      ).toContain(needed);
    }

    for (const tab of tabs) {
      await test.step(`the "${tab}" tile opens the "${tab}" section`, async () => {
        await openTab(page, tab);

        expect(
          tabInUrl(page),
          `the "${tab}" tile left the address on "${tabInUrl(page)}"`,
        ).toBe(tab);

        await pressDashboardBack(page, { expect: "home" });
      });
    }
  } finally {
    await closeSellerPage(context, page);
  }
});

test("SD-03 the slide-out menu opens a section, and back walks out again", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await gotoSellerDashboard(page, { sellerId: seed.sellerId });

    await test.step("the menu opens the Locations section", async () => {
      await openTabFromMenu(page, "locations");
    });

    await test.step("back closes the section and stays on the dashboard", async () => {
      await pressDashboardBack(page, { expect: "home" });
    });

    await test.step("back again leaves the dashboard for the shop list", async () => {
      await pressDashboardBack(page, { expect: "shopList" });
      await shopCard(page, { sellerId: seed.sellerId });
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// SD-04 / SD-05 — reading the locations list
// ---------------------------------------------------------------------------

test("SD-04 the locations list shows the rows the backend holds", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await openLocations(page, { sellerId: seed.sellerId, direct: true });

    const seeded = await test.step("the backend holds the seed's own location", async () =>
      readLocation(page, {
        sellerId: seed.sellerId,
        locationId: seed.locationId,
        what: "reading the shop's locations",
      }));

    await test.step("the seed's location is drawn in the list", async () => {
      const card = await locationCard(page, {
        locationId: seed.locationId,
        what: "the locations list",
      });

      // The name, not merely the row. A row that renders with an empty name is
      // a row the reader cannot act on, and it would pass a presence check.
      await expect(
        shopLocations.cardName(card),
        `the row for location ${seed.locationId} is on screen but carries no name, so the list drew an empty card`,
      ).toHaveText(seeded.name, { timeout: 20_000 });
    });

    await test.step("every row the backend returned was drawn", async () => {
      const onBackend = (
        await readLocations(page, { sellerId: seed.sellerId })
      ).map((row) => String(row.id));
      const onScreen = await listedLocationIds(page);

      const missing = onBackend.filter((id) => !onScreen.includes(id));
      expect(
        missing.join(", "),
        `the backend returned ${onBackend.length} locations on the first page and the list drew ${onScreen.length}; these ids were not drawn: ${missing.join(", ")}`,
      ).toBe("");
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

test("SD-05 the status filter narrows the list to what the backend returns", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await openLocations(page, { sellerId: seed.sellerId, direct: true });

    for (const [label, value, status] of [
      ["active", "1", 1],
      ["inactive", "0", 0],
    ] as const) {
      await test.step(`the ${label} filter shows only the ${label} rows`, async () => {
        await filterLocationsByStatus(page, value);

        const expected = (
          await readLocations(page, { sellerId: seed.sellerId, status })
        ).map((row) => String(row.id));
        const onScreen = await listedLocationIds(page);

        const extra = onScreen.filter((id) => !expected.includes(id));
        expect(
          extra.join(", "),
          `the ${label} filter drew rows the backend did not return for status=${status}: ${extra.join(", ")}`,
        ).toBe("");

        const missing = expected.filter((id) => !onScreen.includes(id));
        expect(
          missing.join(", "),
          `the ${label} filter left out rows the backend did return for status=${status}: ${missing.join(", ")}`,
        ).toBe("");
      });
    }
  } finally {
    await closeSellerPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// SD-06 / SD-07 / SD-08 — one location this suite owns, from creation onwards
//
// Ordered, and the order is the whole point: there is no delete, so every write
// lands on the row SD-06 made rather than on a row the environment already had.
// ---------------------------------------------------------------------------

test.describe.serial("a location this suite creates and then changes", () => {
  /** The row SD-06 made. Read by SD-07 and SD-08, and deactivated at the end. */
  let createdId: string | number | null = null;
  let createdName = "";

  test.afterAll(async ({ browser }) => {
    test.setTimeout(120_000);
    if (createdId === null) return;

    // A location cannot be deleted, so leaving it inactive is the most tidying
    // that is possible. Quiet on purpose: a tidy-up that threw would replace
    // the failure the run was actually reporting.
    const { context, page } = await openSellerPage(browser);
    try {
      const seed = readQaSeedState();
      const said = await deactivateLocationQuietly(page, {
        sellerId: seed.sellerId,
        locationId: createdId,
      });
      test.info().annotations.push({ type: "tidy-up", description: said });
    } finally {
      await closeSellerPage(context, page);
    }
  });

  test("SD-06 a location created through the form exists on the backend", async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const seed = readQaSeedState();
    const { context, page } = await openSellerPage(browser);

    try {
      await openLocations(page, { sellerId: seed.sellerId, direct: true });
      await openCreateLocationForm(page);

      const countries = await test.step("the create form offers a country to pick", async () => {
        const options = await locationCountryOptions(page);
        expect(
          options.length,
          "the location create form offered no country at all, so the core backend refused GET /shop/locations/lookups",
        ).toBeGreaterThan(0);
        return options;
      });

      createdName = newQaLocationName();

      await test.step("the seller fills the form and saves", async () => {
        await fillLocationForm(page, {
          name: createdName,
          countryId: countries[0].value,
          address: "QA automated test row — safe to deactivate",
          latitude: "33.513805",
          longitude: "36.276526",
        });
        await saveLocationForm(page, { what: "creating a location" });
      });

      const stored = await test.step("the backend holds the new location", async () => {
        const rows = await readLocations(page, { sellerId: seed.sellerId });
        const row = rows.find((one) => one.name === createdName);
        expect(
          row,
          `creating a location: the core backend's list holds no row named "${createdName}" out of the ${rows.length} it returned, so the save never reached it`,
        ).toBeTruthy();
        return row!;
      });

      createdId = stored.id;

      await test.step("the new location carries the address that was typed", async () => {
        expect(
          stored.address ?? "",
          `creating a location: the core backend stored the row but not its address (it returned "${stored.address ?? ""}")`,
        ).toBe("QA automated test row — safe to deactivate");
      });

      await test.step("a new location starts active", async () => {
        expect(
          stored.status,
          `creating a location: the backend stored the row with status ${stored.status}; a new location is supposed to start active`,
        ).toBe(1);
      });

      await test.step("the new location is drawn in the list", async () => {
        await locationCard(page, {
          locationId: stored.id,
          what: "after creating a location",
        });
      });
    } finally {
      await closeSellerPage(context, page);
    }
  });

  test("SD-07 an edit made through the form reaches the backend", async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    expect(
      createdId,
      "SD-06 never created a location, so there is nothing to edit — read that case's failure",
    ).not.toBeNull();

    const seed = readQaSeedState();
    const { context, page } = await openSellerPage(browser);
    const newAddress = `QA automated test row — edited ${Date.now()}`;

    try {
      await openLocations(page, { sellerId: seed.sellerId, direct: true });
      await openEditLocationForm(page, { locationId: createdId! });

      await test.step("the edit form is filled from the row it is editing", async () => {
        const form = await readLocationForm(page);
        expect(
          form.name,
          `the edit form opened for location ${createdId} holding the name "${form.name}" instead of the row's own name`,
        ).toBe(createdName);
      });

      await test.step("the seller changes the address and saves", async () => {
        await fillLocationForm(page, { address: newAddress });
        await saveLocationForm(page, { what: "editing a location" });
      });

      await test.step("the backend holds the new address", async () => {
        const stored = await readLocation(page, {
          sellerId: seed.sellerId,
          locationId: createdId!,
          what: "editing a location",
        });
        expect(
          stored.address ?? "",
          `editing a location: the core backend still holds the old address for location ${createdId}`,
        ).toBe(newAddress);
      });

      await test.step("the list on screen shows the new address", async () => {
        const card = await locationCard(page, {
          locationId: createdId!,
          what: "after editing a location",
        });
        await expect(
          shopLocations.cardAddress(card),
          `the backend took the new address but the list kept drawing the old one for location ${createdId}`,
        ).toHaveText(newAddress, { timeout: 20_000 });
      });
    } finally {
      await closeSellerPage(context, page);
    }
  });

  test("SD-08 Deactivate then Activate, and the backend holds each status", async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    expect(
      createdId,
      "SD-06 never created a location, so there is nothing to activate — read that case's failure",
    ).not.toBeNull();

    const seed = readQaSeedState();
    const { context, page } = await openSellerPage(browser);

    try {
      await openLocations(page, { sellerId: seed.sellerId, direct: true });

      await test.step("the row starts active", async () => {
        const card = await locationCard(page, {
          locationId: createdId!,
          what: "before changing a location's status",
        });
        expect(
          await cardStatus(card),
          `location ${createdId} was not active before this case pressed anything, so it cannot prove a deactivation`,
        ).toBe("1");
      });

      await test.step("Deactivate moves the row to inactive", async () => {
        await toggleLocationStatus(page, {
          locationId: createdId!,
          expected: "0",
        });
      });

      await test.step("the backend holds the row as inactive", async () => {
        const stored = await readLocation(page, {
          sellerId: seed.sellerId,
          locationId: createdId!,
          what: "deactivating a location",
        });
        expect(
          stored.status,
          `deactivating a location: the screen showed location ${createdId} as inactive but the core backend still holds status ${stored.status}`,
        ).toBe(0);
      });

      await test.step("Activate moves the row back to active", async () => {
        await toggleLocationStatus(page, {
          locationId: createdId!,
          expected: "1",
        });
      });

      await test.step("the backend holds the row as active again", async () => {
        const stored = await readLocation(page, {
          sellerId: seed.sellerId,
          locationId: createdId!,
          what: "reactivating a location",
        });
        expect(
          stored.status,
          `reactivating a location: the screen showed location ${createdId} as active but the core backend still holds status ${stored.status}`,
        ).toBe(1);
      });
    } finally {
      await closeSellerPage(context, page);
    }
  });
});

// ---------------------------------------------------------------------------
// SD-09 — the form's own refusals
// ---------------------------------------------------------------------------

test("SD-09 the location form refuses a bad value without asking any backend", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await openLocations(page, { sellerId: seed.sellerId, direct: true });
    await openCreateLocationForm(page);

    await test.step("an empty name is refused, and nothing is sent", async () => {
      await fillLocationForm(page, { name: "", address: "" });
      const outcome = await attemptLocationSave(page, { graceMs: 8_000 });

      expect(
        outcome.requested,
        `an empty location name was sent to the ${outcome.backend || "core"} backend anyway (it answered ${outcome.status}); the form is supposed to refuse it first`,
      ).toBe(false);

      await expect(
        shopLocations.fieldError(page, "name"),
        "the location form refused to save but said nothing under the name box, so the seller is not told why",
      ).toBeVisible({ timeout: 10_000 });
    });

    // The latitude box is `<input type="number" min={-90} max={90}>`, so the
    // BROWSER refuses it and `handleSubmit` is never reached. That is why this
    // step reads the browser's verdict rather than the component's inline
    // error: the component's own latitude rule cannot fire for a value typed
    // into that box, and asserting it would be asserting unreachable code.
    await test.step("a latitude outside -90..90 is refused, and nothing is sent", async () => {
      const countries = await locationCountryOptions(page);
      await fillLocationForm(page, {
        name: newQaLocationName(),
        countryId: countries[0]?.value ?? "",
        latitude: "999",
      });

      const outcome = await attemptLocationSave(page, { graceMs: 8_000 });

      expect(
        outcome.requested,
        `a latitude of 999 was sent to the ${outcome.backend || "core"} backend anyway (it answered ${outcome.status}); it is supposed to be refused before any backend is asked`,
      ).toBe(false);

      const verdict = await fieldValidity(shopLocations.latitudeInput(page));

      expect(
        verdict.rangeOverflow,
        `the latitude box accepted 999 as a valid value, so nothing stops the seller saving a coordinate that is not on the Earth (the browser said: "${verdict.message || "nothing"}")`,
      ).toBe(true);

      expect(
        verdict.message,
        "the latitude box is marked invalid but carries no message, so the seller is refused without being told why",
      ).not.toBe("");
    });

    await test.step("the form is closed without saving anything", async () => {
      await shopLocations.cancelButton(page).click();
      await expect(
        shopLocations.form(page),
        "Cancel did not close the location form",
      ).toBeHidden({ timeout: 20_000 });
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// SD-10 / SD-11 / SD-12 — the shop's own record
// ---------------------------------------------------------------------------

test("SD-10 the shop-info form is filled from the shop's own record", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await openShopInfo(page, { sellerId: seed.sellerId, direct: true });

    const stored = await readShopInfo(page, {
      sellerId: seed.sellerId,
      what: "reading the shop's record",
    });
    const onScreen = await readShopInfoForm(page);

    await test.step("the name box holds the shop's own name", async () => {
      expect(
        onScreen.name,
        `the shop-info form drew "${onScreen.name}" in the name box while the core backend holds "${stored.name}"`,
      ).toBe(stored.name);
    });

    await test.step("the contact box holds the shop's own contact", async () => {
      expect(
        onScreen.contact,
        "the shop-info form drew a different contact number than the core backend holds",
      ).toBe(stored.contact ?? "");
    });

    await test.step("the address box holds the shop's own address", async () => {
      expect(
        onScreen.address,
        "the shop-info form drew a different address than the core backend holds",
      ).toBe(stored.address ?? "");
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

test("SD-11 shop info refuses an empty and a non-numeric contact", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await openShopInfo(page, { sellerId: seed.sellerId, direct: true });
    const original = await readShopInfoForm(page);

    await test.step("an empty contact is refused, and nothing is sent", async () => {
      await fillShopInfo(page, { contact: "" });
      const outcome = await attemptShopInfoSave(page, { graceMs: 8_000 });

      expect(
        outcome.requested,
        `an empty shop contact was sent to the ${outcome.backend || "core"} backend anyway (it answered ${outcome.status}); the form is supposed to refuse it first`,
      ).toBe(false);

      await expect(
        shopInfoSelectors.fieldError(page, "contact"),
        "the shop-info form refused to save but said nothing under the contact box, so the seller is not told why",
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("a contact with letters in it is refused, and nothing is sent", async () => {
      await fillShopInfo(page, { contact: "not-a-number" });
      const outcome = await attemptShopInfoSave(page, { graceMs: 8_000 });

      expect(
        outcome.requested,
        `a shop contact containing letters was sent to the ${outcome.backend || "core"} backend anyway (it answered ${outcome.status}); the form is supposed to refuse it first`,
      ).toBe(false);

      await expect(
        shopInfoSelectors.fieldError(page, "contact"),
        "the shop-info form refused a contact with letters in it but said nothing under the contact box",
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("the box is put back to what it held", async () => {
      // Nothing was written, so this only tidies the screen. Left in because a
      // case that ends on an invalid form makes the next reader wonder whether
      // it saved.
      await fillShopInfo(page, { contact: original.contact });
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

test("SD-12 a contact and address change reaches the backend, and is put back", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  /** Exactly what the shop held before this case touched it, media included.
   *  The write replaces every field, so the restore has to hand all of them
   *  back — see `bareMediaName` in `actions/shopInfo.ts`. */
  let snapshot: BackendShopInfo | null = null;

  // Two values this case invents, so no message here ever prints something the
  // environment already held.
  const stamp = String(Date.now()).slice(-8);
  const newContact = `9715${stamp}`;
  const newAddress = `QA automated test — shop address ${stamp}`;

  try {
    await openShopInfo(page, { sellerId: seed.sellerId, direct: true });

    const before = await test.step("the shop's record is read before anything is written", async () =>
      readShopInfo(page, {
        sellerId: seed.sellerId,
        what: "before changing the shop's record",
      }));
    snapshot = before;

    await test.step("the seller changes the contact and the address and saves", async () => {
      await fillShopInfo(page, { contact: newContact, address: newAddress });
      await saveShopInfo(page, { what: "changing the shop's contact and address" });
    });

    const stored = await test.step("the backend is asked what it now holds", async () =>
      readShopInfo(page, {
        sellerId: seed.sellerId,
        what: "after changing the shop's record",
      }));

    await test.step("the core backend holds the new contact", async () => {
      expect(
        stored.contact ?? "",
        `changing the shop's contact: the core backend still holds a different number after the save answered successfully`,
      ).toBe(newContact);
    });

    await test.step("the core backend holds the new address", async () => {
      expect(
        stored.address ?? "",
        `changing the shop's address: the core backend returned "${stored.address ?? ""}" after the save answered successfully`,
      ).toBe(newAddress);
    });

    await test.step("the shop's name was not changed by this save", async () => {
      expect(
        stored.name,
        `changing the shop's contact and address also changed its name to "${stored.name}" — the QA seed finds its shop by name, so this would break the next run`,
      ).toBe(before.name);
    });

    // Compared by the bare filename, not by the whole stored value. The form
    // sends the last path segment back (`normializeImage` in `ShopInfo.tsx`)
    // while the read returns a full address, so the two spellings of the same
    // picture differ and a raw comparison would be red for no reason.
    await test.step("the shop's logo was not changed by this save", async () => {
      expect(
        bareMediaName(stored.image) ?? "",
        "changing the shop's contact and address also cleared or replaced its logo",
      ).toBe(bareMediaName(before.image) ?? "");
    });

    await test.step("the shop's banner was not changed by this save", async () => {
      expect(
        bareMediaName(stored.banner) ?? "",
        "changing the shop's contact and address also cleared or replaced its banner",
      ).toBe(bareMediaName(before.banner) ?? "");
    });
  } finally {
    if (snapshot) {
      const said = await restoreShopInfoQuietly(page, {
        sellerId: seed.sellerId,
        snapshot,
      });
      test.info().annotations.push({ type: "tidy-up", description: said });
    }
    await closeSellerPage(context, page);
  }
});

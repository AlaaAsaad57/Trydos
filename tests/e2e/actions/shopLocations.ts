// The Locations section of the seller dashboard.
//
// ---------------------------------------------------------------------------
// Every scenario is acted through the screen and judged at the backend
//
// The click, the typing and the save all go through the real form, because that
// is what these cases exist to cover. The **judgement** is a direct read of
// `/shop/locations` afterwards, through the app's own proxy.
//
// The two are not the same claim and the messages here never mix them. The list
// redrawing proves the browser's copy changed; only the read proves the core
// backend stored anything. A save that answers 200, updates the screen and
// writes nothing would pass the first and fail the second, and that is the
// whole point.
//
// ---------------------------------------------------------------------------
// A location cannot be deleted
//
// The API exposes no delete — `LocationsTab` says so too. So a case that
// creates one can never tidy up fully; the most it can do is deactivate the row
// it made. `deactivateLocation` exists for exactly that, and the spec calls it
// in a `finally` so a case that fails half-way still leaves the active list
// clean.
//
// ---------------------------------------------------------------------------
// Nothing here prints an address, a coordinate or a shop's contact number
//
// They are not credentials, but this repository is public and failure messages
// are published. A message may quote a value the **test itself invented** — a
// generated location name, a status code, the backend's own refusal — and never
// a value that was already on the environment.

import { expect, type Locator, type Page } from "@playwright/test";

import { sellerDashboard, shopLocations } from "../selectors";
import {
  SELLER_SERVICE,
  sellerCall,
  type CallResult,
} from "../harness/sellerDashboard";
import {
  dashboardLocale,
  gotoSellerDashboard,
  openTab,
  refuseIfSessionExpired,
} from "./sellerDashboard";

/** One location exactly as `/shop/locations` returns it. */
export type BackendLocation = {
  id: number;
  name: string;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  status: 0 | 1;
  country: { id: number; name?: string; nicename?: string } | null;
};

/** The mark every row this suite creates carries.
 *
 *  Kept in step with `services/elastic/qaFilter.ts` by the unit suite. A
 *  location has no slug and is never indexed, so the mark cannot hide it from
 *  shoppers the way a product's slug does. It is here for a person reading the
 *  shop's location list, so a test row is obviously a test row. */
export const QA_LOCATION_PREFIX = "trydos-qa-";

/** A name no earlier run can already hold.
 *
 *  **The backend refuses a duplicate**: a location's name is unique per shop
 *  per country, and a repeat answers 422 with `detailed_error[].code = "name"`.
 *  There is no delete, so yesterday's row is still there and a fixed name would
 *  make the create case pass exactly once per environment and be red for ever
 *  after. The run's own timestamp is what keeps it honest. */
export const newQaLocationName = (): string =>
  `${QA_LOCATION_PREFIX}loc-${Date.now()}`;

/** One read or write against the locations endpoints, through the app's proxy.
 *
 *  `x-country` is taken from the address the run is on. These endpoints read
 *  the country from the **header**, not the query string, so a call that
 *  guesses answers about a different market and the difference looks like a
 *  fault the app caused. */
const call = async (
  page: Page,
  options: {
    sellerId: string | number;
    url: string;
    method: string;
    body?: unknown;
    note?: string;
  },
): Promise<CallResult> =>
  sellerCall(page, {
    service: SELLER_SERVICE.dashboard,
    url: options.url,
    method: options.method,
    body: options.body,
    sellerId: String(options.sellerId),
    country: dashboardLocale(page).country,
    note: options.note,
  });

/** How many pages of `/shop/locations` a read will walk.
 *
 *  Matches the QA seed's own cap for the same reason -- see `qaSeed.ts`. */
const MAX_LOCATION_PAGES = 10;

/** Every location the backend holds for this shop, optionally one status only.
 *
 *  Fails naming the backend and quoting the status it answered with, so a read
 *  that could not be made is never reported as "the row is missing". */
export const readLocations = async (
  page: Page,
  options: { sellerId: string | number; status?: 0 | 1 },
): Promise<BackendLocation[]> => {
  const all: BackendLocation[] = [];
  let pageNumber = 1;
  let lastPage = 1;

  // **Every page.** `/shop/locations` returns eleven rows at a time, and this
  // shop has more than that: `SD-06` adds one on every run and a location can
  // never be deleted. Reading page one alone reported the seed's own location
  // as missing -- `SD-04` failed with "holds no row with id 56, out of 11 it
  // returned" once the leaked rows had pushed it onto page two.
  //
  // The cap is a stop rather than a budget: the list only grows, so "read to
  // the end" has no end on an old environment.
  while (pageNumber <= lastPage && pageNumber <= MAX_LOCATION_PAGES) {
    const query =
      options.status === undefined
        ? `?page=${pageNumber}`
        : `?status=${options.status}&page=${pageNumber}`;

    const result = await call(page, {
      sellerId: options.sellerId,
      url: `/shop/locations${query}`,
      method: "GET",
      note: `read the shop's locations (page ${pageNumber})`,
    });

    expect(
      result.ok,
      `the core backend refused to list this shop's locations (page ${pageNumber}, ${result.status}${result.message ? `: ${result.message}` : ""})`,
    ).toBe(true);

    const rows = result.data?.locations;
    expect(
      Array.isArray(rows),
      `the core backend answered the locations list without a "locations" array, so there is nothing to judge (page ${pageNumber}, status ${result.status})`,
    ).toBe(true);

    all.push(...(rows as BackendLocation[]));

    lastPage = Number(result.data?.meta?.last_page ?? 1) || 1;
    pageNumber += 1;
  }

  return all;
};

/** One location the backend holds, or a failure that says it is not there.
 *
 *  `what` names the thing the caller was proving, so the message describes the
 *  step rather than the helper. */
export const readLocation = async (
  page: Page,
  options: { sellerId: string | number; locationId: string | number; what: string },
): Promise<BackendLocation> => {
  const rows = await readLocations(page, { sellerId: options.sellerId });
  const row = rows.find((one) => String(one.id) === String(options.locationId));

  expect(
    row,
    `${options.what}: the core backend's location list holds no row with id ${options.locationId}, out of ${rows.length} it returned`,
  ).toBeTruthy();

  return row as BackendLocation;
};

/** Open the Locations section and wait until it has finished loading.
 *
 *  "Finished" is the list, the empty state **or** the load error — all three
 *  mean the section stopped waiting. The error is then failed on by name, so a
 *  section whose backend refused is never reported as an empty shop. */
export const openLocations = async (
  page: Page,
  options: { sellerId: string | number; direct?: boolean },
): Promise<void> => {
  if (options.direct) {
    await gotoSellerDashboard(page, {
      sellerId: options.sellerId,
      tab: "locations",
    });
  } else {
    await openTab(page, "locations");
  }

  await settleLocations(page);
};

/** Wait for the list to stop loading, and fail by name if it could not load.
 *
 *  **Four endings are waited for together, not one after another.** The list,
 *  the empty state, the section's own load error, and the Access Denied block
 *  all mean "it stopped waiting"; waiting for only the first would spend the
 *  whole timeout on a section that had already given its answer, and then
 *  report a timeout instead of the answer. Each ending is then failed on by its
 *  own name, so "the backend refused", "this account may not look" and "nothing
 *  ever rendered" are three different sentences. */
export const settleLocations = async (page: Page): Promise<void> => {
  const list = shopLocations.list(page);
  const empty = shopLocations.empty(page);
  const failed = shopLocations.loadError(page);
  const denied = sellerDashboard.accessDenied(page);

  await expect(
    list.or(empty).or(failed).or(denied),
    "the Locations section never finished loading — it drew no list, no empty state, no error and no refusal",
  ).toBeVisible({ timeout: 45_000 });

  // Checked before the other two: a guest session produces the refusal, and
  // blaming the permission would send the reader to the wrong place.
  await refuseIfSessionExpired(page, "opening the Locations section");

  await expect(
    denied,
    "the Locations section refused to draw: this account does not hold READ_LOCATIONS for this shop",
  ).toBeHidden();

  await expect(
    failed,
    "the Locations section could not load: the core backend refused GET /shop/locations",
  ).toBeHidden();
};

/** Narrow the list to one status, and wait for the redraw.
 *
 *  `"all"`, `"1"` (active) or `"0"` (inactive) — the values the select itself
 *  carries, never the translated labels beside them. */
export const filterLocationsByStatus = async (
  page: Page,
  status: "all" | "1" | "0",
): Promise<void> => {
  await shopLocations.statusFilter(page).selectOption(status);
  await settleLocations(page);
};

/** The ids drawn on the page that is open, in the order the list drew them. */
const idsOnThisPage = async (page: Page): Promise<string[]> =>
  shopLocations
    .anyCard(page)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-location-id") ?? ""),
    );

/** Every id the list draws, across all of its pages.
 *
 *  **All pages, because the backend read is all pages.** `readLocations` above
 *  walks the paginator, so comparing it against one screenful reports every row
 *  past the first page as "the list left it out" — `SD-05` failed with "the
 *  inactive filter left out rows the backend did return for status=0: 62" when
 *  row 62 was simply on page two.
 *
 *  This shop has more rows than fit on a page and always will: `SD-06` adds one
 *  per run and a location can never be deleted.
 *
 *  **It leaves the list on its last page.** Every caller compares and then
 *  stops, so nothing depends on which page is open afterwards; a caller that
 *  does must open the section again. */
export const listedLocationIds = async (page: Page): Promise<string[]> => {
  const all = await idsOnThisPage(page);
  const next = shopLocations.paginationNext(page);

  for (let turn = 0; turn < MAX_LOCATION_PAGES; turn += 1) {
    if (!(await next.isEnabled().catch(() => false))) break;

    const before = (await idsOnThisPage(page)).join(",");
    await next.click();

    // The click swaps the rows in place, so "the page changed" is the signal —
    // there is no navigation to wait for.
    await expect
      .poll(async () => (await idsOnThisPage(page)).join(","), {
        timeout: 15_000,
        message:
          "the locations list did not draw a different page after Next was pressed",
      })
      .not.toBe(before);

    all.push(...(await idsOnThisPage(page)));
  }

  return all;
};

/** One row on screen, asserted to be there. Returns it so the caller can read
 *  inside it. */
export const locationCard = async (
  page: Page,
  options: { locationId: string | number; what: string },
): Promise<Locator> => {
  const card = shopLocations.card(page, options.locationId);

  // **Pages forward until the row is on screen, the way a seller would.**
  //
  // The section draws one page at a time (`LocationsTab.tsx` keeps `page` and
  // `meta` and renders a `Pagination` control), and this shop has more rows
  // than fit: `SD-06` adds one on every run and a location can never be
  // deleted, so the seed's own row drifts further back with every run. Looking
  // only at whatever page happened to be open reported it as absent — "the
  // locations list on screen has no row with id 56" — when it was simply on
  // page two.
  //
  // The first look is given the full budget, because the section may still be
  // loading. Later pages only need the row to appear after a click.
  const here = await card
    .waitFor({ state: "visible", timeout: 30_000 })
    .then(() => true)
    .catch(() => false);

  if (!here) {
    const next = shopLocations.paginationNext(page);

    for (let turn = 0; turn < MAX_LOCATION_PAGES; turn += 1) {
      const canGoOn = await next.isEnabled().catch(() => false);
      if (!canGoOn) break;

      await next.click();
      const found = await card
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (found) return card;
    }
  }

  await expect(
    card,
    `${options.what}: the locations list on screen has no row with id ${options.locationId}, on any page it would turn to`,
  ).toBeVisible({ timeout: 10_000 });
  return card;
};

/** What the row's pill says: `1` for active, `0` for inactive.
 *
 *  Read from `data-active`, never from the word inside the pill — the word is
 *  translated and this suite must not depend on the display language. */
export const cardStatus = async (card: Locator): Promise<string> =>
  (await shopLocations.cardStatus(card).getAttribute("data-active")) ?? "";

/** Open the create form and wait for it. */
export const openCreateLocationForm = async (page: Page): Promise<void> => {
  await expect(
    shopLocations.addButton(page),
    "the Locations section offers no Add Location control, so this account may not create one",
  ).toBeVisible({ timeout: 30_000 });

  await shopLocations.addButton(page).click();
  await waitForLocationForm(page, "create");
};

/** Open the edit form for one row and wait for it. */
export const openEditLocationForm = async (
  page: Page,
  options: { locationId: string | number },
): Promise<void> => {
  const card = await locationCard(page, {
    locationId: options.locationId,
    what: "opening the edit form",
  });

  await expect(
    shopLocations.editButton(card),
    `the row for location ${options.locationId} offers no Edit control, so this account may not change it`,
  ).toBeVisible({ timeout: 20_000 });

  await shopLocations.editButton(card).click();
  await waitForLocationForm(page, "edit");
};

/** The modal is open, in the mode the caller asked for, and past its own load.
 *
 *  The form fetches its country list before it draws any field, so a caller
 *  that typed as soon as the modal appeared typed into nothing. Waiting for the
 *  name box is waiting for that fetch to have returned. */
const waitForLocationForm = async (
  page: Page,
  mode: "create" | "edit",
): Promise<void> => {
  const form = shopLocations.form(page);
  await expect(
    form,
    `the location ${mode} form did not open`,
  ).toBeVisible({ timeout: 30_000 });

  await expect(
    form,
    `the location form opened in the wrong mode — expected ${mode}`,
  ).toHaveAttribute("data-mode", mode, { timeout: 10_000 });

  await expect(
    shopLocations.nameInput(page),
    `the location ${mode} form opened but never drew its fields, so its country lookup did not answer`,
  ).toBeVisible({ timeout: 30_000 });
};

/** What the open form currently holds. Used to prove an edit form was filled
 *  from the row it says it is editing. */
export const readLocationForm = async (
  page: Page,
): Promise<{
  name: string;
  countryId: string;
  address: string;
  latitude: string;
  longitude: string;
}> => ({
  name: await shopLocations.nameInput(page).inputValue(),
  countryId: await shopLocations.countrySelect(page).inputValue(),
  address: await shopLocations.addressInput(page).inputValue(),
  latitude: await shopLocations.latitudeInput(page).inputValue(),
  longitude: await shopLocations.longitudeInput(page).inputValue(),
});

/** Type into the open form. Every field is optional — an absent one is left
 *  exactly as the form had it. */
export const fillLocationForm = async (
  page: Page,
  values: {
    name?: string;
    countryId?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  },
): Promise<void> => {
  if (values.name !== undefined) {
    await shopLocations.nameInput(page).fill(values.name);
  }
  if (values.countryId !== undefined) {
    await shopLocations.countrySelect(page).selectOption(values.countryId);
  }
  if (values.address !== undefined) {
    await shopLocations.addressInput(page).fill(values.address);
  }
  if (values.latitude !== undefined) {
    await shopLocations.latitudeInput(page).fill(values.latitude);
  }
  if (values.longitude !== undefined) {
    await shopLocations.longitudeInput(page).fill(values.longitude);
  }
};

/** The country options the form offers, as `{ value, label }`.
 *
 *  Returned rather than chosen here, because which country a case wants is the
 *  case's decision — a created row's name is unique **per country**, so the
 *  choice is part of what the test is doing, not a detail to hide. */
export const locationCountryOptions = async (
  page: Page,
): Promise<{ value: string; label: string }[]> => {
  const options = await shopLocations
    .countrySelect(page)
    .evaluateAll((nodes) =>
      (nodes[0] as HTMLSelectElement | undefined)
        ? Array.from((nodes[0] as HTMLSelectElement).options).map((option) => ({
            value: option.value,
            label: option.textContent ?? "",
          }))
        : [],
    );

  // The first entry is the form's own "Select" placeholder, which is not a
  // country and cannot be saved.
  return options.filter((option) => option.value !== "");
};

/** What the browser itself thinks of one of the form's inputs.
 *
 *  **Needed because two different things refuse a bad value here, and only one
 *  of them is React.** The latitude and longitude boxes are
 *  `<input type="number" min max>`, so an out-of-range value makes the browser
 *  block the submit and show its own bubble. `handleSubmit` is never called,
 *  `validate()` never runs, and the component's own "Latitude must be between
 *  -90 and 90" line is never drawn — it is unreachable from a real browser and
 *  only guards a value the input would have to be given by script.
 *
 *  So the honest check for those two boxes is the browser's own verdict, which
 *  is what a seller actually sees. The name box has no such attribute, so its
 *  refusal really is React's and is read from the inline error instead. */
export const fieldValidity = async (
  input: Locator,
): Promise<{ valid: boolean; rangeOverflow: boolean; message: string }> =>
  input.evaluate((node) => {
    const field = node as HTMLInputElement;
    return {
      valid: field.validity.valid,
      rangeOverflow: field.validity.rangeOverflow,
      message: field.validationMessage,
    };
  });

/** What one Save attempt on the location form did. */
export type LocationSaveOutcome = {
  /** Did a write leave the browser at all? `false` means the form's own
   *  validation stopped it before any backend was asked. */
  requested: boolean;
  /** The status the backend answered with, or 0 when no write was made. */
  status: number;
  /** Which backend the proxy said answered, or "" when the header was absent. */
  backend: string;
};

/** Press Save and report what happened, without asserting.
 *
 *  For the case that proves the form refuses a bad value **on its own**. The
 *  only honest way to say "nothing was sent" is to wait and see nothing, so
 *  `graceMs` is spent on purpose when the form is expected to refuse.
 *
 *  Matches the write by the proxy's own `x-proxy-url` header, which carries the
 *  backend path — every dashboard call leaves the browser as a `POST
 *  /api/proxy`, so the method and address alone cannot tell them apart. */
export const attemptLocationSave = async (
  page: Page,
  options: { graceMs?: number } = {},
): Promise<LocationSaveOutcome> => {
  const graceMs = options.graceMs ?? 20_000;

  const settled = page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/proxy") &&
        response.request().method() === "POST" &&
        /\/shop\/locations(\/|$|\?)/.test(
          response.request().headers()["x-proxy-url"] ?? "",
        ) &&
        (response.request().headers()["x-proxy-method"] ?? "").toUpperCase() ===
          "POST",
      { timeout: graceMs },
    )
    .catch(() => null);

  await shopLocations.saveButton(page).click();
  const response = await settled;

  return {
    requested: response !== null,
    status: response?.status() ?? 0,
    backend: response?.headers()["x-market-backend"] ?? "",
  };
};

/** Save the open form and wait for the modal to close.
 *
 *  A refusal is reported with the backend's own words: the form puts the
 *  envelope message in its banner and binds each field error to its input, so
 *  both are read rather than guessed at. */
export const saveLocationForm = async (
  page: Page,
  options: { what: string },
): Promise<void> => {
  await shopLocations.saveButton(page).click();

  const form = shopLocations.form(page);
  const banner = shopLocations.formError(page);
  let refusal = "";

  // Three outcomes, and they are polled together rather than waited for one
  // after the other. Waiting for the form to close first would spend the whole
  // timeout on a save the backend had already refused, and then report a
  // timeout instead of what the backend said.
  await expect
    .poll(
      async () => {
        if (await banner.isVisible().catch(() => false)) {
          refusal = (await banner.innerText().catch(() => "")).trim();
          return "refused";
        }
        if (!(await form.isVisible().catch(() => true))) return "closed";
        return "still saving";
      },
      {
        message: `${options.what}: the location form neither closed nor showed an error after Save, so the save never settled`,
        timeout: 45_000,
      },
    )
    .not.toBe("still saving");

  expect(
    refusal,
    `${options.what}: the core backend refused the location save, saying: ${refusal || "(no text)"}`,
  ).toBe("");

  await settleLocations(page);
};

/** Press the row's status control once and wait for the pill to follow.
 *
 *  Returns the status the row now shows. The control is one button with two
 *  meanings, so the caller reads the status first and says what it expected. */
export const toggleLocationStatus = async (
  page: Page,
  options: { locationId: string | number; expected: "1" | "0" },
): Promise<void> => {
  const card = await locationCard(page, {
    locationId: options.locationId,
    what: "changing a location's status",
  });

  await expect(
    shopLocations.toggleButton(card),
    `the row for location ${options.locationId} offers no status control, so this account may not activate or deactivate it`,
  ).toBeVisible({ timeout: 20_000 });

  await shopLocations.toggleButton(card).click();

  // The section shows a refusal in its own banner rather than in the modal —
  // read it before blaming the pill for not moving. "The backend said no" and
  // "the screen did not follow" are different faults with the same appearance.
  const refused = shopLocations.actionError(page);
  let refusal = "";

  await expect
    .poll(
      async () => {
        if (await refused.isVisible().catch(() => false)) {
          refusal = (await refused.innerText().catch(() => "")).trim();
          return "refused";
        }
        return await cardStatus(card);
      },
      {
        message: `the row for location ${options.locationId} did not move to status ${options.expected} after the status control was pressed`,
        timeout: 30_000,
      },
    )
    .toBe(options.expected);

  expect(
    refusal,
    `the core backend refused the status change for location ${options.locationId}, saying: ${refusal || "(no text)"}`,
  ).toBe("");
};

/** Put a row back to inactive, quietly, at the end of a case.
 *
 *  A location cannot be deleted, so this is the most tidying that is possible.
 *  It never throws: a case reporting its own failure must not have that failure
 *  replaced by a tidy-up that also went wrong. What it did is returned instead,
 *  so the spec can say so in its report. */
export const deactivateLocationQuietly = async (
  page: Page,
  options: { sellerId: string | number; locationId: string | number },
): Promise<string> => {
  try {
    const result = await call(page, {
      sellerId: options.sellerId,
      url: `/shop/locations/${options.locationId}/change-status`,
      method: "POST",
      body: { status: 0 },
      note: "tidy up: deactivate the location this case created",
    });
    return result.ok
      ? `location ${options.locationId} was left inactive`
      : `location ${options.locationId} is still ACTIVE — the tidy-up call answered ${result.status}`;
  } catch (error) {
    return `location ${options.locationId} is still ACTIVE — the tidy-up call threw: ${String((error as Error)?.message ?? "").slice(0, 120)}`;
  }
};

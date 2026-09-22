// The seller dashboard's Stories section.
//
// One file per dashboard section, the same shape `shopLocations.ts` and
// `sellerComments.ts` use. The shell — reaching the dashboard, moving between
// sections — is `sellerDashboard.ts` and is not repeated here.
//
// ---------------------------------------------------------------------------
// Why this file carries its own upload watcher
//
// `actions/story.ts` already has one, and it cannot be reused. Its story path
// is a module constant pinned to the **shopper's** endpoint:
//
//     const ADD_STORY_PATH = "/api/v1/stories/add_story";   // story.ts
//
// A seller uploads through `/api/v1/stories/add-seller-story`
// (`services/sellerDashboard/index.ts`). `"add-seller-story".startsWith("add_story")`
// is false, so the shared describer reports *"the browser never sent
// /api/v1/stories/add_story"* after a seller upload that worked perfectly —
// a wrong backend named on a healthy run, which is the one thing a failure
// message must never do. `watchUpload` is not exported either, so there was
// nothing to reuse even if the path matched.
//
// ---------------------------------------------------------------------------
// Why the seller's own list, and never the shopper feed
//
// A seller story is written by `add-seller-story` and listed by
// `seller-stories`. The home bar reads `users_stories`. **Whether one feeds the
// other is exactly what `OQ-1` asks**, and it is unanswered. So every check
// this file makes about whether a story exists or is gone reads the *seller's*
// list, which is correct whichever way `OQ-1` turns out. Reading the shopper
// feed would make a "no" answer look like a successful delete.
//
// ---------------------------------------------------------------------------
// Everything printed goes through `redact()`
//
// The repository is public and the runner inherits Playwright's output, so the
// list reporter's assertion text lands in a world-readable job log. Only the
// separate report step redacts, and that feeds the notifier, not the log. The
// media call also carries a run-minted upload ticket that matches no shape rule
// in the redactor, so **no message here ever prints a header or a body** — a
// status and the backend's own message, capped, and nothing else.

import { expect, type Locator, type Page } from "@playwright/test";

import { sellerStories as sel } from "../selectors";
import { signedInSession } from "./auth";
import { openTab, refuseIfSessionExpired } from "./sellerDashboard";
import { auth as authSel } from "../selectors";
import { throughProxyInPage } from "../harness/orderCleanup";
import { redact } from "../harness/redact";
import { stories as storySel } from "../selectors";

/** How long the section's own list call is given before the case gives up. */
const SECTION_LOAD_MS = 45_000;

/** How long the upload's two backends are given, together. The media server
 *  takes a real file and the stories backend then writes a row. */
const UPLOAD_MS = 60_000;

/** The most a printed backend message may be. Long enough to carry a real
 *  refusal, short enough that a 4096-character notification survives it. */
const MESSAGE_CAP = 200;

/** The two paths one seller upload touches, in order. */
const MEDIA_UPLOAD_PATH = "/gated/upload";
const ADD_SELLER_STORY_PATH = "/api/v1/stories/add-seller-story";

// ---------------------------------------------------------------------------
// Opening the section, and what this account may do in it
// ---------------------------------------------------------------------------

/** What the Stories section says this account may do.
 *
 *  Read from the section's **root**, which carries both permissions as
 *  attributes. Never inferred from which buttons are drawn: the delete control
 *  lives inside a story card, so on an empty grid — the normal state before
 *  this journey uploads anything — its absence means both "may not delete" and
 *  "nothing to delete". */
export type StoryPermissions = { canCreate: boolean; canDelete: boolean };

/** Open the Stories section and say what the account may do there.
 *
 *  Checks `READ_STORY` **first, and by its own name**. Without that permission
 *  the dashboard renders no section at all and no access-denied block either —
 *  unlike products, boutiques and users, stories has none. So a case that
 *  merely waited for the section root would time out and report "the section
 *  never appeared", which names the wrong thing. The menu entry is drawn only
 *  for an account that holds the permission, so its absence is the answer. */
export const openStoriesSection = async (
  page: Page,
): Promise<StoryPermissions> => {
  const menuEntry = page.getByTestId("seller-dashboard-menu-stories");

  expect(
    await menuEntry.count(),
    "the dashboard offers this account no Stories entry, so the account does not hold READ_STORY. That is a permission on the account, not a fault in the section",
  ).toBeGreaterThan(0);

  await openTab(page, "stories");

  const section = sel.section(page);
  await expect(
    section,
    "the Stories section did not render although the account holds READ_STORY",
  ).toBeVisible({ timeout: SECTION_LOAD_MS });

  return {
    canCreate: (await section.getAttribute("data-can-create")) === "true",
    canDelete: (await section.getAttribute("data-can-delete")) === "true",
  };
};

/** Wait for the section's own list call to have answered — whichever way.
 *
 *  Three outcomes are legitimate and they mean different things: the grid drew
 *  rows, the list is genuinely empty, or the backend refused. A case that
 *  waited only for the grid would report a refused list as a slow render, and
 *  one that waited only for "grid or empty" would report a refusal as an empty
 *  shop. */
export const waitForStoriesList = async (page: Page): Promise<void> => {
  /** Has the app given up on this session and asked for a phone code?
   *
   *  **This must be told apart from a slow backend, and it was not.** Every
   *  service here answers a 401 by exchanging its own refresh token and
   *  retrying, so a first 401 means nothing on its own. Only when that exchange
   *  is *refused* does the app fall through and draw the verify screen. When it
   *  does, waiting longer cannot help: the list call is never going to be made.
   *
   *  Reported by name, because the message that says "the stories backend never
   *  answered" sends the next reader to the wrong backend entirely — which is
   *  exactly what happened on the run that found this. */
  const askedToVerify = async (): Promise<boolean> =>
    await authSel
      .methodPhone(page)
      .isVisible()
      .catch(() => false);

  await expect
    .poll(
      async () =>
        (await sel.grid(page).isVisible().catch(() => false)) ||
        (await sel.empty(page).isVisible().catch(() => false)) ||
        (await sel.loadError(page).isVisible().catch(() => false)) ||
        // Not an answer — a reason to stop waiting. Judged by name below.
        (await askedToVerify()),
      {
        timeout: SECTION_LOAD_MS,
        message:
          "the Stories section drew neither its grid, nor its empty state, nor an error, so the stories backend never answered the section's own list call",
      },
    )
    .toBe(true);

  // Named before the list is judged: an expired session and a refused backend
  // look identical from the section, and only one of them is about stories.
  await refuseIfSessionExpired(page, "reading the seller's stories");
  expect(
    await askedToVerify(),
    "the app asked the seller to verify their number instead of drawing the section, so the saved session was refused and its refresh token was not accepted either. This is the session, not the stories backend",
  ).toBe(false);

  const failed = await sel.loadError(page).isVisible().catch(() => false);
  if (failed) {
    const said = (await sel.loadError(page).innerText().catch(() => "")).trim();
    expect(
      false,
      redact(
        `the stories backend refused the seller's own story list: ${said.slice(0, MESSAGE_CAP)}`,
      ),
    ).toBe(true);
  }
};

// ---------------------------------------------------------------------------
// The seller's own story list, read from the backend
// ---------------------------------------------------------------------------

/** One story as this file cares about it. */
export type SellerStoryRow = {
  id: string | number;
  link: string;
  /** Both halves of the attachment, because they fail apart.
   *
   *  The form sends `product_id` and `product_slug` as two fields, so a story
   *  can come back with the id and no slug — which is a different fault from no
   *  attachment at all, and only one of the two is the dashboard's doing. A
   *  reader that kept just the slug reports both the same way. */
  productId: string | number | null;
  productSlug: string;
};

/** The account id the app itself reports for this session.
 *
 *  The seller list is addressed by `user_id` **and** `seller_id`, and the seed
 *  state carries only the second. This is where the first comes from — asked of
 *  the app, never read out of the saved jar's profile cookie, which can be a
 *  snapshot of a session that has since been superseded.
 *
 *  A guest has none. That matters more than it looks: an empty `user_id`
 *  returns "no match", which reads exactly like a story that is not there. */
export const sellerAccountId = async (page: Page): Promise<number | null> =>
  (await signedInSession(page)).accountId;

/** Rows the stories backend holds for this seller.
 *
 *  **Normalises the shape.** The list comes back either flat or grouped by
 *  author, and the app's own tab flattens defensively for that reason. A helper
 *  handed the wrong shape returns nothing, which is indistinguishable from a
 *  story that is genuinely gone — the silent pass this whole file is arranged
 *  to avoid. */
export const readSellerStories = async (
  page: Page,
  options: {
    sellerId: string | number;
    userId: number;
    country?: string;
    language?: string;
    page?: number;
  },
): Promise<{ status: number; rows: SellerStoryRow[]; message: string }> => {
  const query = new URLSearchParams({
    user_id: String(options.userId),
    seller_id: String(options.sellerId),
    page: String(options.page ?? 1),
    perPage: "20",
  });

  const answer = await throughProxyInPage(page, {
    target: `/api/v1/stories/seller-stories?${query.toString()}`,
    method: "GET",
    country: options.country ?? "sy",
    language: options.language ?? "en",
    server: "stories",
  });

  const body = answer.json as any;
  const raw = body?.data?.data ?? body?.data?.stories ?? body?.data ?? [];
  const list: any[] = Array.isArray(raw) ? raw : [];

  // Grouped or flat — take whichever arrived.
  const flat: any[] = list.some((item) => Array.isArray(item?.stories))
    ? list.flatMap((group) =>
        Array.isArray(group.stories) ? group.stories : [],
      )
    : list;

  return {
    status: answer.status,
    message: String(body?.message ?? "").slice(0, MESSAGE_CAP),
    rows: flat
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: row.id,
        link: String(row.link ?? ""),
        productId: row.product_id ?? null,
        productSlug: String(row.product_slug ?? ""),
      })),
  };
};

/** The one row whose link is exactly `link`, or null.
 *
 *  By link, because the link is this run's own mark — the QA host plus a token
 *  minted for this run. Matching by position would pick up a row somebody else
 *  left behind. */
export const findSellerStoryByLink = (
  rows: readonly SellerStoryRow[],
  link: string,
): SellerStoryRow | null =>
  rows.find((row) => row.link === link) ?? null;

// ---------------------------------------------------------------------------
// Uploading
// ---------------------------------------------------------------------------

/** What each of the upload's two calls did. */
export type UploadAttempt = {
  media: { sent: boolean; status: number; said: string };
  save: { sent: boolean; status: number; said: string };
};

/** Watch both calls one seller upload makes.
 *
 *  Returns a reader, so the caller drives the screen between starting the watch
 *  and reading it. Two backends can refuse this one step and the message has to
 *  say which — that is the whole reason this exists rather than a single
 *  `expect` on the screen, which collapses both into one translated toast.
 *
 *  **Judges the first answer that is not a 401.** Every service here recovers
 *  from a 401 by exchanging its own refresh token and retrying, so watching a
 *  single response reports a write that landed as a write that was refused. */
export const watchSellerUpload = (page: Page): (() => UploadAttempt) => {
  const attempt: UploadAttempt = {
    media: { sent: false, status: 0, said: "" },
    save: { sent: false, status: 0, said: "" },
  };

  /** Which leg a request belongs to, or null.
   *
   *  **The two legs are found differently, and that is not an oversight.** The
   *  media upload goes straight to the media server, so its own URL carries the
   *  path. The save does not: every client call travels to `/api/proxy` and the
   *  real target rides in the `x-proxy-url` header, so matching the save on the
   *  request URL finds nothing and reports "the browser never sent the story"
   *  after a save that worked. Measured — that is exactly what the first run of
   *  this file reported. */
  const legOf = (request: {
    url: () => string;
    headers: () => Record<string, string>;
  }): "media" | "save" | null => {
    if (request.url().includes(MEDIA_UPLOAD_PATH)) return "media";
    const target = request.headers()["x-proxy-url"] ?? "";
    return target.startsWith(ADD_SELLER_STORY_PATH) ? "save" : null;
  };

  const onRequest = (request: {
    url: () => string;
    headers: () => Record<string, string>;
  }): void => {
    const which = legOf(request);
    if (which) attempt[which].sent = true;
  };

  const onResponse = (response: {
    request: () => { url: () => string; headers: () => Record<string, string> };
    status: () => number;
    text: () => Promise<string>;
  }): void => {
    const which = legOf(response.request());
    if (!which) return;

    const leg = attempt[which];
    const status = response.status();

    leg.sent = true;
    // A 401 is recovered by the app itself and the answer that follows is the
    // real one, so a 401 never overwrites something already recorded.
    if (status === 401 && leg.status !== 0) return;
    leg.status = status;

    void response
      .text()
      .then((body) => {
        let said = "";
        try {
          said = String(
            (JSON.parse(body) as { message?: unknown }).message ?? "",
          );
        } catch {
          said = "";
        }
        leg.said = said.slice(0, MESSAGE_CAP);
      })
      .catch(() => {
        leg.said = "";
      });
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  return () => {
    page.off("request", onRequest);
    page.off("response", onResponse);
    return attempt;
  };
};

/** One line naming which of the two backends refused, in plain words.
 *
 *  **Never prints a header or a body** — a status and the backend's own
 *  message, capped, through the redactor. The media call carries a run-minted
 *  upload ticket that matches no shape rule in the redactor, so a dumped header
 *  would be published in a world-readable log as-is. */
export const describeSellerUpload = (attempt: UploadAttempt): string => {
  const parts: string[] = [];

  if (!attempt.media.sent) {
    parts.push("the browser never sent the file to the media server");
  } else if (attempt.media.status >= 400 || attempt.media.status === 0) {
    parts.push(
      `the media server refused the file (${attempt.media.status})` +
        (attempt.media.said ? `: ${attempt.media.said}` : ""),
    );
  } else {
    parts.push(`the media server took the file (${attempt.media.status})`);
  }

  if (!attempt.save.sent) {
    parts.push(
      "and the browser never sent the story to the stories backend, so the form stopped before the save",
    );
  } else if (attempt.save.status >= 400 || attempt.save.status === 0) {
    parts.push(
      `but the stories backend refused the story (${attempt.save.status})` +
        (attempt.save.said ? `: ${attempt.save.said}` : ""),
    );
  } else {
    parts.push(`and the stories backend took the story (${attempt.save.status})`);
  }

  return redact(parts.join(", "));
};

/** Upload one story from the dashboard: file, crop, link, product, share.
 *
 *  The crop step is not optional for a photo — the form sends a chosen image to
 *  the shared crop widget and only a cropped file reaches the preview. A video
 *  skips it, which is why this helper is photo-only and says so. */
export const uploadSellerStory = async (
  page: Page,
  options: {
    photo: { name: string; mimeType: string; buffer: Buffer };
    link: string;
    productId: string | number;
  },
): Promise<UploadAttempt> => {
  await expect(
    sel.addButton(page),
    "the Stories section drew no Add Story control, although this account reports CREATE_STORY",
  ).toBeVisible();
  await sel.addButton(page).click();

  await expect(
    sel.uploadDialog(page),
    "the Add Story control was pressed but the upload dialog never opened",
  ).toBeVisible();

  await sel.fileInput(page).setInputFiles(options.photo);

  // The crop dialog is the shopper upload's, shared. One hook, one name.
  await expect(
    storySel.cropSave(page),
    "the photo was chosen but the crop dialog never opened, so the file cannot reach the form",
  ).toBeVisible({ timeout: 20_000 });
  await storySel.cropSave(page).click();

  await sel.linkInput(page).fill(options.link);

  await sel.productPick(page).click();
  const row = sel.productRow(page, options.productId);
  await expect(
    row,
    `the product picker does not offer product ${options.productId} on its first page, so the story cannot be attached to it`,
  ).toBeVisible({ timeout: 20_000 });
  await row.click();

  await expect(
    sel.productChosen(page),
    "the product was pressed in the picker but the form does not show it as chosen, so nothing would be attached",
  ).toBeVisible();

  const read = watchSellerUpload(page);
  await sel.shareButton(page).click();

  // Both calls, or the ceiling. The reader is drained either way so the caller
  // always gets a message that names a backend.
  await page
    .waitForResponse(
      (response) =>
        (response.request().headers()["x-proxy-url"] ?? "").startsWith(
          ADD_SELLER_STORY_PATH,
        ),
      { timeout: UPLOAD_MS },
    )
    .catch(() => undefined);

  return read();
};

// ---------------------------------------------------------------------------
// Deleting
// ---------------------------------------------------------------------------

/** Delete one story from the dashboard, by its own id.
 *
 *  Presses the dashboard's own control, **not** the shopper story viewer's
 *  delete — that one lives inside the opened viewer and belongs to a different
 *  journey. */
export const deleteSellerStory = async (
  page: Page,
  options: { storyId: string | number },
): Promise<void> => {
  const card = sel.card(page, options.storyId);
  await expect(
    card,
    `the Stories section shows no row with id ${options.storyId}, so there is nothing here to delete`,
  ).toBeVisible({ timeout: SECTION_LOAD_MS });

  const remove = sel.cardDelete(card);
  await expect(
    remove,
    "the story row carries no delete control, so this account does not hold DELETE_STORY",
  ).toBeVisible();
  await remove.click();

  await expect(
    sel.deleteConfirm(page),
    "the delete control was pressed but no confirmation appeared, so nothing was deleted",
  ).toBeVisible();
  await sel.deleteConfirm(page).click();

  await expect(
    card,
    "the story row is still on screen after the delete was confirmed",
  ).toBeHidden({ timeout: SECTION_LOAD_MS });
};

/** One card, for a caller that wants to read it. */
export const storyCard = (page: Page, storyId: string | number): Locator =>
  sel.card(page, storyId);

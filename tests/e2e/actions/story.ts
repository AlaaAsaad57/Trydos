// The stories journey: upload, find, report, delete.
//
// ---------------------------------------------------------------------------
// The one rule everything here exists to keep
//
// **A story this suite touches must be a story this run created.** Reporting
// cannot be undone — the app offers no way to withdraw one — and deleting is
// just as final. So every action below identifies its target by the full link
// the run wrote, never by position in a list and never by "the first story on
// screen".
//
// The QA mark is the link's *host*, which hides the story from customers but
// says nothing about *which* story it is: a leftover from last night and
// another run's story share that host. So each upload carries
//
//     https://<qaStoryLinkHost()>/e2e/<run token>/<kind>
//
// The host keeps it hidden. The path makes it this run's.
//
// ---------------------------------------------------------------------------
// Why the host is never typed out
//
// A typo, or a stale `NEXT_PUBLIC_QA_STORY_LINK_HOST` in the build, produces a
// story that is **not** QA data — real, visible media on a real environment,
// uploaded by a test. So the link is built from the app's own
// `qaStoryLinkHost()`, checked with the app's own `isQaStory()` before the
// upload starts, and checked again against what the backend actually stored.

import { expect, type Page } from "@playwright/test";

import { isQaStory, qaStoryLinkHost } from "utils/qaStoryFilter";

import { throughProxyInPage } from "../harness/orderCleanup";
import {
  findStoriesByPrefix,
  findStoryByLink,
  waitForStoryByLink,
  type FeedGroup,
  type FoundStory,
} from "../harness/storyFinder";
import { stories as storySelectors } from "../selectors";

/** The kind of story this suite makes.
 *
 *  Only `photo`. A video upload was in scope until the owner removed it on
 *  2026-09-20 — nothing available here can produce an MP4 the app's file picker
 *  accepts. The kind stays in the address so a second kind can be added without
 *  changing what a run's earlier stories look like. */
export type StoryKind = "photo";

/** An opaque, random label for one run.
 *
 *  **Opaque on purpose.** It is written into a story's public `link` on a shared
 *  backend and stays there, so it must carry no phone number, account id,
 *  e-mail, branch name, secret or internal host — nothing but noise. */
export const newRunToken = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** The address one upload carries, built from the app's own mark host. */
export const qaStoryLink = (runToken: string, kind: StoryKind): string =>
  `https://${qaStoryLinkHost()}/e2e/${runToken}/${kind}`;

/** Every address this run could have written, for the clean-up to sweep. */
export const qaStoryLinkPrefix = (runToken: string): string =>
  `https://${qaStoryLinkHost()}/e2e/${runToken}/`;

/** The 1x1 PNG the photo case uploads.
 *
 *  Made here rather than kept as a file, the same way `profile.live.spec.ts`
 *  does for the profile picture — the suite already proves these exact bytes
 *  pass the upload-ticket and media-store chain. Synthetic, so it can never hold
 *  a real person. */
export const storyPhoto = () => ({
  name: "trydos-e2e-story.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
});

// ---------------------------------------------------------------------------
// Reading the feed as the backend sent it
// ---------------------------------------------------------------------------

/** One page of the story feed, **unfiltered**.
 *
 *  Straight from the stories backend through `/api/proxy`, so what comes back is
 *  what the app would have filtered — which is the only way to prove a story
 *  exists, or that it is gone, independently of what the screen decided to draw.
 *
 *  **Nothing read here may be printed.** These rows are real customers' stories:
 *  their links, their names, their ids. A failure message built from this may
 *  name **this run's own token and story ids and nothing else**. */
export const readStoryFeedPage = async (
  page: Page,
  pageNumber: number,
  options: { country?: string; language?: string } = {},
): Promise<FeedGroup[]> => {
  const answer = await throughProxyInPage(page, {
    target: `/api/v1/stories/users_stories?page=${pageNumber}`,
    method: "GET",
    country: options.country ?? "sy",
    language: options.language ?? "en",
    server: "stories",
  });

  const body = answer.json as any;
  const groups = body?.data?.data ?? body?.data ?? [];
  return Array.isArray(groups) ? (groups as FeedGroup[]) : [];
};

/** A `readPage` for the finder, bound to this page and locale. */
export const feedReader =
  (page: Page, options: { country?: string; language?: string } = {}) =>
  async (pageNumber: number): Promise<FeedGroup[]> =>
    await readStoryFeedPage(page, pageNumber, options);

/** Wait for a story this run just uploaded to appear in the feed. Page one only. */
export const waitForOwnStory = async (
  page: Page,
  options: { link: string; country?: string; language?: string },
): Promise<FoundStory | null> =>
  await waitForStoryByLink(feedReader(page, options), { link: options.link });

/** Find a story this run uploaded, paging as far as the finder allows. */
export const findOwnStory = async (
  page: Page,
  options: { link: string; country?: string; language?: string },
): Promise<FoundStory | null> =>
  await findStoryByLink(feedReader(page, options), { link: options.link });

/** Every story this run uploaded that is still there. */
export const findOwnStoriesLeft = async (
  page: Page,
  options: { runToken: string; country?: string; language?: string },
): Promise<FoundStory[]> =>
  await findStoriesByPrefix(feedReader(page, options), {
    prefix: qaStoryLinkPrefix(options.runToken),
  });

// ---------------------------------------------------------------------------
// Uploading — and failing fast when a backend refuses
// ---------------------------------------------------------------------------

const MEDIA_UPLOAD_PATH = "/gated/upload";
const ADD_STORY_PATH = "/api/v1/stories/add_story";

/** What actually happened during one upload, step by step.
 *
 *  **Read from the two requests, not from the screen**, and that is deliberate.
 *  The sheet tells the shopper "Upload Failed Try Again" whoever refused — the
 *  media server or the stories backend — and the message goes through
 *  `translateFunction`, so matching it would tie this suite to English and still
 *  not say which backend said no. The requests answer both questions. */
export type UploadAttempt = {
  mediaSent: boolean;
  mediaAnswered: boolean;
  mediaStatus: number | null;
  storySent: boolean;
  storyAnswered: boolean;
  storyStatus: number | null;
  /** Only the backend's own `message`, capped. Never a body, never a header. */
  said: string;
};

const MESSAGE_CAP = 200;

/** One sentence naming the step that stopped, and the backend that stopped it. */
export const describeUpload = (attempt: UploadAttempt): string => {
  if (!attempt.mediaSent) {
    return `the browser never sent the file to the media server (${MEDIA_UPLOAD_PATH}), so the upload was refused before it left the page`;
  }
  if (!attempt.mediaAnswered) {
    return `the media server never answered ${MEDIA_UPLOAD_PATH} — the file was still going up when the wait ran out`;
  }
  if (attempt.mediaStatus !== null && attempt.mediaStatus >= 400) {
    return `the media server refused the file with ${attempt.mediaStatus}${attempt.said ? `: ${attempt.said}` : ""}`;
  }
  if (!attempt.storySent) {
    return `the media server took the file, but the browser never sent ${ADD_STORY_PATH}, so the story row was never asked for`;
  }
  if (!attempt.storyAnswered) {
    return `the stories backend never answered ${ADD_STORY_PATH} — the request was still in flight when the wait ran out`;
  }
  return `the stories backend answered ${ADD_STORY_PATH} with ${attempt.storyStatus}${attempt.said ? `: ${attempt.said}` : ""}`;
};

const watchUpload = (page: Page): { report: () => UploadAttempt } => {
  const attempt: UploadAttempt = {
    mediaSent: false,
    mediaAnswered: false,
    mediaStatus: null,
    storySent: false,
    storyAnswered: false,
    storyStatus: null,
    said: "",
  };

  // Attached before the click, never after: a watcher registered afterwards
  // misses the very request it exists to describe.
  page.on("request", (request) => {
    if (request.url().includes(MEDIA_UPLOAD_PATH)) attempt.mediaSent = true;
    // Every client call travels to `/api/proxy`; the real path is in the header.
    const target = request.headers()["x-proxy-url"] ?? "";
    if (target.startsWith(ADD_STORY_PATH)) attempt.storySent = true;
  });

  page.on("response", async (response) => {
    const request = response.request();
    const isMedia = request.url().includes(MEDIA_UPLOAD_PATH);
    const isStory = (request.headers()["x-proxy-url"] ?? "").startsWith(
      ADD_STORY_PATH,
    );
    if (!isMedia && !isStory) return;

    if (isMedia) {
      attempt.mediaAnswered = true;
      attempt.mediaStatus = response.status();
    } else {
      attempt.storyAnswered = true;
      attempt.storyStatus = response.status();
    }

    // Never throws while reading: a body that will not parse must not replace
    // the failure the case is reporting.
    try {
      const body: any = await response.json();
      const said = typeof body?.message === "string" ? body.message : "";
      if (said) attempt.said = said.slice(0, MESSAGE_CAP);
    } catch {
      // Nothing to add.
    }
  });

  return { report: () => attempt };
};

/** How long an upload may go without any answer before the case gives up.
 *
 *  Far below the per-case budget on purpose. The point is to fail **naming the
 *  media server or the stories backend**, rather than to let a hung promise eat
 *  the whole case and blame the feed. */
const UPLOAD_SIGNAL_MS = 30_000;

/** Upload one story through the screens a shopper uses.
 *
 *  Returns the link that was sent, and what the two backends did. */
export const uploadStory = async (
  page: Page,
  options: { runToken: string; kind: StoryKind; file?: { name: string; mimeType: string; buffer: Buffer } },
): Promise<{ link: string; attempt: UploadAttempt }> => {
  const link = qaStoryLink(options.runToken, options.kind);

  // Checked with the app's own rule, before anything is uploaded. If this is
  // wrong the story would be real, visible media on a real environment.
  expect(
    isQaStory({ link }),
    `the link this case was about to upload is not test data by the app's own rule, so the story would be visible to every customer. The host came from qaStoryLinkHost(), so NEXT_PUBLIC_QA_STORY_LINK_HOST is set to something unusable`,
  ).toBe(true);

  const watcher = watchUpload(page);

  const addButton = storySelectors.addButton(page);
  await expect(
    addButton,
    "the add-story control is not on the page. Both test accounts are allowed to upload stories, so this is the account's profile losing is_allowed_to_upload_story on the core backend, not a slow render",
  ).toBeVisible({ timeout: 30_000 });
  await addButton.click();

  await storySelectors.galleryOption(page).click();
  await storySelectors.fileInput(page).setInputFiles(options.file ?? storyPhoto());

  // A photo goes through the crop editor first; a video does not. Its Save is
  // the only way out, and the default crop passes the original file through.
  if (options.kind === "photo") {
    const save = storySelectors.cropSave(page);
    await expect(
      save,
      "choosing a photo did not open the crop editor's Save control, so the upload cannot go any further",
    ).toBeVisible({ timeout: 30_000 });
    await save.click();
  }

  await storySelectors.linkInput(page).fill(link);

  const share = storySelectors.shareButton(page);
  await expect(
    share,
    "the Share Story control never appeared, which means the sheet never accepted the media — there is no link-only story, so nothing can be shared without it",
  ).toBeVisible({ timeout: 30_000 });
  await share.click();

  // Wait for a real answer from the stories backend, not for the screen to
  // settle. See `UploadAttempt` for why the screen cannot be trusted here.
  await expect
    .poll(() => watcher.report().storyAnswered, {
      timeout: UPLOAD_SIGNAL_MS,
      message: "waiting for the stories backend to answer the upload",
    })
    .toBe(true)
    .catch(() => undefined);

  const attempt = watcher.report();

  expect(
    attempt.storyAnswered && (attempt.storyStatus ?? 500) < 400,
    `the ${options.kind} story was not created, and ${describeUpload(attempt)}`,
  ).toBe(true);

  return { link, attempt };
};

// ---------------------------------------------------------------------------
// The viewer — opening a ring, and landing on the right item inside it
// ---------------------------------------------------------------------------

/** How many times the helper will step forward looking for its own item. */
const MAX_ADVANCES = 12;

/** The id of the story the app would act on right now, or `null`.
 *
 *  Read from the **active** holder only. The carousel mounts several holders at
 *  once and the others are neighbouring authors, so a locator that matched them
 *  all could report a story the app is not showing. */
export const showingStoryId = async (page: Page): Promise<string | null> =>
  await storySelectors
    .activeHolder(page)
    .first()
    .getAttribute("data-story-id")
    .catch(() => null);

/** How many further pages of the bar to pull in while looking for a ring. Same
 *  bound as the finder uses on the feed itself. */
const MAX_BAR_PAGES = 5;

/** Open one author's ring from the bar, **scrolling to find it**.
 *
 *  The bar renders page one and loads the next only when its end scrolls into
 *  view, so a ring can be perfectly present in the feed and still have no tile
 *  on screen. That is not a corner case: the account that uploaded a story sees
 *  its own ring at the front, while any *other* account sees it wherever the
 *  backend orders it — measured on a real run, the reporting account found the
 *  uploader's ring nowhere on page one.
 *
 *  So this walks the bar the way a shopper does. Failing without having scrolled
 *  would report "the app is hiding this story" about a story that was simply
 *  further along. */
export const openRing = async (
  page: Page,
  groupId: string | number,
): Promise<void> => {
  const tile = storySelectors.tile(page, groupId);
  const bar = page.locator("#stories-bar-container");

  for (let pulled = 0; pulled < MAX_BAR_PAGES; pulled += 1) {
    if ((await tile.count()) > 0) break;
    if ((await bar.count()) === 0) break;

    const before = await storySelectors.anyTile(page).count();

    // To the end, which is what the bar watches to decide to load more.
    await bar
      .evaluate((element) => {
        element.scrollTo({ left: element.scrollWidth });
      })
      .catch(() => undefined);

    // Wait for the bar to actually grow; if it does not, the feed has ended and
    // another scroll would only cost time.
    const grew = await page
      .waitForFunction(
        (count) =>
          document.querySelectorAll('[data-pw="story-element"]').length > count,
        before,
        { timeout: 10_000 },
      )
      .then(() => true)
      .catch(() => false);

    if (!grew) break;
  }

  await expect(
    tile,
    `the stories bar never showed a tile for the author this run uploaded as, after walking ${MAX_BAR_PAGES} pages of it. Either the feed does not carry the ring that far, or this account is not among NEXT_PUBLIC_QA_STORY_VIEWER_PHONES in the build being served, so the app is hiding the run's own story from it`,
  ).toBeVisible({ timeout: 30_000 });
  await tile.click();
};

/** Step forward until the app is showing **this** story, or give up saying so.
 *
 *  Needed because the viewer does not open where a case would like. A
 *  non-owner's ring starts at the *oldest* item, an owner's at the newest, and
 *  either way the viewer advances on its own timer — including, at the end of a
 *  ring, on to a **different author**, where the report control is still drawn.
 *  So a case that acts without landing on its own item first can report a real
 *  customer's story, and that cannot be undone.
 *
 *  Advancing is a click on the right half of the frame, which is what the viewer
 *  listens for. There is no test hook on that zone, and adding one is not in
 *  this change. */
export const advanceToStory = async (
  page: Page,
  storyId: string | number,
): Promise<boolean> => {
  const wanted = String(storyId);

  for (let step = 0; step < MAX_ADVANCES; step += 1) {
    if ((await showingStoryId(page)) === wanted) return true;

    const frame = page.viewportSize();
    if (!frame) return false;
    await page.mouse.click(Math.floor(frame.width * 0.8), Math.floor(frame.height * 0.5));
    await page.waitForTimeout(400);
  }

  return (await showingStoryId(page)) === wanted;
};

// ---------------------------------------------------------------------------
// Reporting and deleting — both irreversible, both guarded the same way
// ---------------------------------------------------------------------------

/** Report the story the app is currently showing, after proving it is ours.
 *
 *  The identity is checked **twice**: once before the sheet is opened, and again
 *  with the sheet open. The second is the one that matters — the viewer pauses
 *  only once the sheet is up, so between the first check and the submit the app
 *  can move on by itself, to the next item and then to the next author. */
export const reportShowingStory = async (
  page: Page,
  options: { storyId: string | number; reason?: string },
): Promise<void> => {
  const wanted = String(options.storyId);

  expect(
    await showingStoryId(page),
    "the viewer moved off this run's story before the report control was pressed, so the report would have been filed against somebody else's story",
  ).toBe(wanted);

  const icon = storySelectors.reportIcon(page);
  await expect(
    icon,
    "the report control is not drawn. It appears only for a signed-in viewer who does not own the story, so either this account owns it or the session was lost",
  ).toBeVisible({ timeout: 15_000 });
  await icon.click();

  const reason = options.reason ?? "spam";
  const reasonControl = storySelectors.reportReason(page, reason);
  await expect(
    reasonControl,
    `the report sheet did not offer the "${reason}" reason, so it never opened or its reasons changed`,
  ).toBeVisible({ timeout: 15_000 });
  await reasonControl.click();

  // The second check, with the viewer paused. This is the guard that actually
  // holds: the first one was true a moment ago, not necessarily now.
  expect(
    await showingStoryId(page),
    "the story on screen changed between opening the report sheet and submitting it, so the report would have been filed against a different story — and a report cannot be withdrawn",
  ).toBe(wanted);

  await storySelectors.reportSubmit(page).click();
};

/** Delete the story the app is currently showing, after proving it is ours. */
export const deleteShowingStory = async (
  page: Page,
  options: { storyId: string | number },
): Promise<void> => {
  const wanted = String(options.storyId);

  expect(
    await showingStoryId(page),
    "the viewer moved off this run's story before the delete control was pressed, so the delete would have removed somebody else's story",
  ).toBe(wanted);

  const icon = storySelectors.deleteIcon(page);
  await expect(
    icon,
    "the delete control is not drawn. It appears only for the owner, so this session is not the account that uploaded the story",
  ).toBeVisible({ timeout: 15_000 });
  await icon.click();

  const confirm = storySelectors.deleteConfirm(page);
  await expect(
    confirm,
    "the delete confirmation never appeared, so nothing was deleted",
  ).toBeVisible({ timeout: 15_000 });
  await confirm.click();
};

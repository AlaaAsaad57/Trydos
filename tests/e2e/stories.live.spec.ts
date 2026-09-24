// The stories journey against real staging: upload a photo story, find it,
// report it, delete it.
//
// ---------------------------------------------------------------------------
// Two identities, and why there is no way round that
//
// The report control is drawn **only** for a signed-in viewer who does not own
// the story (`StoryHolder.tsx`), and the delete control **only** for the owner.
// So one account can never report its own story, and this file signs in twice:
// Shopper A uploads and deletes, Shopper B reports. Shopper A goes first because
// it always has a working one-time code; when `TEST_ACCOUNT_OTP_2` is missing,
// only the reporter's sign-in and the report case skip.
//
// ---------------------------------------------------------------------------
// Every story here is test data, and every action is aimed by its own link
//
// A story is hidden from customers when its link points at the QA host, and it
// is *this run's* when the path carries this run's token. Both halves matter:
// the host keeps a real shopper from ever seeing it, and the token keeps this
// file from reporting or deleting a leftover, another run's story, or a real
// person's.
//
// ---------------------------------------------------------------------------
// The setting this file cannot run without
//
// The app shows a test story only to the accounts named in
// `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES`. **Nobody configures that**:
// `harness/server.ts` fills it in from the same test phones this file signs in
// with, when it builds the app. So the only thing that can go wrong is having no
// test account at all, and the file skips saying exactly that.

import type { BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import { attemptAuth, signedInSession } from "./actions/auth";
import { gotoAbout, gotoHome } from "./actions/nav";
import {
  advanceToStory,
  deleteShowingStory,
  findOwnStoriesLeft,
  findOwnStory,
  newRunToken,
  openRing,
  qaStoryLink,
  reportShowingStory,
  uploadStory,
  waitForOwnStory,
} from "./actions/story";
import {
  envValue,
  hasBackends,
  hasMedia,
  hasQaStoryViewers,
  hasShopperA,
  hasShopperB,
  hasShopperBCode,
  NO_QA_STORY_VIEWERS_REASON,
  shopperBOtp,
} from "./harness/env";
import {
  newLiveContext,
  openSignedInSession,
  saveSession,
  SESSION_STATE,
} from "./harness/liveSession";
import { recordSignInOutcome } from "./harness/session";
import { throughProxyInPage } from "./harness/orderCleanup";
import { stories as storySelectors } from "./selectors";

// One journey, in order. A later case must never run against a session an
// earlier one failed to make and report a fault that is not there.
test.describe.configure({ mode: "serial" });

const COUNTRY = "sy";

/** This run's label, made once.
 *
 *  Module scope is safe here and only here: `workers: 1` and
 *  `fullyParallel: false` keep one spec file inside one worker, so these values
 *  are shared by the cases in this file and by nothing else. */
const RUN_TOKEN = newRunToken();

/** What each upload case leaves for the ones after it. */
const uploaded: { kind: string; link: string; storyId: string | number; groupId: string | number }[] = [];

let context: BrowserContext;
let page: Page;

test.beforeEach(() => {
  test.skip(!hasBackends(), "BACKEND_URL and GO_BACKEND_URL are not set.");
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE and TEST_ACCOUNT_OTP are not set, so nothing can sign in to upload a story.",
  );
  test.skip(!hasMedia(), "The media store is not configured, so no story can be uploaded.");
  test.skip(!hasQaStoryViewers(), NO_QA_STORY_VIEWERS_REASON);
});

test.afterAll(async ({ browser }) => {
  // The net, not the test. STORY-05 deletes through the screens a shopper uses;
  // this only matters when the run died before reaching it.
  //
  // It runs from the **uploader's** session, because only the owner may delete.
  // Quiet on purpose: clean-up that throws replaces the failure the run was
  // reporting.
  //
  // **Bounded by the same five pages as the finder.** A story pushed further
  // back than that is not reached, and stays on the environment.
  test.setTimeout(120_000);

  if (uploaded.length === 0) {
    await context?.close();
    return;
  }

  try {
    const netContext = await openSignedInSession(
      browser,
      SESSION_STATE.stories,
      "STORY-00a",
    );
    const netPage = await netContext.newPage();
    await gotoHome(netPage);

    const left = await findOwnStoriesLeft(netPage, {
      runToken: RUN_TOKEN,
      country: COUNTRY,
    });

    for (const story of left) {
      await throughProxyInPage(netPage, {
        target: "/api/v1/stories/delete_story",
        method: "POST",
        body: { story_id: story.storyId },
        country: COUNTRY,
        language: "en",
        server: "stories",
      }).catch(() => undefined);
    }

    await netContext.close();
  } catch {
    // Nothing to say and nothing to do.
  }

  await context?.close();
});

test("STORY-00a the uploader signs in", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  context = await newLiveContext(browser);
  page = await context.newPage();

  await gotoAbout(page, { country: COUNTRY });
  const signIn = recordSignInOutcome(page);

  await attemptAuth(page, {
    intent: "login",
    phone: envValue("TEST_ACCOUNT_PHONE"),
    method: "whatsapp",
    otp: envValue("TEST_ACCOUNT_OTP"),
  });
  await signIn.waitForOutcome(30_000);

  const session = await signedInSession(page);
  expect(
    session.phoneVerified,
    `the uploader's sign-in did not land (the app reported ${signIn.outcome()})`,
  ).toBe(true);

  expect(
    session.stories,
    "the app signed this account in but the stories backend's part did not land, so this account has no story feed of its own to upload into",
  ).toBe(true);

  await saveSession(context, SESSION_STATE.stories);
});

test("STORY-00b the reporter signs in", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  test.skip(
    !hasShopperB() || !hasShopperBCode(),
    "TEST_ACCOUNT_PHONE_2 and TEST_ACCOUNT_OTP_2 are not both set, so nothing can sign in as the second account. Only that account can report, because the report control is never drawn for the owner.",
  );

  const reporterContext = await newLiveContext(browser);
  const reporterPage = await reporterContext.newPage();

  await gotoAbout(reporterPage, { country: COUNTRY });
  const signIn = recordSignInOutcome(reporterPage);

  await attemptAuth(reporterPage, {
    intent: "login",
    phone: envValue("TEST_ACCOUNT_PHONE_2"),
    method: "whatsapp",
    otp: shopperBOtp(),
  });
  await signIn.waitForOutcome(30_000);

  const session = await signedInSession(reporterPage);
  expect(
    session.phoneVerified,
    `the reporter's sign-in did not land (the app reported ${signIn.outcome()})`,
  ).toBe(true);

  expect(
    session.stories,
    "the reporting account signed in but the stories backend's part did not land, so it has no story feed and nothing to report from",
  ).toBe(true);

  await saveSession(reporterContext, SESSION_STATE.storiesReporter);
  await reporterContext.close();
});

test("STORY-01 a photo story is uploaded and carries this run's mark", async () => {
  test.setTimeout(240_000);

  await gotoHome(page);
  const { link, attempt } = await uploadStory(page, {
    runToken: RUN_TOKEN,
    kind: "photo",
  });

  expect(
    attempt.mediaStatus,
    `the media server did not take the photo. ${JSON.stringify(attempt.mediaStatus)} is not a success`,
  ).toBeLessThan(400);

  const found = await waitForOwnStory(page, { link, country: COUNTRY });

  expect(
    found,
    "the stories backend accepted the upload but the story never appeared in the feed within a minute, so nothing below can open it",
  ).not.toBeNull();

  // AC-7, the half that matters: what the backend **stored**, not what was
  // typed. A story that came back unmarked is visible to every customer, so it
  // goes at once.
  const storedIsQa = found!.link.startsWith(qaStoryLink(RUN_TOKEN, "photo"));
  if (!storedIsQa) {
    await throughProxyInPage(page, {
      target: "/api/v1/stories/delete_story",
      method: "POST",
      body: { story_id: found!.storyId },
      country: COUNTRY,
      language: "en",
      server: "stories",
    }).catch(() => undefined);
  }
  expect(
    storedIsQa,
    "the story the backend stored does not carry this run's test link, so it is not hidden from customers. It has been deleted again",
  ).toBe(true);

  uploaded.push({
    kind: "photo",
    link,
    storyId: found!.storyId,
    groupId: found!.groupId,
  });
});

test("STORY-03 the feed shows this run's own story, wherever it sits", async () => {
  test.setTimeout(180_000);
  expect(
    uploaded.length,
    "no story was uploaded, so there is nothing to look for",
  ).toBeGreaterThan(0);

  await gotoHome(page);

  const own = uploaded[0];
  const found = await findOwnStory(page, { link: own.link, country: COUNTRY });

  expect(
    found?.storyId,
    "the story this run uploaded is not in the first five pages of the feed for the account that uploaded it. Either the app being served was built without NEXT_PUBLIC_QA_STORY_VIEWER_PHONES — a run with --skip-build reuses an older build — or the stories backend has not published it",
  ).toBe(own.storyId);

  // And on screen, not only in the answer.
  await openRing(page, own.groupId);
  expect(
    await advanceToStory(page, own.storyId),
    "the ring opened but the viewer never landed on this run's own story after stepping forward, so the cases that report and delete have no way to aim",
  ).toBe(true);

  await storySelectors.closeViewer(page).click().catch(() => undefined);
});

test("STORY-03b a guest never sees this run's story, while it is live", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  expect(
    uploaded.length,
    "no story was uploaded, so there is nothing to hide",
  ).toBeGreaterThan(0);

  // **This is what makes the lock's proof real.** The existing QA-11 case only
  // asserts that no QA link is on the page — which passes on an environment that
  // has no QA story at all. Here the story is known to exist, because the case
  // above just found it, so the absence below means hidden and not missing.
  const guestContext = await newLiveContext(browser);
  const guestPage = await guestContext.newPage();
  const own = uploaded[0];

  try {
    await gotoHome(guestPage);

    // **This case used to read the wrong thing, and so could never fail.**
    //
    // It collected every `<a href>` on the home page and looked for the story's
    // link among them. No home page anchor ever carries a story link: the bar
    // tile is a `div` (`components/Home/Stories/Story.tsx`) and the
    // `<a href={link}>` exists only inside the **opened** viewer
    // (`components/Home/Stories/StoryViewer.tsx`). So the list it searched could
    // not contain the answer whether or not the guest could see the ring, the
    // filter always came back empty, and the case passed every time — including
    // on a day the hiding rule was broken. It is the case this project relies on
    // to prove test stories stay away from customers.
    //
    // It now reads the **ring tile**, which is what a guest would actually see,
    // by the author's own id.
    const tiles = guestPage.locator('[data-pw="story-element"]');

    // **Content before absence.** A bar that drew nothing at all would satisfy
    // any absence check while proving nothing — the story would be "hidden"
    // only because there was no feed. This is the same trap in a second form.
    await expect
      .poll(async () => await tiles.count(), {
        timeout: 60_000,
        message:
          "a signed-out visitor's home page drew no stories bar at all, so this case cannot tell a hidden story from an empty feed. That is a stories backend fault, not a filter fault",
      })
      .toBeGreaterThan(0);

    expect(
      await guestPage
        .locator(`[data-pw="story-element"][data-id="${own.groupId}"]`)
        .count(),
      "a signed-out visitor's home page shows the ring holding the story this run uploaded, so test content is on a real customer's screen",
    ).toBe(0);
  } finally {
    await guestContext.close().catch(() => undefined);
  }
});

test("STORY-04 the second account reports the story this run uploaded", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  test.skip(
    !hasShopperB() || !hasShopperBCode(),
    "TEST_ACCOUNT_PHONE_2 and TEST_ACCOUNT_OTP_2 are not both set, so nothing can sign in as the account that reports.",
  );
  expect(
    uploaded.length,
    "no story was uploaded, so there is nothing to report",
  ).toBeGreaterThan(0);

  const reporterContext = await openSignedInSession(
    browser,
    SESSION_STATE.storiesReporter,
    "STORY-00b",
  );
  const reporterPage = await reporterContext.newPage();
  await gotoHome(reporterPage);

  const own = uploaded[0];

  // The reporter has to find the uploader's ring for itself: it sees a
  // different feed.
  const seen = await findOwnStory(reporterPage, {
    link: own.link,
    country: COUNTRY,
  });
  expect(
    seen?.storyId,
    "the reporting account cannot see the story the other account uploaded, so it has nothing to report. Both test phones must reach the build as NEXT_PUBLIC_QA_STORY_VIEWER_PHONES",
  ).toBe(own.storyId);

  await openRing(reporterPage, own.groupId);
  expect(
    await advanceToStory(reporterPage, own.storyId),
    "the viewer never landed on this run's story, so the report was not filed — which is the right outcome, because a report cannot be withdrawn",
  ).toBe(true);

  await reportShowingStory(reporterPage, { storyId: own.storyId });

  await reporterContext.close();
});

test("STORY-05 every story this run uploaded is deleted, and is gone from the backend", async () => {
  test.setTimeout(240_000);
  expect(
    uploaded.length,
    "no story was uploaded, so there is nothing to delete",
  ).toBeGreaterThan(0);

  await gotoHome(page);

  for (const own of uploaded) {
    await openRing(page, own.groupId);

    expect(
      await advanceToStory(page, own.storyId),
      `the viewer never landed on this run's ${own.kind} story, so nothing was deleted`,
    ).toBe(true);

    await deleteShowingStory(page, { storyId: own.storyId });
    await page.waitForTimeout(1_000);
    await storySelectors.closeViewer(page).click().catch(() => undefined);
  }

  // Checked at the backend, not on the screen. The viewer removes a deleted
  // story from the store straight away, so the screen would agree even if the
  // stories backend had refused.
  const left = await findOwnStoriesLeft(page, {
    runToken: RUN_TOKEN,
    country: COUNTRY,
  });

  expect(
    left.map((story) => story.storyId),
    "the delete screen reported success but the stories backend still holds this run's story, so the row is still on the environment",
  ).toEqual([]);

  uploaded.length = 0;
});

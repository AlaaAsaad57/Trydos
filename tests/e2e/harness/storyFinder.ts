// Finding one run's own story in the feed — and nothing else.
//
// **Pure on purpose.** No `@playwright/test`, no `Page`, no network. The caller
// hands in a `readPage(n)` function and this decides where to look and when to
// stop, exactly as `qaGrepFor` in `laneConfig.ts` takes its allow-list check as
// an argument. That is what lets the unit suite drive the paging with a fake
// feed instead of a real backend — the browser suite gates no pull request, so a
// rule proved only there is unguarded from the day it lands.
//
// **Why match on the whole link.** The QA mark is the link's *host*, and the
// host alone cannot tell this run's photo story from its video story, from a
// leftover of an earlier run, or from another item in the same ring. Every
// upload therefore carries `https://<qa host>/e2e/<run token>/<kind>`, and
// everything here matches the full address or the run's own prefix. A test must
// never report or delete a story it did not create.

/** One story item, as the feed carries it. Deliberately loose: three modules in
 *  this repository declare their own `Story` type and none of them is the one
 *  the backend actually sends. */
export type FeedStory = { id?: string | number; link?: unknown };

/** One author's stories. */
export type FeedGroup = { id?: string | number; stories?: FeedStory[] };

/** Where a story was found. `page` is recorded so a case can say "page 3 of 5"
 *  rather than "somewhere". */
export type FoundStory = {
  groupId: string | number;
  storyId: string | number;
  link: string;
  page: number;
};

/** How many pages of the feed anything here will read.
 *
 *  Five, and the number is a budget rather than a guess: each page is a real
 *  round trip to the stories backend, and the cases that page are bounded by a
 *  per-case timeout that has to hold on a slow day. A story past page five is
 *  not found — see `MISSED_PAST_PAGE_LIMIT`. */
export const PAGE_LIMIT = 5;

/** Said plainly, because the alternative is a silent gap: the clean-up cannot
 *  promise more than the window it reads. */
export const MISSED_PAST_PAGE_LIMIT =
  `nothing matched in the first ${PAGE_LIMIT} pages of the feed. ` +
  "A story further back than that is not reached by this suite, so it stays on the environment";

/** How many times the poll asks page one, and how long it waits between asks.
 *
 *  12 × 5 s = 60 s. The comparable number in this suite is QA-10's index poll,
 *  which is capped at 36 attempts of 5 s; that is a **cap it breaks out of on
 *  the first hit**, not a measured need. A story row is written by the same
 *  request that created it, so it should appear far sooner than a search index
 *  does. */
export const POLL_ATTEMPTS = 12;
export const POLL_WAIT_MS = 5_000;

/** Reads one page of the feed. Page numbers start at 1. */
export type ReadPage = (page: number) => Promise<FeedGroup[]>;

const linkOf = (story: FeedStory): string =>
  typeof story?.link === "string" ? story.link.trim() : "";

/** Walk the feed, newest page first, and return every story whose link the
 *  caller accepts.
 *
 *  Stops at `PAGE_LIMIT`, and stops early on an empty page — an empty page means
 *  the feed has ended, and asking for the next one only costs a round trip. */
export const findStories = async (
  readPage: ReadPage,
  options: {
    matches: (link: string) => boolean;
    maxPages?: number;
    /** Stop at the first match. The locate path wants one; the clean-up wants
     *  all of them. */
    stopAtFirst?: boolean;
  },
): Promise<FoundStory[]> => {
  const maxPages = options.maxPages ?? PAGE_LIMIT;
  const found: FoundStory[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const groups = await readPage(page);
    if (!Array.isArray(groups) || groups.length === 0) break;

    for (const group of groups) {
      for (const story of group?.stories ?? []) {
        const link = linkOf(story);
        if (!link || !options.matches(link)) continue;
        if (group?.id === undefined || story?.id === undefined) continue;

        found.push({
          groupId: group.id,
          storyId: story.id,
          link,
          page,
        });

        if (options.stopAtFirst) return found;
      }
    }
  }

  return found;
};

/** The one story at exactly this address, or `null`. */
export const findStoryByLink = async (
  readPage: ReadPage,
  options: { link: string; maxPages?: number },
): Promise<FoundStory | null> => {
  const wanted = options.link.trim();

  const found = await findStories(readPage, {
    matches: (link) => link === wanted,
    maxPages: options.maxPages,
    stopAtFirst: true,
  });

  return found[0] ?? null;
};

/** Every story this run uploaded, by its own token prefix.
 *
 *  **Only this run's.** A leftover from an earlier run matches a different
 *  token, and another run may be in flight against the same environment — so
 *  deleting somebody else's leftover is not tidying up, it is interfering. */
export const findStoriesByPrefix = async (
  readPage: ReadPage,
  options: { prefix: string; maxPages?: number },
): Promise<FoundStory[]> => {
  const prefix = options.prefix.trim();
  if (!prefix) return [];

  return findStories(readPage, {
    matches: (link) => link.startsWith(prefix),
    maxPages: options.maxPages,
  });
};

/** Wait for a freshly uploaded story to appear, asking **page one only**.
 *
 *  A story that was just created is the newest thing in the feed, so paging
 *  while waiting multiplies the round trips for no gain: `PAGE_LIMIT` pages ×
 *  `POLL_ATTEMPTS` attempts would be 60 reads per upload. Paging belongs to the
 *  case that has to prove paging works, and to the clean-up.
 *
 *  `sleep` is a parameter so the unit suite can drive every attempt without
 *  waiting a real minute. */
export const waitForStoryByLink = async (
  readPage: ReadPage,
  options: {
    link: string;
    attempts?: number;
    waitMs?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<FoundStory | null> => {
  const attempts = options.attempts ?? POLL_ATTEMPTS;
  const waitMs = options.waitMs ?? POLL_WAIT_MS;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const found = await findStoryByLink(readPage, {
      link: options.link,
      maxPages: 1,
    });
    if (found) return found;

    if (attempt < attempts) await sleep(waitMs);
  }

  return null;
};

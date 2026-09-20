// The QA mark for stories, and the filter that hides it from the feed.
//
// A story has no shop behind it, so the shop-slug mark used for products does
// not apply. The mark a story carries is its **link**: a QA story links to the
// QA host. That is the same idea — the mark travels inside the row — using the
// one field the story backend already stores and every reader already receives.
//
// **No `"use client"` and no `"use server"` here.** Four different readers apply
// this filter: two run on the server, two in the browser. A directive would shut
// half of them out.
//
// The host is a **code constant**. `NEXT_PUBLIC_QA_STORY_LINK_HOST` can override
// it, and the value is public by design — it ships in the browser bundle and it
// is not a secret. Anybody who learns it learns the address of a test story.

/** The default host. A story whose `link` points here is QA data. */
export const QA_STORY_LINK_HOST = "qa-test.trydos.tech";

/** The host in force, lower case. Falls back to the constant when the override
 *  is empty or is not a parseable host. */
export const qaStoryLinkHost = (): string => {
  const override = (process.env.NEXT_PUBLIC_QA_STORY_LINK_HOST ?? "").trim();
  if (!override) return QA_STORY_LINK_HOST;

  const host = hostOf(override);
  return host || QA_STORY_LINK_HOST;
};

/** The host part of a link, or `""` when there is not one.
 *
 *  **Never throws.** A throw inside a story reader is expensive out of all
 *  proportion: it leaves the home stories bar stuck on its skeleton, and it
 *  sends the server reader into its catch, which returns an empty feed and
 *  writes one error report per request. An unreadable link is simply not QA. */
const hostOf = (value: string): string => {
  const raw = value.trim();
  if (!raw) return "";

  try {
    // A bare host such as `qa-test.trydos.tech/x` has no scheme, and `new URL`
    // refuses it. Add one so both shapes parse the same way.
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
      ? raw
      : `https://${raw}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return "";
  }
};

/** Is this story a QA story, measured against a host the caller already read?
 *
 *  Separate from `isQaStory` so a whole feed can be filtered without calling
 *  `qaStoryLinkHost()` — which reads the environment and may build a `URL` —
 *  once per story. */
const isQaStoryForHost = (story: unknown, host: string): boolean => {
  if (!story || typeof story !== "object") return false;

  const link = (story as { link?: unknown }).link;
  if (typeof link !== "string") return false;

  const storyHost = hostOf(link);
  return storyHost !== "" && storyHost === host;
};

/** Is this story a QA story? */
export const isQaStory = (story: unknown): boolean =>
  isQaStoryForHost(story, qaStoryLinkHost());

// ---------------------------------------------------------------------------
// The viewer allow-list — who still sees a QA story
// ---------------------------------------------------------------------------

/** The accounts that still see QA stories, named by **phone number**.
 *
 *     NEXT_PUBLIC_QA_STORY_VIEWER_PHONES=999000000001,999000000002
 *
 *  Phone numbers rather than user ids, for one reason: the test accounts'
 *  numbers are already configured — the e2e harness needs them to sign in — so
 *  nobody has to look anything up, and there is no second setting to keep in
 *  step with the first. The harness fills this in for itself from the accounts
 *  it is already given.
 *
 *  **Empty is the default and means the feature is off.** With nothing set, no
 *  viewer can match and everybody — signed in or not — sees exactly what they
 *  saw before this list existed.
 *
 *  **It must never be set on a deployed app.** `NEXT_PUBLIC_` values are inlined
 *  into the browser bundle at build time, so on a build that has it set the
 *  numbers are readable by every visitor of that build. It belongs only in the
 *  environment the e2e harness builds and starts, which is never deployed and
 *  never published — the same rule `QA_VIEW_SECRET` carries, and the reason the
 *  numbers must stay out of every tracked file.
 *
 *  **The browser half of this is advisory, not a control.** Three of the four
 *  readers run in the page and learn who is looking from store state a visitor
 *  can change. The real guarantee is the paragraph above: on a build a customer
 *  can reach, the list is empty, so there is nothing to match and nothing to
 *  spoof. Only `serverRequests/stories.ts` reads the viewer out of the browser's
 *  reach, from the HttpOnly `User-Data` cookie.
 *
 *  Matching ignores everything that is not a digit, on **both** sides — so
 *  `+999 000 000 001`, `999000000001` and `+999-000-000-001` are one entry. That
 *  is the same rule `utils/server/otpAllowlist.ts` uses for the test numbers
 *  that skip the one-time-code limiter, and for the same reason: the app, the
 *  environment file and a person typing all write a number differently. */

/** Everything that is not a digit is noise — on both sides of the comparison. */
const digitsOnly = (value: unknown): string =>
  typeof value === "number"
    ? String(value).replace(/[^0-9]/g, "")
    : typeof value === "string"
      ? value.replace(/[^0-9]/g, "")
      : "";

/** Shared empty set, so the common case allocates nothing. */
const NO_VIEWERS: ReadonlySet<string> = new Set<string>();

const viewerPhones = (): ReadonlySet<string> => {
  const raw = (process.env.NEXT_PUBLIC_QA_STORY_VIEWER_PHONES ?? "").trim();
  if (!raw) return NO_VIEWERS;

  // `filter(Boolean)` after the mapping, so `"1,,2"` and a trailing comma never
  // leave an empty entry behind. An empty entry would match a viewer with no
  // phone at all — which is every guest, and every signed-in visitor before the
  // store is filled.
  return new Set(raw.split(",").map(digitsOnly).filter(Boolean));
};

/** Is the viewer one of the configured test accounts?
 *
 *  Takes the phone as the app holds it — a string, a number, with or without a
 *  `+` and spaces. `""`, `null`, `undefined` and `0` all mean "nobody is signed
 *  in yet", and none of them may ever match: that is what a reader passes before
 *  it knows who is looking, and a list entry matching it would show QA stories
 *  to everyone. */
export const isQaStoryViewer = (viewerPhone: unknown): boolean => {
  const digits = digitsOnly(viewerPhone);
  // A lone `0` is the app's own "no phone" marker (`components/Home/AddStory.tsx`).
  if (!digits || Number(digits) === 0) return false;

  return viewerPhones().has(digits);
};

/** Drop every QA story from a feed, then drop any group left with none.
 *
 *  The shape is a list of **groups** — one per author — each holding a nested
 *  `stories` array. Both levels matter: removing the QA item but keeping its
 *  author leaves an empty ring on the bar that opens onto nothing.
 *
 *  A group that already had no stories is dropped too. Two of the four readers
 *  filtered empty groups before this existed and two did not, so doing it here
 *  makes the four agree. */
/** The shape this filter needs, and nothing more.
 *
 *  Deliberately loose. Four readers call this, and each one holds its own
 *  `Story` type — `serverRequests/stories.ts`, `store/homepage/reducer.ts` and
 *  `tests/fixtures/story.ts` all declare a different one. Naming any of them
 *  here would tie the filter to one reader and force a cast at the other three.
 *  What the filter actually reads is a `stories` array whose items may carry a
 *  `link`, so that is what it asks for. */
type StoryGroupLike = { stories?: unknown };

export const dropQaStories = <T extends StoryGroupLike = any>(
  groups: readonly T[] | null | undefined,
  /** The phone number of whoever is looking, when the caller knows it.
   *
   *  Optional, and the default is today's behaviour exactly: with no second
   *  argument nobody is a test viewer and every QA story is dropped. That is
   *  what lets the readers be updated one at a time without an intermediate
   *  state where a QA story escapes. */
  viewerPhone?: unknown,
): T[] => {
  if (!Array.isArray(groups)) return [];

  // Both read **once per call**, never once per story: `qaStoryLinkHost()` reads
  // the environment and may build a `URL`, and the allow-list splits a string.
  const host = qaStoryLinkHost();
  const keepQaStories = isQaStoryViewer(viewerPhone);

  const kept: T[] = [];

  for (const group of groups) {
    if (!group || typeof group !== "object") continue;

    const stories = (group as { stories?: unknown }).stories;
    if (!Array.isArray(stories)) continue;

    // A test viewer keeps the QA stories. The empty-author rule below still
    // applies to them, because an author with no stories is an empty ring that
    // opens onto nothing whoever is looking.
    const keptStories = keepQaStories
      ? stories
      : stories.filter((story) => !isQaStoryForHost(story, host));
    if (keptStories.length === 0) continue;

    kept.push({ ...(group as object), stories: keptStories } as T);
  }

  return kept;
};

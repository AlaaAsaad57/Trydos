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

/** Is this story a QA story? */
export const isQaStory = (story: unknown): boolean => {
  if (!story || typeof story !== "object") return false;

  const link = (story as { link?: unknown }).link;
  if (typeof link !== "string") return false;

  const host = hostOf(link);
  return host !== "" && host === qaStoryLinkHost();
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
): T[] => {
  if (!Array.isArray(groups)) return [];

  const kept: T[] = [];

  for (const group of groups) {
    if (!group || typeof group !== "object") continue;

    const stories = (group as { stories?: unknown }).stories;
    if (!Array.isArray(stories)) continue;

    const keptStories = stories.filter((story) => !isQaStory(story));
    if (keptStories.length === 0) continue;

    kept.push({ ...(group as object), stories: keptStories } as T);
  }

  return kept;
};

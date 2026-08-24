// robots.txt, and which crawlers it lets in.
//
// This file exists because of a live defect on trydos.ramaaz.dev: link previews
// were blank on Facebook, LinkedIn and X, while WhatsApp still showed something.
// The split is the tell. WhatsApp's fetcher ignores robots.txt; the other three
// read it first and obey it. And robots.txt said, for everyone:
//
//     User-Agent: *
//     Disallow: /
//
// So the OG tags on the page were never the problem for those three — they were
// never fetched. Nothing errored and nothing was logged: the platforms simply
// declined to scrape, which looks exactly like "the preview is broken".
//
// The blanket disallow is deliberate and stays. It keeps a pre-launch host out
// of search, and — the reason that matters on the bill — it stops crawlers
// walking every locale and paying for an SSR render each time. What it must not
// do is take the preview scrapers down with the search engines. Those two jobs
// look the same to robots.txt and are not the same thing: a preview scraper
// fetches one page a shopper deliberately shared, renders a card and leaves.
//
// So the two halves below. The first is the fix: the named preview crawlers get
// through while `*` stays shut. The second guards the half that must not move —
// a search engine reading this file still finds a closed door, because the whole
// point of the flag is that staging is not indexable.

import { afterEach, describe, expect, it } from "vitest";

import robots from "app/robots";

// The crawlers that render a link card. Each one reads robots.txt and obeys it,
// which is why each needs naming: `*` does not reach them once a more specific
// group matches, and a group that is missing means that platform is still shut
// out. Telegram and Discord are here for the same reason as the first three —
// they are how a shopper shares a product outside WhatsApp.
const PREVIEW_CRAWLERS = [
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "TelegramBot",
  "Discordbot",
];

// robots.txt groups are addressed by user-agent, and Next lets a rule carry
// either one agent or a list. Read both shapes so a later edit that splits or
// merges the groups does not quietly stop this file from finding them.
function ruleFor(userAgent: string) {
  const rules = robots().rules;
  const asArray = Array.isArray(rules) ? rules : [rules];
  return asArray.find((rule) => {
    const agents = Array.isArray(rule.userAgent)
      ? rule.userAgent
      : [rule.userAgent];
    return agents.some(
      (agent) => agent?.toLowerCase() === userAgent.toLowerCase(),
    );
  });
}

// `disallow: "/"` and `allow: "/"` can each be a string or a list of them.
function pathsIn(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

describe("robots.txt on a host that is not indexable", () => {
  // The runner sets NEXT_PUBLIC_ALLOW_INDEXING=false for every test (see
  // vitest.config.mts), which is the branch this whole block is about. Restore
  // it after the one test that changes it.
  afterEach(() => {
    process.env.NEXT_PUBLIC_ALLOW_INDEXING = "false";
  });

  it.each(PREVIEW_CRAWLERS)(
    "lets %s fetch the page, so its link preview can be built",
    (crawler) => {
      const rule = ruleFor(crawler);

      expect(
        rule,
        `robots.txt names no group for ${crawler}, so it falls through to "User-agent: *" and is refused — this platform shows a blank link card no matter what the page's OG tags say`,
      ).toBeDefined();

      expect(
        pathsIn(rule?.allow),
        `robots.txt has a group for ${crawler} but does not allow "/", so it still cannot fetch the page it was asked to preview`,
      ).toContain("/");

      expect(
        pathsIn(rule?.disallow),
        `robots.txt allows ${crawler} and disallows "/" in the same group — the more specific disallow wins and the preview stays blank`,
      ).not.toContain("/");
    },
  );

  it("still shuts every other crawler out, so a pre-launch host stays unindexed", () => {
    const catchAll = ruleFor("*");

    expect(
      catchAll,
      'robots.txt has no "User-agent: *" group, so search engines are no longer refused and a pre-launch host can be indexed',
    ).toBeDefined();

    expect(
      pathsIn(catchAll?.disallow),
      'the "User-agent: *" group no longer disallows "/" — search engines may now crawl every locale, which both indexes a host that is not ready and pays for an SSR render per page',
    ).toContain("/");
  });

  it("does not publish a sitemap, so no crawler is handed the full page list", () => {
    expect(
      robots().sitemap,
      "robots.txt advertises a sitemap on a host that is not indexable, which invites exactly the crawl the blanket disallow exists to prevent",
    ).toBeUndefined();
  });

  it("opens the whole site to everyone once indexing is switched on", () => {
    process.env.NEXT_PUBLIC_ALLOW_INDEXING = "true";

    const catchAll = ruleFor("*");

    expect(
      pathsIn(catchAll?.allow),
      'with NEXT_PUBLIC_ALLOW_INDEXING=true the "User-agent: *" group does not allow "/" — the production domain is unreachable to search engines',
    ).toContain("/");

    expect(
      robots().sitemap,
      "the indexable build publishes no sitemap, so crawlers have to discover every page by following links",
    ).toBeTruthy();
  });
});

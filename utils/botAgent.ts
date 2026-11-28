/**
 * Crawlers and link-preview fetchers, by their user agent (Stage 7e part 2).
 *
 * The start flow and the sign-in request never show to them: a crawler must
 * read the page, not a login over it.
 *
 * The words are proxy.ts's own bot list, minus "instagram". The Instagram app
 * opens links in its own browser, whose user agent says "Instagram", and that
 * browser is a real shopper. proxy.ts keeps its list for its locale rules and
 * is not changed here.
 */
const CRAWLER_WORDS = [
  "googlebot",
  "bingbot",
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "linkedinbot",
  "discordbot",
  "slackbot-linkexpanding",
  "vercel",
  "vercel-og",
] as const;

/** True when the user agent is a crawler or a link-preview fetcher. */
export function isCrawlerAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const agent = userAgent.toLowerCase();
  return CRAWLER_WORDS.some((word) => agent.includes(word));
}

import { MetadataRoute } from "next";
import { isIndexingAllowed } from "utils/server";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

// The crawlers that build a link preview card, and nothing else.
//
// These are not search engines and must not be treated as ones. A search engine
// walks the whole site on its own schedule; each of these fetches exactly one
// page, because a shopper deliberately pasted that page's address into a chat.
// Refusing them does not keep anything out of search — it only makes the link
// the shopper shared arrive with no picture, no title and no description.
//
// Each one has to be named. robots.txt matches the single most specific group
// and ignores every other, so a crawler with no group of its own falls through
// to "User-agent: *" and is refused. WhatsApp is deliberately absent: its
// fetcher does not read robots.txt at all, so a group for it would do nothing.
const LINK_PREVIEW_CRAWLERS = [
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "TelegramBot",
  "Discordbot",
];

export default function robots(): MetadataRoute.Robots {
  // Only the production domain (NEXT_PUBLIC_ALLOW_INDEXING=true) is crawlable.
  // Everywhere else, disallow the whole site so dev/preview builds stay out of
  // search — and, just as important pre-launch, so crawlers don't trigger SSR
  // renders across every locale and inflate Vercel Function Duration.
  //
  // The link-preview crawlers are carved out of that. They cost one render for
  // one page a shopper chose to share, which is the whole point of sharing it,
  // and they never index. No sitemap is published either way here, so nothing
  // hands any of them the full page list.
  if (!isIndexingAllowed()) {
    return {
      rules: [
        {
          userAgent: LINK_PREVIEW_CRAWLERS,
          allow: "/",
        },
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${General_Site_Data.url}/sitemap.xml`,
  };
}

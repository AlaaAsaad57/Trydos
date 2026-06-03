import { MetadataRoute } from "next";
import { isIndexingAllowed } from "utils/server";

export default function robots(): MetadataRoute.Robots {
  // Only the production domain (NEXT_PUBLIC_ALLOW_INDEXING=true) is crawlable.
  // Everywhere else, disallow the whole site so dev/preview builds stay out of search.
  if (!isIndexingAllowed()) {
    return {
      rules: [
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
  };
}

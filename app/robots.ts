import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },

    sitemap:
      "https://www.trydos-front-git-alaa-dev-trydos-front-team.vercel.app/sitemap.xml",
  };
}

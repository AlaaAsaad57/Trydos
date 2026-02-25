import { MetadataRoute } from "next";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = General_Site_Data.url;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/settings",
          "/dashboard/",
          "/_next/",
          "/static/",
          "/private/",
          "/temp/",
          "/test/",
          "/staging/",
          "/dev/",
          "/revalidate/",
          "/callInProg/",
          "/endCall/",
          "/call_direct/",
          "/selectCountry/",
          "/api-test/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
  // return {
  //   rules: [
  //     {
  //       userAgent: "*",
  //       disallow: "*",
  //     },
  //   ],
  // };
}

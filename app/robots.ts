import { MetadataRoute } from "next";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = General_Site_Data.url;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  };
}

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_REMOTE_FRONT;

  return {
    rules: [
      {
        userAgent: "*",
        disallow: "*",
      },
    ],
  };
  // return {
  //   rules: [
  //     {
  //       userAgent: "*",
  //       allow: "/",
  //       disallow: [
  //         "/api/",
  //         "/admin/",
  //         "/dashboard/",
  //         "/_next/",
  //         "/static/",
  //         "/private/",
  //         "/temp/",
  //         "/test/",
  //         "/staging/",
  //         "/dev/",
  //         "/revalidate/",
  //         "/callInProg/",
  //         "/endCall/",
  //         "/call_direct/",
  //         "/selectCountry/",
  //         "/api-test/",
  //       ],
  //     },
  //   ],
  //   sitemap: `${baseUrl}/sitemap.xml`,
  //   host: baseUrl,
  // };
}

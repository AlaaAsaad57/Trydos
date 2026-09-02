import { lang as langParam } from "next/root-params";
import CategoryHomeView from "components/Home/CategoryHomeView";
import { GetHomeMetaData } from "serverRequests/meta/home";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { LogServerError } from "utils/serverErrorReporter";
import { translateFunction } from "utils/server";

// `export const instant = false` is gone. It was phase 1's opt-out, added so the
// app could build with Cache Components on before any route was converted. This
// route is converted now.
//
// `searchParams` is gone too, and that is the change that makes the rest
// possible: a page that awaits searchParams is request-bound and can never be
// cached. ?mainCategory= became /categories/{slug} (D-13). Old addresses are not
// redirected (D-14) — they now render the plain homepage, which is a correct
// page, not an error.

export async function generateMetadata() {
  const lang = await langParam();
  try {
    return await GetHomeMetaData({ local: lang, category: null });
  } catch (error) {
    LogServerError({ error, type: "meta" }, `/${lang}`);
    const language = lang.split("-")[1];
    const baseUrl = General_Site_Data.url;
    const ogImageUrl = baseUrl + General_Site_Data.og;
    const title = translateFunction(
      "TryDos - Premium Shopping Experience",
      language,
    );
    const description = translateFunction(
      "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      language,
    );

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${lang}`,
        siteName: "Trydos",
        type: "website",
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }
}

// The try/catch that used to wrap the JSX is gone. It caught, logged and then
// re-threw the same error, which is what an error boundary is for — and
// app/(client)/[lang]/error.tsx is that boundary. Re-throwing from a Server
// Component only stopped React streaming the parts that had already rendered.
export default async function HomePage() {
  return <CategoryHomeView slug={null} />;
}

import { General_Site_Data } from "./Constants";
import { mapLocaleToBCP47 } from "./utils";

function Website({ local }) {
  let payload = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${General_Site_Data.url}/#website`,
    url: `${General_Site_Data.url}`,
    name: General_Site_Data.name,
    inLanguage: mapLocaleToBCP47(local),
    publisher: {
      "@id": `${General_Site_Data.url}/#organization`,
    },
    // Google Sitelinks Search Box — deep-links into our server-rendered search
    // results route (/{locale}/filters?search={term}). Search now lives in the
    // ?search= query param (single source of truth), so the template must use it.
    // {search_term_string} must remain a literal placeholder; it survives
    // JSON.stringify untouched.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${General_Site_Data.url}/${local}/filters?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default Website;

import Script from "next/script";
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

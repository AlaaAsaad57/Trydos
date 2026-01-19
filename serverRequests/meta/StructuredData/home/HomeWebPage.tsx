import Script from "next/script";
import { General_Site_Data } from "../Constants";
import { mapLocaleToBCP47 } from "../utils";
import { trydosTranslations } from "serverRequests/meta/constants-meta";

function HomeWebPage({ local }) {
  const [country, language] = local?.split("-");
  const translation = trydosTranslations[language] || trydosTranslations.en;
  let payload = {
    "@type": "WebPage",
    "@id": `${General_Site_Data.url}/${local}/#webpage`,
    url: `${General_Site_Data.url}/${local}`,
    name: translation.home.title,
    inLanguage: mapLocaleToBCP47(local),
    isPartOf: {
      "@id": `${General_Site_Data.url}/#website`,
    },
    about: {
      "@id": `${General_Site_Data.url}/#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${General_Site_Data.url}/${General_Site_Data.og}`,
    },
  };

  {
  }
  return (
    <Script
      id="home-webpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default HomeWebPage;

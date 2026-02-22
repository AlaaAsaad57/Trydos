import { General_Site_Data } from "./Constants";
import Script from "next/script";

function Organaization({ local }) {
  let payload = {
    "@context": "https://schema.org",

    "@type": "Organization",
    "@id": `${General_Site_Data.url}/#organization`,
    name: `${General_Site_Data.name}`,
    url: `${General_Site_Data.url}/${local}`,
    logo: `${General_Site_Data.url}/icons/logo.svg`,
    sameAs: [General_Site_Data.facebookPage, General_Site_Data.instagranPage],
    alternatename: [
      `${General_Site_Data.url}/${local}`,
      "Trydos",
      "Trydos Syria",
      "Trydos سوريا",
      "Trydos Turkey",
      "Trydos تركيا",
      "Trydos العراق",
      "Trydos Iraq",
      "Trydos Lebanon",
      "Trydos لبنان",
      "Trydos United Arab Emirates",
      "Trydos الإمارات العربية المتحدة",
      "Trydos المملكة العربية السعودية",
      "Trydos Saudi Arabia",
      "Trydos Katar",
      "Trydos دولة قطر",
      "Trydos Kuveyt",
      "Trydos الكويت",
      "Trydos Umman",
      "Trydos عمان",
      "Trydos Bahreyn",
      "Trydos مملكة البحرين",
    ],
  };
  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default Organaization;

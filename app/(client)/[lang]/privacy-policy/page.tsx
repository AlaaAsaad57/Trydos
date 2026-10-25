import { lang as langParam } from "next/root-params";
import StaticPage from "components/static/StaticPage";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { getRobotsConfig, translateFunction } from "utils/server";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "Read the TryDos Privacy Policy: terms, cancellation, return, address changes, and information about your data.";
const INTRO =
  "Your privacy matters to us. Below are the terms, policies and conditions governing your use of TryDos.";

const SECTIONS = [
  {
    id: "why-we-know-you",
    heading: "Why We Know You",
    body: "",
  },
  {
    id: "cancellation-terms",
    heading: "Terms Of Cancellation",
    body: "",
  },
  {
    id: "return-terms",
    heading: "Terms Of Return",
    body: "",
  },
  {
    id: "change-address-terms",
    heading: "Terms Of Change Address",
    body: "",
  },
  {
    id: "change-color-terms",
    heading: "The Change Color Terms",
    body: "",
  },
  {
    id: "change-size-terms",
    heading: "The Change Size Terms",
    body: "",
  },
  {
    id: "terms-of-service",
    heading: "Terms Of Services",
    body: "",
  },
  {
    id: "privacy-policy",
    heading: "Privacy Policy",
    body: "",
  },
];

export async function generateMetadata() {
  const lang = await langParam();
  const [, language] = lang.split("-");
  return {
    title: translateFunction(TITLE, language),
    description: translateFunction(DESCRIPTION, language),
    alternates: buildAlternates(lang, "/privacy-policy"),
    robots: getRobotsConfig({ index: true, follow: true }),
  };
}

export default async function Page() {
  const lang = await langParam();
  return (
    <StaticPage lang={lang} title={TITLE} intro={INTRO} sections={SECTIONS} />
  );
}

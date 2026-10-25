import { lang as langParam } from "next/root-params";
import StaticPage from "components/static/StaticPage";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { getRobotsConfig, translateFunction } from "utils/server";

const TITLE = "Contact Us";
const DESCRIPTION =
  "Contact the TryDos team for help with your order, account, or to learn about selling on the platform as a boutique.";
const INTRO =
  "We're here to help. Reach the TryDos team with any question about your order, account or selling on the platform.";
const SECTIONS = [
  {
    heading: "Customer Support",
    body: "",
  },
  {
    heading: "Business & Boutiques",
    body: "",
  },
];

export async function generateMetadata() {
  const lang = await langParam();
  const [, language] = lang.split("-");
  return {
    title: translateFunction(TITLE, language),
    description: translateFunction(DESCRIPTION, language),
    alternates: buildAlternates(lang, "/contact"),
    robots: getRobotsConfig({ index: true, follow: true }),
  };
}

export default async function Page() {
  const lang = await langParam();
  return (
    <StaticPage lang={lang} title={TITLE} intro={INTRO} sections={SECTIONS} />
  );
}

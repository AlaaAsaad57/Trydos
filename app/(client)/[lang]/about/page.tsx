import { lang as langParam } from "next/root-params";
import StaticPage from "components/static/StaticPage";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { getRobotsConfig, translateFunction } from "utils/server";

const TITLE = "About TryDos";
const DESCRIPTION =
  "TryDos is a multilingual live-shopping marketplace connecting boutiques and shoppers across the region with curated fashion, beauty and lifestyle products.";
const INTRO =
  "TryDos is a multilingual live-shopping marketplace connecting boutiques and shoppers across the region. We bring curated fashion, beauty and lifestyle products from trusted sellers straight to your screen.";
const SECTIONS = [
  {
    heading: "Our Mission",
    body: "We make discovering and buying from independent boutiques effortless — with live video shopping, secure checkout and fast delivery, all in your local language and currency.",
  },
  {
    heading: "Why Shop With TryDos",
    body: "Thousands of products from verified boutiques, real-time live sales, easy returns and dedicated support in Arabic, English, Turkish and Kurdish.",
  },
];

export async function generateMetadata() {
  const lang = await langParam();
  const [, language] = lang.split("-");
  return {
    title: translateFunction(TITLE, language),
    description: translateFunction(DESCRIPTION, language),
    alternates: buildAlternates(lang, "/about"),
    robots: getRobotsConfig({ index: true, follow: true }),
  };
}

export default async function Page() {
  const lang = await langParam();
  return (
    <StaticPage lang={lang} title={TITLE} intro={INTRO} sections={SECTIONS} />
  );
}

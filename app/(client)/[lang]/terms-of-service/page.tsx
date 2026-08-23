import { lang as langParam } from "next/root-params";
import StaticPage from "components/static/StaticPage";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { getRobotsConfig, translateFunction } from "utils/server";

const TITLE = "Terms & Conditions";
const DESCRIPTION =
  "The TryDos Terms & Conditions covering how to use the platform, orders, payments and your responsibilities as a shopper or seller.";
const INTRO =
  "By using TryDos you agree to these terms. Please read them carefully before shopping or selling on our platform.";
const SECTIONS = [
  {
    heading: "Using TryDos",
    body: "You agree to use TryDos lawfully, to provide accurate account information, and to respect the rights of boutiques, sellers and other shoppers.",
  },
  {
    heading: "Orders & Payments",
    body: "All orders are subject to availability and confirmation. Prices, fees and delivery times are shown at checkout and may vary by country.",
  },
];

export async function generateMetadata() {
  const lang = await langParam();
  const [, language] = lang.split("-");
  return {
    title: translateFunction(TITLE, language),
    description: translateFunction(DESCRIPTION, language),
    alternates: buildAlternates(lang, "/terms-of-service"),
    robots: getRobotsConfig({ index: true, follow: true }),
  };
}

export default async function Page() {
  const lang = await langParam();
  return (
    <StaticPage lang={lang} title={TITLE} intro={INTRO} sections={SECTIONS} />
  );
}

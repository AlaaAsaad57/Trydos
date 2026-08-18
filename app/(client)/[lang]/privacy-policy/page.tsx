import { lang as langParam } from "next/root-params";
import StaticPage from "components/static/StaticPage";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { getRobotsConfig, translateFunction } from "utils/server";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "Read the TryDos Privacy Policy: what information we collect, how we use it, and the choices you have over your data.";
const INTRO =
  "Your privacy matters to us. This policy explains what information TryDos collects, how we use it, and the choices you have.";
const SECTIONS = [
  {
    heading: "Information We Collect",
    body: "We collect the details you provide when you create an account or place an order, along with basic device and usage data needed to operate and secure the service.",
  },
  {
    heading: "How We Use Your Data",
    body: "Your data is used to process orders, personalise your experience, prevent fraud and improve TryDos. We never sell your personal information.",
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

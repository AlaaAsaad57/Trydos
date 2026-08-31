import { lang as langParam } from "next/root-params";
import PersonalInfoCountries from "components/settings/PersonalInfoCountries";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function CountriesPage() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="flex-col w-full flex ">
      <PersonalInfoCountries isRtl={isRtl} local={lang} />
    </div>
  );
}

export default CountriesPage;

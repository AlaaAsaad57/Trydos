import { lang as langParam } from "next/root-params";
import PersonalInfoCountries from "components/settings/PersonalInfoCountries";

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

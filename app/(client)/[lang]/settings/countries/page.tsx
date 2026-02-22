import PersonalInfoCountries from "components/settings/PersonalInfoCountries";

async function CountriesPage({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="flex-col w-full flex ">
      <PersonalInfoCountries isRtl={isRtl} local={Params.lang} />
    </div>
  );
}

export default CountriesPage;

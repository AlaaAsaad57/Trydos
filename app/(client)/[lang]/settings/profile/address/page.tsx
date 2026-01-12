import PersonalInfoAddress from "components/settings/PersonalInfoAddress";

import { fetchCountries } from "utils/tinyUtils";

async function ProfileAddressList({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";

  let countries = await fetchCountries(country, language);

  return (
    <div className="flex-col w-full pt-[20px] px-[12px] flex setting-screen">
      <PersonalInfoAddress
        countries={countries}
        isRtl={isRtl}
        local={Params.lang}
      />
    </div>
  );
}

export default ProfileAddressList;

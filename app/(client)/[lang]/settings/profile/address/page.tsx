import { lang as langParam } from "next/root-params";
import PersonalInfoAddress from "components/settings/PersonalInfoAddress";
import { GetCountries } from "serverRequests/product";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function ProfileAddressList() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";

  let countries = await GetCountries({ country, language });

  return (
    <div className="flex-col w-full pt-[20px] px-[12px] flex setting-screen">
      <PersonalInfoAddress
        countries={countries}
        isRtl={isRtl}
        local={lang}
      />
    </div>
  );
}

export default ProfileAddressList;

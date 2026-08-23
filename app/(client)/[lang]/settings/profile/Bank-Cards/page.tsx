import { lang as langParam } from "next/root-params";
import BackBar from "components/setting/BackBar";
import { COOKIE_NAMES, UserData } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { translateFunction } from "utils/server";

async function ProfileBankCards() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let SafeUserProfile = (await getCookieServer<UserData>(
    COOKIE_NAMES.USER_DATA,
  )) || { name: "", phone: "", is_phone_verified: 0 };
  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="bank-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={lang}
        name={translateFunction("Profile | Bank Cards", language)}
        preivous_page={`/${lang}/settings/profile`}
      />
    </div>
  );
}

export default ProfileBankCards;

import PersonalInfoForm from "components/setting/profile/PersonalInfoForm";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
async function PersonalInfo({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let SafeUserProfile = (await getCookieServer<UserData>(
    COOKIE_NAMES.USER_DATA,
  )) || { name: "", phone: "", is_phone_verified: 0 };
  return (
    <div className="flex-col w-full pt-[20px] px-[12px] flex setting-screen">
      <PersonalInfoForm
        initialData={SafeUserProfile}
        isRtl={isRtl}
        language={language}
        local={Params?.lang}
      />
    </div>
  );
}

export default PersonalInfo;

import ProfileSizeInfo from "components/settings/ProfileSizeInfo";
import { COOKIE_NAMES, UserData } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";

async function SizeForm({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let SafeUserProfile = (await getCookieServer<UserData>(
    COOKIE_NAMES.USER_DATA,
  )) || { name: "", phone: "", is_phone_verified: 0 };
  return (
    <div className="flex-col w-full pt-[20px] px-[12px] flex setting-screen ">
      <ProfileSizeInfo
        initialData={SafeUserProfile}
        isRtl={isRtl}
        local={Params?.lang}
      />
    </div>
  );
}

export default SizeForm;

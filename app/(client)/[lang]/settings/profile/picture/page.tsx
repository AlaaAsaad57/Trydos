import { lang as langParam } from "next/root-params";
import UploadProfilePhoto from "components/settings/UploadProfilePhoto";
import { COOKIE_NAMES, UserData } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";

async function ProfilePictureForm() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let SafeUserProfile = (await getCookieServer<UserData>(
    COOKIE_NAMES.USER_DATA,
  )) || { name: "", phone: "", is_phone_verified: 0 };
  return (
    <UploadProfilePhoto
      userProfile={SafeUserProfile}
      isRtl={isRtl}
      local={lang}
    />
  );
}

export default ProfilePictureForm;

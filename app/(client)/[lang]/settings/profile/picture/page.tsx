import UploadProfilePhoto from "components/settings/UploadProfilePhoto";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";

async function ProfilePictureForm({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let SafeUserProfile = (await getCookieServer<UserData>(
    COOKIE_NAMES.USER_DATA,
  )) || { name: "", phone: "", is_phone_verified: 0 };
  return (
    <UploadProfilePhoto
      userProfile={SafeUserProfile}
      isRtl={isRtl}
      local={Params?.lang}
    />
  );
}

export default ProfilePictureForm;

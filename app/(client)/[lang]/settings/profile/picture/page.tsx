import UploadProfilePhoto from "components/settings/UploadProfilePhoto";
import { cookies } from "next/headers";

async function ProfilePictureForm({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let cookieStore = await cookies();
  let SafeUserProfileCookie = cookieStore.get("User-Data")?.value;
  let SafeUserProfile = SafeUserProfileCookie
    ? JSON.parse(SafeUserProfileCookie)
    : { name: "", phone: "", is_phone_verified: 0 };
  return (
    <UploadProfilePhoto
      userProfile={SafeUserProfile}
      isRtl={isRtl}
      local={Params?.lang}
    />
  );
}

export default ProfilePictureForm;

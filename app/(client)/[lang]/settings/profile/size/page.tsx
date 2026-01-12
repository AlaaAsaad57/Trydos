import ProfileSizeInfo from "components/settings/ProfileSizeInfo";
import { cookies } from "next/headers";

async function SizeForm({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let cookieStore = await cookies();
  let SafeUserProfileCookie = cookieStore.get("User-Data")?.value;
  let SafeUserProfile = SafeUserProfileCookie
    ? JSON.parse(SafeUserProfileCookie)
    : { name: "", phone: "", is_phone_verified: 0 };
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

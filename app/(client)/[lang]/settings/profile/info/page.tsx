import PersonalInfoForm from "components/setting/profile/PersonalInfoForm";
import { cookies } from "next/headers";
async function PersonalInfo({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let cookieStore = await cookies();
  let SafeUserProfileCookie = cookieStore.get("User-Data")?.value;
  let SafeUserProfile = SafeUserProfileCookie
    ? JSON.parse(SafeUserProfileCookie)
    : { name: "", phone: "", is_phone_verified: 0 };
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

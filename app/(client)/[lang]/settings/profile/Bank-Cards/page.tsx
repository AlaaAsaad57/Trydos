import BackBar from "components/setting/BackBar";
import { cookies } from "next/headers";
import React from "react";

async function ProfileBankCards({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let cookieStore = await cookies();
  let SafeUserProfileCookie = cookieStore.get("User-Data")?.value;
  let SafeUserProfile = SafeUserProfileCookie
    ? JSON.parse(SafeUserProfileCookie)
    : { name: "", phone: "", is_phone_verified: 0 };
  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="bank-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={Params?.lang}
        name={"Profile | Bank Cards"}
        preivous_page={`/${Params.lang}/settings/profile`}
      />
    </div>
  );
}

export default ProfileBankCards;

import Setting from "components/global/Setting";
import BackBar from "components/setting/BackBar";
import React from "react";

async function Prefferences({ params }) {
  // Server component to render JSON-LD structured data
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="main-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={Params?.lang}
        preivous_page={`/${Params.lang}/settings`}
      />
      <Setting lang={Params.lang} />
    </div>
  );
}

export default Prefferences;

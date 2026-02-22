import BackBar from "components/setting/BackBar";
import LanguageSetting from "components/settings/LanguageSetting";

async function LanguagesPage({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="languages-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        DataCy="language-setting"
        local={Params.lang}
        preivous_page={`/${Params.lang}/settings`}
      />
      <LanguageSetting local={Params.lang} languageVar={language} />
    </div>
  );
}

export default LanguagesPage;

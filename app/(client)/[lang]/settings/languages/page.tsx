import BackBar from "components/setting/BackBar";
import LanguageSetting from "components/settings/LanguageSetting";

async function LanguagesPage({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/languages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      lang: language,
      country: country,
    },
  });
  const languageVar = await res.json();
  const languages = languageVar?.data?.map((item: any) => item.code);

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="languages-setting-page"
    >
      <LanguageSetting
        languages={languages}
        isRtl={isRtl}
        local={Params.lang}
        languageVar={language}
      />
    </div>
  );
}

export default LanguagesPage;

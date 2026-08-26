import { lang as langParam } from "next/root-params";
import LanguageSetting from "components/settings/LanguageSetting";

async function LanguagesPage() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const res = await fetch(`${process.env.BACKEND_URL}/languages`, {
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
        local={lang}
        languageVar={language}
      />
    </div>
  );
}

export default LanguagesPage;

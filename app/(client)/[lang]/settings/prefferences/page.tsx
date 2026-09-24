import { lang as langParam } from "next/root-params";
import Setting from "components/global/Setting";
import BackBar from "components/setting/BackBar";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function Prefferences() {
  // Server component to render JSON-LD structured data
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="main-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={lang}
        preivous_page={`/${lang}/settings`}
      />
      <Setting lang={lang} />
    </div>
  );
}

export default Prefferences;

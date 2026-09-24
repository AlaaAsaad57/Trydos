import { lang as langParam } from "next/root-params";
import ChecklistView from "components/setting/checklist/ChecklistView";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function ChecklistPage() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="checklist-setting-page"
    >
      <ChecklistView isRtl={isRtl} language={language} local={lang} />
    </div>
  );
}

export default ChecklistPage;

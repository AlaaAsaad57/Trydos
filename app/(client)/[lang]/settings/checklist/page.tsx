import ChecklistView from "components/setting/checklist/ChecklistView";

async function ChecklistPage({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="checklist-setting-page"
    >
      <ChecklistView isRtl={isRtl} language={language} local={Params?.lang} />
    </div>
  );
}

export default ChecklistPage;

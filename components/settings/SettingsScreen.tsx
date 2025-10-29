"use client";
import BackIcon from "public/svg/listing/backIcon.svg";
import { useParams } from "next/navigation";
import Setting from "components/global/Setting";
import { translateFunction } from "utils/functions";

interface SettingsScreenProps {
  goBack: () => void;
}

function SettingsScreen({ goBack }: SettingsScreenProps) {
  const params = useParams();
  // @ts-ignore
  const lang = params?.lang;

  return (
    <div className="w-full h-full flex-col">
      <div className="bg-[#fff] flex items-center justify-between top-0 left-0 w-full h-[50px] sticky z-10">
        <span
          className="p-2 cursor-pointer"
          onClick={goBack}
          aria-label={translateFunction("Back")}
        >
          <BackIcon />
        </span>
        <h2 className="text-[#1D1D1D] text-[16px] medium">
          {translateFunction("Settings")}
        </h2>
        <span />
      </div>

      <div className="w-full px-[12px] pt-[8px] pb-[24px]">
        {/* Mirror of app/(client)/[lang]/settings/page.tsx content */}
        {/* @ts-ignore */}
        <Setting lang={lang} />
      </div>
    </div>
  );
}

export default SettingsScreen;

import React, { DOMElement } from "react";
import ProfileCard from "./ProfileCard";
import TryDosWalletIcon from "public/svg/TryDosWalletIcon.svg";
import OrdersIcon from "public/svg/OrdersIcon.svg";
import SettingsIcon from "public/svg/SettingsIcon.svg";
import TermsIcon from "public/svg/TermsIcon.svg";
import LegalInfoIcon from "public/svg/LegalInfoIcon.svg";
import AboutIcon from "public/svg/AboutIcon.svg";
import ShareAppIcon from "public/svg/ShareAppIcon.svg";
import LanguageIcon from "public/svg/LanguageIcon.svg";

import { useParams } from "node_modules/next/navigation";
import { allCountries } from "country-telephone-data";
import Flag from "react-world-flags";

const options = [
  { name: "Settings", Icon: <SettingsIcon /> },
  { name: "Terms & Conditions", Icon: <TermsIcon /> },
  { name: "Legal Information", Icon: <LegalInfoIcon /> },
  { name: "About Us", Icon: <AboutIcon /> },
  { name: "Share App", Icon: <ShareAppIcon /> },
];
function MainSetting({
  swipeToScreen,
}: {
  swipeToScreen: (index: number) => void;
}) {
  const { lang } = useParams();
  // @ts-ignore
  let country = lang?.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0]?.name,
    iso: country,
  };
  return (
    <div className="flex-col w-full pt-[20px] px-[12px]">
      <ProfileCard
        goToProfile={() => swipeToScreen(1)}
        goToProfilePicture={() => swipeToScreen(2)}
        goToProfileSize={() => swipeToScreen(4)}
      />
      <div className="flex-row mt-[18px]">
        <div className="flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px] cursor-pointer">
          <OrdersIcon />
          <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
            Orders
          </span>
          <span className="text-[#8D8D8D] text-[12px] regular">1 Action</span>
        </div>
        <div className="flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px] ml-[12px] cursor-pointer">
          <TryDosWalletIcon />
          <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
            Trydos Wallet
          </span>
          <span className="text-[#8D8D8D] text-[12px] regular">
            300 USD Your Balance
          </span>
        </div>
      </div>
      <div className="flex-col mt-[8px]">
        {options.map((option) => (
          <SettingOption key={option.name} {...option} />
        ))}
        <div className="flex-row mt-[12px]">
          <div className="flex-row w-1/2 h-[53px] bg-[#F8F8F8] rounded-[15px] px-[12px] items-center cursor-pointer">
            <Flag
              code={country.iso.toUpperCase()}
              height="18"
              style={{
                borderRadius: "4px",
              }}
              width="28"
              alt={`${country.name} flag`}
            />
            <span className="text-[#1D1D1D] text-[14px] regular ml-[12px]">
              {country.name}
            </span>
          </div>
          <div className="flex-row w-1/2 h-[53px] bg-[#F8F8F8] rounded-[15px] px-[12px] items-center cursor-pointer ml-[12px]">
            <LanguageIcon />
            <span className="text-[#1D1D1D] text-[14px] regular ml-[12px]">
              English
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainSetting;
const SettingOption = ({
  name,
  Icon,
}: {
  name: string;
  Icon: React.ReactNode;
}) => {
  return (
    <div className="w-full flex-row cursor-pointer mt-[4px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center">
      {Icon}
      <span className="text-[14px] regular text-[#1d1d1d] ml-[12px] ">
        {name}
      </span>
    </div>
  );
};

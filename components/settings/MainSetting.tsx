import React, { useEffect, useState } from "react";
import ProfileCard from "./ProfileCard";
import TryDosWalletIcon from "public/svg/TryDosWalletIcon.svg";
import OrdersIcon from "public/svg/OrdersIcon.svg";
import SettingsIcon from "public/svg/SettingsIcon.svg";
import TermsIcon from "public/svg/TermsIcon.svg";
import LegalInfoIcon from "public/svg/LegalInfoIcon.svg";
import AboutIcon from "public/svg/AboutIcon.svg";
import ShareAppIcon from "public/svg/ShareAppIcon.svg";
import LanguageIcon from "public/svg/LanguageIcon.svg";
import { useParams } from "next/navigation";
import { allCountries } from "country-telephone-data";
import order from "services/order";

import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { FlagIcon } from "utils/tinyUtils";
import {
  MainSettingOptionPropsType,
  MainSettingPropsType,
} from "models/componentType/settingTypes/MainSettingPropsType";
import { fetchOrders } from "services/orders";

const options = [
  { name: "Settings", Icon: <SettingsIcon /> },
  { name: "Terms & Conditions", Icon: <TermsIcon /> },
  { name: "Legal Information", Icon: <LegalInfoIcon /> },
  { name: "About Us", Icon: <AboutIcon /> },
  { name: "Share App", Icon: <ShareAppIcon /> },
];
function MainSetting({ swipeToScreen }: MainSettingPropsType) {
  const { wallet, currency, totalOrders, settings } = useAppStore();
  const points = settings["starting-setting"]?.decimal_point_settings || 0;

  const { lang } = useParams();
  // @ts-ignore
  let country = lang?.split("-")[0];
  country = {
    name: allCountries.filter((s) => s.iso2 === country)[0]?.name,
    iso: country,
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWallet();
  }, []);
  const getWallet = async () => {
    try {
      setLoading(true);
      const res = await order.GetWallet();
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  const getLanguage = () => {
    // @ts-ignore
    let iso = lang.split("-")[1];
    if (iso === "en") return "English";
    if (iso === "ar") return "العربية";
    if (iso === "tr") return "Turkish";
  };
  return (
    <div className="flex-col w-full pt-[20px] px-[12px]">
      <ProfileCard
        goToProfile={() => swipeToScreen(1)}
        goToProfilePicture={() => swipeToScreen(2)}
        goToProfileSize={() => swipeToScreen(4)}
      />
      <div className="flex-row mt-[18px]">
        <OrdersCard swipeToScreen={swipeToScreen} />
        <div className="flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px] ml-[12px] cursor-pointer">
          <TryDosWalletIcon />
          <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
            {translateFunction("Trydos Wallet")}
          </span>
          <span className="text-[#8D8D8D] text-[12px] regular">
            {loading ? (
              <Spinner />
            ) : (
              <>
                {wallet?.wallet_balance?.toFixed(points)} {currency?.symbol}{" "}
                {translateFunction("Your Balance")}
              </>
            )}
          </span>
        </div>
      </div>
      <div className="flex-col mt-[8px]">
        {options.map((option) => (
          <SettingOption key={option.name} {...option} />
        ))}
        <div className="flex-row mt-[12px]">
          <div
            onClick={() => {
              swipeToScreen(8);
            }}
            data-cy="country-button"
            className="flex-row w-1/2 h-[53px] bg-[#F8F8F8] rounded-[15px] px-[12px] items-center cursor-pointer"
          >
            <span className="w-[30px] h-[20px]">
              {" "}
              <FlagIcon iso={country.iso} />
            </span>

            <span className="text-[#1D1D1D] text-[14px] regular ml-[12px]">
              {country.name}
            </span>
          </div>
          <div
            className="flex-row w-1/2 h-[53px] bg-[#F8F8F8] rounded-[15px] px-[12px] items-center cursor-pointer ml-[12px]"
            onClick={() => {
              swipeToScreen(11);
            }}
            data-cy="language-button"
          >
            <LanguageIcon />
            <span className="text-[#1D1D1D] text-[14px] regular ml-[12px]">
              {getLanguage()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainSetting;
const SettingOption = ({ name, Icon }: MainSettingOptionPropsType) => {
  return (
    <div className="w-full flex-row cursor-pointer mt-[4px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center">
      {Icon}
      <span className="text-[14px] regular text-[#1d1d1d] ml-[12px] ">
        {translateFunction(name)}
      </span>
    </div>
  );
};
const OrdersCard = ({
  swipeToScreen,
}: {
  swipeToScreen: (screen: number) => void;
}) => {
  const { totalOrders } = useAppStore();
  useEffect(() => {
    getOrders();
  }, []);
  const getOrders = async () => {
    const res = await fetchOrders(0, 10);
  };
  return (
    <div
      className="flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px] cursor-pointer"
      data-cy="orders-page-button"
      onClick={() => {
        swipeToScreen(9);
      }}
    >
      <OrdersIcon />
      <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
        {translateFunction("Orders")}
      </span>
      {totalOrders === -1 ? (
        <span>
          <Spinner />
        </span>
      ) : (
        <span className="text-[#8D8D8D] text-[12px] regular">
          {totalOrders} {translateFunction("Action")}
        </span>
      )}
    </div>
  );
};

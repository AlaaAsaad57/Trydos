import React, { useEffect, useState } from "react";
import ProfileCard from "./ProfileCard";
import TryDosWalletIcon from "public/svg/TryDosWalletIcon";
import OrdersIcon from "public/svg/OrdersIcon";
import SettingsIcon from "public/svg/SettingsIcon";
import TermsIcon from "public/svg/TermsIcon";
import LegalInfoIcon from "public/svg/LegalInfoIcon";
import AboutIcon from "public/svg/AboutIcon";
import ShareAppIcon from "public/svg/ShareAppIcon";
import LanguageIcon from "public/svg/LanguageIcon";
import { useParams, useRouter } from "next/navigation";
import { allCountries } from "country-telephone-data";
import order from "services/order";
import BackIcon from "public/svg/listing/backIcon";

import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { FlagIcon } from "utils/tinyUtils";
import {
  MainSettingOptionPropsType,
  MainSettingPropsType,
} from "models/componentType/settingTypes/MainSettingPropsType";
import { fetchOrders } from "services/orders";
import SettingsLoader from "components/skeleton/loaders/SettingsLoader";
import NextLink from "components/global/NextLink";

function MainSetting({ swipeToScreen }: MainSettingPropsType) {
  const options = [
    {
      name: "Settings",
      Icon: <SettingsIcon />,
      onClick: () => swipeToScreen(13),
    },
    { name: "Terms & Conditions", Icon: <TermsIcon /> },
    { name: "Legal Information", Icon: <LegalInfoIcon /> },
    { name: "About Us", Icon: <AboutIcon /> },
    { name: "Share App", Icon: <ShareAppIcon /> },
  ];
  const {
    wallet,
    currency,
    userProfile,
    settings,
    language,
    showNotificaionCircle,
    settingLastPath,
    setSettingLastPath,
  } = useAppStore();
  const points = settings?.["starting-setting"]?.decimal_point_settings || 0;

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
    if (iso === "ku") return "کوردی";
  };
  const isRtl = language === "ar" || language === "ku";
  const router = useRouter();
  if (!userProfile) return <SettingsLoader />;
  const BackBar = () => {
    const [hasHistory, setHasHistory] = useState(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      // Check if the user has navigated within the app
      setHasHistory(window.history.length > 2);
      if (settingLastPath) {
        router.prefetch(settingLastPath);
      }
    }, []);

    const handleBack = () => {
      setLoading(true);
      if (settingLastPath) {
        window.location.href = settingLastPath;
      } else {
        window.location.href = `/${lang}`;
      }
    };
    return (
      <div className="bg-[#fff] flex items-center top-0 left-0 w-full h-[50px]">
        <span
          className="p-2 cursor-pointer"
          onClick={() => {
            if (!loading) handleBack();
          }}
        >
          {loading ? <Spinner /> : <BackIcon />}
        </span>
      </div>
    );
  };
  return (
    <div className="flex-col w-full pt-[20px] px-[12px]">
      <BackBar />
      <ProfileCard
        goToProfile={() => swipeToScreen(1)}
        goToProfilePicture={() => swipeToScreen(2)}
        goToProfileSize={() => swipeToScreen(4)}
      />
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  mt-[18px] gap-[12px]`}
      >
        <OrdersCard swipeToScreen={swipeToScreen} />
        <div
          className={` ${
            isRtl && "items-end"
          } flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px]  cursor-pointer`}
          onClick={() => swipeToScreen(12)}
          role="button"
          tabIndex={0}
          aria-label={translateFunction("Wallet Transactions")}
        >
          <TryDosWalletIcon />
          <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
            {translateFunction("Trydos Wallet")}
          </span>
          <span
            className="text-[#8D8D8D] text-[12px] regular"
            data-cy="user-wallet-amount"
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                <span className="medium">
                  {wallet?.wallet_balance?.toFixed(currency?.decimal_digits)}{" "}
                </span>
                {currency?.symbol} {translateFunction("Your Balance")}
              </>
            )}
          </span>
        </div>
      </div>
      <div className="flex-col mt-[8px]">
        {options.map((option) => (
          <SettingOption key={option.name} {...option} />
        ))}
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } mt-[12px] gap-[12px]`}
        >
          <div
            onClick={() => {
              swipeToScreen(8);
            }}
            data-cy="country-button"
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } w-1/2 h-[53px] bg-[#F8F8F8] gap-[12px] rounded-[15px] px-[12px] items-center cursor-pointer`}
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
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } w-1/2 h-[53px] bg-[#F8F8F8] rounded-[15px] px-[12px] items-center cursor-pointer gap-[12px]`}
            onClick={() => {
              swipeToScreen(11);
            }}
            data-cy="language-button"
          >
            <LanguageIcon />
            <span className="text-[#1D1D1D] text-[14px] regular">
              {getLanguage()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainSetting;
const SettingOption = ({ name, Icon, onClick }: MainSettingOptionPropsType) => {
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      onClick={() => {
        if (onClick) {
          onClick();
        }
      }}
      className={`w-full flex-row cursor-pointer mt-[4px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center ${
        isRtl ? "flex-row-reverse" : " "
      }`}
    >
      {Icon}
      <span
        className={`text-[14px] regular text-[#1d1d1d] ml-[12px] ${
          isRtl ? "pr-2" : " "
        }`}
      >
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
  const { totalOrders, language, showNotificaionCircle, user, setLoginOpen } =
    useAppStore();
  useEffect(() => {
    getOrders();
  }, []);
  const getOrders = async () => {
    const res = await fetchOrders(0, 10);
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`${
        isRtl && "items-end"
      } flex-col w-1/2 h-[94px] bg-[#F8F8F8] relative rounded-[12px] p-[12px] cursor-pointer`}
      data-cy="orders-page-button"
      onClick={() => {
        if (user.phone !== "0" && user) swipeToScreen(9);
        else setLoginOpen(true);
      }}
    >
      {showNotificaionCircle.length > 0 ? (
        <span className="absolute w-[10px] h-[10px] bg-[#f64f64] rounded-full top-[-2px] right-[-2px] animate-pulse z-20"></span>
      ) : (
        <></>
      )}
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

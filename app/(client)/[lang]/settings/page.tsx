import NextLink from "components/global/NextLink";
import BackBar from "components/setting/BackBar";
import OrdersLinkCard from "components/setting/orders";
import Profile from "components/setting/profile";
import WalletLinkCard from "components/setting/WalletLinkCard";
import GoToSellerDashBoard from "components/settings/GoToSellerDashBoard";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import { translateFunction } from "utils/server";
import { getLocalizedCountryName } from "utils/countryData";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import RouterRefresh from "components/global/RouterRefresh";

import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";


export async function generateMetadata({ params }) {
  let Params = await params;
  const [country, language] = Params?.lang?.split("-");
  const metadata = {
    title: translateFunction("Settings - TryDos", language),
    description: translateFunction(
      "Manage your account settings and preferences.",
      language,
    ),
    alternates: buildAlternates(Params.lang, "/settings"),
  };
  return metadata;
}

async function page({ params }) {
  // Server component to render JSON-LD structured data
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  // The orders count is fetched client-side by <OrdersLinkCard>, so the page
  // itself only needs the cached profile cookie.
  const SafeUserProfileRaw = await getCookieServer<UserData>(
    COOKIE_NAMES.USER_DATA,
  );
  let SafeUserProfile = SafeUserProfileRaw || {
    name: "",
    phone: "",
    is_phone_verified: 0,
  };
  const options = [
    {
      name: "My Checklist",
      Icon: `/icons/Heart.svg`,
      href: `/${Params?.lang}/settings/checklist`,
    },
    {
      name: "Settings",
      Icon: `/icons/SettingsIcon.svg`,
      href: `/${Params?.lang}/settings/prefferences`,
    },
    // {
    //   name: "Terms & Conditions",
    //   Icon: `/icons/TermsIcon.svg`,
    //   href: `/${Params?.lang}/terms-of-service`,
    // },
    {
      name: "Legal Information",
      Icon: `/icons/LegalInfoIcon.svg`,
      href: `#`,
    },
    // {
    //   name: "Contact Us",
    //   Icon: `/icons/ContactInfoIcon.svg`,
    //   href: `/${Params?.lang}/contact`,
    // },
    {
      name: "About Us",
      Icon: `/icons/AboutIcon.svg`,
      href: `#`,
    },
    // {
    //   name: "Compare",
    //   Icon: `/icons/FilterInfoIcon.svg`,
    //   href: `/${Params?.lang}/compare`,
    // },
    {
      name: "Share App",
      Icon: `/icons/ShareAppIcon.svg`,
      href: `#`,
    },
  ];

  let countryData = {
    name: getLocalizedCountryName(country, language),
    iso: country,
  };

  const getLanguage = () => {
    // @ts-ignore
    let iso = language;
    if (iso === "en") return "English";
    if (iso === "ar") return "العربية";
    if (iso === "tr") return "Turkish";
    if (iso === "ku") return "کوردی";
  };
  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex setting-screen"
      key="main-setting-page"
    >
      <BackBar
        isRtl={isRtl}
        local={Params?.lang}
        preivous_page={`/${Params.lang}`}
      />
      <RouterRefresh />
      <Suspense
        fallback={
          <Skeleton
            className={`w-full h-[138px] rounded-[15px] bg-[#F8F8F8] p-[12px] ${
              isRtl ? "flex-row-reverse" : "flex-row"
            } justify-between cursor-pointer`}
          />
        }
      >
        {/* @ts-ignore */}
        <Profile
          local={Params.lang}
          isRtl={isRtl}
          language={language}
          SafeUserProfile={SafeUserProfile}
        />
      </Suspense>
      <GoToSellerDashBoard
        language={language}
        isAuthed={(SafeUserProfile?.phone?.length ?? 0) > 3}
      />
     
      <div
        className={`flex w-full ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  mt-[18px] gap-[12px]`}
      >
        {/* @ts-ignore */}
        <OrdersLinkCard
          isRtl={isRtl}
          language={language}
          local={Params?.lang}
          user={SafeUserProfile}
        />

        {/* @ts-ignore */}
        <WalletLinkCard country={country} isRtl={isRtl} language={language} />
      </div>
      <div className="flex-col mt-[8px] flex w-full">
        {options.map((option) => (
          <SettingOption
            isRtl={isRtl}
            key={option.name}
            language={language}
            {...option}
          />
        ))}
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } mt-[12px] gap-[12px] flex w-full`}
      >
        <NextLink
          isFromSetting={true}
          href={`/${Params?.lang}/settings/countries`}
          data-cy="country-button"
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } w-1/2 h-[53px] bg-[#F8F8F8] gap-[12px] rounded-[15px] px-[12px] items-center cursor-pointer`}
        >
          <span className="w-[30px] h-[20px]">
            <img
              src={`/icons/flag/${country}.svg`}
              alt={"country"}
              width={25}
              height={16}
            />
          </span>

          <span className="text-[#1D1D1D] text-[14px] regular ml-[12px]">
            {countryData.name}
          </span>
        </NextLink>
        <NextLink
          isFromSetting={true}
          href={`/${Params?.lang}/settings/languages`}
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } w-1/2 h-[53px] bg-[#F8F8F8] rounded-[15px] px-[12px] items-center cursor-pointer gap-[12px]`}
          data-cy="language-button"
        >
          <img
            src={`/icons/LanguageIcon.svg`}
            alt={"country"}
            width={25}
            height={16}
          />
          <span className="text-[#1D1D1D] text-[14px] regular">
            {getLanguage()}
          </span>
        </NextLink>
      </div>
    </div>
  );
}

export default page;

const SettingOption = ({ name, Icon, href, isRtl, language }: any) => {
  return (
    <NextLink
      isFromSetting={true}
      href={href}
      className={`w-full flex-row cursor-pointer mt-[4px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center ${
        isRtl ? "flex-row-reverse" : " "
      }`}
    >
      <img src={Icon} className="w-[25px] h-[25px]" />
      <span
        className={`text-[14px] regular text-[#1d1d1d] ml-[12px] ${
          isRtl ? "pr-2" : " "
        }`}
      >
        {translateFunction(name, language)}
      </span>
    </NextLink>
  );
};

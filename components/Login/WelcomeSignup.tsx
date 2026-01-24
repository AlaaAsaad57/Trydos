import { useParams } from "next/navigation";

import React, { useEffect, useState } from "react";

import { translateFunction } from "utils/functions";
import NextLink from "components/global/NextLink";
import { useAppStore } from "store";
import {
  GA_AUTH_SCREEN,
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
interface Props {
  stepIndicator: number;
  Name: string | null;
  signStep: string;
  close: Function;
}
function WelcomeSignup({ stepIndicator, Name, signStep, close }: Props) {
  const { language, setLoginOpen } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [active, setActive] = useState(false);
  const mountAnim = ` 
  0% {transform:translateX(800px)}
  100% {transform:translateX(0px)}
`;
  const unmountAnim = `
0% {transform:translateX(0px)}
100% {transform:translateX(-800px)}
`;

  useEffect(() => {
    if (stepIndicator === 6 && signStep === "welcomeSignup") {
      setTimeout(() => {
        setActive(true);
      }, 50);
    } else {
      setTimeout(() => {
        setActive(false);
      }, 50);
    }
  }, [stepIndicator, signStep]);
  if (active)
    return (
      <div className="flex-col items-center w-full pb-[40px]">
        <div className="welcoming-container">
          <div className="welcoming-label">{translate("Hello,", language)}</div>
          <div className="welcoming-user">{Name}</div>
        </div>
        <div
          className="welcoming-enjoy"
          style={{ marginBottom: "10vh" }}
          data-cy="Wellcome-Enjoy"
        >
          {translate("Enjoy With Our Services", language)}
        </div>
        <div className="signup-detail">
          {translate(
            "We Recommend That You Complete Your Profile To Make The Most Of The App’s Features, Such As Shopping, Chatting, Stories, Taking Advantage Of Offers, Interests, And Much More",
            language,
          )}
        </div>
        <div
          className="login-button-group"
          onClick={() => {
            setLoginOpen(false);
          }}
        >
          <NextLink
            data={{
              is_settings: true,
            }}
            ariaLabel={`Complete My Profile ${lang}`}
            href={`/${lang}/settings/profile`}
            className="login-button"
            data-cy="Complate-Close"
            style={{
              position: "relative",
              backgroundColor: "#F4FFF4",
              marginTop: "0px",
              marginBottom: "29px",
              marginLeft: "14px",
              marginRight: "24px",
            }}
          >
            {translate("Complete My Profile", language)}
          </NextLink>
        </div>
        <div
          className="blue-text skip-text"
          data-cy="skipForNow"
          style={{ fontFamily: `var(--Quicksand-Regular)`, fontSize: "14px" }}
          onClick={() => {
            setLoginOpen(false);
          }}
        >
          {translate("Skip For Now", language)}
        </div>
      </div>
    );
  else return <></>;
}

export default WelcomeSignup;

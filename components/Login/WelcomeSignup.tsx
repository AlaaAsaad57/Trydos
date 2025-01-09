import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Animated from "react-mount-animation";
import { useSelector } from "react-redux";
import { translateFunction } from "utils/functions";
interface Props {
  stepIndicator: number;
  Name: string | null;
  signStep: string;
  close: Function;
}
function WelcomeSignup({ stepIndicator, Name, signStep, close }: Props) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );

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
  return (
    <Animated.div
      unmountTime={0.5}
      className="animated-container"
      show={active}
      mountAnim={mountAnim}
      style={{
        animationFillMode: "forwards",
      }}
      unmountAnim={unmountAnim}
    >
      <div className="welcoming-container">
        <div className="welcoming-label">{translate("Hello,", language)}</div>
        <div className="welcoming-user">{Name || "Alaa Asaad"}</div>
      </div>
      <div className="welcoming-enjoy" style={{ marginBottom: "10vh" }}>
        {translate("Enjoy With Our Services", language)}
      </div>
      <div className="signup-detail">
        {translate(
          "We Recommend That You Complete Your Profile To Make The Most Of The App’s Features, Such As Shopping, Chatting, Stories, Taking Advantage Of Offers, Interests, And Much More",
          language
        )}
      </div>
      <div className="login-button-group">
        <div
          className="login-button"
          onClick={() => close()}
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
        </div>
      </div>
      <div
        className="blue-text skip-text"
        style={{ fontFamily: `var(--Quicksand-Regular)`, fontSize: "14px" }}
        onClick={() => {
          close();
        }}
      >
        {translate("Skip For Now", language)}
      </div>
    </Animated.div>
  );
}

export default WelcomeSignup;

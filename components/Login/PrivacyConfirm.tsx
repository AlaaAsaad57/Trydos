import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import ConditionIcon from "public/svg/ConditionIcon.svg";
import Animated from "react-mount-animation";
function PrivacyConfirm({ stepIndicator, setStepIndcator }) {
  const language = useSelector((state: any) => state.homepage.language);
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
    if (stepIndicator === 1) {
      setTimeout(() => {
        setActive(true);
      }, 50);
    } else {
      setTimeout(() => {
        setActive(false);
      }, 50);
    }
  }, [stepIndicator]);
  return (
    <Animated.div
      className="animated-container"
      show={active}
      mountAnim={mountAnim}
      style={{
        animationFillMode: "forwards",
      }}
      unmountAnim={unmountAnim}
    >
      <div
        className="login-privacy-text"
        style={{ paddingInline: "30px", textAlign: "left" }}
      >
        {translate("To ", language)}
        <span className="privacy-bold" style={{ marginInline: "4px" }}>
          {translate("Create New Account ", language)}
        </span>
        {translate("Tap “Agree & Continue” To Accept trydos", language)}
      </div>
      <div
        className="login-privacy-text"
        style={{
          cursor: "pointer",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "23px",
        }}
      >
        <ConditionIcon />
        <span
          className="privacy-text"
          onClick={() => {}}
          style={{ marginTop: "10px" }}
        >
          {translate("Terms Of Services", language)}
        </span>
      </div>
      <div className="login-button-group">
        <div
          className="login-button"
          onClick={() => setStepIndcator(2)}
          style={{
            position: "relative",
            marginTop: "58px",
            marginLeft: "14px",
            marginRight: "24px",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <g
              id="Group_10837"
              data-name="Group 10837"
              transform="translate(-20 -769)"
            >
              <g
                id="Rectangle_4715"
                data-name="Rectangle 4715"
                transform="translate(20 769)"
                fill="none"
                stroke="#388cff"
                stroke-width="0.5"
                stroke-dasharray="3 3"
              >
                <rect width="calc(100%)" height="100%" rx="20" stroke="none" />
                <rect
                  x="0.25"
                  y="0.25"
                  width="calc(100% - 1px)"
                  height="59px"
                  rx="19.75"
                  fill="none"
                />
              </g>
            </g>
          </svg>
          {translate("Agree & Continue", language)}
        </div>
      </div>
    </Animated.div>
  );
}

export default PrivacyConfirm;

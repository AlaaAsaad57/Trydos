import { useEffect, useState } from "react";

import { Sendevent, translateFunction } from "utils/functions";
import ConditionIcon from "public/svg/ConditionIcon.svg";

import { useTransition, animated } from "react-spring";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

function PrivacyConfirm({ stepIndicator, setStepIndicator }) {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };

  const [active, setActive] = useState(false);
  const transition = useTransition(active, {
    from: { x: -800 },
    enter: { x: 0 },
    leave: { x: 800 },
    config: {
      bounce: 0,
      clamp: false,
      precision: 0,
      friction: 10,
    },
  });
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
    <>
      {transition((style, item) =>
        item ? (
          <animated.div
            style={style}
            className="animated-container phone-animate"
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
                data-testid="Terms Of Services"
                onClick={() => {}}
                style={{ marginTop: "10px" }}
              >
                {translate("Terms Of Services ", language)}
              </span>
            </div>
            <div className="login-button-group">
              <div
                className="login-button agree-terms"
                data-cy="agree-terms"
                data-testid="Agree Terms"
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "agree_continue_button",
                  });
                  setStepIndicator(2);
                }}
                style={{
                  position: "relative",
                  marginTop: "58px",
                  marginLeft: "14px",
                  marginRight: "24px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                >
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
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                    >
                      <rect
                        width="calc(100%)"
                        height="100%"
                        rx="20"
                        stroke="none"
                      />
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
          </animated.div>
        ) : (
          <></>
        )
      )}
    </>
  );
}

export default PrivacyConfirm;

import { useEffect, useState } from "react";
import Animated from "react-mount-animation";
import { useSelector } from "react-redux";
import { Sendevent, translateFunction } from "utils/functions";
import AuthService from "services/auth";
import { useParams } from "next/navigation";

function AlreadyRegistered({
  inputValue,
  setStepIndicator,
  close,
  setStepSign,
  FinaliseLogin,
  stepIndicator,
  signStep,
}: {
  inputValue: string;
  stepIndicator: number;
  signStep: string;
  FinaliseLogin: Function;
  setStepIndicator: Function;
  close: Function;
  setStepSign: Function;
}) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const user = useSelector((state: StateInterface) => state.auth.Tempuser);
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
    if (stepIndicator === 6 && signStep === "alreadyExists") {
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
        width: "100%",
      }}
      unmountAnim={unmountAnim}
    >
      <div
        className="phone-input-desc already-registered"
        data-cy="already-registered-phone"
        style={{ paddingInline: "20px" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <g
            id="Group_10808"
            data-name="Group 10808"
            transform="translate(-65 -464)"
          >
            <g
              id="Group_10756"
              data-name="Group 10756"
              transform="translate(65 464)"
            >
              <path
                id="Subtraction_1"
                data-name="Subtraction 1"
                d="M.327,12.044a.322.322,0,0,1-.195-.068A.362.362,0,0,1,.013,11.6l.83-2.735A5.99,5.99,0,0,1,0,5.795,5.693,5.693,0,0,1,5.572,0a5.692,5.692,0,0,1,5.571,5.795,5.693,5.693,0,0,1-5.571,5.8A5.426,5.426,0,0,1,2.446,10.6L.512,11.986A.3.3,0,0,1,.327,12.044ZM5.52,8.727a.714.714,0,1,0,.7.714A.7.7,0,0,0,5.52,8.727Zm.144-5.688a1.1,1.1,0,0,1,1.192,1.1c0,.539-.229.874-.874,1.279a1.791,1.791,0,0,0-1.021,1.61v.127c0,.4.214.647.558.647.319,0,.5-.2.533-.587.026-.557.226-.836.893-1.245A2.1,2.1,0,0,0,5.712,2.022a2.246,2.246,0,0,0-2.2,1.228,1.482,1.482,0,0,0-.144.647.482.482,0,0,0,.517.542c.28,0,.436-.135.537-.465A1.188,1.188,0,0,1,5.664,3.039Z"
                transform="translate(0 2.955)"
                fill="#388cff"
              />
              <path
                id="Path_21380"
                data-name="Path 21380"
                d="M12.563,12.056a.324.324,0,0,1-.2.068.3.3,0,0,1-.184-.059l-1.936-1.386-.022.014a6.642,6.642,0,0,0,.5-2.545A6.362,6.362,0,0,0,4.5,1.67a5.905,5.905,0,0,0-1.368.159A5.408,5.408,0,0,1,7.123.079a5.693,5.693,0,0,1,5.571,5.8,5.972,5.972,0,0,1-.843,3.068l.83,2.736a.359.359,0,0,1-.118.377Z"
                transform="translate(1.07 0.602)"
                fill="#388cff"
              />
              <rect
                id="Rectangle_4714"
                data-name="Rectangle 4714"
                width="14.421"
                height="15"
                transform="translate(0.579)"
                fill="none"
              />
            </g>
          </g>
        </svg>

        <div className="text-login-desc">
          <div
            className="text-login-item already-registered"
            data-cy="already-registered-phone"
          >
            {translate("This Number Already Registered With Us !", language)}
          </div>
          <div className="icon-detail" style={{ marginTop: "1px" }}>
            <svg
              id="Group_10806"
              data-name="Group 10806"
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 10 10"
            >
              <path
                id="Path_13937"
                data-name="Path 13937"
                d="M181.618,115.591a.3.3,0,0,0-.03.1.243.243,0,1,0,.483.04.494.494,0,0,1,.01-.111v-.111a2.663,2.663,0,0,0-.141-.846,2.512,2.512,0,0,0-1.712-1.581,2.671,2.671,0,0,0-.635-.081,1.707,1.707,0,0,0-.222.01l-.212.03a.235.235,0,0,0,.081.463.99.99,0,0,1,.171-.02h.03c.05,0,.1-.01.151-.01a1.992,1.992,0,0,1,1.43.594,2.029,2.029,0,0,1,.594,1.41v.111Z"
                transform="translate(-174.683 -110.326)"
                fill="#8d8d8d"
              />
              <path
                id="Path_13938"
                data-name="Path 13938"
                d="M173.589,63.952a.243.243,0,1,0,.483.04c.01-.111.01-.222.01-.332a4.512,4.512,0,0,0-.05-.645,3.863,3.863,0,0,0-3.495-3.2c-.1-.01-.212-.01-.312-.01s-.222,0-.332.01-.222.02-.332.04a.235.235,0,1,0,.081.463l.2-.03c.03,0,.06-.01.091-.01.1-.01.2-.01.292-.01a3.471,3.471,0,0,1,.977.141,3.348,3.348,0,0,1,1.42.846,3.459,3.459,0,0,1,.755,1.138,3.4,3.4,0,0,1,.242,1.249v.1A.823.823,0,0,0,173.589,63.952Z"
                transform="translate(-165.462 -58.423)"
                fill="#8d8d8d"
              />
              <path
                id="Path_13939"
                data-name="Path 13939"
                d="M164.183,6.544A5.229,5.229,0,0,0,160.467,5c-.151,0-.3.01-.453.02a3.493,3.493,0,0,0-.453.06.235.235,0,1,0,.081.463l.2-.03a1.5,1.5,0,0,1,.211-.02c.141-.01.272-.02.413-.02a4.745,4.745,0,0,1,4.754,4.754v.222c0,.06-.01.121-.01.191a.243.243,0,1,0,.483.04c.01-.151.02-.3.02-.443A5.215,5.215,0,0,0,164.183,6.544Z"
                transform="translate(-155.714 -5.003)"
                fill="#8d8d8d"
              />
              <path
                id="Path_13940"
                data-name="Path 13940"
                d="M9.636,26.481l-1.719-.946c-.573-.319-.593-.11-1.195.548-.146.159-.418.577-.738.5a7.05,7.05,0,0,1-2.331-1.633,5.575,5.575,0,0,1-1.039-1.6c-.019-.518,1.088-.777.729-1.762L2.574,19.82C1.855,18.127-.156,20.836.009,22.1c.427,3.116,5.76,8.154,8.733,6.492C9.4,28.213,10.3,26.889,9.636,26.481Z"
                transform="translate(0 -18.92)"
                fill="#8d8d8d"
              />
            </svg>

            <span style={{ color: "#5d5d5d" }}>+{inputValue}</span>
          </div>
          <div className="icon-detail" style={{ marginTop: "1px" }}>
            <span
              style={{ marginLeft: "20px", color: "#C4C2C2", marginTop: "9px" }}
            >
              {translate("You Can Log In Now", language)}
            </span>
          </div>
        </div>
      </div>
      <div className="login-button-group">
        <div
          className="login-button"
          onClick={() => {
            if (user.name.length > 1) {
              Sendevent({
                event: "button_clicked",
                value: "login_continue_button",
              });
              setStepSign("welcomeLogin");
              setStepIndicator(6);
              FinaliseLogin();
            } else {
              setStepIndicator(7);
            }
          }}
          style={{
            position: "relative",
            marginTop: "50px",
            marginLeft: "14px",
            marginRight: "24px",
          }}
        >
          {translate("Login & Continue", language)}
        </div>
      </div>
      <div
        className="blue-text"
        style={{
          fontSize: "12px",
          fontFamily: `var(--Quicksand-Regular)`,
          marginTop: "3vh",
        }}
        onClick={() => {
          AuthService.cancelAuth();
          close();
        }}
      >
        {translate("Cancel & Take A Look At The App", language)}
      </div>
    </Animated.div>
  );
}

export default AlreadyRegistered;

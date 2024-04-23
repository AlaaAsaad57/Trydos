import React from "react";
import AlreadyRegistered from "./AlreadyRegistered";
import AccountNotFound from "./AccountNotFound";
import WelcomingWidget from "./WelcomingWidget";
import { translate } from "utils/functions";
import { useSelector } from "react-redux";
import { UserInterface } from "models/User";

function SignSteps({
  inputValue,
  setStepIndactor,
  close,
  Name,
  user,
  FinaliseLogin,
  operation,
  signStep,
  setStepSign,
}: {
  signStep: string;
  FinaliseLogin: Function;
  inputValue: string;
  operation: string;
  setStepIndactor: Function;
  close: Function;
  Name: string;
  user: UserInterface;
  setStepSign: Function;
}) {
  const language = useSelector((state: any) => state.homepage.language);

  return (
    <>
      {signStep === "welcomeLogin" ? (
        <WelcomingWidget
          Name={user?.name || "User Test"}
          close={() => close()}
          inputValue={inputValue}
          setStepIndcator={(e: number) => setStepIndactor(e)}
        />
      ) : (
        <>
          {signStep === "alreadyExists" && (
            <AlreadyRegistered
              setStepSign={(e) => setStepSign(e)}
              FinaliseLogin={() => FinaliseLogin()}
              close={() => close()}
              inputValue={inputValue}
              setStepIndcator={(e) => setStepIndactor(e)}
            />
          )}{" "}
          {signStep === "notFound" && (
            <AccountNotFound
              inputValue={inputValue}
              FinaliseLogin={() => FinaliseLogin()}
              setStepIndcator={(e) => setStepIndactor(e)}
            />
          )}
          {signStep === "welcomeSignup" && (
            <>
              <div className="welcoming-container">
                <div className="welcoming-label">
                  {translate("Hello,", language)}
                </div>
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
                style={{ fontFamily: "Adobe Clean Regular", fontSize: "14px" }}
              >
                {translate("Skip For Now", language)}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default SignSteps;

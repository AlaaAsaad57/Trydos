import React from "react";
import AlreadyRegistered from "./AlreadyRegistered";
import AccountNotFound from "./AccountNotFound";
import WelcomingWidget from "./WelcomingWidget";
import { translate } from "utils/functions";
import { useSelector } from "react-redux";
import { UserInterface } from "models/User";
import WelcomeSignup from "./WelcomeSignup";

function SignSteps({
  inputValue,
  stepIndicator,
  setStepIndactor,
  close,
  cancelLogin,
  Name,
  user,
  FinaliseLogin,
  operation,
  signStep,
  setStepSign,
}: {
  signStep: string;
  stepIndicator: number;
  FinaliseLogin: Function;
  cancelLogin: Function;
  inputValue: string;
  operation: string;
  setStepIndactor: Function;
  close: Function;
  Name: string;
  user: UserInterface;
  setStepSign: Function;
}) {
  return (
    <>
      <WelcomingWidget
        signStep={signStep}
        stepIndicator={stepIndicator}
        Name={user?.name || "User Test"}
        close={() => close()}
        inputValue={inputValue}
        setStepIndcator={(e: number) => setStepIndactor(e)}
      />

      <AlreadyRegistered
        signStep={signStep}
        stepIndicator={stepIndicator}
        setStepSign={(e) => setStepSign(e)}
        FinaliseLogin={() => FinaliseLogin()}
        close={() => {
          close();
          cancelLogin();
        }}
        inputValue={inputValue}
        setStepIndcator={(e) => setStepIndactor(e)}
      />
      <AccountNotFound
        signStep={signStep}
        close={() => {
          close();
          cancelLogin();
        }}
        stepIndicator={stepIndicator}
        inputValue={inputValue}
        FinaliseLogin={() => FinaliseLogin()}
        setStepIndcator={(e) => setStepIndactor(e)}
      />
      <WelcomeSignup
        Name={Name}
        close={() => close()}
        signStep={signStep}
        stepIndicator={stepIndicator}
      />
    </>
  );
}

export default SignSteps;

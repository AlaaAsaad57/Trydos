import AlreadyRegistered from "./AlreadyRegistered";
import AccountNotFound from "./AccountNotFound";
import WelcomingWidget from "./WelcomingWidget";

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
  signStep,
  setStepSign,
}: {
  signStep: string;
  stepIndicator: number;
  FinaliseLogin: Function;
  cancelLogin: Function;
  inputValue: string;
  setStepIndactor: Function;
  close: Function;
  Name: string;
  user: any;
  setStepSign: Function;
}) {
  return (
    <div className="flex-col items-center w-full pb-[40px]">
      {stepIndicator !== 7 && (
        <>
          <WelcomingWidget
            signStep={signStep}
            stepIndicator={stepIndicator}
            Name={user?.name || ""}
            close={() => close()}
            inputValue={inputValue}
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
            setStepIndicator={(e) => setStepIndactor(e)}
          />
          <AccountNotFound
            signStep={signStep}
            close={() => {
              close();
              cancelLogin();
            }}
            stepIndicator={stepIndicator}
            inputValue={inputValue}
            setStepIndicator={(e) => setStepIndactor(e)}
          />
          <WelcomeSignup
            Name={Name}
            close={() => close()}
            signStep={signStep}
            stepIndicator={stepIndicator}
          />
        </>
      )}
    </div>
  );
}

export default SignSteps;

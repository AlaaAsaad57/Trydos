import LogInPins from "components/Login/LogInPins";

import SendMethod from "components/Login/SendMethod";

import React, { useEffect, useState } from "react";
import AuthService from "services/auth";

import "public/styles/newLogin.css";
import "public/styles/login.css";
import { useAppStore } from "store";
import PhoneInput from "components/Login/PhoneInput";

function ConfirmMobileChange({
  closeWindow,
  value,
  successCallbackFunction,
  forVerify,
}) {
  const { setWrongNumber, verficationID, wrongNumber, userProfile } =
    useAppStore();
  const [stepIndicator, setStepIndicator] = useState(3);
  const [inputValue, setInputValue] = useState(value);

  const [MessageMethod, setMessageMethod] = useState("");
  const [pins, setPins] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const [idToken, setIdToken] = useState("");

  const SendOtpHook = async ({
    errorCallback,
    mobilePhone,
    is_via_whatsapp,
    successCallback,
  }) => {
    try {
      let errorCallbackFunc = (e) => errorCallback(e);
      let data = await AuthService.SendOtp(
        mobilePhone,
        is_via_whatsapp,
        errorCallbackFunc
      );

      successCallback();
    } catch (error) {
      console.log(error);
      errorCallback();
      console.error("SendOtp failed:", error);
    }
  };
  const [rendere, setRender] = useState(true);
  const VerifyOtpHook = async ({ code, verificationID }) => {
    try {
      if (forVerify) {
        let data = await AuthService.VerifyOtp(
          code,
          verficationID,
          "",
          () => {}
        );
        FinaliseLogin();
        return data;
      }
      let data = await AuthService.VerifyOtpForUpdatePhone(
        code,
        verificationID
      );
      return data;
    } catch (error) {
      console.error("VerifyOtp failed:", error);
      // errorCallback(error);
      throw error;
    }
  };
  const FinaliseLogin = async () => {
    await AuthService.ConfirmSignIn();
  };
  const [failedLogin, setFailed] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const loginFunc = async (e) => {
    try {
      setLoadingPin(true);
      let data = await VerifyOtpHook({
        code: e,
        verificationID: verficationID,
      });
      successCallbackFunction(data);

      setLoadingPin(false);
    } catch (error) {
      setLoadingPin(false);
    }
  };

  useEffect(() => {
    if (value && value !== "0") {
      let phone = value;
      setInputValue(phone);
      setStepIndicator(4);
    } else {
      setInputValue("");
      setStepIndicator(3);
    }
  }, []);
  const [showMobile, setShowMobile] = useState(false);
  return (
    <div>
      {!userProfile?.phone ||
        (userProfile.phone === "0" && (
          <PhoneInput
            isForCart={true}
            inputValue={inputValue}
            wrongNumber={wrongNumber}
            setWrongNumber={(e) => {
              setWrongNumber(e);
            }}
            setInputValue={(e) => setInputValue(e)}
            stepIndicator={stepIndicator}
            setStepIndicator={(e) => setStepIndicator(e)}
            operation={"login"}
          />
        ))}
      <SendMethod
        stepIndicator={stepIndicator}
        setWrongNumber={(e) => {
          setWrongNumber(e);
        }}
        setStepIndicator={(e: number) => setStepIndicator(e)}
        setShowMobile={setShowMobile}
        setMessageMethod={(e: string) => setMessageMethod(e)}
        inputValue={inputValue}
        hideEdit={true}
      />

      <LogInPins
        loadingPin={loadingPin}
        forChanging={true}
        expired={expired}
        init={() => {
          setDisabled(false);
          setExpired(false);
        }}
        stepIndicator={stepIndicator}
        setDisabled={(e) => {
          setDisabled(e);
          setExpired(e);
        }}
        resend={() => {
          SendOtpHook({
            mobilePhone: inputValue,
            is_via_whatsapp: MessageMethod === "WA" ? "1" : "0",

            successCallback: function () {
              //   successCallback();
            },
            errorCallback: function (msg) {
              setStepIndicator(3);
            },
          });
          setDisabled(false);
          setExpired(false);
        }}
        setStepIndactor={(e) => setStepIndicator(e)}
        rendere={rendere}
        inputValue={inputValue}
        disabled={disabled}
        Submit={(e) => loginFunc(e)}
        successLogin={success}
        wrongNumber={wrongNumber}
        failedLogin={failedLogin}
        setPin={(e: string) => setPins(e)}
        pin={pins}
        MessageMethod={MessageMethod}
      />
    </div>
  );
}

export default ConfirmMobileChange;

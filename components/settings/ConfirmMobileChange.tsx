import LogInPins from "components/Login/LogInPins";
import PhoneInput from "components/Login/PhoneInput";
import SendMethod from "components/Login/SendMethod";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import AuthService from "services/auth";
import { Sendevent } from "utils/functions";
import "public/styles/newLogin.css";
import "public/styles/login.css";

function ConfirmMobileChange({
  closeWindow,
  value,
  successCallbackFunction,
  forVerify,
}) {
  const [stepIndicator, setStepIndicator] = useState(3);
  const [inputValue, setInputValue] = useState(value);
  const dispatch = useDispatch();
  const [MessageMethod, setMessageMethod] = useState("");
  const [pins, setPins] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);

  const verficationID = useSelector(
    (state: StateInterface) => state.auth.verficationID
  );
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
      // errorCallback(error);
      console.error("VerifyOtp failed:", error);
    }
  };
  const FinaliseLogin = async () => {
    await AuthService.ConfirmSignIn();
  };
  const [failedLogin, setFailed] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const loginFunc = async (e) => {
    setLoadingPin(true);
    let data = await VerifyOtpHook({
      code: e,
      verificationID: verficationID,
      // errorCallback: (e) => {
      //   Sendevent({
      //     event: "programming_event",
      //     value: "otp_failed_event",
      //   });
      //   setFailed(true);
      //   setTimeout(() => {
      //     setPins("");
      //     setRender(false);
      //     setFailed(false);
      //     setTimeout(() => {
      //       setRender(true);
      //     }, 300);
      //   }, 1000);
      //   if (e.message === "user not found") {
      //     Sendevent({
      //       event: "programming_event",

      //       value: "phone_number_not_registered_event",
      //     });

      //     setStepIndicator(6);
      //   }
      //   setLoadingPin(false);
      // },
      // successCallback: async (exists, name) => {
      //   Sendevent({
      //     event: "programming_event",

      //     value: "verify_otp_signin_success_event",
      //   });

      //   await FinaliseLogin();

      //   setTimeout(() => {
      //     setLoadingPin(false);
      //     closeWindow();
      //     goToOrders();
      //   }, 2000);
      // },
    });

    // let idToken = "";
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    // localStorage.setItem("has-phone", value);

    successCallbackFunction(data);
    dispatch({
      type: "UPDATE_USER_IS_VERFIED",
      payload: { is_phone_verified: 1 },
    });
    setLoadingPin(false);
  };
  const wrongNumber = useSelector(
    (state: StateInterface) => state.auth.wrongNumber
  );
  useEffect(() => {
    if (value) {
      let phone = value;
      setInputValue(phone);
      setStepIndicator(4);
    }
  }, []);
  const [showMobile, setShowMobile] = useState(false);
  return (
    <div>
      <SendMethod
        stepIndicator={stepIndicator}
        setWrongNumber={(e) => {
          dispatch({ type: "WRONG-NUMBER", payload: e });
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

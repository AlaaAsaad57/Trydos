import LogInPins from "components/Login/LogInPins";
import PhoneInput from "components/Login/PhoneInput";
import SendMethod from "components/Login/SendMethod";
import React, { useEffect, useState } from "react";
import AuthService from "services/auth";
import { Sendevent } from "utils/functions";
import "public/styles/newLogin.css";
import "public/styles/login.css";
import { useAppStore } from "store";
import {
  GA_CLICK_EVENT_VALUES,
  GA_EVENT_NAMES,
  GA_PROGRAMMING_EVENT_VALUES,
} from "utils/GAEvents";

function ConfirmMobile({ closeWindow, hasMobile, goToOrders }) {
  const { setWrongNumber, verficationID, wrongNumber } = useAppStore();
  const [stepIndicator, setStepIndicator] = useState(3);
  const [inputValue, setInputValue] = useState("");
  const [MessageMethod, setMessageMethod] = useState("");
  const [pins, setPins] = useState("");

  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const SendOtpHook = async ({
    errorCallback,
    mobilePhone,
    is_via_whatsapp,
    successCallback,
  }) => {
    try {
      let errorCallbackFunc = (e) => errorCallback(e);
      await AuthService.SendOtp(
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
  const VerifyOtpHook = async ({
    code,
    verificationID,
    Username,
    EditPhoneFunc,
    successCallback,
    errorCallback,
  }) => {
    try {
      let [exists, name] = await AuthService.VerifyOtp(
        code,
        verificationID,
        Username,
        EditPhoneFunc
      );
      await successCallback(exists, name);
    } catch (error) {
      errorCallback(error);
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
    await VerifyOtpHook({
      code: e,
      EditPhoneFunc: () => {},
      Username: "",
      verificationID: verficationID,
      errorCallback: (e) => {
        Sendevent({
          event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
          value: GA_PROGRAMMING_EVENT_VALUES.OTP_FAILED_EVENT,
        });
        setFailed(true);
        setTimeout(() => {
          setPins("");
          setRender(false);
          setFailed(false);
          setTimeout(() => {
            setRender(true);
          }, 300);
        }, 1000);
        if (e.message === "user not found") {
          Sendevent({
            event: GA_EVENT_NAMES.PROGRAMMING_EVENT,

            value:
              GA_PROGRAMMING_EVENT_VALUES.PHONE_NUMBER_NOT_REGISTERED_EVENT,
          });

          setStepIndicator(6);
        }
        setLoadingPin(false);
      },
      successCallback: async (exists, name) => {
        Sendevent({
          event: GA_EVENT_NAMES.PROGRAMMING_EVENT,

          value: GA_PROGRAMMING_EVENT_VALUES.OTP_SUCCESS_EVENT,
        });

        await FinaliseLogin();

        setTimeout(() => {
          setLoadingPin(false);
          closeWindow();
          goToOrders();
        }, 2000);
      },
    });
  };

  useEffect(() => {
    if (hasMobile) {
      let phone = localStorage.getItem("has-phone");
      setInputValue(phone);
      setStepIndicator(4);
    }
  }, []);
  const [showMobile, setShowMobile] = useState(false);

  return (
    <div>
      {(!hasMobile || showMobile) && (
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
      )}
      <SendMethod
        stepIndicator={stepIndicator}
        setWrongNumber={(e) => {
          setWrongNumber(e);
        }}
        setStepIndicator={(e: number) => setStepIndicator(e)}
        setShowMobile={setShowMobile}
        setMessageMethod={(e: string) => setMessageMethod(e)}
        inputValue={inputValue}
      />

      <LogInPins
        loadingPin={loadingPin}
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
              setTimeout(() => {
                closeWindow();
              }, 3000);
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

export default ConfirmMobile;

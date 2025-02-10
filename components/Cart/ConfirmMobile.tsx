import LogInPins from "components/Login/LogInPins";
import PhoneInput from "components/Login/PhoneInput";
import SendMethod from "components/Login/SendMethod";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import AuthService from "services/auth";
import { Sendevent } from "utils/functions";
import "public/styles/newLogin.css";
import "public/styles/login.css";

function ConfirmMobile({ closeWindow, hasMobile, goToOrders }) {
  const [stepIndicator, setStepIndicator] = useState(3);
  const [inputValue, setInputValue] = useState("");
  const dispatch = useDispatch();
  const [MessageMethod, setMessageMethod] = useState("");
  const [pins, setPins] = useState("");
  const verficationID = useSelector(
    (state: StateInterface) => state.auth.verficationID
  );
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
    let idToken = localStorage.getItem("ID-TOKEN");

    await AuthService.VerifyGuest(idToken, async () => {});
    await AuthService.ConfirmSignIn();
  };
  const [failedLogin, setFailed] = useState(false);

  const loginFunc = async (e) => {
    await VerifyOtpHook({
      code: e,
      EditPhoneFunc: () => {},
      Username: "",
      verificationID: verficationID,
      errorCallback: (e) => {
        Sendevent({
          event: "programming_event",
          value: "otp_failed_event",
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
            event: "programming_event",

            value: "phone_number_not_registered_event",
          });

          setStepIndicator(6);
        }
      },
      successCallback: async (exists, name) => {
        Sendevent({
          event: "programming_event",

          value: "verify_otp_signin_success_event",
        });

        await FinaliseLogin();
        setTimeout(() => {
          closeWindow();
          goToOrders();
        }, 2000);
      },
    });
  };
  const wrongNumber = useSelector(
    (state: StateInterface) => state.auth.wrongNumber
  );
  useEffect(() => {
    if (hasMobile) {
      let phone = localStorage.getItem("has-phone");
      setInputValue(phone);
      setStepIndicator(4);
    }
  }, []);
  return (
    <div>
      <PhoneInput
        isForCart={true}
        inputValue={inputValue}
        wrongNumber={wrongNumber}
        setWrongNumber={(e) => {
          //   setWrongNumber(e);
          dispatch({ type: "WRONG-NUMBER", payload: e });
        }}
        setInputValue={(e) => setInputValue(e)}
        stepIndicator={stepIndicator}
        setStepIndicator={(e) => setStepIndicator(e)}
        operation={"login"}
      />
      <SendMethod
        stepIndicator={stepIndicator}
        setWrongNumber={(e) => {
          dispatch({ type: "WRONG-NUMBER", payload: e });
        }}
        setStepIndicator={(e: number) => setStepIndicator(e)}
        setMessageMethod={(e: string) => setMessageMethod(e)}
        inputValue={inputValue}
      />

      <LogInPins
        expired={expired}
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

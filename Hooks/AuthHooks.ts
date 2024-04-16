import { useMutation } from "@tanstack/react-query";
import {
  CheckPhoneInputInterface,
  SendOtpInputInterface,
  UserInterface,
  VerifyOtpInputInterface,
} from "models/User";
import AuthService from "services/auth";

export function useAuthHooks() {
  // CheckInputHook
  const {
    data: dataCheckPhoneHook,
    isPending: isPendingCheckPhone,
    mutateAsync: mutateAsyncCheckPhone,
  } = useMutation({
    mutationFn: async (CheckPhoneInput: CheckPhoneInputInterface) => {
      try {
        const { value, step, newAccount } = CheckPhoneInput;
        await AuthService.CheckPhone(value, step, newAccount);
        console.log("CheckPhone");
      } catch (error) {
        console.error("CheckPhone failed:", error);
      }
    },
  });

  // SendOtpHook
  const {
    data: dataSendOtpHook,
    isPending: isPendingSendOtpHook,
    mutateAsync: mutateAsyncSendOtpHook,
  } = useMutation({
    mutationFn: async (SendOtpInput: SendOtpInputInterface) => {
      const {
        mobilePhone,
        is_via_whatsapp,
        step,
        errorCallback,
        successCallback,
      } = SendOtpInput;
      try {
        await AuthService.SendOtp(mobilePhone, is_via_whatsapp, step);
        successCallback();
      } catch (error) {
        errorCallback();
        console.error("SendOtp failed:", error);
      }
    },
  });

  // VerifyOtp

  const {
    data: dataVerifyOtpHook,
    isPending: isPendingVerifyOtpHook,
    mutateAsync: mutateAsyncVerifyOtpHook,
  } = useMutation({
    mutationFn: async (VerifyOtpInput: VerifyOtpInputInterface) => {
      try {
        const {
          code,
          verificationID: verificationID,
          Username,
          EditPhoneFunc,
          successCallback,
          errorCallback,
        } = VerifyOtpInput;
        let [exists, name] = await AuthService.VerifyOtp(
          code,
          verificationID,
          Username,
          EditPhoneFunc
        );
        successCallback(exists, name);
        console.log("VerifyOtpHook");
      } catch (error) {
        console.error("VerifyOtp failed:", error);
      }
    },
  });

  return {
    CheckPhoneData: dataCheckPhoneHook,
    CheckPhoneLoading: isPendingCheckPhone,
    CheckPhoneHook: mutateAsyncCheckPhone,

    SendOtpData: dataSendOtpHook,
    SendOtpLoading: isPendingSendOtpHook,
    SendOtpHook: mutateAsyncSendOtpHook,

    VerifyOtpData: dataVerifyOtpHook,
    VerifyOtpLoading: isPendingVerifyOtpHook,
    VerifyOtpHook: mutateAsyncVerifyOtpHook,
  };
}

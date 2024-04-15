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
  const { isPending: isPendingCheckPhone, mutateAsync: mutateAsyncCheckPhone } =
    useMutation({
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
    isPending: isPendingSendOtpHook,
    mutateAsync: mutateAsyncSendOtpHook,
  } = useMutation({
    mutationFn: async (SendOtpInput: SendOtpInputInterface) => {
      try {
        const { mobilePhone, is_via_whatsapp, step } = SendOtpInput;
        await AuthService.SendOtp(mobilePhone, is_via_whatsapp, step);
        console.log("SendOtpHook");
      } catch (error) {
        console.error("SendOtp failed:", error);
      }
    },
  });

  // VerifyOtp

  const {
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
        } = VerifyOtpInput;
        await AuthService.VerifyOtp(
          code,
          verificationID,
          Username,
          EditPhoneFunc
        );
        console.log("VerifyOtpHook");
      } catch (error) {
        console.error("VerifyOtp failed:", error);
      }
    },
  });

  return {
    CheckPhoneLoading: isPendingCheckPhone,
    CheckPhoneHook: mutateAsyncCheckPhone,

    SendOtpLoading: isPendingSendOtpHook,
    SendOtpHook: mutateAsyncSendOtpHook,

    VerifyOtpLoading: isPendingVerifyOtpHook,
    VerifyOtpHook: mutateAsyncVerifyOtpHook,
  };
}

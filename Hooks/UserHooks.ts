import { useMutation } from "@tanstack/react-query";
import { UserInterface } from "models/User";
import { signup, signin } from "services/users";

export function useAuth() {
  const {
    isIdle: isIdleSignin,
    isPending: isPendingSignin,
    data: signinData,
    mutateAsync: mutateAsyncSignin,
  } = useMutation({
    mutationFn: signin,
    onSuccess: () => {},
  });
  const signinHook = async (userData: UserInterface) => {
    try {
      await mutateAsyncSignin(userData);
    } catch (error) {
      console.error("Signin failed:", error);
    }
  };

  const {
    data: signupData,
    isIdle: isIdleSignup,
    isPending: isPendingSignup,
    mutateAsync: mutateAsyncSignup,
  } = useMutation({
    mutationFn: signup,
    onSuccess: () => {},
  });
  const signupHook = async (userData: UserInterface) => {
    try {
      await mutateAsyncSignup(userData);
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  const {
    data: sendOtpData,
    isIdle: isIdleSendOtp,
    isPending: isPendingSendOtp,
    mutateAsync: mutateAsyncSendOtp,
  } = useMutation({
    mutationFn: signup,
    onSuccess: () => {},
  });
  const sendOtpHook = async (userData: UserInterface) => {
    try {
      await mutateAsyncSendOtp(userData);
    } catch (error) {
      console.error("SendOtp failed:", error);
    }
  };

  return {
    sendOtpHook,
    signupHook,
    signinHook,
    signupData,
    signinData,
    signupLoading: isPendingSignup,
    signinLoading: isPendingSignin,
    sendOtpLoading: isPendingSendOtp,
    isLoading: isPendingSignup || isPendingSendOtp || isPendingSignin,
  };
}

import { OTP_URL, STORIES_URL } from "utils/endpointConfig";
import { store } from "../index";
export const ReInitialise = () => {
  return { type: "RE-INITILIASE" };
};
export const lodaingOTP = (val) => {
  return { type: "LOADING-OTP", payload: val };
};

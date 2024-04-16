import { OTP_URL, STORIES_URL } from "utils/endpointConfig";
import { store } from "../index";
import { getStories } from "utils/functions";
export const ReInitialise = () => {
  return { type: "RE-INITILIASE" };
};
export const lodaingOTP = (val) => {
  return { type: "LOADING-OTP", payload: val };
};
export const RegisterGuest = () => {
  return {};
};

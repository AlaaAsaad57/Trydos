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
export const UpdateName = async (name) => {
  try {
    localStorage.setItem(
      "USER-STORIES",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("USER-STORIES")),
        name: name,
      })
    );
    localStorage.setItem(
      "USER",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("USER")),
        name: name,
      })
    );
    store.dispatch({ type: "UPDATE-NAME", payload: name });
    let axios = (await import("axios")).default;
    axios.post(
      OTP_URL + "/customer/update-name",
      { name: name },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("MARKET-TOKEN")}`,
        },
      }
    );
    axios.post(
      STORIES_URL + "/api/v1/users/update",
      { name: name },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("STORIES-TOKEN")}`,
        },
      }
    );
    getStories();
  } catch (e) {
    console.error(e);
  }
};

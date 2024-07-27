import { store } from "store";
import { ReInitialise } from "store/auth/actions";
import userImage from "public/images/profileNo.png";
import Cookies from "js-cookie";

import { _isStoreLastJson, getLang } from "utils/functions";
import {
  OTP_URL,
  SEND_OTP,
  STORIES_URL,
  VERFIY_OTP,
  VERFIY_OTP_SIGNUP,
} from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
const getHeader = () => {
  return {
    headers: {
      Authorization: `Bearer ${
        typeof localStorage !== "undefined" &&
        localStorage.getItem("MARKET-TOKEN")
      }`,
      lang: getLang(null, Cookies.get("language")),
      country: Cookies.get("country"),
    },
  };
};
class AuthService {
  async CheckPhone(
    value: string | number,
    step: Function,
    newAccount: boolean
  ) {
    try {
      const response = await fetch(
        OTP_URL + "/phone/check-existence/" + `${value}`,
        getHeader()
      );
      let repo = await response.json();
      step(277);
      store.dispatch(ReInitialise());
      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
    } catch (e) {
      step(282);
      store.dispatch({ type: "WRONG-NUMBER", payload: "phone already exists" });
    }
  }
  async SendOtp(
    mobilePhone: string,
    is_via_whatsapp: number | string,
    step: Function
  ) {
    try {
      let response = await fetch(
        OTP_URL +
          SEND_OTP +
          `?phone=+${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`,
        getHeader()
      );
      let repo = await response.json();
      if (repo.data.verificationId) {
        store.dispatch({
          type: "SET-VERFICATION-ID",
          payload: repo.data.verificationId,
        });

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      }
      return repo;
    } catch (e) {
      step(282);
      store.dispatch({
        type: "WRONG-NUMBER",
        payload: "failed to send otp code please try again",
      });
      throw e;
    }
  }
  async VerifyOtp(
    code: string,
    verficationID: string,
    Username: string,
    EditPhoneFunc: Function
  ) {
    try {
      const response = await fetch(
        OTP_URL +
          (Username.length > 0 ? VERFIY_OTP_SIGNUP : VERFIY_OTP) +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        getHeader()
      );
      let repo = await response.json();
      if (repo?.isSuccessful === false) {
        throw new Error("Wrong Code");
      }
      localStorage.setItem("ID-TOKEN", repo.data.id_token);
      Cookies.set("market-token", repo.data.token);
      localStorage.setItem("MARKET-TOKEN", repo.data.token);
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...repo.data.user,
          already_exists: repo.data.already_exists,
          is_verified: false,
        })
      );
      store.dispatch({
        type: "TEMP-USER",
        payload: {
          ...repo.data.user,
          already_exists: repo.data.already_exists,
          is_verified: false,
        },
      });
      StoryService.loginStories();
      ChatService.loginChat();

      if (typeof window !== "undefined") {
        localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
      return [repo.data.already_exists, repo.data.user.name];
    } catch (e) {
      if (e.response.data.message === "user not found") {
        store.dispatch({ type: "WRONG-NUMBER", payload: "user not found" });
      } else {
        store.dispatch({ type: "LOGIN_FAILED" });
      }
      throw e;
    }
  }
  async UpdateName(name: string) {
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
        getHeader()
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

      StoryService.getStories();
    } catch (e) {
      console.error(e);
    }
  }
  async ConfirmSignIn() {
    let userLocal = JSON.parse(localStorage.getItem("USER"));
    store.dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        id: userLocal.id,
        idToken: userLocal.id_token,
        name: userLocal.name,
        avatar: userImage,
        already_exists: userLocal.already_exists,
        is_verified: true,
      },
    });
    localStorage.setItem(
      "USER",
      JSON.stringify({ ...userLocal, is_verified: true })
    );
    StoryService.loginStories();
    ChatService.loginChat();
  }
  async cancelAuth() {
    store.dispatch({ type: "CANCEL-AUTH" });
  }
}
export default new AuthService();

import axios from "axios";
import { store } from "store";
import { ReInitialise } from "store/auth/actions";
import userImage from "public/images/profileNo.png";
import Cookies from "js-cookie";

import { _isStoreLastJson } from "utils/functions";
import {
  OTP_URL,
  SEND_OTP,
  STORIES_URL,
  VERFIY_OTP,
  VERFIY_OTP_SIGNUP,
} from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
class AuthService {
  http = axios.create({
    baseURL: OTP_URL,
    headers: {
      Authorization: `Bearer ${
        typeof localStorage !== "undefined" &&
        localStorage.getItem("MARKET-TOKEN")
      }`,
      lang: Cookies.get("language"),
      country: Cookies.get("country"),
    },
  });

  async CheckPhone(
    value: string | number,
    step: Function,
    newAccount: boolean
  ) {
    try {
      const response = await this.http.get(
        "/phone/check-existence/" + `${value}`
      );
      step(277);
      store.dispatch(ReInitialise());
      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(response));
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
      const response = await this.http.get(
        SEND_OTP + `?phone=+${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`
      );
      if (response.data.data.verificationId) {
        store.dispatch({
          type: "SET-VERFICATION-ID",
          payload: response.data.data.verificationId,
        });

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(response));
        }
      }
      return response.data;
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
      const response = await this.http.get(
        (Username.length > 0 ? VERFIY_OTP_SIGNUP : VERFIY_OTP) +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`
      );
      if (response.data?.isSuccessful === false) {
        throw new Error("Wrong Code");
      }
      localStorage.setItem("ID-TOKEN", response.data.data.id_token);
      localStorage.setItem("MARKET-TOKEN", response.data.data.token);
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...response.data.data.user,
          already_exists: response.data.data.already_exists,
          is_verified: false,
        })
      );
      store.dispatch({
        type: "TEMP-USER",
        payload: {
          ...response.data.data.user,
          already_exists: response.data.data.already_exists,
          is_verified: false,
        },
      });
      StoryService.loginStories();
      ChatService.loginChat();

      if (typeof window !== "undefined") {
        localStorage.setItem("LAST_JSON", JSON.stringify(response));
      }
      return [response.data.data.already_exists, response.data.data.user.name];
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

import { store } from "store";
import { ReInitialise } from "store/auth/actions";
import userImage from "public/images/profileNo.png";
import Cookies from "js-cookie";

import { _isStoreLastJson, getLang, UserID } from "utils/functions";
import { SEND_OTP, VERFIY_OTP, VERFIY_OTP_SIGNUP } from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
import { FetchApi } from "store/homepage/cachedActions";
import axios from "axios";
import home from "./home";
const getHeader = () => {
  return {
    headers: {
      "ssr-req": "true",
      Authorization: `Bearer ${
        localStorage.getItem("MARKET-TOKEN") ||
        localStorage.getItem("DEVICE-TOKEN")
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
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/phone/check-existence/" +
          `${value}`,
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
      store.dispatch({
        type: "WRONG-NUMBER",
        payload: e.response.data.message,
      });
    }
  }
  async SendOtp(
    mobilePhone: string,
    is_via_whatsapp: number | string,
    step: Function,
    errorCallback: Function
  ) {
    let msg = "";
    try {
      let response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          SEND_OTP +
          `?phone=+${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`,
        getHeader()
      );

      let repo = await response.json();

      msg = repo.message;
      if (repo.data?.verificationId) {
        store.dispatch({
          type: "SET-VERFICATION-ID",
          payload: repo.data.verificationId,
        });

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      } else throw new Error(msg);
      return repo;
    } catch (e) {
      step(282);

      errorCallback();
      store.dispatch({
        type: "WRONG-NUMBER",
        payload: msg,
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
        process.env.NEXT_PUBLIC_BACKEND_URL +
          (Username.length > 0 ? VERFIY_OTP_SIGNUP : VERFIY_OTP) +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        getHeader()
      );
      let repo = await response.json();

      if (repo?.data?.message === "user not found") {
        throw new Error("user not found");
      }
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
      if (e.message === "user not found") {
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
        process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/update-name",
        { name: name },
        getHeader()
      );
      axios.post(
        process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + "/api/v1/users/update",
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
  async NotifyForProducts({ id, variant }) {
    const details = {
      product_id: id,
      variant,
      user_id: UserID(),
      notification_type_id: 1,
    };
    var formBody: any = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    let data = await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/product_notification/store",
      formBody,
      {
        ...getHeader(),
      }
    );
  }
  async getProductNotify({ id }) {
    if (!localStorage.getItem("DEVICE-TOKEN")) await home.RegisterDevice();
    let data = await axios.get(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/web/product/likesCommentsSharesDetails/" +
        id,

      {
        ...getHeader(),
      }
    );

    return data.data.data;
  }
}
export default new AuthService();

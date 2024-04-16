import axios from "axios";
import { store } from "store";
import { GetChats } from "store/chat/actions";
import userImage from "public/images/profileNo.png";
import {
  CUSTOMER_INFO_URL,
  OTP_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";

class HomeService {
  http = axios.create({
    baseURL: OTP_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("MARKET-TOKEN")}`,
    },
  });
  async getClientData() {
    if (!localStorage.getItem("customer-info")) this.getCustomerInfo();
    const response = await this.http.get(STARTER_SETTINGS);
    store.dispatch({ type: "GET_SETTINGS", payload: response.data });
    sessionStorage.setItem(
      "starttingSetting",
      JSON.stringify(response.data.data)
    );
    setTimeout(() => {
      GetChats(false);
    }, 2000);
  }
  async getCustomerInfo() {
    const response = await this.http.get(CUSTOMER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("MARKET-TOKEN")}`,
      },
    });
    store.dispatch({
      type: "UPDATE_USER_INFO",
      payload: response.data.data.customer_info,
    });
    localStorage.setItem(
      "customer-info",
      JSON.stringify(response.data.data.customer_info)
    );
  }
  async CheckLogin() {
    if (
      SSRDetect() &&
      localStorage.getItem("USER") &&
      localStorage.getItem("ID-TOKEN") &&
      localStorage.getItem("MARKET-TOKEN")
    ) {
      store.dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          id: JSON.parse(localStorage.getItem("USER")).id,
          idToken: localStorage.getItem("ID-TOKEN"),
          name: JSON.parse(localStorage.getItem("USER")).name,
          avatar: JSON.parse(localStorage.getItem("USER")).avatar || userImage,
        },
      });
      setTimeout(() => {
        this.getClientData();
      }, 6000);
    }
  }
  async RegisterDevice() {
    if (
      SSRDetect() &&
      !localStorage.getItem("DEVICE-TOKEN") &&
      !localStorage.getItem("USER")
    ) {
      let response = await this.http.post(REGISTER_DEVICE_URL);
      localStorage.setItem("DEVICE-TOKEN", response.data.data.token);
    }
  }
}

export default new HomeService();

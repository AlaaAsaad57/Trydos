"use client";
import axios from "axios";
import { store } from "store";
import { GetChats } from "store/chat/actions";
import Cookies from "js-cookie";
import userImage from "public/images/profileNo.png";
import { _isStoreLastJson } from "utils/functions";
import {
  CUSTOMER_INFO_URL,
  HOME_DATA_URL,
  OTP_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";
import { GetMainData } from "store/homepage/actions";

class HomeService {
  http = axios.create({
    baseURL: OTP_URL,
    headers: {
      Authorization: `Bearer ${
        typeof localStorage !== "undefined" &&
        localStorage.getItem("MARKET-TOKEN")
      }`,
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

    if (typeof window !== "undefined") {
      console.log(_isStoreLastJson(), "_isStoreLastJson");
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(response));
    }
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

    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(response));
    }
  }
  async CheckLogin() {
    if (
      SSRDetect() &&
      localStorage.getItem("USER") &&
      JSON.parse(localStorage.getItem("USER")).is_verified &&
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
      localStorage.setItem("guest-user", response.data.data.user);
      if (typeof window !== "undefined") {
        console.log(_isStoreLastJson(), "_isStoreLastJson");
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(response));
      }
    }
  }
  async GetBoutiques(slug) {
    const response = await this.http.get(
      OTP_URL + HOME_DATA_URL + `ByCategory/${slug}`,
      {
        headers: {
          country: Cookies.get("country"),
          language: Cookies.get("language"),
        },
      }
    );
    store.dispatch(GetMainData(response.data.data.boutiques));
  }
}

export default new HomeService();

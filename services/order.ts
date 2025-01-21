import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { _isStoreLastJson, getLang } from "utils/functions";
import { store } from "store";

class OrderService {
  async GetAddressList() {
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data = await AxiosGet({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/list",
        title: "Get Address List",
      });
      store.dispatch({ type: "GET-ADRRESS-LIST", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    }
  }
  async AddAddressList({ address }) {
    let body = {
      latitude: address.location.latitude,
      longitude: address.location.longitude,
      address: address.address,
      address_detail: address.address_detail,
      country: address?.Country?.name,
      city: "Latakia",
      district: "Jableh",
      town: "Ba`bda",
      street: "23",
      zip: "123123",
      contact_person_name: address.contact_info.name,
      phone: address.contact_info.phone,
      alternative_phone: address.contact_info.alternative_phone,
    };
    var formBody: any = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/add",
        title: "Add Address",
        body: formBody,
      });
      store.dispatch({ type: "ADD-ADRRESS-LIST", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    }
  }
  async UpdateAddressList({ address }) {
    let body = {
      latitude: address.location.latitude,
      longitude: address.location.longitude,
      address: address.address,
      address_detail: address.address_detail,
      country: address.Country.name,
      city: "Latakia",
      district: "Jableh",
      town: "Ba`bda",
      street: "23",
      zip: "123123",
      contact_person_name: address.contact_info.name,
      phone: address.contact_info.phone,
      alternative_phone: address.contact_info.alternative_phone,
    };
    var formBody: any = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/update",
        title: "Update Address",
        body: formBody,
      });
      store.dispatch({ type: "UPDATE-ADRRESS-LIST", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    }
  }
  async DeleteAddressList({ address }) {
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/customer/address/delete?address_id=${address}`,
        title: "Delete Address",
        body: "",
      });
      store.dispatch({ type: "DELETE-ADRRESS-LIST", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
    }
  }
}
export default new OrderService();

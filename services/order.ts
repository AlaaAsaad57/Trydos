import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { store } from "store";
import { GetAddressListApi, GetWalletApi, PlaceOrderApi } from "models/Api";

class OrderService {
  async PlaceOrder({ payment_method, pay_by_wallet }) {
    let addressId = store.getState().cart.addressLists[0]?.id;
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data: PlaceOrderApi = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/customer/order/checkout/${payment_method}?order_note=order note&address_id=${addressId}&pay_by_wallet=${
            pay_by_wallet ? 1 : 0
          }`,
        title: "pay Order",
        body: "",
      });
      if (!data[0]?.url) {
        store.dispatch({ type: "ORDER-SUCCESS", payload: data });
        store.dispatch({ type: "ORDER-DATA", payload: { success: true } });
      } else {
        store.dispatch({ type: "CRYPTO_CARD_PAYMENT", payload: data[0] });
      }

      store.dispatch({ type: "ORDER-LOADING", payload: false });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    }
  }
  async GetWallet() {
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data: GetWalletApi = await AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/customer/wallet/list?limit=10&offset=1",
        title: "Get Wallet",
      });
      store.dispatch({ type: "WALLET-USER", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    }
  }
  async GetAddressList() {
    try {
      store.dispatch({ type: "ORDER-LOADING", payload: true });
      let data: GetAddressListApi = await AxiosGet({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/list",
        title: "Get Address List",
      });

      store.dispatch({ type: "GET-ADRRESS-LIST", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    }
  }
  async AddAddressList({ address, callback }) {
    let body = {
      latitude: address.location.latitude,
      longitude: address.location.longitude,
      address: address.address,
      address_detail: address.address_detail,
      country: address?.Country?.name,
      iso: address?.Country?.code,
      city: address.region_details.city,
      province: address.region_details.province,
      town: address.region_details.town,
      street: address.region_details.street,
      building: address.region_details.building,
      zip: "123123",
      contact_person_name: address.contact_info.contact_person_name,
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
      await this.GetAddressList();
      callback();
      store.dispatch({ type: "ADD-ADRRESS-LIST", payload: data });
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    }
  }
  async UpdateAddressList({ address, callback }) {
    let body = {
      id: address.id,
      latitude: address.location.latitude,
      longitude: address.location.longitude,
      address: address.address,
      address_detail: address.address_detail,
      country: address?.Country?.name,
      iso: address?.Country?.code,
      city: address.region_details.city,
      province: address.region_details.province,
      town: address.region_details.town,
      street: address.region_details.street,
      building: address.region_details.building,
      zip: "123123",
      contact_person_name: address.contact_info.contact_person_name,
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
      callback();

      store.dispatch({ type: "ORDER-LOADING", payload: false });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: false });
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
        hasMessageOnly: true,
      });

      store.dispatch({ type: "ORDER-LOADING", payload: false });
    } catch (error) {
      store.dispatch({ type: "ORDER-LOADING", payload: false });
    }
  }
}
export default new OrderService();

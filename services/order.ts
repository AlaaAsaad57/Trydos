import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { useAppStore } from "store";
import { PlaceOrderApi } from "models/API/market/PlaceOrder";
import { GetAddressListApi } from "models/API/market/GetAddresses";
import { GetWalletApi } from "models/API/market/GetWallet";
import { GetCartOreview, toUSD } from "utils/functions";
import { getCurrency } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";

class OrderService {
  async PlaceOrder({ payment_method, pay_by_wallet }) {
    const {
      addressLists,
      setOrderLoading,
      setOrderSuccess,
      setOrderData,
      setCryptoCardPayment,
    } = useAppStore.getState();
    let addressId = addressLists.filter((s) => s.is_default === 1)[0]?.id;
    try {
      setOrderLoading(true);
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
        setOrderSuccess({ data });
        setOrderData({ data, success: true });
      } else {
        setCryptoCardPayment(data[0]);
      }

      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async GetWallet() {
    const { setOrderLoading, setWalletUser, setCurrency } =
      useAppStore.getState();
    try {
      setOrderLoading(true);
      getCurrency({
        callback: (data) => {
          setCurrency(data.currency);
        },
      });
      let response: { data: GetWalletApi } = await fetchData({
        url: "/customer/wallet/list?limit=10&offset=1",
        reqTitle: "Get Wallet",
        method: "GET",
        server: "market",
      });
      setWalletUser({
        ...response.data,
        wallet_balance: response.data.wallet_balance || 0,
      });
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async GetAddressList() {
    const { setOrderLoading, setAddressList } = useAppStore.getState();
    this.GetProvinces();
    try {
      setOrderLoading(true);
      let response: { data: GetAddressListApi } = await fetchData({
        url: "/customer/address/list",
        reqTitle: "Get Address List",
        method: "GET",
        server: "market",
      });
      setAddressList(response.data);
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async SetDefault({ id }) {
    const { setOrderLoading } = useAppStore.getState();

    let details = {
      address_id: id,
    };
    var formBody: any = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    try {
      setOrderLoading(true);
      let data = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/set-default",
        title: "set default Address",
        body: formBody,
      });
      await GetCartOreview();
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async AddAddressList({ address, callback }) {
    const { setOrderLoading } = useAppStore.getState();

    let body = {
      latitude: address.location?.latitude,
      longitude: address.location?.longitude,
      address: address?.address,
      address_detail: address?.address_detail,
      country: address?.Country?.name,
      iso: address?.Country?.code,
      city: address.region_details?.city,
      province: address.region_details?.province,
      town: address.region_details?.town,
      street: address.region_details?.street,
      building: address.region_details?.building,
      zip: "123123",
      contact_person_name: address.contact_info?.contact_person_name,
      phone: address.contact_info?.phone,
      alternative_phone: address.contact_info?.alternative_phone,
    };
    var formBody: any = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    try {
      setOrderLoading(true);
      let data = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/add",
        title: "Add Address",
        body: formBody,
      });
      await this.GetAddressList();
      await GetCartOreview();
      callback();

      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async UpdateAddressList({ address, callback }) {
    const { setOrderLoading } = useAppStore.getState();

    let body = {
      id: address.id,
      latitude: address.location?.latitude,
      longitude: address.location?.longitude,
      address: address?.address,
      address_detail: address.address_detail,
      country: address?.Country?.name,
      iso: address?.Country?.code,
      city: address.region_details?.city,
      province: address.region_details?.province,
      town: address.region_details?.town,
      street: address.region_details?.street,
      building: address.region_details?.building,
      zip: "123123",
      contact_person_name: address.contact_info?.contact_person_name,
      phone: address.contact_info?.phone,
      alternative_phone: address.contact_info?.alternative_phone,
    };
    var formBody: any = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    try {
      setOrderLoading(true);
      let data = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/address/update",
        title: "Update Address",
        body: formBody,
      });
      callback();

      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async DeleteAddressList({ address }) {
    const { setOrderLoading } = useAppStore.getState();

    try {
      setOrderLoading(true);
      let data = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/customer/address/delete?address_id=${address}`,
        title: "Delete Address",
        body: "",
        hasMessageOnly: true,
      });

      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async GetProvinces() {
    const { setOrderLoading, setProvinces } = useAppStore.getState();
    try {
      setOrderLoading(true);
      let data = await AxiosGet({
        url:
          process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
          "/api/addresses/get-provinces-by-iso",
        title: "Get Provinces",
      });

      setProvinces(data);
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async getOrderDetails(id) {
    let data = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        `/customer/order/getOrdersByOrderGroupID?order_group_id=${id}`,
      title: "getOrderByOrderGroupID request",
    });

    return data;
  }
}
export default new OrderService();

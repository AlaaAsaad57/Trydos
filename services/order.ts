import { useAppStore } from "store";
import { PlaceOrderApi } from "models/API/market/PlaceOrder";
import { GetAddressListApi } from "models/API/market/GetAddresses";
import { GetWalletApi } from "models/API/market/GetWallet";
import { GetCartOreview } from "utils/functions";
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
      let response: { data: PlaceOrderApi } = await fetchData({
        url: `/customer/order/checkout/${payment_method}?order_note=order note&address_id=${addressId}&pay_by_wallet=${
          pay_by_wallet ? 1 : 0
        }`,
        reqTitle: "pay Order",
        body: "",
        method: "POST",
        server: "market",
      });

      if (!response.data[0]?.url) {
        setOrderSuccess({ data: response.data });
        setOrderData({ data: response.data, success: true });
      } else {
        setCryptoCardPayment(response.data[0]);
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

    try {
      setOrderLoading(true);
      await fetchData({
        url: "/customer/address/set-default",
        reqTitle: "set default Address",
        body: JSON.stringify(details),
        method: "POST",
        server: "market",
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

    try {
      setOrderLoading(true);
      await fetchData({
        url: "/customer/address/add",
        reqTitle: "Add Address",
        body: JSON.stringify(body),
        method: "POST",
        server: "market",
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

    try {
      setOrderLoading(true);
      let data = await fetchData({
        url: "/customer/address/update",
        reqTitle: "Update Address",
        body: JSON.stringify(body),
        method: "POST",
        server: "market",
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
      let data = await fetchData({
        url: `/customer/address/delete?address_id=${address}`,
        reqTitle: "Delete Address",
        body: "",
        method: "POST",
        server: "market",
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
      let response = await fetchData({
        url: "/api/addresses/get-provinces-by-iso",
        reqTitle: "Get Provinces",
        method: "GET",
        server: "elastic",
      });

      setProvinces(response.data);
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
    }
  }
  async getOrderDetails(id, signal?: AbortSignal) {
    let response = await fetchData({
      url: `/customer/order/getOrdersByOrderGroupID?order_group_id=${id}`,
      reqTitle: "getOrderByOrderGroupID request",
      method: "GET",
      server: "market",
      signal,
    });

    return response.data;
  }
  async CancelOrder({ order_id }) {
    try {
      console.log({ order_id });
      let response = await fetchData({
        url: `/customer/order/cancel`,
        reqTitle: "Cancel Order",
        method: "POST",
        server: "market",
        // body: JSON.stringify({ order_id }),
      });
      if (response.success || response.isSuccessful) return response;
    } catch (error) {
      console.log(error);
    }
  }
  async CancelOrderItem({ order_id, item_id, qty }) {
    try {
      console.log({ order_id, item_id, qty });
      let response = await fetchData({
        url: `/customer/order/cancel-item`,
        reqTitle: "Cancel Order Item",
        method: "POST",
        server: "market",
        // body: JSON.stringify({ order_id, detail_id: item_id, qty }),
      });
      if (response.success || response.isSuccessful) return response;
    } catch (error) {
      console.log(error);
    }
  }
}
export default new OrderService();

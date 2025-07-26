import { useAppStore } from "store";
import { PlaceOrderApi } from "models/API/market/PlaceOrder";
import { GetAddressListApi } from "models/API/market/GetAddresses";
import { GetWalletApi } from "models/API/market/GetWallet";
import { GetCartOreview } from "utils/functions";
import { getCurrency } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import auth from "./auth";
import { REQUESTS_DATA } from "utils/Requests";

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
        reqTitle: REQUESTS_DATA.PAY_ORDER,
        body: "",
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
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
        reqTitle: REQUESTS_DATA.GET_WALLET,
        method: "GET",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      setWalletUser({
        ...response.data,
        wallet_balance: response.data.wallet_balance || 0,
      });
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
      console.error(error);
    }
  }
  async GetAddressList() {
    const { setOrderLoading, setAddressList } = useAppStore.getState();
    this.GetProvinces();
    try {
      setOrderLoading(true);
      let response: { data: GetAddressListApi } = await fetchData({
        url: "/customer/address/list",
        reqTitle: REQUESTS_DATA.GET_ADDRESS_LIST,
        method: "GET",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      setAddressList(response.data);
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
      console.error(error);
    }
  }
  async SetDefault({ id }) {
    const { setOrderLoading } = useAppStore.getState();

    let details = {
      address_id: id,
    };

    try {
      setOrderLoading(true);
      const response = await fetchData({
        url: "/customer/address/set-default",
        reqTitle: REQUESTS_DATA.SET_DEFAULT_ADDRESS,
        body: JSON.stringify(details),
        method: "POST",
        server: "market",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
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
      city: address.region_details?.city ?? "Not Entered",
      province: address.region_details?.province ?? "Not Entered",
      town: address.region_details?.town ?? "Not Entered",
      street: address.region_details?.street ?? "Not Entered",
      building: address.region_details?.building ?? "Not Entered",
      zip: "123123",
      contact_person_name: address.contact_info?.contact_person_name,
      phone: address.contact_info?.phone,
      alternative_phone: address.contact_info?.alternative_phone,
    };

    try {
      setOrderLoading(true);
      const response = await fetchData({
        url: "/customer/address/add",
        reqTitle: REQUESTS_DATA.ADD_ADDRESS,
        body: JSON.stringify(body),
        method: "POST",
        server: "market",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      await this.GetAddressList();
      await GetCartOreview();
      callback();

      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
      console.error(error);
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
      city: address.region_details?.city ?? "Not Entered",
      province: address.region_details?.province ?? "Not Entered",
      town: address.region_details?.town ?? "Not Entered",
      street: address.region_details?.street ?? "Not Entered",
      building: address.region_details?.building ?? "Not Entered",
      zip: "123123",
      contact_person_name: address.contact_info?.contact_person_name,
      phone: address.contact_info?.phone,
      alternative_phone: address.contact_info?.alternative_phone,
    };

    try {
      setOrderLoading(true);
      let data = await fetchData({
        url: "/customer/address/update",
        reqTitle: REQUESTS_DATA.UPDATE_ADDRESS,
        body: JSON.stringify(body),
        method: "POST",
        server: "market",
      });
      callback();
      if (!data.success) {
        throw new Error(data.message);
      }
      setOrderLoading(false);
    } catch (error) {
      console.error(error);
      setOrderLoading(false);
    }
  }
  async DeleteAddressList({ address }) {
    const { setOrderLoading } = useAppStore.getState();

    try {
      setOrderLoading(true);
      let data = await fetchData({
        url: `/customer/address/delete?address_id=${address}`,
        reqTitle: REQUESTS_DATA.DELETE_ADDRESS,
        body: "",
        method: "POST",
        server: "market",
      });
      if (!data.success) {
        throw new Error(data.message);
      }
      setOrderLoading(false);
    } catch (error) {
      setOrderLoading(false);
      console.error(error);
    }
  }
  async GetProvinces() {
    const { setOrderLoading, setProvinces } = useAppStore.getState();
    try {
      setOrderLoading(true);
      let response = await fetchData({
        url: "/api/addresses/get-provinces-by-iso",
        reqTitle: REQUESTS_DATA.GET_PROVINCES,
        method: "GET",
        server: "elastic",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setProvinces(response.data);
      setOrderLoading(false);
    } catch (error) {
      console.error(error);
      setOrderLoading(false);
    }
  }
  async getOrderDetails(id, signal?: AbortSignal) {
    try {
      let response = await fetchData({
        url: `/customer/order/getOrdersByOrderGroupID?order_group_id=${id}`,
        reqTitle: REQUESTS_DATA.GETORDERBYORDERGROUPID_REQUEST,
        method: "GET",
        server: "market",
        signal,
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  async CancelOrder({ order_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/cancel`,
        reqTitle: REQUESTS_DATA.CANCEL_ORDER,
        method: "POST",
        server: "market",
        body: JSON.stringify({ order_id }),
      });
      if (response.success || response.isSuccessful) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async CancelOrderItem({ order_id, qty, item_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/cancel-item`,
        reqTitle: REQUESTS_DATA.CANCEL_ORDER_ITEM,
        method: "POST",
        server: "market",
        body: JSON.stringify({ order_id, detail_id: item_id, qty }),
      });
      if (response.success || response.isSuccessful) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async changeOrderAddress({ order_id, address_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/change-address`,
        reqTitle: REQUESTS_DATA.CHANGE_ORDER_ADDRESS,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          order_group_id: order_id,
          new_shipping_address_id: address_id,
        }),
      });
      if (response.success || response.isSuccessful) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async changeOrderItemVariant({ color, choice_1, order_detail_id, image }) {
    try {
      let response = await fetchData({
        url: `/customer/order/change-item-variant`,
        reqTitle: REQUESTS_DATA.CHANGE_ORDER_VARIANT,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          color,
          choice_1: choice_1 ?? "",
          order_detail_id,
          image,
        }),
      });
      if (response.success || response.isSuccessful) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async RateOrderWithhComment({
    star_rating,
    comment,
    order_detail_id,
    productId,
    id = null,
  }) {
    try {
      if (id) {
        let res = await fetchData({
          url: `/customer/product_comment/order/update`,
          server: "market",
          method: "POST",
          body: JSON.stringify({
            customer_id: auth.UserID(),
            order_details_id: order_detail_id,
            comment: comment,
            star_rating: star_rating,
            product_id: productId,
            id: id,
          }),
          reqTitle: REQUESTS_DATA.UPDATE_ORDER_RATE,
        });
        if (!res.success) {
          throw new Error(res?.message);
        }
      } else {
        let res = await fetchData({
          url: `/customer/product_comment/order`,
          server: "market",
          method: "POST",
          body: JSON.stringify({
            customer_id: auth.UserID(),
            order_details_id: order_detail_id,
            comment: comment,
            star_rating: star_rating,
            product_id: productId,
          }),
          reqTitle: REQUESTS_DATA.RATE_ORDER_DETAILS,
        });
        if (!res.success) {
          throw new Error(res?.message);
        }
      }
    } catch (e) {
      throw new Error(e?.message);
    }
  }
}
export default new OrderService();

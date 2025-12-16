import { useAppStore } from "store";
import { PlaceOrderApi } from "models/API/market/PlaceOrder";
import { GetAddressListApi } from "models/API/market/GetAddresses";
import { GetWalletApi } from "models/API/market/GetWallet";
import { GetCartOreview, translateFunction } from "utils/functions";
import { getCurrency } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import auth from "./auth";
import { REQUESTS_DATA } from "utils/Requests";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { showErrorNotification } from "store/notifications/reducer";

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
      return response.data;
    } catch (error) {
      setOrderLoading(false);
      console.error(error);
    }
  }
  async GetWalletTransactions(limit: number = 10, offset: number = 1) {
    try {
      let response: { data: GetWalletApi } = await fetchData({
        url: `/customer/wallet/list?limit=${limit}&offset=${offset}`,
        reqTitle: REQUESTS_DATA.GET_WALLET,
        method: "GET",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
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

      callback(response?.data?.id);

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
      contact_person_name:
        address.contact_info?.contact_person_name ?? address.contact_info?.name,
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
    variant,
    seller_id = null,
    owner_id,
    owner_type,
    images = [],
  }) {
    try {
      let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
      // if (userData.need_auth) {
      //   showErrorNotification(
      //     translateFunction("Please Verify Your Phone Number")
      //   );
      //   return null;
      // }
      let res;
      if (id) {
        res = await fetchData({
          url: `/public_comment/comments/${id}/update`,
          method: "PUT",
          body: JSON.stringify({
            text: comment,
            rating: star_rating,
            owner_id: String(owner_id),
            owner_type: owner_type,
            comments_images_customer: images,
          }),
          reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
          server: "comments",
        });
      } else {
        res = await fetchData({
          url: "/public_comment/comments/create",
          method: "POST",
          body: JSON.stringify({
            text: comment,
            //   @ts-ignore
            product_id: String(productId),
            user_id: String(auth.UserID()),
            user_name: auth.User()?.name,
            user_avatar: auth.User().image,
            user_type: "customer",
            rating: star_rating,
            owner_id: String(owner_id),
            owner_type: owner_type,
            variant,
            order_details_id: String(order_detail_id),
            phone: auth?.User()?.phone,
            comments_images_customer: images,
          }),
          reqTitle: REQUESTS_DATA.ADD_COMMENT_FOR_PRODUCT,
          server: "comments",
        });
      }
      if (!res.success) {
        throw new Error(res?.message);
      }
    } catch (e) {
      console.log(e);
      throw new Error(e?.message);
    }
  }
  async getReturnReasons() {
    try {
      console.log(REQUESTS_DATA.RETURN_REASONS);
      let response = await fetchData({
        url: `/customer/order/return_requests/reasons`,
        reqTitle: REQUESTS_DATA.RETURN_REASONS,
        method: "GET",
        server: "market",
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
  async CreateReturnRequest({ order_id }) {
    try {
      let resp = await fetchData({
        url: `/customer/order/return_requests/store?order_id=${order_id}&is_for_exchange=0&is_draft=1`,
        reqTitle: REQUESTS_DATA.CREAT_RETURN_REQ,
        method: "GET",
        server: "market",
      });
      return resp?.data?.return_request_id;
    } catch (error) {}
  }
  async UploadImageForOrderReturn({ image }) {
    let formData = new FormData();
    formData.append("image", image);
    formData.append("path", "return_request_products/");

    try {
      let response = await fetchData({
        url: "/storage/storage-upload",
        body: formData,
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE_IMAGE,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response?.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  async UploadImageForRating({ image }) {
    let formData = new FormData();
    formData.append("image", image);
    formData.append("path", "rating_orders/");

    try {
      let response = await fetchData({
        url: "/storage/storage-upload",
        body: formData,
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE_IMAGE,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response?.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  async UpdateReturnedProduct({ reason_id, quantity, images, id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/return_request_products/update`,
        reqTitle: REQUESTS_DATA.RETURN_PRODUCT,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          id,
          quantity,
          images,
          return_request_reason_id: reason_id?.id,
        }),
      });
      if (response.success || response.isSuccessful) {
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {}
  }
  async ReturnProduct({
    product_id,
    order_detail_id,
    reason_id,
    quantity,
    images,
    order_id,
    return_request_id,
  }) {
    let return_req = return_request_id;
    if (!return_request_id) {
      return_req = await this.CreateReturnRequest({ order_id: order_id });
    }

    try {
      let response = await fetchData({
        url: `/customer/order/return_request_products/store`,
        reqTitle: REQUESTS_DATA.RETURN_PRODUCT,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          product_id,
          order_detail_id,
          quantity,
          return_request_id: return_req,
          images,
          return_request_reason_id: reason_id?.id,
          is_for_exchange: 0,
          details: "",
        }),
      });
      if (response.success || response.isSuccessful) {
        return return_req;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {}
  }
  async CancelReturn({ return_request_product_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/return_request_products/cancel?return_request_product_id=${return_request_product_id}`,
        reqTitle: REQUESTS_DATA.CANCEL_RETURN_PRODUCT,
        method: "GET",
        server: "market",
      });
      if (response.success || response.isSuccessful) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {}
  }
  async getReturnRequestDetails({ order_id = null, return_request_id = null }) {
    try {
      let req;
      if (!return_request_id) {
        req = await this.CreateReturnRequest({ order_id: order_id });
      } else {
        req = return_request_id;
      }
      let response = await fetchData({
        url: `/customer/order/return_requests/order_details?return_request_id=${req}`,
        reqTitle: REQUESTS_DATA.DETAILS_RETURN_PRODUCT,
        method: "GET",
        server: "market",
      });
      if (response?.success) return response.data;
      else throw new Error();
    } catch (error) {
      throw error;
    }
  }
  async ConfirmReturnRequest({ return_request_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/return_requests/confirm_return_request`,
        reqTitle: REQUESTS_DATA.CONFIRM_RETURN_PRODUCT,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          return_request_ids: return_request_id,
        }),
      });
      if (response?.success) return response.data;
      else throw new Error();
    } catch (error) {
      throw error;
    }
  }
  async ViewReturnRequest({ return_request_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/return_requests/view?return_request_id=${return_request_id}`,
        reqTitle: REQUESTS_DATA.VIEW_RETURN_PRODUCT,
        method: "GET",
        server: "market",
      });
      if (response?.success) return response.data;
      else throw new Error();
    } catch (error) {
      throw error;
    }
  }
  async CancelReturnRequest({ return_request_id }) {
    try {
      let response = await fetchData({
        url: `/customer/order/return_requests/bulk_cancel`,
        reqTitle: REQUESTS_DATA.CANCEL_RETURN_REQ,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          return_request_ids: return_request_id,
        }),
      });
      if (response?.success) return response.data;
      else throw new Error();
    } catch (error) {
      throw error;
    }
  }
  async removeImage({ return_request_product_id, img }) {
    let res = await fetchData({
      url: `/customer/order/return_request_products/remove_image?return_request_product_id=${return_request_product_id}&image=${img}`,
      server: "market",
      method: "GET",
      reqTitle: REQUESTS_DATA.REMOVE_IMAGE,
    });
    if (!res.success) {
      throw new Error(res?.message);
    }
  }
  async GetReturnDetailsForOrderGroup({ order_group_id }) {
    let resp = await fetchData({
      url: `/customer/order/return_requests/order_details_by_group?order_group_id=${order_group_id}`,
      server: "market",
      method: "GET",
      reqTitle: REQUESTS_DATA.DETAILS_RETURN_PRODUCT,
      noMessage: true,
    });
    let arr = resp.data.return_requests_data?.map((s) => ({
      details: s,
      id: s.return_request_id,
    }));
    return arr;
  }
}
export default new OrderService();

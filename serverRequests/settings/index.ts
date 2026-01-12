"use server";
import { GetStarttingSetting } from "serverRequests";
import { HandleAuthedFetch } from "serverRequests/HandleAuthedFetch";

export async function GetOrders({
  page = 1,
  pageSize = 10,
  selectedStatus = null,
}) {
  try {
    let res = await HandleAuthedFetch({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        `/customer/order/list?offset=${page}&limit=${pageSize}${
          selectedStatus ? `&order_group_status=${selectedStatus}` : ""
        }`,
    });
    return res?.data;
  } catch (error) {
    return null;
  }
}

export async function getWallet({ language, country, offset = 1, limit = 10 }) {
  try {
    let res = await HandleAuthedFetch({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        `/customer/wallet/list?limit=${limit}&offset=${offset}`,
      method: "GET",
      headers: {
        country,
        language,
        lang: language,
      },
    });

    return res?.data?.data;
  } catch (error) {
    console.log(error);
  }
}

export async function getOrderStatues({ language, country }) {
  try {
    let res = await GetStarttingSetting({ language, country });
    return res?.order_group_statuses ?? [];
  } catch (error) {}
}

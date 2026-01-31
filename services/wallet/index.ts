import { fetchData } from "utils/fetchData";
import { LogError } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import { Currencies } from "utils/types/wallet";

class AuthService {
  async checkWallet({ id }) {
    let res = null;
    // let res = await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      res = await fetchData({
        method: "GET",
        url: `/wallets/myAcounts?currencySymbol=SAR`,
        server: "wallet",
        reqTitle: REQUESTS_DATA.CHECK_USER_WALLET,
        noMessage: true,
      });
    } catch (error) {
      res = null;
    }

    if (!res || res?.length === 0 || !res.success) this.createWallet({ id });
  }
  async createWallet({ id }) {
    try {
      let response = await fetchData({
        method: "POST",
        url: "/wallets?subtype=MAIN",
        server: "wallet",
        body: JSON.stringify({
          userId: id,
          subtype: "MAIN",
          name: "Primary Funding Wallet",
        }),
        reqTitle: REQUESTS_DATA.CREATE_WALLET,
        noMessage: true,
      });
    } catch (error) {
      LogError({
        error,
        scenario: "creating wallet for user",
        user_id: id,
      });
    }
  }
  async getCurrencies({ language }) {
    try {
      let response = await fetchData({
        method: "GET",
        url: "/currencies",
        server: "wallet",
        reqTitle: REQUESTS_DATA.GET_CURRENCIES,
        noMessage: true,
      });
      let currencies: Currencies = response.data;
    } catch (error) {
      LogError({
        error,
        scenario: "get currencies",
      });
    }
  }
}

export default new AuthService();

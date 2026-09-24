// @vitest-environment node
//
// services/wallet/index.ts — the Server Actions that talk to the wallet backend.
// Only the functions that have a caller are tested here: checkWallet (sign-in),
// createWallet (behind it), and GetWalletBalanceForCountryCurrency (checkout,
// through getCurrencies and GetWalletBalanceInCurrency). The bank-deposit
// actions have no caller yet — see the dead-code list for this ticket.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let walletToken: any = "wallet-token";
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: async () => walletToken,
}));

const getCurrency = vi.fn();
vi.mock("serverRequests", () => ({
  getCurrency: (c: any, l: any) => getCurrency(c, l),
}));

const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (e: any) => LogServerError(e),
}));

import {
  checkWallet,
  createWallet,
  fetchServerData,
  GetWalletBalanceForCountryCurrency,
} from "services/wallet";

const WALLET = "https://wallet.example.com";

/** A fetch answer with the given status and JSON body. */
const reply = (status: number, body: any = {}) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }) as any;

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("WALLET_BACKEND_URL", WALLET);
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  LogServerError.mockClear();
  getCurrency.mockReset();
  walletToken = "wallet-token";
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchServerData (wallet)", () => {
  it("sends JSON with the language header and no caching", async () => {
    fetchSpy.mockResolvedValue(reply(200, { data: { id: 1 } }));
    const out = await fetchServerData({ url: `${WALLET}/x`, local: "sy-ar" });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers, "the request headers are wrong").toEqual({
      "Accept-Language": "sy-ar",
      "Content-Type": "application/json",
    });
    expect(init.cache, "wallet data was allowed into the cache").toBe("no-store");
    expect(out, "the wallet answer was not unwrapped").toEqual({
      success: true,
      data: { id: 1 },
      error: null,
      status: 200,
    });
  });

  it("drops the content type for a multipart upload and for a FormData body", async () => {
    fetchSpy.mockResolvedValue(reply(200, { ok: true }));
    await fetchServerData({
      url: `${WALLET}/x`,
      method: "POST",
      headers: { ContentType: "MULTIPART", "Content-Type": "x" },
    });
    await fetchServerData({ url: `${WALLET}/x`, method: "POST", body: new FormData() });
    expect(fetchSpy.mock.calls[0][1].headers, "the multipart flag or content type was sent").toEqual({
      "Accept-Language": "en-gb",
    });
    expect(fetchSpy.mock.calls[1][1].headers["Content-Type"], "a FormData body got a JSON type").toBeUndefined();
  });

  it("returns an empty success for 204", async () => {
    fetchSpy.mockResolvedValue(reply(204));
    expect(await fetchServerData({ url: `${WALLET}/x` }), "204 was not an empty success").toEqual({
      error: null,
      success: true,
      data: null,
      status: 204,
    });
  });

  it("keeps the wallet backend's error text on a refusal", async () => {
    fetchSpy
      .mockResolvedValueOnce(reply(400, { message: "bad amount" }))
      .mockResolvedValueOnce(reply(500, { error: "db down" }))
      .mockResolvedValueOnce(reply(500, {}));
    const a = await fetchServerData({ url: `${WALLET}/x` });
    const b = await fetchServerData({ url: `${WALLET}/x` });
    const c = await fetchServerData({ url: `${WALLET}/x` });
    expect([a.error, b.error, c.error], "the wallet refusal texts are wrong").toEqual([
      "bad amount",
      "db down",
      "Unknown Error",
    ]);
    expect(a.data, "a body with no data field was not handed back whole").toEqual({ message: "bad amount" });
  });

  it("reports a network failure and answers 500", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("ECONNREFUSED")).mockRejectedValueOnce({});
    const a = await fetchServerData({ url: `${WALLET}/x` });
    const b = await fetchServerData({ url: `${WALLET}/x` });
    expect(a, "a network failure was not turned into a 500").toEqual({
      success: false,
      data: null,
      error: "ECONNREFUSED",
      status: 500,
    });
    expect(b.error, "a failure with no message has no default text").toBe("Network Request Failed");
    expect(LogServerError.mock.calls[0]?.[0]?.scenario, "the wallet network failure was not reported").toBe(
      "wallet fetch failed",
    );
  });
});

describe("checkWallet", () => {
  it("does nothing more when the shopper already has a wallet", async () => {
    fetchSpy.mockResolvedValue(reply(200, { data: [{ id: "w1" }] }));
    expect(await checkWallet({ id: "u1" }), "an existing wallet returned something").toBeUndefined();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url, "the wallet list was not asked for").toBe(`${WALLET}/wallets/myAcounts`);
    expect(init.headers.Authorization, "the wallet token was not sent").toBe("Bearer wallet-token");
    expect(fetchSpy.mock.calls.length, "a wallet was created although one exists").toBe(1);
  });

  it("hands back the 401 sentinel and creates nothing when the wallet token is refused", async () => {
    fetchSpy.mockResolvedValueOnce(reply(401, { message: "expired" })).mockResolvedValueOnce(reply(401, {}));
    expect(await checkWallet({ id: "u1" }), "the wallet 401 was not handed back").toEqual({
      error: "expired",
      status: 401,
      success: false,
      data: null,
      unauthenticated: true,
    });
    expect((await checkWallet({ id: "u1" }))?.error, "a bare 401 lost the wallet fetch default text").toBe("Unknown Error");
    expect(fetchSpy.mock.calls.length, "a wallet was created after a 401").toBe(2);
  });

  it("creates the main wallet when the shopper has none", async () => {
    fetchSpy
      .mockResolvedValueOnce(reply(404, { message: "no wallet" }))
      .mockResolvedValueOnce(reply(201, { data: { id: "w9" } }));
    await checkWallet({ id: "u1", local: "sy-ar" });
    const [url, init] = fetchSpy.mock.calls[1];
    expect(url, "the wallet was not created on the main subtype").toBe(`${WALLET}/wallets?subtype=MAIN`);
    expect(JSON.parse(init.body), "the new wallet body is wrong").toEqual({
      userId: "u1",
      subtype: "MAIN",
      name: "Primary Funding Wallet",
    });
    expect(init.headers["Accept-Language"], "the language was not passed on").toBe("sy-ar");
  });
});

describe("createWallet", () => {
  it("returns the wallet backend answer on success and on a 401", async () => {
    fetchSpy.mockResolvedValueOnce(reply(201, { data: { id: "w9" } })).mockResolvedValueOnce(reply(401, {}));
    expect((await createWallet({ id: "u1" })).data, "the new wallet was not returned").toEqual({ id: "w9" });
    expect((await createWallet({ id: "u1" })).status, "a 401 was not handed back").toBe(401);
  });

  it("reports and throws when the wallet backend refuses the creation", async () => {
    fetchSpy.mockResolvedValue(reply(409, { message: "exists" }));
    await expect(createWallet({ id: "u1" }), "a refused creation did not throw").rejects.toThrow("exists");
    expect(LogServerError.mock.calls[0]?.[0], "the refused creation was not reported with the user").toMatchObject({
      error: "exists",
      scenario: "creating wallet for user",
      user_id: "u1",
    });
  });
});

describe("GetWalletBalanceForCountryCurrency", () => {
  const currency = { code: "SYP", symbol: "ل.س", decimal_digits: 0 };
  const currencies = { items: [{ id: "c-usd", symbol: "USD" }, { id: "c-syp", symbol: "SYP" }] };

  it("returns the balance in the country's currency", async () => {
    getCurrency.mockResolvedValue(currency);
    fetchSpy.mockImplementation(async (url: string) =>
      url.includes("/currencies")
        ? reply(200, { data: currencies })
        : reply(200, { data: { available: 250 } }),
    );
    const out = await GetWalletBalanceForCountryCurrency({ country: "sy" });
    expect(out, "the balance block is wrong").toEqual({
      totalAvailable: 250,
      symbol: "ل.س",
      decimal_digits: 0,
    });
    const urls = fetchSpy.mock.calls.map((c) => c[0]);
    expect(urls, "the wallet calls are wrong").toEqual([
      `${WALLET}/currencies?countryCode=SY`,
      `${WALLET}/wallets/my/balances/c-syp?assetType=CURRENCY&accountSubtype=MAIN`,
    ]);
    expect(getCurrency, "the market currency was not asked for").toHaveBeenCalledWith("sy", "en");
  });

  it("throws when the market currency or the wallet currencies are missing", async () => {
    getCurrency.mockResolvedValue(null);
    fetchSpy.mockResolvedValue(reply(200, { data: currencies }));
    await expect(GetWalletBalanceForCountryCurrency({ country: "iq" }), "a missing currency did not throw").rejects.toThrow(
      "Currency not found for country: iq",
    );
    getCurrency.mockResolvedValue(currency);
    fetchSpy.mockResolvedValue(reply(500, { message: "down" }));
    await expect(
      GetWalletBalanceForCountryCurrency({ country: "iq" }),
      "a failed wallet currency list did not throw",
    ).rejects.toThrow("Currency not found for country: iq");
    expect(
      LogServerError.mock.calls.some((c) => c[0].scenario === "Get Currencies from wallet system"),
      "the wallet currency failure was not reported",
    ).toBe(true);
  });

  it("hands back the 401 from the currency list or from the balance", async () => {
    getCurrency.mockResolvedValue(currency);
    fetchSpy.mockResolvedValueOnce(reply(401, {}));
    expect(
      (await GetWalletBalanceForCountryCurrency({ country: "sy" }) as any).unauthenticated,
      "the currency-list 401 was not handed back",
    ).toBe(true);
    fetchSpy.mockImplementation(async (url: string) =>
      url.includes("/currencies") ? reply(200, { data: currencies }) : reply(401, {}),
    );
    expect(
      (await GetWalletBalanceForCountryCurrency({ country: "sy" }) as any).unauthenticated,
      "the balance 401 was not handed back",
    ).toBe(true);
  });

  it("throws when the balance lookup is refused", async () => {
    getCurrency.mockResolvedValue(currency);
    fetchSpy.mockImplementation(async (url: string) =>
      url.includes("/currencies") ? reply(200, { data: currencies }) : reply(500, { message: "ledger down" }),
    );
    await expect(GetWalletBalanceForCountryCurrency({ country: "sy" }), "a refused balance did not throw").rejects.toThrow(
      "ledger down",
    );
    expect(
      LogServerError.mock.calls.find((c) => c[0].scenario === "GetWalletBalance from wallet system")?.[0]?.params,
      "the balance failure was not reported with its query",
    ).toBe("assetType=CURRENCY&accountSubtype=MAIN");
  });
});

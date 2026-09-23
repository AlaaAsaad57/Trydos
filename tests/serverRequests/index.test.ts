// @vitest-environment node
//
// The start-up settings read in the serverRequests barrel (GetStarttingSetting).
// It asks the routed market backend for the page's locale and returns the inner
// settings object, whichever backend's envelope came back. The fetch and the
// market base address are replaced; the envelope reader is the real one.
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({ fetchServerData: vi.fn(), marketBase: vi.fn() }));

vi.mock("serverRequests/ServerFetch", () => ({ fetchServerData: io.fetchServerData }));
vi.mock("serverRequests/products", () => ({ resolveMarketFetchBase: io.marketBase }));
vi.mock("serverRequests/currency", () => ({}));
vi.mock("serverRequests/stories", () => ({}));

import { GetStarttingSetting } from "serverRequests";

beforeEach(() => {
  vi.clearAllMocks();
  io.marketBase.mockResolvedValue("https://market.test");
});

describe("the start-up settings read (GetStarttingSetting)", () => {
  it("asks the routed market backend for the page's locale and returns the settings", async () => {
    io.fetchServerData.mockResolvedValue({ data: { data: { starting_setting: { decimal_points: 2 } } } });

    const settings: any = await GetStarttingSetting({ language: "ar", country: "sy" });

    expect(io.fetchServerData.mock.calls[0][0], "the settings request is wrong").toEqual({
      url: "https://market.test/web/home/startingSettings",
      headers: { lang: "ar", country: "sy" },
      local: "sy-ar",
      method: "GET",
    });
    expect(settings?.decimal_points, "the inner settings object was not returned").toBe(2);
  });
});

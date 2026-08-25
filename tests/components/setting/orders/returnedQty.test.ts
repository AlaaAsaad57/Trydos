import { describe, expect, it } from "vitest";

import { shouldShowReturnedQty } from "@/components/setting/orders/returnedQty";

describe("shouldShowReturnedQty", () => {
  it("shows the returned quantity for an accepted return request", () => {
    expect(
      shouldShowReturnedQty({
        alreadyReturn: true,
        requestStatus: { name: "Accepted", value: "accepted" },
        returnedQty: 2,
      }),
      "an accepted return request must still show the returned quantity",
    ).toBe(true);
  });

  it("hides the returned quantity when the return request is cancelled", () => {
    expect(
      shouldShowReturnedQty({
        alreadyReturn: true,
        requestStatus: { name: "Return Request Canceled", value: "cancelled" },
        returnedQty: 2,
      }),
      "a cancelled return request must not show a returned quantity — nothing is being returned",
    ).toBe(false);
  });

  it("hides the returned quantity while the return request is still a draft", () => {
    expect(
      shouldShowReturnedQty({
        alreadyReturn: true,
        requestStatus: { name: "Draft", value: "draft" },
        returnedQty: 2,
      }),
      "a draft return request is still being composed and must not show a returned quantity",
    ).toBe(false);
  });

  it("hides the returned quantity when the item was never returned", () => {
    expect(
      shouldShowReturnedQty({
        alreadyReturn: false,
        requestStatus: { name: "Accepted", value: "accepted" },
        returnedQty: 2,
      }),
      "an item with no return record must not show a returned quantity",
    ).toBe(false);
  });

  it("hides the returned quantity when the returned amount is zero", () => {
    expect(
      shouldShowReturnedQty({
        alreadyReturn: true,
        requestStatus: { name: "Accepted", value: "accepted" },
        returnedQty: 0,
      }),
      "a returned quantity of zero must not be shown as a label",
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useSellerProfile } from "app/(client)/[lang]/sellerProfile/SellerProfileContext";

describe("useSellerProfile", () => {
  it("throws a clear error when used outside SellerProfileProvider", () => {
    expect(
      () => renderHook(() => useSellerProfile()),
      "the hook should refuse to run without its provider",
    ).toThrow("useSellerProfile must be used within a SellerProfileProvider");
  });
});

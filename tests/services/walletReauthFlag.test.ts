import { describe, expect, it } from "vitest";
import { WALLET_REAUTH_ON_401 } from "services/wallet/reauthFlag";

describe("WALLET_REAUTH_ON_401 reauth flag", () => {
  it("exports boolean kill-switch flag value", () => {
    expect(typeof WALLET_REAUTH_ON_401, "WALLET_REAUTH_ON_401 should be a boolean").toBe("boolean");
  });
});

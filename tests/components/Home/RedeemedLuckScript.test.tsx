import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RedeemedLuckScript from "components/Home/RedeemedLuckScript";
import { REDEEMED_LUCK_SCRIPT } from "utils/luck/redeemedScript";

describe("RedeemedLuckScript", () => {
  it("writes the redeemed-luck script into a raw script tag", () => {
    const { container } = render(<RedeemedLuckScript />);
    const script = container.querySelector("script#redeemed-luck");
    expect(script, "the script tag is missing").not.toBeNull();
    expect(script!.innerHTML, "the script body is not the redeemed-luck script").toBe(REDEEMED_LUCK_SCRIPT);
  });
});

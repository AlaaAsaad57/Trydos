import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabCount } from "components/DemoApp/DemoBottomNav";

/*
  The number on a tab (the cart's 3, the chat's 11) is Quicksand Bold 12 in the
  design file.

  Each Quicksand weight is its own font family in this app (see the [lang]
  layout). The tab bar sits outside the demo root that has `.font-quicksand`, so
  the rules in rdb-auth.css that map `font-bold` to the Bold family do not reach
  it. `font-bold` alone gives weight 700 on the Regular family, and the browser
  then draws the number thin. The number must name the Bold family itself.
*/

const COUNT = {
  text: "11",
  x: 10,
  idle: { baseline: 20, color: "#4A31E7" },
  active: { baseline: 21, color: "#FFFFFF" },
};

describe("Tab count", () => {
  it("names the Bold font family itself, because no wrapper maps font-bold to it", () => {
    render(<TabCount tab="chat" on={false} count={COUNT} size={34} />);
    const numbers = document.querySelectorAll<HTMLElement>(
      '[data-pw="demo-tab-chat-count"]',
    );
    expect(
      numbers.length,
      "the tab count draws no number for the idle and the active state",
    ).toBeGreaterThan(0);
    for (const number of numbers) {
      expect(
        number.style.fontFamily,
        "the tab count is not set in the Bold family, so the browser draws it thin",
      ).toBe("var(--Quicksand-Bold)");
    }
  });
});

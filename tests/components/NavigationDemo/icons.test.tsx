import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabIcon, type TabId } from "components/NavigationDemo/icons";

const IDS: TabId[] = ["home", "search", "live", "cart", "profile"];

describe("TabIcon", () => {
  it.each(IDS)("draws the %s icon as an outline when idle and solid when active", (id) => {
    const idle = render(<TabIcon id={id} filled={false} />).container.querySelector("svg")!;
    const active = render(<TabIcon id={id} filled size={30} />).container.querySelector("svg")!;
    expect(idle.getAttribute("width"), `the idle ${id} icon has the wrong default size`).toBe("25");
    expect(active.getAttribute("width"), `the active ${id} icon ignored its size`).toBe("30");
    expect(
      idle.getAttribute("stroke-width") !== active.getAttribute("stroke-width"),
      `the ${id} icon looks the same idle and active`,
    ).toBe(true);
  });
});

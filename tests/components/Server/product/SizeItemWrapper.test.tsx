// The size buttons on the product page. Tapping one puts ?size= in the address
// without scrolling, and marks it chosen.
import { describe, expect, it } from "vitest";

import SizeItemWrapper from "components/Server/product/SizeItemWrapper";
import { routerSpies } from "tests/mocks/nextNavigation";

import { renderWithProviders, screen, userEvent } from "../../../render";

describe("the size buttons", () => {
  it("marks the chosen size and moves the choice when another is tapped", async () => {
    await renderWithProviders(
      <SizeItemWrapper ActiveSize="m">{[<span key="m">M</span>, <span key="l">L</span>]}</SizeItemWrapper>,
      { path: "/products/shoe", search: "color=red" },
    );
    const box = (t: string) => screen.getByText(t).parentElement as HTMLElement;
    expect(box("M").className, "the size from the address should be marked").toContain("bg-[#F4F4F4]");
    await userEvent.click(screen.getByText("L"));
    expect(routerSpies.push, "the chosen size should go into the address, keeping the colour").toHaveBeenCalledWith(
      "/gb-en/products/shoe?color=red&size=l",
      expect.objectContaining({ scroll: false }),
    );
    expect(box("L").className, "the tapped size should be marked").toContain("bg-[#F4F4F4]");
    expect(box("M").className, "the old size should no longer be marked").toContain("bg-white");
  });
});

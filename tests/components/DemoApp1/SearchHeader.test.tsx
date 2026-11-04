import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchHeader } from "components/DemoApp1/screens/SearchHeader";

const header = (props: Partial<React.ComponentProps<typeof SearchHeader>> = {}) =>
  render(
    <SearchHeader
      placeholder="Search anything…"
      value=""
      onChange={() => {}}
      voice={<span data-pw="voice-slot" />}
      scan={<span data-pw="scan-slot" />}
      chips={["For You"]}
      picked={0}
      {...props}
    />,
  );

describe("SearchHeader (XD Home Page – 1)", () => {
  it("shows the placeholder, and names the field with it", () => {
    header();
    expect(screen.getByLabelText("Search anything…"), "the field is not named by its placeholder").toBeInTheDocument();
  });

  it("hands every typed key to its owner", () => {
    const onChange = vi.fn();
    header({ onChange });
    fireEvent.change(screen.getByLabelText("Search anything…"), { target: { value: "shoes" } });
    expect(onChange, "the typed text did not reach the search").toHaveBeenCalledWith("shoes");
  });

  it("draws the rest of the completion after the typed text", () => {
    header({ value: "sho", ghost: "es" });
    const ghost = document.querySelector('[data-pw="demo-search-ghost"]')!;
    expect(ghost.textContent, "the completion is not the typed text followed by its rest").toBe("shoes");
  });

  it("draws no completion when there is none", () => {
    header({ value: "sho" });
    expect(document.querySelector('[data-pw="demo-search-ghost"]'), "an empty completion still drew a box").toBeNull();
  });

  it("draws what it is given in the voice and scan places", () => {
    header();
    expect(document.querySelector('[data-pw="voice-slot"]'), "the voice place is empty").not.toBeNull();
    expect(document.querySelector('[data-pw="scan-slot"]'), "the scan place is empty").not.toBeNull();
  });

  it("marks the picked chip", () => {
    header({ chips: ["A", "B"], picked: 1 });
    expect(
      screen.getByRole("button", { name: "B" }).getAttribute("aria-pressed"),
      "the picked chip is not marked as pressed",
    ).toBe("true");
  });

  it("tells its owner which chip was tapped", () => {
    const onPick = vi.fn();
    header({ chips: ["A", "B"], onPick });
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onPick, "a tap on the second chip did not report index 1").toHaveBeenCalledWith(1);
  });

  it("places the field and the chips from the start edge, so Arabic mirrors them (A-13)", () => {
    header({ chips: ["A", "B"] });
    const field = screen.getByLabelText("Search anything…").closest("div")!.parentElement as HTMLElement;
    const second = screen.getByRole("button", { name: "B" });
    expect(
      [field.style.marginLeft, field.style.marginInlineStart, second.style.marginLeft, second.style.marginInlineStart],
      "the field and the chips must use start-edge margins, not left margins",
    ).toEqual(["", "12px", "", "12px"]);
  });
});

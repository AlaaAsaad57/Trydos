import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("embla-carousel-react", () => ({ default: () => [() => {}] }));
vi.mock("embla-carousel-autoplay", () => ({ default: () => ({}) }));
vi.mock("embla-carousel-auto-height", () => ({ default: () => ({}) }));

import { BoutiqueSliderWrapper } from "components/Home/OfferWidgets/BoutiqueElement";

describe("BoutiqueSliderWrapper", () => {
  it("shows the boutique name and its description with HTML entities decoded", async () => {
    const { container } = await renderWithProviders(
      <BoutiqueSliderWrapper boutique={{ name: "Mona", description: "Tom &amp;amp; Jerry &hellip; &foo;" }}>
        <span>slide</span>
      </BoutiqueSliderWrapper>,
    );
    expect(screen.getByText("Mona"), "the boutique name is missing").toBeInTheDocument();
    expect(
      container.querySelector('[data-pw="boutique-description"]')!.textContent,
      "a double-encoded entity was not decoded, or an unknown one was changed",
    ).toBe("Tom & Jerry … &foo;");
    expect(
      (container.querySelector('[data-pw="boutique-name"]')!.parentElement as HTMLElement).style.direction,
      "an English caption must run left to right",
    ).toBe("ltr");
  });

  it("runs the caption right to left in Arabic and hides an empty description", async () => {
    const { container } = await renderWithProviders(
      <BoutiqueSliderWrapper boutique={{ name: "Mona" }}>{null}</BoutiqueSliderWrapper>,
      { language: "ar" },
    );
    expect(container.querySelector('[data-pw="boutique-description"]'), "an empty description was drawn").toBeNull();
    expect(
      (container.querySelector('[data-pw="boutique-name"]')!.parentElement as HTMLElement).style.direction,
      "an Arabic caption must run right to left",
    ).toBe("rtl");
  });
});

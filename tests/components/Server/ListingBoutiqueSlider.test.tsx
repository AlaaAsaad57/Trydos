// The boutique header on a boutique's listing page: logo, name and a slider of
// its banners. A boutique without banners gets no header at all.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/clientWrapper/filtersPage/BoutiquePhotoSliderWrapper", () => ({
  default: ({ children }: any) => <div data-pw="slider">{children}</div>,
}));

import ListingBoutiqueSlider from "components/Server/ListingBoutiqueSlider";

import { renderWithProviders } from "../../render";

describe("the boutique header on its listing", () => {
  it("shows the logo, the name and one slide per banner", async () => {
    const element = await ListingBoutiqueSlider({
      boutiquePromise: Promise.resolve({
        name: "Nike",
        icon: "/upload/logo.png",
        banners: [{ file_path: "/upload/a.png" }, { file_path: "/upload/b.png" }],
      }),
    });
    const { container } = await renderWithProviders(element);
    expect(container.querySelector(".boutique-text")?.textContent, "the boutique name is missing").toBe("Nike");
    expect(
      container.querySelectorAll('[data-pw="image_image"]').length,
      "each banner should get its own slide",
    ).toBe(2);
    expect(
      (container.querySelector('[data-pw="banners_length-1"]') as HTMLElement).style.getPropertyValue("--slide-size"),
      "several banners should each take 85% so the next one peeks in",
    ).toBe("85%");
  });

  it("gives a single banner the full width", async () => {
    const element = await ListingBoutiqueSlider({
      boutiquePromise: Promise.resolve({ name: "Nike", banners: [{ file_path: "/upload/a.png" }] }),
    });
    const { container } = await renderWithProviders(element);
    expect(
      (container.querySelector('[data-pw="banners_length-1"]') as HTMLElement).style.getPropertyValue("--slide-size"),
      "one banner should take the full width",
    ).toBe("100%");
  });

  it("draws no header for a boutique without banners", async () => {
    const element = await ListingBoutiqueSlider({ boutiquePromise: Promise.resolve({ name: "Nike" }) });
    const { container } = await renderWithProviders(element);
    expect(container.querySelector('[data-pw="boutique_top_icons"]'), "no banners should mean no header").toBeNull();
  });
});

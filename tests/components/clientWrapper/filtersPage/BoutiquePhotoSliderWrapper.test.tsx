// The carousel around the boutique photos on the listing page.
import { describe, expect, it, vi } from "vitest";

const emblaCalls = vi.hoisted(() => ({
  options: null as any,
  plugins: null as any,
  delay: null as any,
}));

vi.mock("embla-carousel-react", () => ({
  default: (options: any, plugins: any) => {
    emblaCalls.options = options;
    emblaCalls.plugins = plugins;
    return [vi.fn()];
  },
}));
vi.mock("embla-carousel-autoplay", () => ({
  default: (opts: any) => {
    emblaCalls.delay = opts.delay;
    return { name: "autoplay" };
  },
}));

import BoutiquePhotoSliderWrapper from "components/clientWrapper/filtersPage/BoutiquePhotoSliderWrapper";

import { renderWithProviders, screen } from "../../../render";

describe("the boutique photo slider", () => {
  it("shows its photos in a non-looping carousel that moves every 3 seconds", async () => {
    await renderWithProviders(
      <BoutiquePhotoSliderWrapper>
        <span>photo one</span>
      </BoutiquePhotoSliderWrapper>,
    );

    expect(screen.getByText("photo one"), "the slider did not draw the photos it was given").toBeInTheDocument();
    expect(emblaCalls.options, "the boutique carousel must not loop").toEqual({ loop: false });
    expect(emblaCalls.delay, "the boutique carousel must move every 3000 ms").toBe(3000);
    expect(emblaCalls.plugins?.[0]?.name, "the autoplay plugin was not handed to the carousel").toBe("autoplay");
  });
});

// The main photo slider on a product page. It reports the image view and the
// product screen view once on mount, and runs right-to-left in Arabic.
import { describe, expect, it, vi } from "vitest";

import ProductImagesSlider from "components/products/ProductImageSlider";
import { GA_EVENT_NAMES } from "utils/GAEvents";

import { renderWithProviders, screen } from "../../render";

const { embla } = vi.hoisted(() => ({ embla: { options: null as any } }));
vi.mock("embla-carousel-react", () => ({
  default: (options: any) => {
    embla.options = options;
    return [() => {}, undefined];
  },
}));
const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
vi.mock("services/auth", () => ({ default: { UserID: () => 7 } }));

describe("ProductImagesSlider", () => {
  it("reports the image and screen views and shows the slides", async () => {
    await renderWithProviders(
      <ProductImagesSlider language="en" productGA={{ item_id: 1 }}>
        <div>slide</div>
      </ProductImagesSlider>,
    );
    expect(screen.getByText("slide"), "the slides are missing").toBeInTheDocument();
    const actions = GAevent.mock.calls.map(([p]: any) => p.action);
    expect(actions, "the image view was not reported").toContain(GA_EVENT_NAMES.VIEW_IMAGE);
    expect(actions, "the product screen view was not reported").toContain(GA_EVENT_NAMES.SCREEN_VIEW);
    expect(embla.options.direction, "English is not left-to-right").toBe("ltr");
  });

  it("runs right-to-left in Arabic", async () => {
    await renderWithProviders(
      <ProductImagesSlider language="ar" productGA={{}}>
        <div>slide</div>
      </ProductImagesSlider>,
    );
    expect(embla.options.direction, "Arabic is not right-to-left").toBe("rtl");
    expect(screen.getByText("slide").parentElement!.className, "the Arabic row is not flipped").toContain(
      "flex-row-reverse",
    );
  });
});

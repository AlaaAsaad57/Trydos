// The full-screen zoom of a product's photos. It listens for clicks on the main
// slider's slides (.product-slider-images), opens the zoom at that photo, and
// reports views and zooms to analytics. Embla is replaced by a stand-in.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import { GA_EVENT_NAMES } from "utils/GAEvents";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

const { embla } = vi.hoisted(() => {
  const listeners: Record<string, Function> = {};
  return {
    embla: {
      listeners,
      snap: 0,
      api: {
        on: vi.fn((name: string, cb: Function) => {
          listeners[name] = cb;
        }),
        off: vi.fn(),
        scrollTo: vi.fn(),
        selectedScrollSnap: () => embla.snap,
      },
    },
  };
});
vi.mock("embla-carousel-react", () => ({ default: () => [() => {}, embla.api] }));

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
vi.mock("services/auth", () => ({ default: { UserID: () => 7 } }));

const GA = { item_id: 1, item_name: "Shoe" };
const IMAGES = [{ file_path: "/a.jpg" }, { file_path: "/b.jpg" }];
const zooms = () =>
  GAevent.mock.calls.filter(([p]: any) => p.action === GA_EVENT_NAMES.ZOOM_IMAGE);

/** Two slides of the main slider, which the zoom listens to. */
function addMainSlides() {
  return [0, 1].map(() => {
    const el = document.createElement("div");
    el.className = "product-slider-images";
    document.body.appendChild(el);
    return el;
  });
}

describe("ProductDetailsSlider", () => {
  let slides: HTMLElement[] = [];
  beforeEach(() => {
    GAevent.mockReset();
    embla.api.on.mockClear();
    embla.api.off.mockClear();
    embla.api.scrollTo.mockClear();
    embla.snap = 0;
    slides = addMainSlides();
    document.documentElement.style.overflow = "hidden";
  });
  afterEach(() => {
    slides.forEach((s) => s.remove());
    vi.useRealTimers();
  });

  it("frees the page, reports the product view, and reports 20 seconds of engagement", async () => {
    vi.useFakeTimers();
    const { store } = await renderWithProviders(
      <ProductDetailsSlider images={IMAGES} productGA={GA} />,
    );
    expect(document.documentElement.style.overflow, "the page scroll was not freed").toBe("initial");
    expect(store.getState().isNavigating, "the navigation loader was not reset").toBeNull();
    expect(GAevent, "the product view was not reported").toHaveBeenCalledWith(
      expect.objectContaining({ action: GA_EVENT_NAMES.VIEW_PRODUCT_EVENT }),
    );
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(GAevent, "20 seconds of engagement were not reported").toHaveBeenCalledWith(
      expect.objectContaining({
        action: GA_EVENT_NAMES.VIEW_ITEM_PRODUCT,
        params: expect.objectContaining({ engagement_time: 20 }),
      }),
    );
  });

  it("opens the zoom at the clicked photo, follows the swipe, and closes", async () => {
    await renderWithProviders(<ProductDetailsSlider images={IMAGES} productGA={GA} />);
    fireEvent.click(slides[1]);
    expect(zooms()[0]?.[0].params.image_index, "the zoom of photo 2 was not reported").toBe(1);
    expect(document.documentElement.style.overflow, "the zoom did not lock the page").toBe("hidden");
    expect(embla.api.scrollTo, "the zoom did not open at photo 2").toHaveBeenCalledWith(1);
    expect(screen.getAllByAltText("Shoe").length === 2, "the zoom does not show the photos").toBe(true);

    embla.snap = 0;
    act(() => embla.listeners.select());
    act(() => embla.listeners.settle());
    expect(zooms().at(-1)?.[0].params.image_index, "the swipe to photo 1 was not reported").toBe(0);

    fireEvent.click(screen.getAllByAltText("Shoe")[0].parentElement as HTMLElement);
    expect(embla.api.scrollTo, "clicking a zoomed photo did not select it").toHaveBeenCalledWith(0);

    fireEvent.click(document.querySelector('[data-pw="close_stories_icon"]') as HTMLElement);
    expect(screen.queryAllByAltText("Shoe").length === 0, "the zoom did not close").toBe(true);
    expect(document.documentElement.style.overflow, "closing did not free the page").toBe("initial");
    expect(embla.api.off, "the swipe listeners were not removed").toHaveBeenCalledWith(
      "select",
      expect.any(Function),
    );
  });

  it("does not listen for clicks or report engagement without product analytics", async () => {
    vi.useFakeTimers();
    await renderWithProviders(<ProductDetailsSlider images={IMAGES} />);
    fireEvent.click(slides[0]);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(zooms().length === 0, "a zoom was reported without product analytics").toBe(true);
    expect(
      GAevent.mock.calls.some(([p]: any) => p.action === GA_EVENT_NAMES.VIEW_ITEM_PRODUCT),
      "engagement was reported without product analytics",
    ).toBe(false);
  });

  it("leaves the loader and the scroll alone when told not to reset", async () => {
    const { store, unmount } = await renderWithProviders(
      <ProductDetailsSlider images={IMAGES} productGA={GA} resetLoader={false} />,
    );
    expect(store.getState().isNavigating, "the loader was reset").toBe(true);
    expect(document.documentElement.style.overflow, "the scroll was changed").toBe("hidden");
    fireEvent.click(slides[0]);
    expect(zooms().length === 0, "a click was listened to without reset").toBe(true);
    unmount();
  });
});

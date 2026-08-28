import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Details store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      product: {},
      details_loading: false,
      sharesCount: null,
      selected_product_for_add_to_cart: null,
      shareLoading: false,
    });
  });

  it("storeProduct stores product and initializes activeColor from sync_color_images", () => {
    const rawProduct = {
      id: 50,
      name: "T-Shirt",
      sync_color_images: [
        { color_name: "Red", image: "red.jpg" },
        { color_name: "Blue", image: "blue.jpg" },
      ],
    };

    useAppStore.getState().storeProduct(rawProduct);

    const stored = useAppStore.getState().product;
    expect(stored.id, "product ID should be stored").toBe(50);
    expect(stored.activeColor, "default activeColor should be first element in sync_color_images").toEqual({
      color_name: "Red",
      image: "red.jpg",
    });
  });

  it("setActiveColorDetails updates activeColor in product state", () => {
    useAppStore.setState({
      product: {
        id: 50,
        activeColor: { color_name: "Red" },
      },
    });

    const newColor = { color_name: "Blue", image: "blue.jpg" };
    useAppStore.getState().setActiveColorDetails(newColor);

    expect(useAppStore.getState().product.activeColor, "activeColor should be updated to Blue").toEqual(newColor);
  });

  it("setShareLoading updates shareLoading flag", () => {
    useAppStore.getState().setShareLoading(true);
    expect(useAppStore.getState().shareLoading, "shareLoading should be true").toBe(true);
  });

  it("setSharesCount updates total shares count", () => {
    useAppStore.getState().setSharesCount(42);
    expect(useAppStore.getState().sharesCount, "sharesCount should be 42").toBe(42);
  });
});

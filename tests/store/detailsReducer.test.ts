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

describe("Details store — the setters the product page and cart use", () => {
  it.each([
    ["setIsModalOpen", "isModalOpen", true],
    ["setSelectedContactsForShare", "selectedContactsForShare", [{ id: 1 }]],
    ["setBuyerCommentModalOption", "BuyerCommentModalOption", { open: true }],
    ["setShouldUpdateComment", "shouldUpdateComment", 3],
    ["setShouldUpdateCommentsCount", "shouldUpdateCommentsCount", true],
    ["setColorBottomSheet", "ColorBottomSheet", { id: 9 }],
  ])("%s writes %s", (action, field, value) => {
    (useAppStore.getState() as any)[action](value);
    expect((useAppStore.getState() as any)[field], `${action} did not write ${field}`).toEqual(value);
  });

  it("setSelectedProductForCart keeps a product with no colour pictures as it is", () => {
    const product = { id: 1, sync_color_images: [] };
    useAppStore.getState().setSelectedProductForCart(product);
    expect(
      useAppStore.getState().selected_product_for_add_to_cart,
      "a product with no colour pictures was changed",
    ).toBe(product);
  });

  it("setSelectedProductForCart fills the colour option from the name when it is missing", () => {
    useAppStore.getState().setSelectedProductForCart({
      id: 1,
      sync_color_images: [
        { color_name: "Red" },
        { color_name: "Blue", color_option: "#00f" },
      ],
      colors: [{ name: "Red" }, { name: "Blue", option: "#00f" }],
    });
    const stored = useAppStore.getState().selected_product_for_add_to_cart as any;
    expect(
      stored.sync_color_images.map((s: any) => s.color_option),
      "the colour-picture options were not filled from the name",
    ).toEqual(["Red", "#00f"]);
    expect(
      stored.colors.map((c: any) => [c.color_option, c.option]),
      "the colour options were not filled from the name",
    ).toEqual([
      ["Red", "Red"],
      ["#00f", "#00f"],
    ]);
  });

  it("setSelectedProductForCart copes with colour pictures but no colour list", () => {
    useAppStore.getState().setSelectedProductForCart({
      id: 1,
      sync_color_images: [{ color_name: "Red" }],
    });
    expect(
      (useAppStore.getState().selected_product_for_add_to_cart as any).colors,
      "a missing colour list was invented",
    ).toBeUndefined();
  });
});

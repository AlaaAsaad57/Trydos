import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Cart store reducer actions", () => {
  beforeEach(() => {
    // Reset store cart state
    useAppStore.setState({
      localCart: [],
      cart: [],
      orderLoading: false,
      coupon_discount: null,
      total_cash: null,
      addressLists: [],
      addressDetails: {
        id: null,
        location: { latitude: null, longitude: null },
        user_name: null,
        Country: { name: "Syria", code: "sy" },
        address_detail: "",
        address: "",
        contact_info: { contact_person_name: "", phone: "", alternative_phone: "" },
        region: "",
        region_details: { city: "", province: "", town: "", street: "", building: "" },
      },
    });
  });

  it("addProductToCart appends new item to localCart state", () => {
    const item = {
      id: 101,
      item_id: "cart-1",
      product_variation_id: 5,
      color: "Red",
      size: "M",
      image: "red.jpg",
      quantity: 1,
      offer_price: 50,
    };

    useAppStore.getState().addProductToCart(item);

    const cart = useAppStore.getState().localCart;
    expect(cart, "localCart should contain added item").toHaveLength(1);
    expect(cart[0].id, "item ID should match").toBe(101);
    expect(cart[0].item_id, "cart item ID should match").toBe("cart-1");
  });

  it("updateProductQuantityInCart updates the target item quantity", () => {
    useAppStore.setState({
      localCart: [
        { id: 101, item_id: "cart-1", quantity: 1 },
        { id: 102, item_id: "cart-2", quantity: 2 },
      ],
    });

    useAppStore.getState().updateProductQuantityInCart({ id: "cart-1", qty: 5 });

    const cart = useAppStore.getState().localCart;
    expect(cart.find((i) => i.item_id === "cart-1")?.quantity, "item-1 quantity should be updated to 5").toBe(5);
    expect(cart.find((i) => i.item_id === "cart-2")?.quantity, "item-2 quantity should remain unchanged").toBe(2);
  });

  it("setAddressList updates addressLists and sets orderLoading false", () => {
    useAppStore.setState({ orderLoading: true });
    const mockAddresses = [
      { id: 1, address: "Home" },
      { id: 2, address: "Office" },
    ];

    useAppStore.getState().setAddressList(mockAddresses);

    expect(useAppStore.getState().addressLists, "addressLists should equal set list").toEqual(mockAddresses);
    expect(useAppStore.getState().orderLoading, "orderLoading should be false").toBe(false);
  });

  it("deleteAddress removes target address by id", () => {
    useAppStore.setState({
      addressLists: [
        { id: 1, address: "Home" },
        { id: 2, address: "Office" },
      ] as any,
    });

    useAppStore.getState().deleteAddress(1);

    expect(useAppStore.getState().addressLists, "address with id 1 should be removed").toEqual([
      { id: 2, address: "Office" },
    ]);
  });

  it("setDefaultAddress updates is_default flag correctly across address list", () => {
    useAppStore.setState({
      addressLists: [
        { id: 1, is_default: 1 },
        { id: 2, is_default: 0 },
      ] as any,
    });

    useAppStore.getState().setDefaultAddress(2);

    const addresses = useAppStore.getState().addressLists;
    expect(addresses.find((a: any) => a.id === 2)?.is_default, "id 2 should be default 1").toBe(1);
    expect(addresses.find((a: any) => a.id === 1)?.is_default, "id 1 should be default 0").toBe(0);
  });
});

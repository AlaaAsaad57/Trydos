import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
// Import order matters here, and it is not decoration. `store/Cart/reducer`
// pulls in utils/tinyUtils, which pulls in store/index.ts, which builds the
// combined store out of every slice. Loading the slice first walks into that
// circle half-built: the slice is still undefined when store/index.ts spreads
// it, and the file dies with "TypeError: default is not a function". Loading
// `store` first builds the store once, and the slice import
// then resolves against a finished module. Do not swap these two lines.
import { useAppStore } from "store";
import useCartStore from "store/Cart/reducer";

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
        contact_info: {
          contact_person_name: "",
          phone: "",
          alternative_phone: "",
        },
        region: "",
        region_details: {
          city: "",
          province: "",
          town: "",
          street: "",
          building: "",
        },
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

    useAppStore
      .getState()
      .updateProductQuantityInCart({ id: "cart-1", qty: 5 });

    const cart = useAppStore.getState().localCart;
    expect(
      cart.find((i) => i.item_id === "cart-1")?.quantity,
      "item-1 quantity should be updated to 5",
    ).toBe(5);
    expect(
      cart.find((i) => i.item_id === "cart-2")?.quantity,
      "item-2 quantity should remain unchanged",
    ).toBe(2);
  });

  it("setAddressList updates addressLists and sets orderLoading false", () => {
    useAppStore.setState({ orderLoading: true });
    const mockAddresses = [
      { id: 1, address: "Home" },
      { id: 2, address: "Office" },
    ];

    useAppStore.getState().setAddressList(mockAddresses);

    expect(
      useAppStore.getState().addressLists,
      "addressLists should equal set list",
    ).toEqual(mockAddresses);
    expect(
      useAppStore.getState().orderLoading,
      "orderLoading should be false",
    ).toBe(false);
  });

  it("deleteAddress removes target address by id", () => {
    useAppStore.setState({
      addressLists: [
        { id: 1, address: "Home" },
        { id: 2, address: "Office" },
      ] as any,
    });

    useAppStore.getState().deleteAddress(1);

    expect(
      useAppStore.getState().addressLists,
      "address with id 1 should be removed",
    ).toEqual([{ id: 2, address: "Office" }]);
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
    expect(
      addresses.find((a: any) => a.id === 2)?.is_default,
      "id 2 should be default 1",
    ).toBe(1);
    expect(
      addresses.find((a: any) => a.id === 1)?.is_default,
      "id 1 should be default 0",
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The cart slice, driven directly (roadmap phase 15).
//
// Everything below builds its own copy of the slice instead of reaching for the
// whole app store. Two reasons. The slice is where the logic is, so a failure
// here names the slice and nothing else. And a fresh copy per test means no
// leftover state from a neighbouring test, which is easy to get wrong in a
// store this large.
//
// Plain setters (setFoo: (v) => set({ foo: v })) are left out on purpose — they
// assert that Zustand works, not that our code does. The functions covered here
// all compute something: the address form, the address list, the coupon reset
// and the four money fields the payment screen writes.
//
// The set() below merges shallowly, which is what Zustand's own set() does.

/** A fresh cart slice with its own state. Actions live on the state object. */
function makeCartSlice(overrides: Record<string, any> = {}) {
  let state: Record<string, any> = {};
  const set = (partial: any) => {
    const next = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  state = { ...(useCartStore as any)(set, get), ...overrides };
  return {
    get s() {
      return state;
    },
  };
}

/**
 * The slice reads the country out of the URL, so a test that cares about the
 * country has to say which page the shopper is on. sy-en is the locale this
 * repository opens by hand — gb is not in the region list.
 */
function openPage(path: string) {
  window.history.replaceState({}, "", path);
}

afterEach(() => {
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

describe("initAddressForm — the blank address form", () => {
  it("drops the id of the address that was being edited", () => {
    const slice = makeCartSlice({
      addressDetails: { id: 44, address: "Old flat", user_name: "Ada" },
    });

    slice.s.initAddressForm();

    // AddAddressForm chooses between add and update with addressDetails?.id.
    // An id left behind here sends an update for an address the shopper is
    // creating, so the new address is never stored.
    expect(
      slice.s.addressDetails.id,
      "the edited address id survived initAddressForm, so the form would send an update for an address the shopper is creating",
    ).toBeUndefined();
  });

  it("clears every region field", () => {
    const slice = makeCartSlice({
      addressDetails: {
        region: " | Damascus | Old City",
        region_details: {
          city: "Old City",
          province: "Damascus",
          town: "Bab Touma",
          street: "Straight Street",
          building: "12",
        },
      },
    });

    slice.s.initAddressForm();

    expect(
      slice.s.addressDetails.region_details,
      "the region parts of the previous address leaked into the blank form",
    ).toEqual({ city: "", province: "", town: "", street: "", building: "" });
    expect(
      slice.s.addressDetails.region,
      "the region line of the previous address leaked into the blank form",
    ).toBe("");
  });

  it("keeps the contact fields present and empty", () => {
    const slice = makeCartSlice({
      addressDetails: { contact_info: undefined },
    });

    slice.s.initAddressForm();

    // AddAddressForm validates with contact_person_name?.length === 0. A
    // missing contact_info makes that check pass by being skipped, and an
    // address with no contact name reaches the core backend.
    expect(
      slice.s.addressDetails.contact_info,
      "the blank form has no contact_info, so the form check for an empty contact name is skipped and an address with no contact name can be sent",
    ).toEqual({ contact_person_name: "", phone: "", alternative_phone: "" });
  });

  it("takes the country from the URL the shopper is on", () => {
    openPage("/sy-en/cart");
    const slice = makeCartSlice();

    slice.s.initAddressForm();

    expect(
      slice.s.addressDetails.Country,
      "the blank form did not take its country from the /sy-en/ URL",
    ).toEqual({ name: "Syria", code: "sy" });
  });
});

describe("startUpdateAddress — opening a saved address in the form", () => {
  const savedAddress = {
    id: 7,
    address: "Home",
    region_details: {
      province: "Damascus",
      city: "Old City",
      town: "null",
      street: "Straight Street",
      building: "12",
    },
    contact_info: { name: "Ada", phone: "+10000000000" },
  };

  it("builds the region line the form shows from the saved parts", () => {
    const slice = makeCartSlice();

    slice.s.startUpdateAddress(savedAddress);

    // "null" arrives as a string from the core backend for a part the shopper
    // never filled in, and must not be shown.
    expect(
      slice.s.addressDetails.region,
      "the region line shown in the edit form was not built from the saved address parts",
    ).toBe(" | Damascus | Old City | Straight Street | 12");
  });

  it("keeps the id, so saving updates instead of creating a second address", () => {
    const slice = makeCartSlice();

    slice.s.startUpdateAddress(savedAddress);

    expect(
      slice.s.addressDetails.id,
      "the edit form lost the address id, so saving it would create a second copy instead of updating",
    ).toBe(7);
  });

  it("copies the saved contact name out of contact_info.name", () => {
    const slice = makeCartSlice();

    slice.s.startUpdateAddress(savedAddress);

    expect(
      slice.s.addressDetails.contact_info.contact_person_name,
      "the edit form did not show the saved contact name",
    ).toBe("Ada");
    expect(
      slice.s.addressDetails.contact_info.phone,
      "the edit form lost the saved phone number",
    ).toBe("+10000000000");
  });

  it("loses the contact name when the saved address carries contact_person_name and no name", () => {
    const slice = makeCartSlice();

    slice.s.startUpdateAddress({
      ...savedAddress,
      contact_info: { contact_person_name: "Ada", phone: "+10000000000" },
    });

    // This pins what the code does today, and it is a finding, not a wanted
    // behaviour. Every screen that shows an address reads
    // "contact_person_name || name", so both key shapes reach the app — but
    // this function only handles name, and overwrites the other shape with
    // undefined. Which shape /customer/address/list really returns is not
    // answered anywhere in this repository, so nothing is changed here.
    expect(
      slice.s.addressDetails.contact_info.contact_person_name,
      "the edit form now keeps a contact_person_name the saved address already carried — the finding this test records has been fixed, so update the test",
    ).toBeUndefined();
  });

  it("overwrites the saved country with the country of the URL", () => {
    openPage("/tr-en/cart");
    const slice = makeCartSlice();

    slice.s.startUpdateAddress({
      ...savedAddress,
      Country: { name: "Syria", code: "sy" },
    });

    // Editing an address saved for one country while browsing another rewrites
    // its country, and UpdateAddressList sends that country to the core
    // backend. Pinned as it is.
    expect(
      slice.s.addressDetails.Country,
      "the edit form did not take its country from the /tr-en/ URL",
    ).toEqual({ name: "Türkiye", code: "tr" });
  });
});

describe("updateAddress — saving an edit back into the list", () => {
  it("replaces only the edited address", () => {
    const slice = makeCartSlice({
      addressLists: [
        { id: 1, address: "Home" },
        { id: 2, address: "Office" },
        { id: 3, address: "Gym" },
      ],
    });

    slice.s.updateAddress({ id: 2, address: "New office" });

    const byId = (id: number) =>
      slice.s.addressLists.find((a: any) => a.id === id);
    expect(
      byId(2)?.address,
      "the edited address did not take the new value",
    ).toBe("New office");
    expect(byId(1)?.address, "editing address 2 changed address 1").toBe(
      "Home",
    );
    expect(byId(3)?.address, "editing address 2 changed address 3").toBe("Gym");
  });

  it("keeps the order of the address list", () => {
    const slice = makeCartSlice({
      addressLists: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });

    slice.s.updateAddress({ id: 2 });

    // This used to end with arr.reverse(). AddressListContainer renders
    // addressLists in order and calls updateAddress every time the shopper taps
    // an address, so the sheet flipped upside down under the tap.
    expect(
      slice.s.addressLists.map((a: any) => a.id),
      "updateAddress reordered the address list instead of leaving the order alone",
    ).toEqual([1, 2, 3]);
  });

  it("does not change which address is the default one", () => {
    // Everything that picks the address to ship to reads
    // `addressLists.filter((s) => s.is_default === 1)[0]` — checkout
    // (services/order.ts:74), PlaceOrderWidget and ShippingAddressContainer all
    // do. That read is order-sensitive when the core backend marks more than one
    // address as default, and the old arr.reverse() flipped the answer on every
    // edit. Editing an address must never move the delivery address.
    const slice = makeCartSlice({
      addressLists: [
        { id: 1, address: "Home", is_default: 1 },
        { id: 2, address: "Office", is_default: 0 },
        { id: 3, address: "Gym", is_default: 1 },
      ],
    });

    slice.s.updateAddress({ id: 2, address: "New office", is_default: 0 });

    const chosen = slice.s.addressLists.filter(
      (a: any) => a.is_default === 1,
    )[0];
    expect(
      chosen?.address,
      "editing an unrelated address moved the delivery address that checkout reads",
    ).toBe("Home");
  });
});

describe("setDefaultAddress — an id that is not in the list", () => {
  it("clears every default when the id belongs to no address in the list", () => {
    const slice = makeCartSlice({
      addressLists: [
        { id: 1, is_default: 1 },
        { id: 2, is_default: 0 },
      ],
    });

    slice.s.setDefaultAddress(99);

    // Checkout picks the address to ship to by looking for is_default. With
    // every flag cleared there is none, and the shopper sees no address.
    expect(
      slice.s.addressLists.map((a: any) => a.is_default),
      "an unknown id left the list with no default address, which is what checkout reads to know where to ship",
    ).toEqual([0, 0]);
  });
});

describe("coupon and discount", () => {
  it("applying a coupon keeps the payment method the shopper already chose", () => {
    const slice = makeCartSlice({
      orderData: {
        data: null,
        payment: [{ id: 0, balance: 50 }],
        coupon: false,
        agree: true,
        coupon_number: "",
        loading: false,
        success: false,
      },
    });

    slice.s.setOrderData({ coupon: 5, coupon_number: "SAVE5" });

    expect(
      slice.s.orderData.payment,
      "applying a coupon dropped the payment method the shopper had chosen",
    ).toEqual([{ id: 0, balance: 50 }]);
    expect(
      slice.s.orderData.coupon,
      "the coupon value was not stored on the order",
    ).toBe(5);
    expect(
      slice.s.orderData.agree,
      "applying a coupon cleared the agree-to-terms flag, which blocks placing the order",
    ).toBe(true);
  });

  it("the order-done reset clears the coupon, the payment and the discount together", () => {
    const slice = makeCartSlice({
      coupon_discount: 5,
      orderData: {
        data: [1],
        payment: [{ id: 1, balance: 50 }],
        coupon: 5,
        agree: true,
        coupon_number: "SAVE5",
        loading: false,
        success: true,
      },
    });

    // The "done" button of PlaceOrderButtons, in the order it runs.
    slice.s.setOrderData({
      payment: [],
      coupon: false,
      agree: false,
      coupon_number: "",
      loading: false,
      success: false,
      data: [],
    });
    slice.s.setCouponDiscount(null);

    expect(
      slice.s.orderData.coupon_number,
      "the coupon code stayed on the order after it was placed, so the next order starts with it filled in",
    ).toBe("");
    expect(
      slice.s.orderData.payment,
      "the payment method stayed on the order after it was placed",
    ).toEqual([]);
    expect(
      slice.s.coupon_discount,
      "the discount stayed after the order was placed, so the next cart shows a discount that no longer applies",
    ).toBeNull();
  });
});

describe("the money the payment screen writes", () => {
  it("setWalletUser falls back to a zero balance when the wallet backend sends none", () => {
    const slice = makeCartSlice();

    slice.s.setWalletUser({ id: 9, wallet_balance: undefined });

    // The payment screen compares wallet_balance > 0 and divides it by the
    // exchange rate. An undefined balance makes both silently wrong.
    expect(
      slice.s.wallet,
      "the wallet backend sent no balance and the store did not fall back to 0",
    ).toEqual({ id: 9, wallet_balance: 0 });
  });

  it("setWalletUser keeps the other fields the wallet backend sent", () => {
    const slice = makeCartSlice();

    slice.s.setWalletUser({ id: 9, currency: "USD", wallet_balance: 12 });

    expect(
      slice.s.wallet,
      "setWalletUser dropped fields the wallet backend sent",
    ).toEqual({ id: 9, currency: "USD", wallet_balance: 12 });
  });

  it("setWalletBalance copies the wallet balance across, and falls back to 0 with no wallet", () => {
    const withWallet = makeCartSlice({
      wallet: { wallet_balance: 12 },
      balance: 0,
    });
    withWallet.s.setWalletBalance();
    expect(
      withWallet.s.balance,
      "the wallet balance was not copied onto the balance field",
    ).toBe(12);

    const noWallet = makeCartSlice({ wallet: null, balance: 7 });
    noWallet.s.setWalletBalance();
    expect(
      noWallet.s.balance,
      "with no wallet loaded the balance did not fall back to 0",
    ).toBe(0);
  });

  it("setCodUser puts the cash total on the balance, and 0 when there is no total", () => {
    const withTotal = makeCartSlice({ total_cash: 120 });
    withTotal.s.setCodUser();
    expect(
      withTotal.s.balance,
      "choosing cash on delivery did not put the cash total on the balance",
    ).toBe(120);

    const noTotal = makeCartSlice({ total_cash: null, balance: 7 });
    noTotal.s.setCodUser();
    expect(
      noTotal.s.balance,
      "with no cash total the cash-on-delivery balance did not fall back to 0",
    ).toBe(0);
  });

  it("setCodUser overwrites the wallet balance, because both write the same field", () => {
    const slice = makeCartSlice({
      wallet: { wallet_balance: 40 },
      total_cash: 120,
    });

    slice.s.setWalletBalance();
    slice.s.setCodUser();

    // A collision, recorded on purpose. setWalletBalance and setCodUser both
    // write `balance`, so choosing cash on delivery replaces the wallet figure.
    // It harms nobody today only because a repo-wide search finds no reader of
    // `balance`, `crypto` or `credit` outside this slice — the payment screen
    // draws the wallet from `wallet.wallet_balance` instead. Anyone who starts
    // reading `balance` inherits this.
    expect(
      slice.s.balance,
      "choosing cash on delivery no longer overwrites the wallet balance — the collision this test records is gone, so update the test",
    ).toBe(120);
  });

  it("setCryptoUser puts the cash total on the crypto field, and 0 when there is no total", () => {
    const withTotal = makeCartSlice({ total_cash: 120 });
    withTotal.s.setCryptoUser();
    expect(
      withTotal.s.crypto,
      "choosing crypto did not put the cash total on the crypto field",
    ).toBe(120);

    const noTotal = makeCartSlice({ total_cash: null, crypto: 7 });
    noTotal.s.setCryptoUser();
    expect(
      noTotal.s.crypto,
      "with no cash total the crypto amount did not fall back to 0",
    ).toBe(0);
  });

  it("setCreditUser puts the cash total on the credit field, and 0 when there is no total", () => {
    const withTotal = makeCartSlice({ total_cash: 120 });
    withTotal.s.setCreditUser();
    expect(
      withTotal.s.credit,
      "choosing card did not put the cash total on the credit field",
    ).toBe(120);

    const noTotal = makeCartSlice({ total_cash: null, credit: 7 });
    noTotal.s.setCreditUser();
    expect(
      noTotal.s.credit,
      "with no cash total the credit amount did not fall back to 0",
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The money the core backend sends, and the row the shopper takes out.
//
// AC-5 and AC-11 of _specs/checkout-address-totals-and-cart-lines.
//
// Neither action had a test. `initCart` and `setCartPreview` are the only two
// writers of the cart's money fields (utils/functions.tsx:326, :351), and
// `removeFromCart` is the only action that clears a row from both lists at once
// (store/Cart/reducer.ts:402-406). The app computes none of these numbers: they
// start as `null` (store/Cart/reducer.ts:50-56) and are only ever overwritten by
// an answer from the core backend.
describe("the money the core backend sends", () => {
  // The four figures a shopper is shown, written out as plain constants rather
  // than derived from the payload. Deriving them the way the code does would
  // make a wrong reducer and a wrong expectation agree with each other.
  const SUB_TOTAL = 80;
  const SHIPPING = 15;
  const DISCOUNT = 20;
  const TOTAL = 85;

  /** What `/cart/cart_shipping` answers, trimmed to the money and one row. */
  const cartShippingAnswer = {
    sub_total: SUB_TOTAL,
    total_shipping_cost: SHIPPING,
    total_discount: DISCOUNT,
    total: TOTAL,
    total_cash: TOTAL,
    cart: [
      {
        id: "cart-row-1",
        product_id: 101,
        image: "shirt.jpg",
        quantity: 1,
        offer_price: 80,
        product_variation_id: null,
      },
    ],
  };

  it("initCart keeps every money figure the core backend sent", () => {
    useAppStore.getState().initCart(cartShippingAnswer as never);

    const s = useAppStore.getState();
    expect(
      s.sub_total,
      "the core backend sent a sub-total of 80 and the cart store does not hold it",
    ).toBe(SUB_TOTAL);
    expect(
      s.total_shipping_cost,
      "the core backend sent a shipping cost of 15 and the cart store does not hold it",
    ).toBe(SHIPPING);
    expect(
      s.total_discount,
      "the core backend sent a discount of 20 and the cart store does not hold it",
    ).toBe(DISCOUNT);
    expect(
      s.total,
      "the core backend sent a total of 85 and the cart store does not hold it",
    ).toBe(TOTAL);
  });

  it("setCartPreview keeps every money figure the core backend sent", () => {
    useAppStore.getState().setCartPreview({
      sub_total: SUB_TOTAL,
      total_shipping_cost: SHIPPING,
      total_discount: DISCOUNT,
      total: TOTAL,
    } as never);

    const s = useAppStore.getState();
    expect(
      s.sub_total,
      "the cart overview from the core backend sent a sub-total of 80 and the cart store does not hold it",
    ).toBe(SUB_TOTAL);
    expect(
      s.total_shipping_cost,
      "the cart overview from the core backend sent a shipping cost of 15 and the cart store does not hold it",
    ).toBe(SHIPPING);
    expect(
      s.total_discount,
      "the cart overview from the core backend sent a discount of 20 and the cart store does not hold it",
    ).toBe(DISCOUNT);
    expect(
      s.total,
      "the cart overview from the core backend sent a total of 85 and the cart store does not hold it",
    ).toBe(TOTAL);
  });

  it("setCartPreview leaves the bag itself alone", () => {
    // The re-price after an address change must not empty the screen. This is
    // why setCartPreview carries `cart` and `localCart` over by hand
    // (store/Cart/reducer.ts:394-400) instead of spreading the answer whole.
    useAppStore.getState().initCart(cartShippingAnswer as never);
    const before = useAppStore.getState().localCart;

    useAppStore.getState().setCartPreview({ total: 999 } as never);

    expect(
      useAppStore.getState().localCart,
      "re-pricing the bag threw the shopper's rows away",
    ).toEqual(before);
  });
});

describe("taking a row out of the bag", () => {
  it("removeFromCart clears the row from both lists the store keeps", () => {
    // Two lists, two different keys: `cart` is filtered by `id` and `localCart`
    // by `item_id` (store/Cart/reducer.ts:402-406). A test that reads one of
    // them cannot see a row left behind in the other.
    useAppStore.setState({
      cart: [
        { id: "cart-row-1", product_id: 101 },
        { id: "cart-row-2", product_id: 102 },
      ] as never,
      localCart: [
        { id: 101, item_id: "cart-row-1", quantity: 1 },
        { id: 102, item_id: "cart-row-2", quantity: 1 },
      ] as never,
    });

    useAppStore.getState().removeFromCart("cart-row-1");

    expect(
      useAppStore.getState().cart.map((s: any) => s.id),
      "the removed row is still in the bag the cart page draws",
    ).toEqual(["cart-row-2"]);
    expect(
      useAppStore.getState().localCart.map((s: any) => s.item_id),
      "the removed row is still in the list the add-to-cart widget reads",
    ).toEqual(["cart-row-2"]);
  });

  it("removeFromCart leaves the other rows alone", () => {
    useAppStore.setState({
      cart: [{ id: "cart-row-1" }, { id: "cart-row-2" }] as never,
      localCart: [
        { id: 101, item_id: "cart-row-1", quantity: 3 },
        { id: 102, item_id: "cart-row-2", quantity: 4 },
      ] as never,
    });

    useAppStore.getState().removeFromCart("cart-row-1");

    expect(
      useAppStore.getState().localCart[0]?.quantity,
      "removing one row changed the quantity of the row that stayed",
    ).toBe(4);
  });
});

describe("AddToCartOption controls — enableAddToCartOption & disableAddToCartOption", () => {
  it("enableAddToCartOption with product initialises options and sets default color/size when selectedColor is null", () => {
    const slice = makeCartSlice({
      AddToCartOption: { selectedColor: null, selectedSize: null },
    });
    const product = {
      id: 99,
      temp_id: 99,
      sync_color_images: [{ color_name: "Black", image: "black.jpg" }],
      choice_options: [
        { options: [{ name: "M" }, { name: "L" }] },
      ],
    };

    slice.s.enableAddToCartOption(product);

    expect(slice.s.AddToCartOption.enable).toBe(true);
    expect(slice.s.loaded).toBe(false);
    expect(slice.s.AddToCartOption.selectedColor).toEqual({
      color_name: "Black",
      image: "black.jpg",
    });
    expect(slice.s.AddToCartOption.selectedSize).toEqual({ name: "M" });
    expect(slice.s.SelectedProduct.choice_options).toBeNull();
  });

  it("enableAddToCartOption without product falls back to SelectedProduct colors and sizes when selectedColor is null", () => {
    const slice = makeCartSlice({
      AddToCartOption: { selectedColor: null, selectedSize: null },
      SelectedProduct: {
        id: 77,
        sync_color_images: [{ color_name: "Red", image: "red.jpg" }],
        choice_options: [{ options: [{ name: "S" }] }],
      },
    });

    slice.s.enableAddToCartOption(null);

    expect(slice.s.AddToCartOption.enable).toBe(true);
    expect(slice.s.AddToCartOption.selectedColor).toEqual({
      color_name: "Red",
      image: "red.jpg",
    });
    expect(slice.s.AddToCartOption.selectedSize).toEqual({ name: "S" });
  });

  it("enableAddToCartOption preserves initial empty object selectedColor due to truthy short-circuit", () => {
    const slice = makeCartSlice();
    slice.s.enableAddToCartOption({
      sync_color_images: [{ color_name: "Blue" }],
    });

    expect(slice.s.AddToCartOption.selectedColor).toEqual({});
  });

  it("enableAddToCartOption preserves already chosen color and size", () => {
    const slice = makeCartSlice({
      AddToCartOption: {
        enable: false,
        selectedColor: { color_name: "CustomColor" },
        selectedSize: { name: "CustomSize" },
      },
    });

    slice.s.enableAddToCartOption({
      sync_color_images: [{ color_name: "Other" }],
      choice_options: [{ options: [{ name: "OtherSize" }] }],
    });

    expect(slice.s.AddToCartOption.selectedColor).toEqual({
      color_name: "CustomColor",
    });
    expect(slice.s.AddToCartOption.selectedSize).toEqual({
      name: "CustomSize",
    });
  });

  it("disableAddToCartOption resets AddToCartOption state and scroll", () => {
    const slice = makeCartSlice({
      AddToCartOption: {
        enable: true,
        quantity: 5,
        price: { price: 100 },
        UID: "uid-123",
        selectedOptions: [{ UID: "uid-123", quantity: 2 }],
      },
    });

    slice.s.disableAddToCartOption();

    expect(slice.s.AddToCartOption.enable).toBe(false);
    expect(slice.s.AddToCartOption.quantity).toBe(0);
    expect(slice.s.AddToCartOption.price).toBeNull();
    expect(slice.s.AddToCartOption.UID).toBe("");
    expect(slice.s.AddToCartOption.selectedOptions).toEqual([]);
  });
});

describe("AddToCartOption selections — addToCartQuantity, addToCartSize & addToCartColor", () => {
  it("addToCartQuantity adds a new option with quantity 1 when UID does not exist", () => {
    const slice = makeCartSlice({
      AddToCartOption: { selectedOptions: [] },
    });

    slice.s.addToCartQuantity({ UID: "opt-1", name: "Red M" });

    expect(slice.s.AddToCartOption.selectedOptions).toEqual([
      { UID: "opt-1", name: "Red M", quantity: 1 },
    ]);
  });

  it("addToCartQuantity increments quantity by 1 when UID already exists", () => {
    const slice = makeCartSlice({
      AddToCartOption: {
        selectedOptions: [
          { UID: "opt-1", name: "Red M", quantity: 2 },
          { UID: "opt-2", name: "Blue L", quantity: 1 },
        ],
      },
    });

    slice.s.addToCartQuantity({ UID: "opt-1" });

    const updated = slice.s.AddToCartOption.selectedOptions.find(
      (o: any) => o.UID === "opt-1",
    );
    expect(updated?.quantity).toBe(3);
    const untouched = slice.s.AddToCartOption.selectedOptions.find(
      (o: any) => o.UID === "opt-2",
    );
    expect(untouched?.quantity).toBe(1);
  });

  it("addToCartSize updates size and recalculates price matching the selected color", () => {
    const slice = makeCartSlice({
      AddToCartOption: {
        selectedColor: { color_name: "Blue" },
        selectedSize: { name: "S" },
      },
      variants: {
        variation: [
          {
            color: { name: "Blue" },
            size: "M",
            price: 150,
            offer_price: 120,
            price_formated: "$150",
            offer_price_formated: "$120",
          },
        ],
      },
    });

    slice.s.addToCartSize({ name: "M" });

    expect(slice.s.AddToCartOption.selectedSize).toEqual({ name: "M" });
    expect(slice.s.AddToCartOption.price).toEqual({
      price: 150,
      offer_price: 120,
      price_formated: "$150",
      offer_price_formated: "$120",
    });
  });

  it("addToCartSize without variants only updates selectedSize", () => {
    const slice = makeCartSlice({
      AddToCartOption: { selectedSize: { name: "S" } },
      variants: null,
    });

    slice.s.addToCartSize({ name: "XL" });

    expect(slice.s.AddToCartOption.selectedSize).toEqual({ name: "XL" });
    expect(slice.s.AddToCartOption.price).toBeUndefined();
  });

  it("addToCartColor updates selectedColor and recalculates price matching selectedSize", () => {
    const slice = makeCartSlice({
      AddToCartOption: {
        selectedColor: { color_name: "Red" },
        selectedSize: { name: "L" },
      },
      variants: {
        variation: [
          {
            color: { name: "Green" },
            size: "L",
            price: 200,
            offer_price: 180,
            price_formated: "$200",
            offer_price_formated: "$180",
          },
        ],
      },
    });

    slice.s.addToCartColor({ color_name: "Green" });

    expect(slice.s.AddToCartOption.selectedColor).toEqual({ color_name: "Green" });
    expect(slice.s.AddToCartOption.price).toEqual({
      price: 200,
      offer_price: 180,
      price_formated: "$200",
      offer_price_formated: "$180",
    });
  });
});

describe("notifyProduct in cart store", () => {
  it("marks variant_notify_for_user true on matching variant in SelectedProduct.variation", () => {
    const slice = makeCartSlice({
      SelectedProduct: {
        id: 1,
        variation: [
          { product_variation_id: 10, variant_notify_for_user: false },
          { product_variation_id: 20, variant_notify_for_user: false },
        ],
      },
    });

    slice.s.notifyProduct(20);

    expect(
      slice.s.SelectedProduct.variation.find((v: any) => v.product_variation_id === 20)
        ?.variant_notify_for_user,
    ).toBe(true);
    expect(
      slice.s.SelectedProduct.variation.find((v: any) => v.product_variation_id === 10)
        ?.variant_notify_for_user,
    ).toBe(false);
  });

  it("sets is_product_notify_for_user true when SelectedProduct has no variations array", () => {
    const slice = makeCartSlice({
      SelectedProduct: {
        id: 2,
        is_product_notify_for_user: false,
      },
    });

    slice.s.notifyProduct(2);

    expect(slice.s.SelectedProduct.is_product_notify_for_user).toBe(true);
  });
});

describe("oldCart store operations — storeOldCart & hideOldCart", () => {
  it("storeOldCart sets oldCart null when falsy cart passed", () => {
    const slice = makeCartSlice({ oldCart: { data: 123 } });

    slice.s.storeOldCart(null);

    expect(slice.s.oldCart).toBeNull();
  });

  it("storeOldCart transforms oldCart products setting price to unit_price", () => {
    const slice = makeCartSlice();

    slice.s.storeOldCart({
      id: "oc-1",
      oldCart: [
        { id: 10, unit_price: 50, offer_price: 40, name: "Shirt" },
      ],
    });

    expect(slice.s.oldCart.oldCart[0]).toEqual({
      id: 10,
      unit_price: 50,
      offer_price: 40,
      price: 50,
      name: "Shirt",
    });
  });

  it("hideOldCart removes item and computes discounted offer_price", () => {
    const slice = makeCartSlice({
      oldCart: {
        oldCart: [
          { id: 1, price_of_variant: 100, discount: 20 },
          { id: 2, price_of_variant: 80, discount: null },
        ],
      },
    });

    slice.s.hideOldCart(1);

    expect(slice.s.oldCart.oldCart).toHaveLength(1);
    expect(slice.s.oldCart.oldCart[0].id).toBe(2);
    expect(slice.s.oldCart.oldCart[0].price).toBe(80);
    expect(slice.s.oldCart.oldCart[0].offer_price).toBe(0);
  });
});

describe("editQuantity in cart store", () => {
  it("decrements available_quantity on SelectedProduct when variantId is empty string", () => {
    const slice = makeCartSlice({
      SelectedProduct: { available_quantity: 3 },
    });

    slice.s.editQuantity("");

    expect(slice.s.SelectedProduct.available_quantity).toBe(2);
  });

  it("clamps available_quantity to 0 when decremented from 0", () => {
    const slice = makeCartSlice({
      SelectedProduct: { available_quantity: 0 },
    });

    slice.s.editQuantity("");

    expect(slice.s.SelectedProduct.available_quantity).toBe(0);
  });

  it("decrements specific variant qty when variantId is provided", () => {
    const slice = makeCartSlice({
      SelectedProduct: {
        variation: [
          { product_variation_id: 100, qty: 5 },
          { product_variation_id: 200, qty: 1 },
        ],
      },
    });

    slice.s.editQuantity(100);

    expect(
      slice.s.SelectedProduct.variation.find((v: any) => v.product_variation_id === 100)?.qty,
    ).toBe(4);
    expect(
      slice.s.SelectedProduct.variation.find((v: any) => v.product_variation_id === 200)?.qty,
    ).toBe(1);
  });
});

describe("getProductDetailsForCart & getProductVariation", () => {
  it("getProductDetailsForCart updates state when AddToCartOption is enabled and temp_id matches", () => {
    const slice = makeCartSlice({
      AddToCartOption: { enable: true, selectedSize: null },
      SelectedProduct: { id: 50 },
      loaded: false,
    });

    slice.s.getProductDetailsForCart({
      temp_id: 50,
      name: "Updated Product",
      choice_options: [{ options: [{ name: "Large" }] }],
      variation: [{ id: 1 }],
    });

    expect(slice.s.SelectedProduct.name).toBe("Updated Product");
    expect(slice.s.AddToCartOption.selectedSize).toEqual({ name: "Large" });
    expect(slice.s.variants).toEqual([{ id: 1 }]);
    expect(slice.s.loaded).toBe(true);
  });

  it("getProductDetailsForCart leaves state unchanged when temp_id does not match", () => {
    const slice = makeCartSlice({
      AddToCartOption: { enable: true },
      SelectedProduct: { id: 50, name: "Original" },
      loaded: false,
    });

    slice.s.getProductDetailsForCart({ temp_id: 999, name: "New" });

    expect(slice.s.SelectedProduct.name).toBe("Original");
    expect(slice.s.loaded).toBe(false);
  });

  it("getProductVariation with color updates SelectedProduct and loaded flag", () => {
    const slice = makeCartSlice({
      SelectedProduct: { id: 1 },
      loaded: false,
    });

    slice.s.getProductVariation({
      color: "Blue",
      variation: [{ id: 9 }],
    });

    expect(slice.s.SelectedProduct.color).toBe("Blue");
    expect(slice.s.variants).toEqual([{ id: 9 }]);
    expect(slice.s.loaded).toBe(true);
  });

  it("getProductVariation without color/Size selects first in-stock variant", () => {
    const slice = makeCartSlice({
      SelectedProduct: {
        id: 1,
        choice_options: [{ options: [{ name: "Medium" }] }],
        sync_color_images: [{ color_name: "Red", image: "red.png" }],
      },
      AddToCartOption: {},
    });

    slice.s.getProductVariation({
      variation: [
        { qty: 0, size: "Small", color: { name: "Blue" } },
        { qty: 2, size: "Medium", color: { name: "Red" } },
      ],
    });

    expect(slice.s.AddToCartOption.selectedSize).toEqual({ name: "Medium" });
    expect(slice.s.AddToCartOption.selectedColor).toEqual({
      color_name: "Red",
      image: "red.png",
    });
    expect(slice.s.loaded).toBe(true);
  });
});

describe("expireLuck & errRemoveFromCart in cart store", () => {
  it("expireLuck resets is_luck to false on SelectedProduct", () => {
    const slice = makeCartSlice({
      SelectedProduct: { id: 10, is_luck: true },
    });

    slice.s.expireLuck();

    expect(slice.s.SelectedProduct.is_luck).toBe(false);
  });

  it("errRemoveFromCart returns empty object when cart_item is still in localCart", () => {
    const slice = makeCartSlice({
      localCart: [{ item_id: "item-1" }],
      cart: [{ id: "item-1" }],
    });

    slice.s.errRemoveFromCart({ item_id: "item-1" });

    expect(slice.s.localCart).toHaveLength(1);
    expect(slice.s.cart).toHaveLength(1);
  });

  it("errRemoveFromCart restores cart_item to both cart and localCart when absent from localCart", () => {
    const slice = makeCartSlice({
      localCart: [],
      cart: [],
    });

    slice.s.errRemoveFromCart({ item_id: "item-missing", id: "item-missing" });

    expect(slice.s.localCart).toEqual([{ item_id: "item-missing", id: "item-missing" }]);
    expect(slice.s.cart).toEqual([{ item_id: "item-missing", id: "item-missing" }]);
  });
});


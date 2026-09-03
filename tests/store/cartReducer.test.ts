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

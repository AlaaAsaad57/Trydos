// The first checkout step (components/Cart/ShippingAddressContainer.tsx): the
// shopping bag summary and the delivery address box.
//
// The order and home services and the country-list server request are
// replaced. Each would otherwise reach the core backend, and this file is about
// what the step shows and which of those it asks for.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShippingAddressContainer from "components/Cart/ShippingAddressContainer";
import { useAppStore } from "store";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const order = vi.hoisted(() => ({
  GetWallet: vi.fn(),
  GetAddressList: vi.fn(),
}));
vi.mock("services/order", () => ({ default: order }));

const home = vi.hoisted(() => ({ getClientData: vi.fn(async () => {}) }));
vi.mock("services/home", () => ({ default: home }));

const GetCountries = vi.hoisted(() => vi.fn());
vi.mock("serverRequests/product", () => ({ GetCountries }));

const cartItems = [
  {
    product_id: 1,
    name: "Shirt",
    quantity: 2,
    image: "a.png",
    shipping_days: 3,
    variations: { Size: "M", color: "Red" },
  },
  {
    product_id: 2,
    name: "Hat",
    quantity: 1,
    image: "b.png",
    shipping_days: 1,
    variations: { size_options: "L", color_options: "Blue" },
    variation: { size_options: "L" },
  },
  { product_id: 3, name: "Sock", quantity: 1, image: "c.png" },
];

const homeAddress = {
  id: 5,
  address: "Home",
  is_default: 1,
  region_details: {
    province: "Damascus",
    city: "Old City",
    town: "Bab Touma",
    street: "Straight St",
    building: "12",
  },
  contact_info: { name: "Ada", phone: "+10000000000" },
};

async function openStep(
  store: Record<string, any> = {},
  language: "en" | "ar" = "en",
) {
  const handlers = {
    slideNext: vi.fn(),
    slidePrev: vi.fn(),
    openAddressList: vi.fn(),
  };
  const view = await renderWithProviders(
    <ShippingAddressContainer {...handlers} />,
    {
      country: "sy",
      language,
      store: { cart: cartItems, addressLists: [], ...store },
    },
  );
  return { ...view, ...handlers };
}

beforeEach(() => {
  sessionStorage.clear();
  order.GetWallet.mockClear();
  order.GetAddressList.mockClear();
  GetCountries.mockReset();
});

describe("the checkout shipping step", () => {
  it("does not load the wallet, addresses or countries for a shopper with no session", async () => {
    await openStep({ user: null });
    expect(order.GetAddressList, "the address list was asked for with no user").not.toHaveBeenCalled();
    expect(GetCountries, "the country list was asked for with no user").not.toHaveBeenCalled();
  });

  it("loads the wallet, the saved addresses and the country list, and keeps the list for the session", async () => {
    GetCountries.mockResolvedValue([{ iso: "sy" }]);
    await openStep({ user: { id: 1 } });

    expect(order.GetWallet, "the wallet was not loaded").toHaveBeenCalled();
    expect(order.GetAddressList, "the saved addresses were not loaded").toHaveBeenCalled();
    expect(GetCountries, "the country list was not asked for the URL's country and language").toHaveBeenCalledWith({
      country: "sy",
      language: "en",
    });
    await waitFor(() =>
      expect(
        (useAppStore.getState() as any).countries,
        "the country list was not put in the store",
      ).toEqual([{ iso: "sy" }]),
    );
    expect(
      sessionStorage.getItem("countries-sy-en"),
      "the country list was not kept for the session",
    ).toBe(JSON.stringify([{ iso: "sy" }]));
  });

  it("reads the country list from the session when it is already there", async () => {
    sessionStorage.setItem("countries-sy-en", JSON.stringify([{ iso: "iq" }]));
    await openStep({ user: { id: 1 } });
    expect(GetCountries, "the country list was fetched again though the session had it").not.toHaveBeenCalled();
    expect(
      (useAppStore.getState() as any).countries,
      "the stored country list was not put in the store",
    ).toEqual([{ iso: "iq" }]);
  });

  it("keeps going when the country list cannot be read", async () => {
    GetCountries.mockRejectedValue(new Error("down"));
    await openStep({ user: { id: 1 } });
    await waitFor(() => expect(GetCountries, "the country list was not asked for").toHaveBeenCalled());
    expect(
      sessionStorage.getItem("countries-sy-en"),
      "a failed country read must not be kept for the session",
    ).toBeNull();
    expect(
      screen.getByText("Shipping & Delivery Address"),
      "the step stopped drawing after the country list failed",
    ).toBeInTheDocument();
  });

  it("lists every bag item with its size and colour, and folds the bag when tapped", async () => {
    await openStep();
    const items = document.querySelectorAll('[data-pw="Item"]');
    expect(items.length > 0, "no bag item was drawn").toBe(true);
    for (const text of ["M", "Red", "L", "Blue"]) {
      expect(screen.getByText(text), `the variation "${text}" is not shown`).toBeInTheDocument();
    }
    await userEvent.click(document.querySelector('[data-pw="bag-viewer"]')!);
    expect(
      document.querySelector('[data-pw="Item"]'),
      "tapping the bag did not fold it",
    ).toBeNull();
  });

  it("asks for an address, and opens an empty form from 'Add New Shipping Address'", async () => {
    const { slideNext, openAddressList } = await openStep({ orderLoading: true });
    expect(
      screen.getByText("Please Enter Shipping Address To Receive Your Bag"),
      "the step did not ask for an address when none is saved",
    ).toBeInTheDocument();
    expect(screen.getByText("No Address Selected"), "the empty address box is missing").toBeInTheDocument();

    await userEvent.click(document.querySelector('[data-pw="addresses-viewer"]')!);
    expect(openAddressList, "an empty address box opened the address list").not.toHaveBeenCalled();

    await userEvent.click(document.querySelector('[data-pw="AddAddres"]')!);
    expect(slideNext, "'Add New Shipping Address' did not open the form").toHaveBeenCalled();
  });

  it("shows the chosen address in Arabic and opens the address list", async () => {
    const { openAddressList } = await openStep(
      {
        addressLists: [homeAddress, { ...homeAddress, id: 6, is_default: 0 }],
        settings: { starting_setting: { shipping_duration_days: "2" } },
        total_shipping_cost: 5,
      },
      "ar",
    );

    expect(
      document.querySelector('[data-pw="Address-Added-Last"]')!.textContent,
      "the chosen address did not list every part of the region",
    ).toBe("Damascus | Old City | Bab Touma | Straight St | 12");
    expect(
      document.querySelector('[data-pw="defaultAddress-contactpersonname"]')!.textContent,
      "the recipient name was not shown from contact_info.name",
    ).toBe("Ada");

    await userEvent.click(document.querySelector('[data-pw="addresses-viewer"]')!);
    expect(openAddressList, "tapping the chosen address did not open the list").toHaveBeenCalledWith(true);
    openAddressList.mockClear();
    await userEvent.click(document.querySelector('[data-pw="Show-Address-That-Added"]')!);
    expect(openAddressList, "'Show Address List' did not open the list").toHaveBeenCalledWith(true);
  });

  it("leaves out region parts that are empty or 'null'", async () => {
    await openStep({
      addressLists: [
        {
          ...homeAddress,
          region_details: { province: "null", city: "", town: "null", street: "null", building: "null" },
          contact_info: { contact_person_name: "Bob" },
        },
      ],
      total_shipping_cost: 0,
    });
    expect(
      document.querySelector('[data-pw="Address-Added-Last"]')!.textContent,
      "empty or 'null' region parts were shown",
    ).toBe("");
  });
});

// What the shopper sees in the checkout address sheet.
//
// This file exists to confirm one finding, BUG-1: tapping an address in the
// list reverses the list. The slice-level proof is in
// tests/store/cartReducer.test.ts; this one is the shopper-facing half, because
// a store field changing order only matters if the screen shows it.
//
// The order service is replaced rather than answered. The tap fires
// `order.SetDefault`, which would otherwise reach the core backend, and the
// suite fails any request nobody wrote a reply for.
import { describe, expect, it, vi } from "vitest";

import AddressListContainer from "components/Cart/AddressListContainer";

import { renderWithProviders, userEvent } from "../../render";

vi.mock("services/order", () => ({
  default: {
    SetDefault: vi.fn().mockResolvedValue(undefined),
  },
}));

/** Three saved addresses, in the order the core backend returned them. */
const savedAddresses = [
  {
    id: 1,
    address: "Home",
    is_default: 1,
    region_details: { city: "Damascus" },
    contact_info: { contact_person_name: "Ada", phone: "+10000000000" },
  },
  {
    id: 2,
    address: "Office",
    is_default: 0,
    region_details: { city: "Damascus" },
    contact_info: { contact_person_name: "Ada", phone: "+10000000000" },
  },
  {
    id: 3,
    address: "Gym",
    is_default: 0,
    region_details: { city: "Damascus" },
    contact_info: { contact_person_name: "Ada", phone: "+10000000000" },
  },
];

/** The address titles, top to bottom, read off the rendered cards. */
function titlesOnScreen() {
  return Array.from(document.querySelectorAll('[data-pw="Address"]')).map(
    (card) => {
      const found = savedAddresses
        .map((a) => a.address)
        .find((title) => card.textContent?.includes(title));
      return found ?? card.textContent;
    },
  );
}

async function openTheSheet() {
  return renderWithProviders(
    <AddressListContainer
      closeSelect={() => {}}
      slideNext={() => {}}
      Delete={() => {}}
    />,
    {
      country: "sy",
      path: "/cart",
      store: { addressLists: savedAddresses.map((a) => ({ ...a })) },
    },
  );
}

describe("the checkout address sheet", () => {
  it("draws the saved addresses in the order the core backend returned them", async () => {
    await openTheSheet();

    expect(
      titlesOnScreen(),
      "the address sheet did not draw the three saved addresses in the order they were stored",
    ).toEqual(["Home", "Office", "Gym"]);
  });

  it("keeps the order on screen after the shopper taps an address", async () => {
    const { store } = await openTheSheet();

    // Tapping a card is how the shopper chooses where to ship. The handler
    // calls order.SetDefault, then updateAddress(s), then
    // setDefaultAddress(s.id) — see AddressListContainer.tsx:78-83.
    const office = Array.from(
      document.querySelectorAll('[data-pw="Address"]'),
    ).find((card) => card.textContent?.includes("Office"))!;
    await userEvent.click(office);

    expect(
      store.getState().addressLists.map((a: any) => a.id),
      "tapping an address reordered the stored list",
    ).toEqual([1, 2, 3]);
    expect(
      titlesOnScreen(),
      "tapping an address flipped the sheet upside down; the addresses are drawn bottom-to-top from the second tap on",
    ).toEqual(["Home", "Office", "Gym"]);
  });

  it("ships to the address the shopper tapped, not to another one", async () => {
    const { store } = await openTheSheet();

    // "Home" starts as the default. Tapping "Office" has to move it. Checkout,
    // PlaceOrderWidget and ShippingAddressContainer all read the delivery
    // address as `addressLists.filter((s) => s.is_default === 1)[0]`, so this
    // reads it the same way.
    const office = Array.from(
      document.querySelectorAll('[data-pw="Address"]'),
    ).find((card) => card.textContent?.includes("Office"))!;
    await userEvent.click(office);

    const chosen = store
      .getState()
      .addressLists.filter((a: any) => a.is_default === 1)[0];
    expect(
      chosen?.address,
      "the shopper tapped Office and checkout would ship somewhere else",
    ).toBe("Office");
    expect(
      store.getState().addressLists.filter((a: any) => a.is_default === 1)
        .length,
      "more than one address is marked as the delivery address, so which one checkout picks depends on their order",
    ).toBe(1);
  });
});

// Saving a new shipping address, from the shopper's side of the button.
//
// This file guards BUG-2: the form used to add its own copy of the address to
// the list after the service had already refreshed the list from the core
// backend. On a good save that showed the address twice; on a refused save it
// showed an address the backend had never stored, under an id made up by
// Math.random.
//
// The order service is replaced rather than answered, and the stand-in behaves
// like the real one: AddAddressList refreshes `addressLists` itself before it
// returns, and it never rejects — it catches its own failures (see
// services/order.ts:293-302 and the tests in tests/services/orderClass.test.ts).
//
// `activeIndex` is false so the map never mounts. It needs Google Maps and has
// nothing to do with saving.
import { describe, expect, it, vi } from "vitest";

import AddAddressForm from "components/Cart/AddAddressForm";
import { useAppStore } from "store";

import { renderWithProviders, userEvent } from "../../render";

const AddAddressList = vi.fn();

vi.mock("services/order", () => ({
  default: {
    AddAddressList: (...args: any[]) => AddAddressList(...args),
    UpdateAddressList: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("services/auth", () => ({
  default: { UpdateName: vi.fn() },
}));

/** A filled-in form. isValid() needs every one of these to let the button work. */
const filledForm = {
  location: { latitude: 33.5, longitude: 36.3 },
  Country: { name: "Syria", code: "sy" },
  address: "New flat",
  address_detail: "Second floor, blue door",
  region: " | Damascus | Old City",
  region_details: {
    city: "Old City",
    province: "Damascus",
    town: "",
    street: "",
    building: "",
  },
  contact_info: {
    contact_person_name: "Ada",
    phone: "+10000000000",
    alternative_phone: "",
  },
};

/** The one address the shopper had before they added another. */
const existingAddress = { id: 11, address: "Home", is_default: 1 };

async function openTheFormAndSave() {
  await renderWithProviders(
    <AddAddressForm
      activeIndex={false}
      setOpenSelect={() => {}}
      slidePrev={() => {}}
      setAddressDetails={() => {}}
    />,
    {
      country: "sy",
      path: "/cart",
      store: {
        countries: [],
        addressLists: [{ ...existingAddress }],
        addressDetails: { ...filledForm },
      },
    },
  );

  const save = document.querySelector('[data-pw="AddSaveButton"]')!;
  await userEvent.click(save);
}

describe("saving a new shipping address", () => {
  it("lists the saved address once, with the id the core backend gave it", async () => {
    // The real service refreshes the list from /customer/address/list before it
    // returns, so by the time the form carries on, the new address is already
    // there under its real id.
    AddAddressList.mockImplementation(async ({ callback }: any) => {
      useAppStore.setState({
        addressLists: [
          { ...existingAddress },
          { id: 77, address: "New flat" },
        ] as any,
      });
      callback(77);
    });

    await openTheFormAndSave();

    expect(
      useAppStore.getState().addressLists.map((a: any) => a.id),
      "the just-saved address is in the list more than once — the form added its own copy on top of the list the core backend returned",
    ).toEqual([11, 77]);
  });

  it("adds nothing to the list when the core backend refuses the save", async () => {
    // What the real service does on a refusal: it logs, it leaves the list
    // alone, it never calls the callback, and it does not reject.
    AddAddressList.mockResolvedValue(undefined);

    await openTheFormAndSave();

    expect(
      useAppStore.getState().addressLists.map((a: any) => a.address),
      "an address the core backend refused to save was put in the list anyway; the shopper can pick it, and checkout then sends an address_id the backend has never seen",
    ).toEqual(["Home"]);
  });
});

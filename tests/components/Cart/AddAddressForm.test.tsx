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
import { beforeAll, describe, expect, it, vi } from "vitest";

import AddAddressForm from "components/Cart/AddAddressForm";
import { useAppStore } from "store";

import { renderWithProviders, userEvent, waitFor } from "../../render";

// jsdom has no `scrollIntoView`, and `shake()` calls it before it adds the
// class this file asserts on (`components/Cart/AddAddressForm.tsx`). Without
// this the shake throws and the assertion reads "no field was shaken" for a
// form that identified the field correctly — a gap in the environment reported
// as a bug in the app. A real browser needs no stub.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const AddAddressList = vi.fn();

vi.mock("services/order", () => ({
  default: {
    AddAddressList: (...args: any[]) => AddAddressList(...args),
    UpdateAddressList: vi.fn().mockResolvedValue(undefined),
  },
}));

// `UserID` is here for the editing case only. That one renders the map, the map
// asks for the country's boundaries, and `fetchData` reads `auth.UserID()` on
// the way out. A mock without it throws from a promise nobody awaits, which
// vitest reports as an unhandled rejection on the whole file and not on the case
// that caused it.
vi.mock("services/auth", () => ({
  default: { UpdateName: vi.fn(), UserID: vi.fn(() => 1) },
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

async function openTheFormAndSave(form: Record<string, unknown> = filledForm) {
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
        addressDetails: { ...form },
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
  // BUG-3 — a field the form never received, rather than one the shopper
  // cleared.
  //
  // The two are not the same object. `startUpdateAddress`
  // (`store/Cart/reducer.ts`) rebuilds `addressDetails` from the backend's
  // answer, and a key the answer omits is `undefined` — not `""`. `isValid()`
  // refuses either way, so Save stays grey and pressing it runs `validate()`.
  // `validate()` asks `?.length === 0`, and `undefined?.length === 0` is false,
  // so it shakes nothing and returns. The shopper presses Save and **nothing
  // happens at all**: no movement, no message, no reason.
  //
  // Found by BUY-03 on staging, where the edit form opened holding every field
  // undefined and the case could only report "the edit form did not close after
  // Save".
  it("tells the shopper which field is missing, not only which one is empty", async () => {
    AddAddressList.mockResolvedValue(undefined);

    // Absent, not blank. Deleting the key is the point of this case.
    const { address_detail: _omitted, ...missingDetailLine } = filledForm;

    await openTheFormAndSave(missingDetailLine);

    expect(
      document.querySelector(".details-border.shake-anim"),
      "pressing Save with the detail line missing did nothing the shopper can " +
        "see: the save was refused and no field was shaken, so there is no way " +
        "to tell a broken form from a form that is waiting for something",
    ).not.toBeNull();
  });

  // The same fault on the phone, and a worse comparison. `validate()` asks
  // `?.length < 5`, and `undefined < 5` is false — so a missing phone did not
  // even reach the "too short" branch that a typed-but-short one does.
  it("shakes the phone when it is missing, not only when it is too short", async () => {
    AddAddressList.mockResolvedValue(undefined);

    await openTheFormAndSave({
      ...filledForm,
      contact_info: { contact_person_name: "Ada", alternative_phone: "" },
    });

    expect(
      document.querySelector(".phone-border.shake-anim"),
      "pressing Save with no phone at all did nothing the shopper can see, " +
        "although a phone of four digits is shaken",
    ).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Editing an address the account already has.
//
// A different entry point from every case above, and the difference is where
// `addressDetails` comes from. Adding starts from `initAddressForm`
// (`store/Cart/reducer.ts`), which writes **every** key the form reads,
// `location: { latitude: null, longitude: null }` included. Editing starts from
// `startUpdateAddress`, which spreads whatever the core backend sent for that
// address and adds two keys of its own — so a key the backend does not send is
// simply not there.
//
// `location` is one of those keys, and the form reaches into it without a guard.
// ---------------------------------------------------------------------------
describe("editing an address the account already has", () => {
  /** What `startUpdateAddress` leaves in the store for an address the core
   *  backend returned **without** a `location` object.
   *
   *  Built the same way the reducer builds it, rather than written out by hand,
   *  so this cannot drift away from what the app really holds. */
  const openedForEditing = (backendAddress: Record<string, unknown>) => {
    useAppStore.getState().startUpdateAddress(backendAddress as any);
    return useAppStore.getState().addressDetails;
  };

  it("draws the form for an address the backend sent with no location", async () => {
    // A saved address as the list can return it: flat coordinates, no nested
    // `location` object. Every other field the form wants is present, so
    // nothing here is about validation.
    const details = openedForEditing({
      id: 42,
      address: "Probe address",
      address_detail: "Second floor, blue door",
      latitude: null,
      longitude: null,
      region_details: {
        city: "Old City",
        province: "Damascus",
        town: "",
        street: "",
        building: "",
      },
      contact_info: { name: "Ada", phone: "+10000000000" },
    });

    await renderWithProviders(
      // `activeIndex` true and a country in the store are what the checkout
      // gives it: both are needed before the map is drawn, and the map is where
      // the location is read. A form rendered with the map off never touches it,
      // which is why every case above passes.
      <AddAddressForm
        activeIndex={true}
        setOpenSelect={() => {}}
        slidePrev={() => {}}
        setAddressDetails={() => {}}
      />,
      {
        country: "sy",
        path: "/cart",
        store: {
          countries: [{ id: 1, name: "Syria", iso: "sy" }],
          addressLists: [{ ...existingAddress }],
          addressDetails: { ...details },
        },
      },
    );

    expect(
      document.querySelector('[data-pw="AddSaveButton"]'),
      "the edit form drew no save button for an address the core backend sent " +
        "without a `location` object, so the shopper cannot save the change " +
        "they just typed",
    ).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The rest of the form: typing into each field, the shake for every refused
// field, the guest-name field, editing, and a save that throws.
// ---------------------------------------------------------------------------
describe("the address form fields and buttons", () => {
  async function openForm(
    form: Record<string, unknown>,
    props: Record<string, unknown> = {},
    extraStore: Record<string, unknown> = {},
  ) {
    const handlers = {
      setOpenSelect: vi.fn(),
      slidePrev: vi.fn(),
      setAddressDetails: vi.fn(),
    };
    await renderWithProviders(
      <AddAddressForm activeIndex={false} {...handlers} {...(props as any)} />,
      {
        country: "sy",
        path: "/cart",
        store: {
          countries: [],
          addressLists: [],
          addressDetails: { ...form },
          ...extraStore,
        },
      },
    );
    return handlers;
  }
  const pw = (id: string) =>
    document.querySelector(`[data-pw="${id}"]`) as HTMLInputElement;
  const save = () => userEvent.click(pw("AddSaveButton"));

  it("writes what the shopper types into every field of the stored address", async () => {
    await openForm({ contact_info: {} });

    await userEvent.type(pw("text-area-placeholder"), "Blue door");
    await userEvent.type(pw("add-address-input"), "Home");
    await userEvent.type(pw("recipient-name-input"), "Ada");
    await userEvent.type(pw("Contact-Phone-input"), "0999");
    await userEvent.type(pw("optional-input"), "0888");

    const details = useAppStore.getState().addressDetails as any;
    expect(details.address_detail, "the detail line was not stored").toBe("Blue door");
    expect(details.address, "the address title was not stored").toBe("Home");
    expect(
      details.contact_info.contact_person_name,
      "the recipient name was not stored",
    ).toBe("Ada");
    expect(details.contact_info.phone, "the contact phone was not stored").toBe("0999");
    expect(
      details.contact_info.alternative_phone,
      "the alternative phone was not stored",
    ).toBe("0888");
  });

  it("opens the region list when the shopper taps 'Change From List'", async () => {
    const { setOpenSelect } = await openForm({ contact_info: {} });
    await userEvent.click(pw("Change-From-List"));
    expect(setOpenSelect, "tapping the region field did not open the region list").toHaveBeenCalled();
  });

  it("asks a guest for their name, shakes the name field until it is filled, then saves it to the account", async () => {
    AddAddressList.mockResolvedValue(undefined);
    const auth = (await import("services/auth")).default as any;
    auth.UpdateName.mockClear();
    await openForm(filledForm, { userName: "" });

    await save();
    expect(
      document.querySelector(".username-border.shake-anim"),
      "a guest pressed Save with no name and the name field was not shaken",
    ).not.toBeNull();
    await waitFor(
      () =>
        expect(
          document.querySelector(".username-border.shake-anim"),
          "the shake did not stop after 1.3 seconds",
        ).toBeNull(),
      { timeout: 2500 },
    );

    await userEvent.type(pw("user-name-input"), "Ada Guest");
    await save();
    expect(AddAddressList, "the filled guest form was not saved").toHaveBeenCalled();
    expect(
      auth.UpdateName,
      "the name the guest typed was not saved to the account",
    ).toHaveBeenCalledWith("Ada Guest");
  });

  it.each([
    ["title-border", { address: "" }],
    ["region-border", { region: "" }],
    ["name-border", { contact_info: { phone: "+10000000000" } }],
  ])("shakes %s when that field holds up the save", async (field, change) => {
    await openForm({ ...filledForm, ...change });
    await save();
    expect(
      document.querySelector(`.${field}.shake-anim`),
      `the field (${field}) that refused the save was not shaken`,
    ).not.toBeNull();
  });

  it("does nothing on Save when no field can be found to shake", async () => {
    await openForm({ ...filledForm, region: "" });
    document.querySelector(".region-border")!.classList.remove("region-border");
    await save();
    expect(
      document.querySelector(".shake-anim"),
      "a field was shaken although the refused field is not on the page",
    ).toBeNull();
  });

  it("saves an edited address to the core backend, updates the list and goes back", async () => {
    const order = (await import("services/order")).default as any;
    order.UpdateAddressList.mockImplementation(async ({ callback }: any) => callback());
    const edited = { ...filledForm, id: 11, address: "Home (new)" };
    const { slidePrev } = await openForm(edited, {}, {
      addressLists: [{ ...existingAddress }],
    });

    expect(pw("AddSaveButton").textContent, "an existing address must offer 'Edit & Save'").toBe(
      "Edit & Save",
    );
    await save();
    const sent = order.UpdateAddressList.mock.calls[0]?.[0]?.address;
    expect(sent?.id, "the edit was not sent for address 11").toBe(11);
    expect(sent?.Country?.code, "the edit did not carry the country from the URL").toBe("sy");
    expect(slidePrev, "the form did not go back after the edit was saved").toHaveBeenCalled();
    expect(
      (useAppStore.getState().addressLists as any[]).find((a) => a.id === 11)?.address,
      "the list still shows the old title after the edit was saved",
    ).toBe("Home (new)");
  });

  it("stops the loading state when saving throws", async () => {
    // The service turns the loading state on before it calls the backend.
    AddAddressList.mockImplementation(async () => {
      useAppStore.setState({ orderLoading: true } as any);
      throw new Error("boom");
    });
    await openForm(filledForm, {}, { orderLoading: false });
    await save();
    await waitFor(() =>
      expect(
        (useAppStore.getState() as any).orderLoading,
        "a save that threw left the form in its loading state",
      ).toBe(false),
    );
    expect(AddAddressList, "the save was not tried").toHaveBeenCalled();
  });

  it("opens and closes the map inside the form, and hides Save while the map is open", async () => {
    await renderWithProviders(
      <AddAddressForm
        activeIndex={true}
        setOpenSelect={() => {}}
        slidePrev={() => {}}
        setAddressDetails={(e: any) => useAppStore.getState().setAddressDetails(e)}
      />,
      {
        country: "sy",
        path: "/cart",
        store: {
          countries: [{ id: 1, name: "Syria", iso: "sy", latitude: "33", longitude: "36" }],
          addressDetails: { ...filledForm },
        },
      },
    );

    await userEvent.click(pw("map-toggle"));
    expect(pw("AddSaveButton"), "Save must be hidden while the map is open").toBeNull();
    await userEvent.click(pw("cancel-button"));
    expect(pw("AddSaveButton"), "Save did not come back after the map closed").not.toBeNull();
    expect(
      (useAppStore.getState().addressDetails as any).location,
      "Cancel on the map did not clear the picked point",
    ).toEqual({ latitude: null, longitude: null });
  });
});

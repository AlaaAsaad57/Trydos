// The address list in the profile settings (components/settings/PersonalInfoAddress.tsx).
//
// It stores the country list, loads the addresses, and lists them with edit
// and delete controls. Edit and "Add New Shipping Address" switch to the
// address form (PersonalInfoAddressModal, stubbed here); delete opens the
// delete confirmation (stubbed).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAddressList = vi.hoisted(() => vi.fn());
vi.mock("services/order", () => ({ default: { GetAddressList: getAddressList } }));

vi.mock("components/Cart/OrdersPage", () => ({
  DeleteModalComponent: ({ slidePrev, closeModal, deletedAddress }: any) => (
    <div data-testid="delete-modal" data-address={deletedAddress.id}>
      <button onClick={slidePrev}>delete done</button>
      <button onClick={closeModal}>delete close</button>
    </div>
  ),
}));

vi.mock("components/settings/PersonalInfoAddressModal", () => ({
  default: ({ goBack }: any) => (
    <div data-testid="address-form">
      <button onClick={goBack}>form back</button>
    </div>
  ),
}));

import PersonalInfoAddress from "components/settings/PersonalInfoAddress";
import { renderWithProviders, screen, userEvent } from "../../render";

const COUNTRIES = [{ id: 1, iso: "sy" }];

/** An entry of the saved-address list, the shape `order.GetAddressList` stores
 *  (it carries `contact_info` and `region_details`, unlike an order's
 *  shipping address). Invented values only. */
function listAddress(overrides: any = {}) {
  return {
    id: 1,
    is_default: 0,
    address: "1 Test Street",
    address_detail: "Flat 1",
    region_details: { country: "Syria", city: "Damascus" },
    contact_info: { contact_person_name: "Test User", phone: "+10000000000" },
    ...overrides,
  };
}

function spies() {
  return {
    setCountries: vi.fn(),
    setAddressDetails: vi.fn(),
    initAddressForm: vi.fn(),
    startUpdateAddress: vi.fn(),
  };
}

beforeEach(() => getAddressList.mockReset());
afterEach(() => vi.clearAllMocks());

async function renderList(store: any = {}) {
  const s = { ...spies(), ...store };
  const r = await renderWithProviders(
    <PersonalInfoAddress countries={COUNTRIES} isRtl={false} local="gb-en" />,
    { store: s },
  );
  return { ...r, spies: s };
}

describe("the address list", () => {
  it("stores the countries, loads the addresses, and says when the list is empty", async () => {
    const { spies } = await renderList({ addressLists: [] });
    expect(spies.setCountries, "the country list was not stored").toHaveBeenCalledWith(COUNTRIES);
    expect(getAddressList, "the addresses were not loaded").toHaveBeenCalled();
    expect(screen.getByText("Your Address List Is Empty"), "an empty list did not say so").toBeInTheDocument();
  });

  it("lists each address with its phone and contact name, and fades while loading", async () => {
    const first = listAddress({ id: 1, is_default: 1 });
    const second = listAddress({
      id: 2,
      address: "Second street",
      contact_info: { name: "Fallback Name" },
    });
    const { container } = await renderList({ addressLists: [first, second], orderLoading: true });
    expect(screen.getByText("Second street"), "the second address is not listed").toBeInTheDocument();
    expect(screen.getByText("Fallback Name"), "a contact with no person name did not fall back to the name").toBeInTheDocument();
    expect(
      (container.firstChild as HTMLElement).className,
      "the list is not faded while addresses load",
    ).toContain("opacity-65");
    expect(
      document.querySelectorAll('[data-pw="Address"]')[0].getAttribute("style"),
      "the default address is not outlined",
    ).toContain("1px solid");

    const user = userEvent.setup();
    await user.click(screen.getByText("Second street"));
    expect(screen.queryByTestId("address-form"), "tapping an address body opened the form").not.toBeInTheDocument();
  });
});

describe("the address controls", () => {
  it("edit starts updating that address and opens the form; the form's back returns", async () => {
    const address = listAddress({ id: 7 });
    const { spies, store } = await renderList({ addressLists: [address] });
    const user = userEvent.setup();

    await user.click(document.querySelector('[data-pw="Edit-Addres-Icon"]')!);
    expect(spies.startUpdateAddress, "edit did not start updating the address").toHaveBeenCalledWith(address);
    expect(spies.setAddressDetails, "edit did not load the address into the form").toHaveBeenCalledWith(address);
    expect(screen.getByTestId("address-form"), "edit did not open the address form").toBeInTheDocument();

    await user.click(screen.getByText("form back"));
    expect(spies.setAddressDetails, "going back did not clear the form").toHaveBeenLastCalledWith(null);
    expect((store.getState() as any).isActiveAddress, "going back left the form open").toBe(false);
  });

  it("add opens an empty form", async () => {
    const { spies } = await renderList({ addressLists: [] });
    await userEvent.setup().click(document.querySelector('[data-pw="AddAddres"]')!);
    expect(spies.initAddressForm, "add did not start an empty form").toHaveBeenCalled();
    expect(screen.getByTestId("address-form"), "add did not open the address form").toBeInTheDocument();
  });

  it("delete opens the confirmation; closing it keeps the list and finishing clears the form", async () => {
    const address = listAddress({ id: 9 });
    const { spies } = await renderList({ addressLists: [address] });
    const user = userEvent.setup();

    await user.click(document.querySelector('[data-pw="Delete-Address-Icon"]')!);
    expect(screen.getByTestId("delete-modal").dataset.address, "delete did not ask about this address").toBe("9");
    await user.click(screen.getByText("delete done"));
    expect(spies.setAddressDetails, "finishing the delete did not clear the form").toHaveBeenCalledWith(null);
    await user.click(screen.getByText("delete close"));
    expect(screen.queryByTestId("delete-modal"), "closing the delete confirmation left it open").not.toBeInTheDocument();
  });
});

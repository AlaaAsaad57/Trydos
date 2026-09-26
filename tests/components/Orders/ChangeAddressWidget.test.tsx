// The "change delivery address & note" sheet on an order, and the
// confirmation (ConfirmAddressModal) the shopper must agree to. Confirming
// posts the new address to the market backend (services/order) and reloads
// the order.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChangeAddressWidget from "components/Orders/ChangeAddressWidget";

import { buildAddress } from "../../fixtures/address";
import { buildOrder } from "../../fixtures/order";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { order } = vi.hoisted(() => ({
  order: { changeOrderAddress: vi.fn(), GetAddressList: vi.fn() },
}));
vi.mock("services/order", () => ({ default: order }));

const trackOrderMgmt = vi.fn();
vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackOrderMgmt: (...a: any[]) => trackOrderMgmt(...a),
}));

vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div data-testid="sheet">
      <button onClick={onClose}>close sheet</button>
      {children}
    </div>
  ),
}));
vi.mock("components/setting/orders/OrderItemBanner", () => ({
  default: () => <div data-testid="banner" />,
}));
vi.mock("components/Cart/SelectRegion", () => ({
  default: ({ closeSelect }: any) => <button onClick={closeSelect}>close region</button>,
}));
vi.mock("components/Cart/AddAddressForm", () => ({
  default: ({ setOpenSelect, slidePrev, setAddressDetails }: any) => (
    <div data-testid="address-form">
      <button onClick={setOpenSelect}>open region</button>
      <button onClick={() => setAddressDetails({ id: 99 })}>set details</button>
      <button onClick={() => slidePrev(2)}>saved address 2</button>
      <button onClick={() => slidePrev(undefined)}>form back</button>
    </div>
  ),
}));

/** An address as the address list stores it. */
const listAddress = (id: number, address: string, name: string) => ({
  id,
  address,
  address_detail: `detail ${id}`,
  region_details: { country: "Syria", city: "Damascus" },
  contact_info: id === 2 ? { contact_person_name: name, phone: "0" } : { name, phone: "0" },
});

const ADDRESSES = [listAddress(1, "Home", "Rana"), listAddress(2, "Office", "Omar")];
const ORDER = buildOrder({
  order_group_id: 700,
  shipping_address_data: buildAddress({ address: "Old Street", contact_person_name: "Old Name" }),
} as any);

async function renderSheet(extra: any = {}, store: any = {}) {
  const close = vi.fn();
  const getOrderDetails = vi.fn(async () => {});
  const view = await renderWithProviders(
    <ChangeAddressWidget
      address_id={1}
      close={close}
      getOrderDetails={getOrderDetails}
      ActivePacks={ORDER}
      {...extra}
    />,
    { store: { addressLists: ADDRESSES, ...store } },
  );
  return { ...view, close, getOrderDetails };
}

const addressRows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-pw="Address"]'));
const changeRequest = () => screen.getByText("Change Request");

describe("ChangeAddressWidget", () => {
  beforeEach(() => {
    order.changeOrderAddress.mockReset();
    order.changeOrderAddress.mockResolvedValue({ success: true });
    order.GetAddressList.mockReset();
    order.GetAddressList.mockResolvedValue(undefined);
    trackOrderMgmt.mockReset();
  });

  it("loads the address list and marks the order's current address", async () => {
    await renderSheet();
    expect(order.GetAddressList, "the address list was not loaded").toHaveBeenCalled();
    expect(addressRows()[0].style.border, "the current address is not marked").toContain("1px solid");
    expect(addressRows()[1].style.border, "another address is marked").toBe("");
    expect(screen.getByText("Rana"), "a contact name is missing").toBeInTheDocument();
    expect(screen.getByText("Omar"), "a contact person name is missing").toBeInTheDocument();
  });

  it("does nothing on Change Request while nothing changed, and closes from the sheet", async () => {
    const { close } = await renderSheet();
    fireEvent.click(changeRequest());
    expect(screen.queryByText("Agree & Change"), "a confirm opened with no change").not.toBeInTheDocument();
    fireEvent.click(screen.getByText("close sheet"));
    expect(close, "the sheet did not close").toHaveBeenCalled();
  });

  it("changes to another address after agreeing to the terms", async () => {
    const { close, getOrderDetails } = await renderSheet({}, {});
    fireEvent.click(addressRows()[1]);
    fireEvent.click(changeRequest());
    expect(screen.getByText("Agree & Change"), "the confirmation did not open").toBeInTheDocument();

    // Not agreed yet: nothing is sent.
    fireEvent.click(screen.getByText("Agree & Change"));
    expect(order.changeOrderAddress, "the change was sent before agreeing").not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("I Read And Agree To"));
    fireEvent.click(screen.getByText("Agree & Change"));
    await waitFor(() => expect(close, "the sheet did not close after the change").toHaveBeenCalled());
    expect(order.changeOrderAddress, "the wrong address was sent").toHaveBeenCalledWith({
      order_id: 700,
      address_id: 2,
    });
    expect(trackOrderMgmt, "the change was not tracked").toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ order_id: 700, from_address_id: 1, to_address_id: 2, note_added: false }),
    );
    expect(getOrderDetails, "the order was not reloaded").toHaveBeenCalled();
  });

  it("keeps the sheet open when the market backend refuses the change", async () => {
    order.changeOrderAddress.mockRejectedValue(new Error("refused"));
    const { close } = await renderSheet({}, { language: "ar" });
    fireEvent.click(addressRows()[1]);
    fireEvent.click(changeRequest());
    fireEvent.click(screen.getByText("I Read And Agree To"));
    fireEvent.click(screen.getByText("Agree & Change"));
    await waitFor(() => expect(order.changeOrderAddress, "the change was not tried").toHaveBeenCalled());
    expect(close, "a refused change closed the sheet").not.toHaveBeenCalled();
  });

  it("'I Disagree' closes the confirmation without sending", async () => {
    await renderSheet();
    fireEvent.click(addressRows()[1]);
    fireEvent.click(changeRequest());
    fireEvent.click(screen.getByText("I Disagree"));
    expect(screen.queryByText("Agree & Change"), "the confirmation stayed open").not.toBeInTheDocument();
    expect(order.changeOrderAddress, "disagreeing sent the change").not.toHaveBeenCalled();
  });

  it("shows the order's own address as 'from' when it is not in the list", async () => {
    await renderSheet({ address_id: 555 });
    fireEvent.click(addressRows()[1]);
    fireEvent.click(changeRequest());
    expect(screen.getByText("Old Street"), "the order's own address is not the 'from' address").toBeInTheDocument();
    fireEvent.click(screen.getByText("I Disagree"));
    fireEvent.click(changeRequest());
    fireEvent.click(screen.getByText("I Read And Agree To"));
    fireEvent.click(screen.getByText("Agree & Change"));
    await waitFor(() =>
      expect(order.changeOrderAddress, "the change was not sent").toHaveBeenCalledWith({
        order_id: 700,
        address_id: 2,
      }),
    );
  });

  it("keeps a delivery note up to 200 characters", async () => {
    await renderSheet();
    fireEvent.click(screen.getByText("Delivery Note"));
    const note = screen.getByPlaceholderText("Add Delivery Instructions...") as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "Ring twice" } });
    expect(screen.getByText("10/200"), "the note length is not shown").toBeInTheDocument();
    fireEvent.change(note, { target: { value: "x".repeat(201) } });
    expect(note.value, "a note over 200 characters was kept").toBe("Ring twice");
    fireEvent.click(screen.getByText("Delivery Address"));
    expect(addressRows().length > 0, "the address tab did not come back").toBe(true);
  });

  // BUG-products-3: ChangeAddressWidget.tsx lines 60, 61-75. The sheet offers a
  // "Delivery Note" tab and turns the Change Request button on for a note alone,
  // but ChangeAddress() sends only { order_id, address_id } — the note is never
  // sent to the market backend (services/order.ts changeOrderAddress has no
  // note field either). A shopper who writes a note is told the change was
  // made, and the note is lost.
  it.fails("BUG-products-3: a delivery note the shopper confirms must be sent with the change", async () => {
    await renderSheet();
    fireEvent.click(screen.getByText("Delivery Note"));
    fireEvent.change(screen.getByPlaceholderText("Add Delivery Instructions..."), {
      target: { value: "Ring twice" },
    });
    fireEvent.click(changeRequest());
    fireEvent.click(screen.getByText("I Read And Agree To"));
    fireEvent.click(screen.getByText("Agree & Change"));
    await waitFor(() => expect(order.changeOrderAddress).toHaveBeenCalled());
    expect(
      JSON.stringify(order.changeOrderAddress.mock.calls[0][0]),
      "the confirmed delivery note was not sent to the market backend",
    ).toContain("Ring twice");
  });

  it("edits an address in the address form, and picks the saved one", async () => {
    const { store } = await renderSheet();
    const edit = addressRows()[1].querySelector(".map-element-icon") as HTMLElement;
    fireEvent.click(edit);
    expect(store.getState().isActiveAddress, "editing did not open the form").toBe(true);
    expect(addressRows()[0].style.border, "clicking the edit icon selected the address").toContain("1px solid");

    fireEvent.click(screen.getByText("open region"));
    fireEvent.click(screen.getByText("close region"));
    expect(screen.queryByText("close region"), "the region picker stayed open").not.toBeInTheDocument();
    fireEvent.click(screen.getByText("set details"));
    expect(store.getState().addressDetails?.id, "the form's details were not stored").toBe(99);

    fireEvent.click(screen.getByText("saved address 2"));
    expect(screen.queryByTestId("address-form"), "the form stayed open after saving").not.toBeInTheDocument();
    expect(addressRows()[1].style.border, "the saved address was not selected").toContain("1px solid");
  });

  it("adds a new address, and leaves the form with back or without a saved id", async () => {
    await renderSheet();
    fireEvent.click(document.querySelector('[data-pw="Add-Shipping-Address"]') as HTMLElement);
    expect(screen.getByTestId("address-form"), "adding did not open the form").toBeInTheDocument();
    fireEvent.click(screen.getByText("form back"));
    expect(screen.queryByTestId("address-form"), "leaving the form did not close it").not.toBeInTheDocument();
    expect(addressRows()[0].style.border, "leaving without saving changed the selection").toContain("1px solid");

    fireEvent.click(document.querySelector('[data-pw="Add-Shipping-Address"]') as HTMLElement);
    fireEvent.click(document.querySelector('img[src="/icons/backIcon.svg"]')!.parentElement as HTMLElement);
    expect(screen.queryByTestId("address-form"), "the back arrow did not close the form").not.toBeInTheDocument();
  });
});

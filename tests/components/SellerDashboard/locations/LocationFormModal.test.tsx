// The create / edit form for one shop location.
//
// The form talks to the locations backend three ways:
//   - create mode loads the country list from the create lookups
//   - edit mode loads the row and its own country list from the edit endpoint
//   - Save sends either a create or an update
// The map is stood in for by one button that "drops a pin", because the real
// map needs Google's script, and this file is about the form around it.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getShopLocationLookups = vi.fn();
const getShopLocationForEdit = vi.fn();
const addShopLocation = vi.fn();
const updateShopLocation = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getShopLocationLookups: (...a: unknown[]) => getShopLocationLookups(...a),
    getShopLocationForEdit: (...a: unknown[]) => getShopLocationForEdit(...a),
    addShopLocation: (...a: unknown[]) => addShopLocation(...a),
    updateShopLocation: (...a: unknown[]) => updateShopLocation(...a),
  },
}));

vi.mock("components/SellerDashboard/locations/LocationMapPicker", () => ({
  default: ({
    value,
    onPick,
  }: {
    value: { lat: number; lng: number } | null;
    onPick: (p: { lat: number; lng: number }) => void;
  }) => (
    <div>
      <span data-testid="map-value">
        {value ? `${value.lat},${value.lng}` : "no pin"}
      </span>
      <button type="button" onClick={() => onPick({ lat: 33.5, lng: 36.25 })}>
        drop pin
      </button>
    </div>
  ),
}));

import LocationFormModal from "components/SellerDashboard/locations/LocationFormModal";

import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const SELLER_ID = "77";

const COUNTRIES = [
  { id: 1, name: "SYRIA", nicename: "Syria" },
  { id: 2, name: "IRAQ" },
];

const ROW = {
  id: 9,
  name: "Damascus Warehouse",
  address: "Mazzeh",
  latitude: "33.51",
  longitude: "36.27",
  status: 1 as const,
  country: { id: 1, name: "SYRIA" },
};

type Props = Partial<Parameters<typeof LocationFormModal>[0]>;

async function mount(props: Props = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const view = await renderWithProviders(
    <LocationFormModal
      sellerId={SELLER_ID}
      location={null}
      canSubmit
      onClose={onClose}
      onSaved={onSaved}
      {...props}
    />,
  );
  return { ...view, onClose, onSaved };
}

const nameInput = () =>
  document.querySelector('[data-pw="location-name-input"]') as HTMLInputElement;
const countrySelect = () =>
  document.querySelector('[data-pw="location-country-select"]') as HTMLSelectElement;
const addressInput = () =>
  document.querySelector('[data-pw="location-address-input"]') as HTMLTextAreaElement;
const latInput = () =>
  document.querySelector('[data-pw="location-latitude-input"]') as HTMLInputElement;
const lngInput = () =>
  document.querySelector('[data-pw="location-longitude-input"]') as HTMLInputElement;
const saveButton = () => screen.getByRole("button", { name: /Save Changes/ });

beforeEach(() => {
  getShopLocationLookups.mockReset();
  getShopLocationForEdit.mockReset();
  addShopLocation.mockReset();
  updateShopLocation.mockReset();
  getShopLocationLookups.mockResolvedValue({ success: true, data: { countries: COUNTRIES } });
  getShopLocationForEdit.mockResolvedValue({
    success: true,
    data: { location: ROW, lookups: { countries: COUNTRIES } },
  });
});

describe("Location form — loading", () => {
  it("offers the countries from the create lookups in create mode", async () => {
    await mount();
    expect(
      await screen.findByRole("option", { name: "Syria" }),
      "a country's nice name should be offered",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "IRAQ" }),
      "a country without a nice name should fall back to its name",
    ).toBeInTheDocument();
    expect(getShopLocationLookups, "create mode should ask the create lookups").toHaveBeenCalledWith(SELLER_ID);
    expect(screen.getByText("Add Location"), "create mode should be titled Add Location").toBeInTheDocument();
  });

  it("fills the form from the edit endpoint in edit mode", async () => {
    getShopLocationForEdit.mockResolvedValue({
      success: true,
      data: { location: { ...ROW, name: "Fresh Name" }, lookups: { countries: COUNTRIES } },
    });
    await mount({ location: ROW });
    await waitFor(() =>
      expect(nameInput()?.value, "the name should come from the fresh edit answer").toBe("Fresh Name"),
    );
    expect(countrySelect().value, "the saved country should be picked").toBe("1");
    expect(latInput().value, "the saved latitude should be filled").toBe("33.51");
    expect(screen.getByTestId("map-value").textContent, "the map should get the saved pin").toBe("33.51,36.27");
    expect(getShopLocationForEdit, "edit mode should load the row by id").toHaveBeenCalledWith(SELLER_ID, 9);
    expect(screen.getByText("Edit Location"), "edit mode should be titled Edit Location").toBeInTheDocument();
  });

  it("keeps the row it was given when the edit answer carries no location or countries", async () => {
    getShopLocationForEdit.mockResolvedValue({ success: true, data: {} });
    await mount({
      location: { ...ROW, name: null as any, address: null, latitude: null, longitude: null, country: null },
    });
    await waitFor(() => expect(nameInput(), "the form should be drawn").toBeTruthy());
    expect(nameInput().value, "a missing name should become an empty field").toBe("");
    expect(countrySelect().value, "a missing country should leave the select empty").toBe("");
    expect(screen.getByTestId("map-value").textContent, "no coordinates means no pin").toBe("no pin");
  });

  it("shows the backend's message when the edit load is refused", async () => {
    getShopLocationForEdit.mockResolvedValue({ success: false, message: "Location not found." });
    await mount({ location: ROW });
    expect(
      await screen.findByText("Location not found."),
      "the seller should read why the locations backend refused the edit load",
    ).toBeInTheDocument();
  });

  it("falls back to a generic message when the create lookups are refused without one", async () => {
    getShopLocationLookups.mockResolvedValue({ success: false, data: {} });
    await mount();
    expect(
      await screen.findByText("Failed to load locations"),
      "a refusal with no message should still say the load failed",
    ).toBeInTheDocument();
  });

  it("shows a thrown value that is not an Error", async () => {
    getShopLocationLookups.mockRejectedValue("network down");
    await mount();
    expect(
      await screen.findByText("network down"),
      "a rejected load should show what it was rejected with",
    ).toBeInTheDocument();
  });

  it("uses an empty country list when the create lookups carry none", async () => {
    getShopLocationLookups.mockResolvedValue({ success: true, data: {} });
    await mount();
    await waitFor(() => expect(countrySelect(), "the form should be drawn").toBeTruthy());
    expect(
      screen.getAllByRole("option").map((o) => o.textContent),
      "only the empty choice should be offered",
    ).toEqual(["Select"]);
  });

  it("does not touch the form after it was closed while loading", async () => {
    let finishCreate: (v: unknown) => void = () => {};
    getShopLocationLookups.mockReturnValue(new Promise((r) => (finishCreate = r)));
    const first = await mount();
    first.unmount();
    finishCreate({ success: true, data: { countries: COUNTRIES } });

    let finishEdit: (v: unknown) => void = () => {};
    getShopLocationForEdit.mockReturnValue(new Promise((r) => (finishEdit = r)));
    const second = await mount({ location: ROW });
    second.unmount();
    finishEdit({ success: true, data: { location: ROW } });

    let failLoad: (e: unknown) => void = () => {};
    getShopLocationLookups.mockReturnValue(new Promise((_, rej) => (failLoad = rej)));
    const third = await mount();
    third.unmount();
    failLoad(new Error("late"));

    await new Promise((r) => setTimeout(r, 0));
    expect(
      screen.queryByText("late"),
      "a load that ends after the form closed must not draw anything",
    ).not.toBeInTheDocument();
  });
});

describe("Location form — closing", () => {
  it("closes on Escape, on the close button, on Cancel and on the backdrop", async () => {
    const { onClose, container } = await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose, "a key other than Escape must not close the form").not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose, "Escape should close the form").toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose, "the close button should close the form").toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose, "Cancel should close the form").toHaveBeenCalledTimes(3);

    await userEvent.click(container.querySelector(".bg-black\\/45") as HTMLElement);
    expect(onClose, "a click on the backdrop should close the form").toHaveBeenCalledTimes(4);
  });
});

describe("Location form — checking the fields", () => {
  it("asks for a name and a country, and sends nothing", async () => {
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.click(saveButton());
    expect(screen.getByText("Name is required"), "an empty name must be refused").toBeInTheDocument();
    expect(screen.getByText("Country is required"), "no country must be refused").toBeInTheDocument();
    expect(addShopLocation, "an invalid form must not reach the backend").not.toHaveBeenCalled();
  });

  it("refuses coordinates outside the world", async () => {
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    fireEvent.change(latInput(), { target: { value: "91" } });
    fireEvent.change(lngInput(), { target: { value: "181" } });
    // Submitted directly: the browser's own min/max check would stop a button
    // click first, and this test is about the form's own check behind it.
    fireEvent.submit(latInput().closest("form") as HTMLFormElement);
    expect(
      screen.getByText("Latitude must be between -90 and 90"),
      "a latitude above 90 must be refused",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Longitude must be between -180 and 180"),
      "a longitude above 180 must be refused",
    ).toBeInTheDocument();
  });

  it("clears the name and country errors when either one is edited", async () => {
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.click(saveButton());
    await userEvent.selectOptions(countrySelect(), "1");
    expect(
      screen.queryByText("Name is required"),
      "editing the country should clear the name error too — the uniqueness rule spans both",
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Country is required"), "the country error should clear").not.toBeInTheDocument();
  });
});

describe("Location form — saving", () => {
  it("creates a location with only the fields that were filled", async () => {
    addShopLocation.mockResolvedValue({ success: true });
    const { onSaved } = await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.type(nameInput(), "  New Point  ");
    await userEvent.selectOptions(countrySelect(), "2");
    await userEvent.click(saveButton());

    await waitFor(() => expect(onSaved, "a created location should be confirmed").toHaveBeenCalledWith("Location created successfully"));
    expect(
      addShopLocation.mock.calls[0],
      "the create call should send the trimmed name and the country id, and no empty optional field",
    ).toEqual([SELLER_ID, { name: "New Point", country_id: 2 }]);
  });

  it("takes the coordinates from the map pin and sends every field on update", async () => {
    updateShopLocation.mockResolvedValue({ success: true });
    const { onSaved } = await mount({ location: ROW });
    await waitFor(() => expect(nameInput()?.value).toBe("Damascus Warehouse"));
    await userEvent.clear(addressInput());
    await userEvent.type(addressInput(), "New address");
    await userEvent.click(screen.getByRole("button", { name: "drop pin" }));
    expect(latInput().value, "the pin's latitude should fill the field with 6 decimals").toBe("33.500000");
    await userEvent.click(saveButton());

    await waitFor(() => expect(onSaved, "an updated location should be confirmed").toHaveBeenCalledWith("Location updated successfully"));
    expect(updateShopLocation.mock.calls[0], "the update should carry every filled field").toEqual([
      SELLER_ID,
      9,
      { name: "Damascus Warehouse", country_id: 1, address: "New address", latitude: 33.5, longitude: 36.25 },
    ]);
  });

  it("puts each field refusal under its own input and the summary on top", async () => {
    addShopLocation.mockResolvedValue({
      success: false,
      message: "The given data was invalid.",
      detailed_error: [{ code: "name", message: "This name is taken." }, { code: "x" }, null],
    });
    const { onSaved } = await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.type(nameInput(), "Dup");
    await userEvent.selectOptions(countrySelect(), "1");
    await userEvent.click(saveButton());

    expect(await screen.findByText("This name is taken."), "the name refusal should sit under the name").toBeInTheDocument();
    expect(screen.getByText("The given data was invalid."), "the backend's summary should be shown").toBeInTheDocument();
    expect(onSaved, "a refused save must not be confirmed").not.toHaveBeenCalled();
  });

  it("uses a generic message when the refusal carries none and no field errors", async () => {
    addShopLocation.mockResolvedValue({ success: false, detailed_error: "not a list" });
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.type(nameInput(), "A");
    await userEvent.selectOptions(countrySelect(), "1");
    await userEvent.click(saveButton());
    expect(
      await screen.findByText("Failed to save location"),
      "a bare refusal should still say the save failed",
    ).toBeInTheDocument();
  });

  it("shows a rejection that is not an Error", async () => {
    addShopLocation.mockRejectedValue("offline");
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.type(nameInput(), "A");
    await userEvent.selectOptions(countrySelect(), "1");
    await userEvent.click(saveButton());
    expect(await screen.findByText("offline"), "the rejection value should be shown").toBeInTheDocument();
  });

  it("sends nothing a second time while the first save is running", async () => {
    let finish: (v: unknown) => void = () => {};
    addShopLocation.mockReturnValue(new Promise((r) => (finish = r)));
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.type(nameInput(), "A");
    await userEvent.selectOptions(countrySelect(), "1");
    const form = nameInput().closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(addShopLocation, "a second submit while saving must not send again").toHaveBeenCalledTimes(1);
    finish({ success: true });
  });
});

describe("Location form — read only", () => {
  it("locks every field, offers no Save and sends nothing on submit", async () => {
    await mount({ location: ROW, canSubmit: false });
    await waitFor(() => expect(nameInput()).toBeTruthy());
    expect(screen.getByText("Read only"), "a seller without the permission should be told the form is read only").toBeInTheDocument();
    expect(nameInput().disabled, "the name must be locked").toBe(true);
    expect(screen.queryByRole("button", { name: /Save Changes/ }), "there must be no Save").not.toBeInTheDocument();
    fireEvent.submit(nameInput().closest("form") as HTMLFormElement);
    expect(updateShopLocation, "a read-only form must never send an update").not.toHaveBeenCalled();
  });
});

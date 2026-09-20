// The Locations section of the seller dashboard.
//
// This section is permission-gated four ways, and each gate has its own
// consequence for the seller:
//   READ_LOCATIONS          - without it the list is never even requested
//   CREATE_LOCATION         - without it there is no "Add Location"
//   UPDATE_LOCATION         - without it there is no "Edit"
//   CHANGE_LOCATION_STATUS  - without it there is no Activate / Deactivate
//
// There is no delete in the API, so a location can only be deactivated. The
// tests below check the list, the status filter, the empty and error states,
// the status toggle, and that each permission removes exactly its own control.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getShopLocations = vi.fn();
const changeShopLocationStatus = vi.fn();
const showSuccessMessage = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getShopLocations: (...a: unknown[]) => getShopLocations(...a),
    changeShopLocationStatus: (...a: unknown[]) => changeShopLocationStatus(...a),
  },
}));

vi.mock("components/global/AddToCartMessage", () => ({
  showSuccessMessage: (...a: unknown[]) => showSuccessMessage(...a),
  showErrorMessage: vi.fn(),
}));

// The create/edit form carries a Google map. This section's job is the list,
// so the form is stood in for by something that only says it opened.
vi.mock("components/SellerDashboard/locations/LocationFormModal", () => ({
  default: ({ location }: { location: unknown }) => (
    <div data-testid="location-form">{location ? "editing" : "creating"}</div>
  ),
}));

import LocationsTab from "components/SellerDashboard/locations/LocationsTab";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const SELLER_ID = "77";

/** Every permission on, so a test only turns off the one it is about. */
const ALL_PERMISSIONS = {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canChangeStatus: true,
};

const location = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Damascus Warehouse",
  address: "Mazzeh, Damascus",
  status: 1,
  country: { id: 1, name: "SYRIA", nicename: "Syria" },
  ...over,
});

/** What GET /shop/locations answers with. */
const listAnswer = (locations: unknown[], meta: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    locations,
    meta: { total: locations.length, current_page: 1, last_page: 1, ...meta },
  },
});

async function mount(props: Partial<typeof ALL_PERMISSIONS> = {}) {
  return renderWithProviders(
    <LocationsTab sellerId={SELLER_ID} {...ALL_PERMISSIONS} {...props} />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
  );
}

beforeEach(() => {
  getShopLocations.mockReset();
  changeShopLocationStatus.mockReset();
  showSuccessMessage.mockReset();
  getShopLocations.mockResolvedValue(listAnswer([location()]));
});

describe("Locations section — the list", () => {
  it("shows each location's name and address", async () => {
    getShopLocations.mockResolvedValue(
      listAnswer([
        location(),
        location({ id: 2, name: "Aleppo Pickup", address: "Azizieh, Aleppo" }),
      ]),
    );
    await mount();

    expect(
      await screen.findByText("Damascus Warehouse"),
      "the first location's name should be listed",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aleppo Pickup"),
      "the second location's name should be listed",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Azizieh, Aleppo"),
      "a location's address should be shown under its name",
    ).toBeInTheDocument();
  });

  it("shows the location's country", async () => {
    await mount();
    expect(
      await screen.findByText("Syria"),
      "the country the location sits in should be shown",
    ).toBeInTheDocument();
  });

  it("marks an inactive location as inactive", async () => {
    getShopLocations.mockResolvedValue(listAnswer([location({ status: 0 })]));
    await mount();
    expect(
      await screen.findByText("Inactive"),
      "a location with status 0 must read as Inactive",
    ).toBeInTheDocument();
  });

  it("asks for every status when no filter is picked", async () => {
    await mount();
    await waitFor(() => expect(getShopLocations).toHaveBeenCalled());
    expect(
      getShopLocations.mock.calls[0][1],
      "the first load should ask page 1 with no status filter",
    ).toEqual({ status: null, page: 1 });
  });

  it("re-asks the backend with the status the seller picked", async () => {
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.selectOptions(screen.getByRole("combobox"), "0");

    await waitFor(() => {
      expect(
        getShopLocations.mock.calls.at(-1)?.[1],
        "picking Inactive should ask the backend for status 0, back at page 1",
      ).toEqual({ status: 0, page: 1 });
    });
  });
});

describe("Locations section — nothing to show", () => {
  it("says the shop has no locations yet", async () => {
    getShopLocations.mockResolvedValue(listAnswer([]));
    await mount();
    expect(
      await screen.findByText("No locations found"),
      "an empty shop should be told it has no locations, not left blank",
    ).toBeInTheDocument();
  });

  it("offers to add the first one when the seller may create", async () => {
    getShopLocations.mockResolvedValue(listAnswer([]));
    await mount();
    expect(
      await screen.findByRole("button", { name: /Add your first location/ }),
      "an empty section should offer the action that fills it",
    ).toBeInTheDocument();
  });

  it("offers no add action when the seller may not create", async () => {
    getShopLocations.mockResolvedValue(listAnswer([]));
    await mount({ canCreate: false });
    await screen.findByText("No locations found");
    expect(
      screen.queryByRole("button", { name: /Add your first location/ }),
      "without CREATE_LOCATION the empty state must not offer to add one",
    ).not.toBeInTheDocument();
  });
});

describe("Locations section — when the backend refuses", () => {
  it("shows the backend's own message rather than a generic one", async () => {
    getShopLocations.mockResolvedValue({
      success: false,
      message: "The locations service is unavailable.",
    });
    await mount();
    expect(
      await screen.findByText("The locations service is unavailable."),
      "the seller should read what the locations backend actually said",
    ).toBeInTheDocument();
  });

  it("lets the seller try the same page again", async () => {
    getShopLocations.mockResolvedValue({ success: false, message: "Boom" });
    await mount();
    await screen.findByText("Boom");

    getShopLocations.mockResolvedValue(listAnswer([location()]));
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByText("Damascus Warehouse"),
      "Retry should load the list again and show it",
    ).toBeInTheDocument();
  });
});

describe("Locations section — changing a location's status", () => {
  it("sends the opposite of the status the row is on", async () => {
    changeShopLocationStatus.mockResolvedValue({ success: true, data: { status: 0 } });
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(
      changeShopLocationStatus,
      "deactivating an active location should send status 0 for that location id",
    ).toHaveBeenCalledWith(SELLER_ID, 1, 0);
  });

  it("takes the new status from the backend's answer, not from the guess", async () => {
    changeShopLocationStatus.mockResolvedValue({ success: true, data: { status: 1 } });
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(
      await screen.findByRole("button", { name: "Deactivate" }),
      "the backend kept the location active, so the row must still offer Deactivate",
    ).toBeInTheDocument();
  });

  it("confirms the change to the seller", async () => {
    changeShopLocationStatus.mockResolvedValue({ success: true, data: { status: 0 } });
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => {
      expect(
        showSuccessMessage,
        "a successful status change should be confirmed on screen",
      ).toHaveBeenCalledWith("Status changed successfully");
    });
  });

  it("shows why the change was refused and leaves the row as it was", async () => {
    changeShopLocationStatus.mockResolvedValue({
      success: false,
      message: "This location is used by an open order.",
    });
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(
      await screen.findByText("This location is used by an open order."),
      "the seller should read why the locations backend refused the change",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Deactivate" }),
      "a refused change must not flip the row's status on screen",
    ).toBeInTheDocument();
  });
});

describe("Locations section — the permission gates", () => {
  it("never asks the backend without READ_LOCATIONS", async () => {
    await mount({ canRead: false });
    expect(
      screen.getByText("Access Denied"),
      "a seller without READ_LOCATIONS should be told the section is blocked",
    ).toBeInTheDocument();
    expect(
      getShopLocations,
      "a call the seller has no permission for must not be made at all",
    ).not.toHaveBeenCalled();
  });

  it("hides Add Location without CREATE_LOCATION", async () => {
    await mount({ canCreate: false });
    await screen.findByText("Damascus Warehouse");
    expect(
      screen.queryByRole("button", { name: /Add Location/ }),
      "without CREATE_LOCATION there must be no Add Location button",
    ).not.toBeInTheDocument();
  });

  it("hides Edit without UPDATE_LOCATION", async () => {
    await mount({ canUpdate: false });
    await screen.findByText("Damascus Warehouse");
    expect(
      screen.queryByRole("button", { name: "Edit" }),
      "without UPDATE_LOCATION a row must not offer Edit",
    ).not.toBeInTheDocument();
  });

  it("hides Deactivate without CHANGE_LOCATION_STATUS", async () => {
    await mount({ canChangeStatus: false });
    await screen.findByText("Damascus Warehouse");
    expect(
      screen.queryByRole("button", { name: "Deactivate" }),
      "without CHANGE_LOCATION_STATUS a row must not offer to deactivate",
    ).not.toBeInTheDocument();
  });
});

describe("Locations section — the create / edit form", () => {
  it("opens the form empty from Add Location", async () => {
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: /Add Location/ }));

    expect(
      (await screen.findByTestId("location-form")).textContent,
      "Add Location should open the form with no location loaded",
    ).toBe("creating");
  });

  it("opens the form on the row that was clicked", async () => {
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(
      (await screen.findByTestId("location-form")).textContent,
      "Edit should open the form on the existing location",
    ).toBe("editing");
  });

  it("keeps the form closed until it is asked for", async () => {
    await mount();
    await screen.findByText("Damascus Warehouse");
    expect(
      screen.queryByTestId("location-form"),
      "the form must not be open when the section first loads",
    ).not.toBeInTheDocument();
  });
});

describe("Locations section — more than one page", () => {
  it("shows no page controls for a single page", async () => {
    await mount();
    await screen.findByText("Damascus Warehouse");
    expect(
      screen.queryByRole("button", { name: /Next/ }),
      "one page of locations needs no page controls",
    ).not.toBeInTheDocument();
  });

  it("asks for the next page when the seller clicks Next", async () => {
    getShopLocations.mockResolvedValue(
      listAnswer([location()], { total: 30, current_page: 1, last_page: 3 }),
    );
    await mount();
    await screen.findByText("Damascus Warehouse");

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(
        getShopLocations.mock.calls.at(-1)?.[1],
        "Next should ask the locations backend for page 2",
      ).toEqual({ status: null, page: 2 });
    });
  });
});

// ---------------------------------------------------------------------------
// The permission arriving late
//
// The dashboard page mounts this section as soon as `?tab=locations` is in the
// address, and it passes `canRead` straight from the permissions in the store.
// On a **fresh page load** — a refresh, a bookmark, a link — that store is
// empty for the first render, so the section is mounted with `canRead: false`
// and only told the truth a moment later.
//
// That is an ordinary thing for a React tree to do. What matters is what the
// section does about it.
// ---------------------------------------------------------------------------
describe("Locations section — when the permission arrives after the first render", () => {
  it("asks the backend as soon as READ_LOCATIONS arrives", async () => {
    const view = await mount({ canRead: false });

    expect(
      getShopLocations,
      "the section asked for the list while it had been told it may not read it",
    ).not.toHaveBeenCalled();

    // The permissions land. Nothing else about the section changes — not the
    // shop, not the status filter — which is exactly the situation a refresh
    // on this tab creates.
    view.rerender(<LocationsTab sellerId={SELLER_ID} {...ALL_PERMISSIONS} />);

    await waitFor(() =>
      expect(
        getShopLocations,
        "READ_LOCATIONS arrived and the section never asked for the list, so it keeps its loading skeleton for ever — this is what a seller sees after refreshing the page on the Locations tab",
      ).toHaveBeenCalled(),
    );
  });

  it("draws the list it was waiting for, instead of the loading skeleton", async () => {
    const view = await mount({ canRead: false });
    view.rerender(<LocationsTab sellerId={SELLER_ID} {...ALL_PERMISSIONS} />);

    expect(
      await screen.findByText("Damascus Warehouse"),
      "the location never reached the screen after READ_LOCATIONS arrived, so the section stayed on its skeleton",
    ).toBeInTheDocument();
  });
});

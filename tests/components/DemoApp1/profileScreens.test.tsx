import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The profile screens on real data (Stage 4 of UI-MIGRATION-PLAN.md). Each
// screen is drawn inside the nav context the screen mount gives, with the
// services stubbed: these cases check what the screens send and show, not
// the backends.

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/sy-en/settings",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => router,
  useParams: () => ({ lang: "sy-en" }),
}));

const auth = vi.hoisted(() => ({
  UpdateProfile: vi.fn(async (..._a: unknown[]) => ({ success: true })),
  UpdateProfileImage: vi.fn(async (..._a: unknown[]) => ({ sub_path: "customers/profile/new.jpg" })),
}));
vi.mock("services/auth", () => ({ default: auth }));

const order = vi.hoisted(() => ({
  GetAddressList: vi.fn(async () => {}),
  GetProvinces: vi.fn(async () => {}),
  DeleteAddressList: vi.fn(async (..._a: unknown[]) => {}),
  AddAddressList: vi.fn(async ({ callback }: any) => callback(7)),
  UpdateAddressList: vi.fn(async ({ callback }: any) => callback()),
}));
vi.mock("services/order", () => ({ default: order }));

const ordersCount = vi.hoisted(() => ({ value: 4 as number | null }));
vi.mock("services/orders", () => ({ fetchOrdersCount: async () => ordersCount.value }));

const trackOrder = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackOrder: (...a: unknown[]) => trackOrder(...a),
}));

vi.mock("utils/fetchData", () => ({ fetchData: vi.fn(async () => ({ success: false })) }));
vi.mock("components/settings/BecomeSellerModal", () => ({
  default: () => <div data-testid="become-seller-form" />,
}));
vi.mock("components/Cart/MapElement", () => ({ MapElement: () => <div data-testid="live-map" /> }));
vi.mock("components/settings/GoToSellerDashBoard", () => ({
  default: () => <div data-testid="seller-card" />,
}));

import { useAppStore } from "store";
import { NavCtx, type DemoNav } from "components/DemoApp1/screenNav";
import ProfileScreen from "components/DemoApp1/screens/ProfileScreen";
import PersonalInfoScreen from "components/DemoApp1/screens/PersonalInfoScreen";
import BodyScreen, { bodyError } from "components/DemoApp1/screens/BodyScreen";
import AddressListScreen from "components/DemoApp1/screens/AddressListScreen";
import AddressFormScreen from "components/DemoApp1/screens/AddressFormScreen";
import SettingsScreen from "components/DemoApp1/screens/SettingsScreen";
import PhotoScreen from "components/DemoApp1/screens/PhotoScreen";
import { ORDER_EVENTS } from "utils/orderFunnel";
import { toProfileAddress } from "components/DemoApp1/useProfileData";

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

const SHOPPER = {
  id: 1012,
  name: "Sara Ali",
  phone: "963912345678",
  email: "sara@example.com",
  gender: 2,
  tall: 165,
  weight: 60,
  image: null,
};

/** A saved address in the shape checkout reads (AddressListContainer). */
const HOME = {
  id: 31,
  address: "Home",
  address_detail: "Building 4, flat 2",
  country: "Syria",
  country_iso: "sy",
  region_details: { province: "Damascus", city: "Mazzeh", town: "West", street: "Main" },
  contact_info: { contact_person_name: "Sara Ali", phone: "963912345678" },
  location: { latitude: 33.5, longitude: 36.2 },
  is_default: 1,
};

let nav: DemoNav;

/** Draws a screen the way the mount does: inside the nav context. */
const draw = (ui: React.ReactElement, locale = "sy-en") => {
  nav = {
    shown: null,
    navigate: vi.fn(),
    back: vi.fn(),
    locale,
    t: (key) => key,
  };
  return render(<NavCtx.Provider value={nav}>{ui}</NavCtx.Provider>);
};

beforeEach(() => {
  vi.clearAllMocks();
  ordersCount.value = 4;
  useAppStore.setState({
    userProfile: { ...SHOPPER },
    addressLists: [{ ...HOME }],
    provinces: [],
    center: null,
    shouldAuthinticated: null,
  } as any);
  useAppStore.getState().initAddressForm();
});

afterEach(() => {
  useAppStore.setState({ userProfile: null, addressLists: [] } as any);
});

describe("the profile tab on real data", () => {
  it("shows the shopper's id, name, phone and default address", async () => {
    draw(<ProfileScreen />);
    const card = document.querySelector('[data-pw="demo-profile-card"]')!;
    expect(card.textContent, "the client card should show the market user id").toContain("1012");
    expect(card.textContent, "the client card should show the shopper's name").toContain("Sara Ali");
    expect(card.textContent, "the client card should show the phone in its international form").toContain("+963");
    expect(card.textContent, "the client card should name the default address (is_default: 1)").toContain("Home");
  });

  it("shows the real orders count and the wallet's mock USD balance (A-17)", async () => {
    draw(<ProfileScreen />);
    await waitFor(() =>
      expect(
        document.querySelector('[data-pw="demo-profile-orders"]')?.textContent,
        "the Orders card should show the count from /customer/order/list",
      ).toContain("4 action"),
    );
    expect(
      document.querySelector('[data-pw="demo-profile-wallet"]')?.textContent,
      "the wallet card should show the USD balance of demoWallet.ts (S4-5)",
    ).toContain("1000 USD");
  });

  it("shows no orders count before the count is known, not a false 0", () => {
    ordersCount.value = null;
    draw(<ProfileScreen />);
    expect(
      document.querySelector('[data-pw="demo-profile-orders"]')?.textContent,
      "the Orders card should not say '0 action' when the count is not known",
    ).not.toContain("0 action");
  });

  it("hides 'Unverified account' from a shopper whose phone is on record (S4-6)", () => {
    draw(<ProfileScreen />);
    expect(screen.queryByText("Unverified account"), "a verified shopper should not see the unverified card").toBeNull();
    expect(screen.queryByText("Setup your size profile"), "the size card should still show").not.toBeNull();
    expect(screen.queryByText("Get trydos Business"), "the business card should still show").not.toBeNull();
  });

  it("opens become-a-seller from 'Get trydos Business' (D-25)", () => {
    draw(<ProfileScreen />);
    fireEvent.click(screen.getByText("Start Your Business now"));
    expect(screen.queryByTestId("become-seller-form"), "the old become-a-seller form should open").not.toBeNull();
  });

  it("opens the Settings screen, the old pages and 'Soon available' from its menu (D-23)", () => {
    draw(<ProfileScreen />);
    const row = (i: number) => document.querySelector<HTMLElement>(`[data-pw="demo-menu-${i}"]`)!;
    fireEvent.click(row(0));
    expect(nav.navigate, "Settings should open the new Settings screen (S4-2)").toHaveBeenCalledWith("settings/preferences");
    fireEvent.click(row(1));
    expect(router.push, "Terms should open the old terms page").toHaveBeenCalledWith("/sy-en/terms-of-service");
    fireEvent.click(row(2));
    expect(router.push, "Legal should open the old privacy page").toHaveBeenCalledWith("/sy-en/privacy-policy");
    fireEvent.click(row(3));
    expect(router.push, "About should open the old about page").toHaveBeenCalledWith("/sy-en/about");
    fireEvent.click(row(5));
    expect(router.push, "the language row should open the old language page").toHaveBeenCalledWith("/sy-en/settings/languages");
    fireEvent.click(row(6));
    expect(screen.queryByText("Soon available"), "Login history has no backend yet, so it should say Soon available (A-8)").not.toBeNull();
  });
});

describe("personal info on real data", () => {
  const edit = () => fireEvent.click(screen.getByText("Edit"));
  const type = (testId: string, value: string) =>
    fireEvent.change(document.querySelector(`[data-pw="${testId}"]`)!, { target: { value } });

  it("starts from the profile and sends only the changed name", async () => {
    draw(<PersonalInfoScreen />);
    expect(
      (document.querySelector('[data-pw="demo-personal-name"]') as HTMLInputElement).value,
      "the name field should start from the profile",
    ).toBe("Sara Ali");
    edit();
    type("demo-personal-name", "Sara A.");
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-personal-save"]')!));
    expect(auth.UpdateProfile, "only the changed name should be sent").toHaveBeenCalledWith(
      { name: "Sara A." },
      expect.objectContaining({ id: 1012 }),
    );
  });

  it("sends the gender as the backend's number", async () => {
    draw(<PersonalInfoScreen />);
    edit();
    fireEvent.click(document.querySelector('[data-pw="demo-gender-man"]')!);
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-personal-save"]')!));
    expect(auth.UpdateProfile, "Man should be sent as gender 1").toHaveBeenCalledWith(
      { gender: 1 },
      expect.anything(),
    );
  });

  it("opens the code sheet for a new e-mail and never sends the e-mail (S4-8)", async () => {
    draw(<PersonalInfoScreen />);
    edit();
    type("demo-personal-email", "new@example.com");
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-personal-save"]')!));
    expect(screen.queryByText("verification Email !"), "a new e-mail should open the code sheet").not.toBeNull();
    expect(auth.UpdateProfile, "the e-mail must not be sent while the backend has no e-mail code").not.toHaveBeenCalled();
  });
});

describe("body measurements on real data", () => {
  it("keeps the old size form's limits (D-28)", () => {
    expect(bodyError("", "70"), "an empty height should be refused").toBe("Height is required");
    expect(bodyError("100", "70"), "a height under 110 cm should be refused").toBe("Height must be between 110 and 250 cm");
    expect(bodyError("170", "200"), "a weight over 180 kg should be refused").toBe("Weight must be between 40 and 180 kg");
    expect(bodyError("170", "70"), "a height and weight inside the limits should pass").toBeNull();
  });

  it("sends the height and the weight, and not the foot size (no backend field, C-1)", async () => {
    draw(<BodyScreen />);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(document.querySelector('[data-pw="demo-body-height"]')!, { target: { value: "170" } });
    fireEvent.change(document.querySelector('[data-pw="demo-body-foot"]')!, { target: { value: "42" } });
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-body-save"]')!));
    expect(auth.UpdateProfile, "the height and weight should be sent as numbers, with no foot size").toHaveBeenCalledWith(
      { tall: 170, weight: 60 },
      expect.anything(),
    );
  });

  it("says why a value is refused and sends nothing", async () => {
    draw(<BodyScreen />);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(document.querySelector('[data-pw="demo-body-height"]')!, { target: { value: "90" } });
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-body-save"]')!));
    expect(screen.queryByText("Height must be between 110 and 250 cm"), "the refusal should be said in a toast").not.toBeNull();
    expect(auth.UpdateProfile, "a refused height must not be sent").not.toHaveBeenCalled();
  });
});

describe("an address row, as the profile screens read it", () => {
  it("reads the place from region_details, street first, as the design writes it", () => {
    const address = toProfileAddress(HOME);
    expect(address.area, "the area should run street, town, city, province").toEqual(["Main", "West", "Mazzeh", "Damascus"]);
    expect(address.countryIso, "the country code should be kept to name the country in the page's language").toBe("sy");
    expect(address.isDefault, "is_default: 1 should mark the default address (D-29)").toBe(true);
  });

  it("builds the nested parts from a flat row, so the edit form gets what checkout's form gets", () => {
    const address = toProfileAddress({
      id: 9,
      address: "Flat",
      province: "Homs",
      city: "Not Entered",
      street: "null",
      contact_person_name: "Ali",
      phone: "963900000002",
      is_default: 0,
    });
    expect(address.area, "unset parts ('Not Entered', 'null') should be left out").toEqual(["Homs"]);
    expect(address.raw.region_details.province, "the edit form needs region_details").toBe("Homs");
    expect(address.raw.contact_info.contact_person_name, "the edit form needs contact_info").toBe("Ali");
    expect(address.raw.location, "the edit form needs a location, even an empty one").toEqual({ latitude: null, longitude: null });
  });
});

describe("the address list on real data", () => {
  it("shows 'empty' only after the list has answered, not while it loads", async () => {
    useAppStore.setState({ addressLists: [] } as any);
    let answer: () => void = () => {};
    order.GetAddressList.mockImplementationOnce(() => new Promise<void>((resolve) => (answer = resolve)));
    draw(<AddressListScreen />);
    expect(
      screen.queryByText("Your address list is empty"),
      "the empty state must not show while the address list is still loading",
    ).toBeNull();
    await act(async () => answer());
    expect(
      screen.queryByText("Your address list is empty"),
      "the empty state should show once the list answered with no address",
    ).not.toBeNull();
  });

  it("deletes an address the way checkout does", async () => {
    draw(<AddressListScreen />);
    fireEvent.click(document.querySelector('[data-pw="demo-address-delete-0"]')!);
    fireEvent.click(await screen.findByText("Sure, Delete"));
    expect(trackOrder, "address_deleted should fire with the address id").toHaveBeenCalledWith(
      ORDER_EVENTS.ADDRESS_DELETED,
      { address_id: 31 },
    );
    expect(order.DeleteAddressList, "the core backend should be asked to delete address 31").toHaveBeenCalledWith({ address: 31 });
    expect(
      useAppStore.getState().addressLists.some((a: any) => a.id === 31),
      "the address should leave the store's list",
    ).toBe(false);
  });

  it("opens the form on the address to edit it", () => {
    draw(<AddressListScreen />);
    fireEvent.click(screen.getByLabelText("Edit"));
    expect(useAppStore.getState().addressDetails.id, "the form should hold the address to edit").toBe(31);
    expect(nav.navigate, "Edit should open the address form").toHaveBeenCalledWith("settings/profile/address/new");
  });
});

describe("the address form on real data", () => {
  const fill = () => {
    useAppStore.getState().setAddressDetails({
      region_details: { province: "Damascus", city: "Mazzeh", town: "West", street: "Main" },
      address_detail: "Building 4",
      address: "Office",
    });
  };

  it("lists only the page's country (S4-7)", () => {
    draw(<AddressFormScreen />);
    fireEvent.click(document.querySelector('[data-pw="demo-address-country"]')!);
    expect(document.querySelector('[data-pw="demo-country-sy"]'), "the page's country (sy) should be listed").not.toBeNull();
    expect(document.querySelector('[data-pw="demo-country-tr"]'), "no other country should be listed").toBeNull();
  });

  it("saves a new address with the shopper's name and phone as the contact (D-29)", async () => {
    draw(<AddressFormScreen />);
    act(() => fill());
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-address-save"]')!));
    expect(order.AddAddressList, "the new address should be sent with the profile's contact").toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          address: "Office",
          address_detail: "Building 4",
          contact_info: expect.objectContaining({ contact_person_name: "Sara Ali", phone: "963912345678" }),
        }),
      }),
    );
    expect(nav.back, "the form should go back to the list once the address is added").toHaveBeenCalled();
  });

  it("asks for a name first when the profile has none", async () => {
    useAppStore.setState({ userProfile: { ...SHOPPER, name: "" } } as any);
    draw(<AddressFormScreen />);
    act(() => fill());
    await act(async () => fireEvent.click(document.querySelector('[data-pw="demo-address-save"]')!));
    expect(screen.queryByText("Enter Your Name !"), "the form should ask for the name").not.toBeNull();
    expect(order.AddAddressList, "an address with no contact name must not be sent").not.toHaveBeenCalled();
  });
});

describe("the photo screen on real data", () => {
  const pickFile = async () => {
    // jsdom has no object URLs (memory: unit suite jsdom gaps).
    URL.createObjectURL = vi.fn(() => "blob:photo");
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["x"], "me.jpg", { type: "image/jpeg" });
    await act(async () => fireEvent.change(input, { target: { files: [file] } }));
    return file;
  };

  it("uploads the picked file, then saves its path on the profile", async () => {
    draw(<PhotoScreen />);
    const file = await pickFile();
    expect(auth.UpdateProfileImage, "the picked file should go to the media server").toHaveBeenCalledWith(file);
    const save = await waitFor(() => {
      const button = document.querySelector('[data-pw="demo-photo-save"]');
      expect(button, "the preview should offer Add & save once the upload is done").not.toBeNull();
      return button!;
    });
    await act(async () => fireEvent.click(save));
    expect(auth.UpdateProfile, "the uploaded path should be saved on the profile").toHaveBeenCalledWith(
      { image: "customers/profile/new.jpg" },
      expect.anything(),
    );
  });

  it("says a refused upload failed and saves nothing", async () => {
    auth.UpdateProfileImage.mockResolvedValueOnce(null as any);
    draw(<PhotoScreen />);
    await pickFile();
    await waitFor(() =>
      expect(screen.queryByText("File upload failed."), "a refused upload should be said").not.toBeNull(),
    );
    expect(document.querySelector('[data-pw="demo-photo-save"]'), "no Add & save after a refused upload").toBeNull();
    expect(auth.UpdateProfile, "nothing should be saved after a refused upload").not.toHaveBeenCalled();
  });
});

describe("the Settings screen (S4-2)", () => {
  it("opens the old pages from its rows", () => {
    draw(<SettingsScreen />);
    const tap = (id: string) => fireEvent.click(document.querySelector(`[data-pw="app-settings-${id}"]`)!);
    tap("notification-settings");
    expect(router.push, "the notification topics should open the old page").toHaveBeenCalledWith("/sy-en/settings/prefferences");
    tap("checklist");
    expect(router.push, "My Checklist should open the old page").toHaveBeenCalledWith("/sy-en/settings/checklist");
    tap("country");
    expect(router.push, "the country row should open the old page").toHaveBeenCalledWith("/sy-en/settings/countries");
    tap("language");
    expect(router.push, "the language row should open the old page").toHaveBeenCalledWith("/sy-en/settings/languages");
    expect(screen.queryByTestId("seller-card"), "the old seller card should sit under the rows").not.toBeNull();
  });
});

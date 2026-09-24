// The seller dashboard's lists, across an arrival (AC-1..AC-7, AC-13..AC-16).
//
// WHY THE SHAPE OF THIS FILE MATTERS
// The bug only exists because of where state lives. `sellerProducts` and
// `sellerBoutiques` are held in `SellerProfileProvider`, which is mounted in
// `sellerProfile/layout.tsx` — a layout that does NOT unmount when a detail
// route opens. So the seller edits a product, presses back, the dashboard page
// remounts, and the list it finds is the one it left.
//
// `arriveAgain()` below reproduces exactly that: the provider stays mounted, the
// page unmounts and mounts again. A test that re-rendered the whole tree would
// throw the context away and pass against the broken code.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEffect } from "react";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../../render";
import { routerSpies } from "../../../mocks/nextNavigation";

/* ------------------------------ the backends ----------------------------- */

const getSellerProducts = vi.fn();
const getSellerBoutiques = vi.fn();
const getSellerPermissions = vi.fn();
const getRoles = vi.fn();
const getUsers = vi.fn();
const getShopes = vi.fn();
const leaveShop = vi.fn();
const addUserToShop = vi.fn();
const deleteUser = vi.fn();
const updateUserRole = vi.fn();
const GetProductsSocial = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerProducts: (...a: unknown[]) => getSellerProducts(...a),
    getSellerBoutiques: (...a: unknown[]) => getSellerBoutiques(...a),
    getSellerPermissions: (...a: unknown[]) => getSellerPermissions(...a),
    getRoles: (...a: unknown[]) => getRoles(...a),
    getUsers: (...a: unknown[]) => getUsers(...a),
    getShopes: (...a: unknown[]) => getShopes(...a),
    getShopInfo: vi.fn(),
    leaveShop: (...a: unknown[]) => leaveShop(...a),
    addUserToShop: (...a: unknown[]) => addUserToShop(...a),
    deleteUser: (...a: unknown[]) => deleteUser(...a),
    updateUserRole: (...a: unknown[]) => updateUserRole(...a),
    changeUserRole: vi.fn(),
    removeUserFromShop: vi.fn(),
  },
}));

vi.mock("services/sellerDashboard/comments", () => ({
  default: { GetProductsSocial: (...a: unknown[]) => GetProductsSocial(...a) },
}));

const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("utils/functions")>()),
  LogError: (...a: unknown[]) => LogError(...a),
}));

vi.mock("services/auth", () => ({ default: { UserID: () => 1 } }));

// The tabs this file never opens. They pull in maps, image cropping and the
// media server, none of which this behaviour depends on.
vi.mock("components/SellerDashboard/GalleryTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/StoriesTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/CommentsTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/ExcelUploadTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/locations/LocationsTab", () => ({ default: () => null }));
// The orders tab hands the page a way to change tab; the stand-in exposes it as
// a button so the hand-off can be pressed.
vi.mock("components/SellerDashboard/orders", () => ({
  default: ({ setActiveTab }: { setActiveTab: (t: string) => void }) => (
    <button data-pw="orders-stub-home" onClick={() => setActiveTab("none")} />
  ),
}));
vi.mock("components/SellerDashboard/ShopInfo", () => ({ default: () => null }));

import SellerDashBoard from "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page";
import {
  SellerProfileProvider,
  useSellerProfile,
} from "app/(client)/[lang]/sellerProfile/SellerProfileContext";

/* -------------------------------- fixtures -------------------------------- */

const SELLER_ID = "77";
const ALL_PERMISSIONS = ["SUPER_ADMIN"];

const product = (id: number, name: string, price = 1000) => ({
  product_id: id,
  name,
  unit_price: price,
  status: 1,
  images: [],
  categories: [],
});

const boutique = (id: number, name: string) => ({ id, name, status: 1, icon: null });

const productsPayload = (items: any[]) => ({
  success: true,
  data: { products: items, meta: { total: items.length, last_page: 1, current_page: 1 } },
});

const boutiquesPayload = (items: any[]) => ({
  success: true,
  data: { boutiques: items },
});

const permissionsPayload = {
  success: true,
  data: [{ seller_id: Number(SELLER_ID), shop_name: "A Shop", permissions: ALL_PERMISSIONS }],
};

/* -------------------------------- harness --------------------------------- */

/**
 * The real topology: the provider is the layout, the dashboard is the page.
 * Toggling `mounted` unmounts and remounts the PAGE only — which is what
 * pressing back from a product editor does.
 */
function Harness({ mounted }: { mounted: boolean }) {
  return (
    <SellerProfileProvider>{mounted ? <SellerDashBoard /> : null}</SellerProfileProvider>
  );
}

async function openDashboard(tab: "products" | "boutiques" | "users" = "products") {
  const result = await renderWithProviders(<Harness mounted />, {
    path: `/sellerProfile/sellerDashboard/${SELLER_ID}`,
    params: { lang: "sy-en", sellerId: SELLER_ID },
    search: `tab=${tab}`,
  });
  await settle();
  return result;
}

/** Let every promise the mount started run to the end. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Leave to a detail route and come back: the page remounts, the provider does not. */
async function arriveAgain(rerender: (ui: React.ReactElement) => void) {
  await act(async () => {
    rerender(<Harness mounted={false} />);
  });
  await act(async () => {
    rerender(<Harness mounted />);
  });
  await settle();
}

beforeEach(() => {
  vi.clearAllMocks();
  getSellerPermissions.mockResolvedValue(permissionsPayload);
  getShopes.mockResolvedValue({ success: true, data: [] });
  getRoles.mockResolvedValue({ success: true, data: { shop_roles: [] } });
  getUsers.mockResolvedValue({ success: true, data: { users: [] } });
  getSellerProducts.mockResolvedValue(productsPayload([]));
  getSellerBoutiques.mockResolvedValue(boutiquesPayload([]));
  GetProductsSocial.mockResolvedValue({ success: true, data: {} });
});

/* --------------------------------- tests ---------------------------------- */

describe("the seller dashboard product list, across an arrival", () => {
  it("shows a product created while the list already had products (AC-1)", async () => {
    getSellerProducts.mockResolvedValue(productsPayload([product(1, "First Shirt")]));
    const { rerender } = await openDashboard();

    expect(
      screen.queryByText("First Shirt"),
      "the product list did not show the product the shop already had",
    ).not.toBeNull();

    // The seller adds a product on the detail route, then presses back.
    getSellerProducts.mockResolvedValue(
      productsPayload([product(1, "First Shirt"), product(2, "Brand New Coat")]),
    );
    await arriveAgain(rerender);

    expect(
      screen.queryByText("Brand New Coat"),
      "a product created on the detail route is missing after returning to the list; the list state lives in a layout that never unmounts, so it has to be re-requested on arrival",
    ).not.toBeNull();
  });

  it("shows an edited product's new values after returning (AC-2)", async () => {
    getSellerProducts.mockResolvedValue(productsPayload([product(1, "Old Name")]));
    const { rerender } = await openDashboard();

    getSellerProducts.mockResolvedValue(productsPayload([product(1, "New Name")]));
    await arriveAgain(rerender);

    expect(
      screen.queryByText("New Name"),
      "the edited product still shows its old name after returning to the list",
    ).not.toBeNull();
    expect(
      screen.queryByText("Old Name"),
      "the old product name is still on screen after the edit, so the stale list was never replaced",
    ).toBeNull();
  });

  it("asks the core backend once per arrival, not once per tab switch (AC-6)", async () => {
    getSellerProducts.mockResolvedValue(productsPayload([product(1, "A Shirt")]));
    const { rerender } = await openDashboard();

    expect(
      getSellerProducts.mock.calls.length,
      `one arrival asked the core backend for the product list ${getSellerProducts.mock.calls.length} times; NFR-1 allows one call per arrival, per list`,
    ).toBe(1);

    await arriveAgain(rerender);

    expect(
      getSellerProducts.mock.calls.length,
      `a second arrival did not re-request the list (still ${getSellerProducts.mock.calls.length} call(s)); without a fresh request the seller sees whatever the layout kept`,
    ).toBe(2);
  });

  it("never says the shop has no products before the request comes back (AC-7)", async () => {
    let release!: (value: unknown) => void;
    getSellerProducts.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    await renderWithProviders(<Harness mounted />, {
      path: `/sellerProfile/sellerDashboard/${SELLER_ID}`,
      params: { lang: "sy-en", sellerId: SELLER_ID },
      search: "tab=products",
    });
    await settle();

    expect(
      screen.queryByText(/no products found/i),
      "the dashboard said the shop has no products while the request was still open — that is a false statement about the seller's own data",
    ).toBeNull();

    expect(
      document.querySelector('[data-pw="dash-skeleton-product-grid"]'),
      "no placeholder was on screen while the product request was open, so the seller sees an empty area instead of the shape of the list",
    ).not.toBeNull();

    await act(async () => {
      release(productsPayload([]));
    });

    expect(
      screen.queryByText(/no products found/i),
      "the empty message never appeared even after the request answered with no products",
    ).not.toBeNull();
  });

  it("shows the empty message once the request has answered (AC-15)", async () => {
    getSellerProducts.mockResolvedValue(productsPayload([]));
    await openDashboard();

    expect(
      screen.queryByText(/no products found/i),
      "a shop with genuinely no products did not get the empty message after its request answered",
    ).not.toBeNull();
  });
});

describe("the seller dashboard boutique list, across an arrival", () => {
  it("shows a boutique created while the list already had boutiques (AC-3)", async () => {
    getSellerBoutiques.mockResolvedValue(boutiquesPayload([boutique(1, "Old Corner")]));
    const { rerender } = await openDashboard("boutiques");

    getSellerBoutiques.mockResolvedValue(
      boutiquesPayload([boutique(1, "Old Corner"), boutique(2, "New Corner")]),
    );
    await arriveAgain(rerender);

    expect(
      screen.queryByText("New Corner"),
      "a boutique created on the detail route is missing after returning to the list",
    ).not.toBeNull();
  });

  it("shows an edited boutique's new values after returning (AC-4)", async () => {
    getSellerBoutiques.mockResolvedValue(boutiquesPayload([boutique(1, "Before Edit")]));
    const { rerender } = await openDashboard("boutiques");

    getSellerBoutiques.mockResolvedValue(boutiquesPayload([boutique(1, "After Edit")]));
    await arriveAgain(rerender);

    expect(
      screen.queryByText("After Edit"),
      "the edited boutique still shows its old name after returning to the list",
    ).not.toBeNull();
  });

  it("drops a deleted boutique after returning (AC-5)", async () => {
    getSellerBoutiques.mockResolvedValue(
      boutiquesPayload([boutique(1, "Kept Corner"), boutique(2, "Doomed Corner")]),
    );
    const { rerender } = await openDashboard("boutiques");

    getSellerBoutiques.mockResolvedValue(boutiquesPayload([boutique(1, "Kept Corner")]));
    await arriveAgain(rerender);

    expect(
      screen.queryByText("Doomed Corner"),
      "a boutique deleted on the detail route is still in the list after returning",
    ).toBeNull();
    expect(
      screen.queryByText("Kept Corner"),
      "the remaining boutique disappeared as well, so the list was emptied rather than refreshed",
    ).not.toBeNull();
  });
});

describe("the seller dashboard when permissions are involved", () => {
  it("waits rather than refusing while permissions are still on the way (AC-13)", async () => {
    // The deep-link path: no shop in the store, so permissions must be fetched.
    getSellerPermissions.mockReturnValue(new Promise(() => {}));

    await renderWithProviders(<Harness mounted />, {
      path: `/sellerProfile/sellerDashboard/${SELLER_ID}`,
      params: { lang: "sy-en", sellerId: SELLER_ID },
      search: "tab=boutiques",
    });
    await settle();

    expect(
      screen.queryByText(/don't have permission/i),
      "the boutiques tab told the seller they have no permission while the permission list was still being fetched — a seller who does have the right is shown a refusal",
    ).toBeNull();

    expect(
      document.querySelector('[data-pw="dash-skeleton-inline"]'),
      "nothing was on screen while permissions were still on the way",
    ).not.toBeNull();
  });

  it("refuses a section the seller really may not see (AC-13)", async () => {
    getSellerPermissions.mockResolvedValue({
      success: true,
      data: [{ seller_id: Number(SELLER_ID), shop_name: "A Shop", permissions: ["READ_ORDERS"] }],
    });

    await openDashboard("boutiques");

    expect(
      screen.queryByText(/don't have permission/i),
      "a seller with no boutique permission was not told so once the permission list had arrived",
    ).not.toBeNull();
  });

  it("reads a failed permission fetch as an error, not as a refusal (AC-13)", async () => {
    getSellerPermissions.mockResolvedValue({
      success: false,
      message: "the permissions service is unavailable",
    });

    await openDashboard("products");

    expect(
      screen.queryByText(/don't have permission/i),
      "the products tab said the seller has no permission when the permission list itself failed to load — a backend failure must never read as a refusal",
    ).toBeNull();

    expect(
      screen.queryByText(/the permissions service is unavailable/i),
      "the permission backend's own failure was not shown to the seller, so there is nothing to retry and nothing that says what went wrong",
    ).not.toBeNull();
  });
});

describe("the seller dashboard when a request fails", () => {
  it("shows the error and lets a retry replace it with the list (AC-14)", async () => {
    getSellerProducts.mockResolvedValueOnce({
      success: false,
      message: "the products backend refused the request",
    });
    await openDashboard();

    expect(
      screen.queryByText(/the products backend refused the request/i),
      "a failed product list request did not show the backend's own message, so the seller cannot tell what failed",
    ).not.toBeNull();

    getSellerProducts.mockResolvedValue(productsPayload([product(1, "Recovered Shirt")]));
    await act(async () => {
      (screen.getByText(/retry/i).closest("button") as HTMLButtonElement).click();
    });
    await settle();

    expect(
      screen.queryByText("Recovered Shirt"),
      "retrying after a failed product request did not replace the error with the list",
    ).not.toBeNull();
  });

  it("retries a failed arrival fetch on the next arrival (AC-14)", async () => {
    getSellerProducts.mockResolvedValueOnce({
      success: false,
      message: "the products backend refused the request",
    });
    const { rerender } = await openDashboard();

    getSellerProducts.mockResolvedValue(productsPayload([product(1, "Second Try Shirt")]));
    await arriveAgain(rerender);

    expect(
      screen.queryByText("Second Try Shirt"),
      "a request that failed on the first arrival was never tried again on the next one; the per-arrival record must not keep a failure as though it had succeeded",
    ).not.toBeNull();
  });
});

describe("two sections of the dashboard loading at the same time", () => {
  it("does not let the roles list finishing make the change-role list say it is empty (AC-16)", async () => {
    // The users tab is the one place two sections still load together: `roles`
    // fills the add-user panel, `rolesForChange` fills the per-user dropdown.
    // They used to share ONE loading flag, so whichever answered first cleared
    // it for both — and the one still waiting rendered "No roles found".
    getUsers.mockResolvedValue({
      success: true,
      data: { users: [{ id: 9, name: "A Teammate", role: { name: "Staff" } }] },
    });

    // The add-user roles answer straight away...
    getRoles.mockResolvedValue({
      success: true,
      data: { shop_roles: [{ id: 1, name: "Manager" }] },
    });

    await openDashboard("users");

    // ...while the change-role roles are still on the way.
    getRoles.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      (
        screen.getByText(/change role/i).closest("button") as HTMLButtonElement
      ).click();
    });
    await settle();

    expect(
      screen.queryByText(/no roles found/i),
      "the change-role list said there are no roles while its own request was still open — the add-user roles answering first must not speak for it",
    ).toBeNull();

    expect(
      screen.queryByText(/loading roles/i),
      "the change-role list showed neither its roles nor a sign that it is still loading",
    ).not.toBeNull();
  });
});

/* ======================================================================== */
/* Everything below reaches the rest of the page: home tiles, the side menu, */
/* each tab's refusal / error / empty state, and the users tab actions.      */
/* ======================================================================== */

const DASH_PATH = `/sy-en/sellerProfile/sellerDashboard/${SELLER_ID}`;

const permsFor = (permissions: string[], extra: Record<string, unknown> = {}) => ({
  success: true,
  data: [{ seller_id: Number(SELLER_ID), shop_name: "A Shop", permissions, ...extra }],
});

/** Wait real time — the page debounces its role searches by 400 ms. */
async function wait(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function openAs(
  permissions: string[] | null,
  tab?: string,
  language: "en" | "ar" = "en",
) {
  if (permissions) getSellerPermissions.mockResolvedValue(permsFor(permissions));
  const result = await renderWithProviders(<Harness mounted />, {
    language,
    country: "sy",
    path: `/sellerProfile/sellerDashboard/${SELLER_ID}`,
    params: { lang: `sy-${language}`, sellerId: SELLER_ID },
    search: tab ? `tab=${tab}` : "",
  });
  await settle();
  return result;
}

/** Arrival from /sellerProfile: the shop list is already in the provider. */
function Seed({ shops }: { shops: any[] }) {
  const { shopes, setShopes } = useSellerProfile();
  useEffect(() => {
    setShopes(shops);
  }, []);
  return shopes.length ? <SellerDashBoard /> : null;
}

async function openSeeded(shops: any[], tab: string) {
  await renderWithProviders(
    <SellerProfileProvider>
      <Seed shops={shops} />
    </SellerProfileProvider>,
    {
      country: "sy",
      path: `/sellerProfile/sellerDashboard/${SELLER_ID}`,
      params: { lang: "sy-en", sellerId: SELLER_ID },
      search: `tab=${tab}`,
    },
  );
  await settle();
}

const byPw = (pw: string) => document.querySelector(`[data-pw="${pw}"]`) as HTMLElement;
const buttonWithText = (text: string | RegExp, index = 0) =>
  screen.getAllByText(text)[index].closest("button") as HTMLButtonElement;

describe("the seller dashboard home", () => {
  it("shows a placeholder while the permissions are on the way", async () => {
    getSellerPermissions.mockReturnValue(new Promise(() => {}));
    await openAs(null);

    expect(byPw("dash-skeleton-inline"), "the home showed no placeholder while permissions were loading").not.toBeNull();
  });

  it("shows the permissions backend's failure instead of the tiles", async () => {
    getSellerPermissions.mockResolvedValue({ success: false, message: "permissions are down" });
    await openAs(null);

    expect(screen.queryByText("permissions are down"), "the home did not show the permissions failure").not.toBeNull();
    expect(screen.queryByText("Welcome back"), "the home drew its tiles over a failed permission list").toBeNull();
  });

  it("opens a section from its tile by writing ?tab= into the URL (ar)", async () => {
    await openAs(["SUPER_ADMIN"], undefined, "ar");

    fireEvent.click(byPw("seller-dashboard-tab-products"));

    expect(routerSpies.replace, "the Products tile did not move the URL to ?tab=products").toHaveBeenCalledWith(
      `/sy-ar/sellerProfile/sellerDashboard/${SELLER_ID}?tab=products`,
      { scroll: false },
    );
  });

  it("leaves to the shop list when back is pressed on the home", async () => {
    await openAs(["SUPER_ADMIN"]);

    fireEvent.click(byPw("seller-dashboard-screen-back-button"));

    expect(routerSpies.push, "back on the dashboard home did not go to the shop list").toHaveBeenCalledWith("/sy-en/sellerProfile");
  });

  it("goes back to the home when back is pressed inside a section", async () => {
    await openAs(["SUPER_ADMIN"], "orders");

    fireEvent.click(byPw("seller-dashboard-screen-back-button"));

    expect(routerSpies.replace, "back inside a section did not clear ?tab=").toHaveBeenCalledWith(DASH_PATH, { scroll: false });
    expect(routerSpies.push, "back inside a section left the dashboard instead of returning home").not.toHaveBeenCalled();
  });

  it("lets the orders tab send the seller back to the home", async () => {
    await openAs(["SUPER_ADMIN"], "orders");

    fireEvent.click(byPw("orders-stub-home"));

    expect(routerSpies.replace, "the orders tab's hand-off did not clear ?tab=").toHaveBeenCalledWith(DASH_PATH, { scroll: false });
  });
});

describe("the seller dashboard side menu", () => {
  const MENU_TABS = [
    "products", "boutiques", "locations", "orders", "permissions",
    "users", "gallery", "stories", "comments", "excel", "shopInfo",
  ];

  it("opens every section it lists", async () => {
    await openAs(["SUPER_ADMIN"]);

    for (const tab of MENU_TABS) {
      fireEvent.click(byPw("seller-dashboard-menu-btn"));
      await settle();
      fireEvent.click(byPw(`seller-dashboard-menu-${tab}`));
      expect(routerSpies.replace, `the side menu's ${tab} item did not open ?tab=${tab}`).toHaveBeenCalledWith(
        `${DASH_PATH}?tab=${tab}`,
        { scroll: false },
      );
    }
    expect(getShopes, "opening the menu did not ask the core backend for the shop list").toHaveBeenCalledWith(true);
  });

  it("closes from the overlay, from Escape, from a click outside and from its own button", async () => {
    await openAs(["SUPER_ADMIN"]);
    const isOpen = () => byPw("seller-dashboard-menu-btn").className.includes("bg-[#5d5d5d]");

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();
    fireEvent.click(document.querySelector(".bg-\\[\\#0000006a\\]")!);
    expect(isOpen(), "clicking the overlay did not close the menu").toBe(false);

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(isOpen(), "a key other than Escape closed the menu").toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(isOpen(), "Escape did not close the menu").toBe(false);

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();
    fireEvent.mouseDown(byPw("seller-dashboard-panel"));
    expect(isOpen(), "a click outside did not close the menu").toBe(false);

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();
    fireEvent.mouseDown(byPw("seller-dashboard-menu-products"));
    expect(isOpen(), "a click inside the menu closed it").toBe(true);
    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    expect(isOpen(), "the menu button did not close the open menu").toBe(false);
  });

  it("takes a non-admin's role from the shop list it fetched", async () => {
    getShopes.mockResolvedValue({
      success: true,
      data: [{ seller_id: Number(SELLER_ID), shop_role: "Packer" }],
    });
    await openAs(["READ_ORDERS"]);

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();

    expect(byPw("seller-dashboard-role").textContent, "the header did not show the role the core backend's shop list named").toContain("Packer");
  });

  it("logs a refused shop list", async () => {
    getShopes.mockResolvedValue({ success: false, message: "shops refused" });
    await openAs(["READ_ORDERS"]);

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();

    expect(LogError, "a refused shop list was not logged").toHaveBeenCalledWith({
      scenario: "SellerDashboard.initializeData",
      error: "shops refused",
    });
  });

  it("logs a thrown shop list as the value that was thrown", async () => {
    getShopes.mockRejectedValueOnce("socket closed");
    await openAs(["READ_ORDERS"]);

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();

    expect(LogError, "a thrown shop list was not logged as that string").toHaveBeenCalledWith({
      scenario: "SellerDashboard.initializeData",
      error: "socket closed",
    });
  });

  it("joins the products fetch already open instead of starting a second one", async () => {
    getSellerProducts.mockReturnValue(new Promise(() => {}));
    await openAs(["SUPER_ADMIN"], "products");

    fireEvent.click(byPw("seller-dashboard-menu-btn"));
    await settle();

    expect(
      getSellerProducts.mock.calls.length,
      "opening the menu while the product list was loading asked the core backend for it a second time",
    ).toBe(1);
  });
});

describe("the seller dashboard products tab", () => {
  it("refuses a seller with no product permission", async () => {
    await openAs(["READ_ORDERS"], "products");

    expect(screen.queryByText("You don't have permission to view products"), "no refusal for a seller without product rights").not.toBeNull();
  });

  it("pages through the list and marks a card click as a navigation", async () => {
    getSellerProducts.mockImplementation(async (_id: string, page: number) => ({
      success: true,
      data: {
        products: [product(page, `Page ${page} Shirt`)],
        meta: { total: 2, last_page: 2, current_page: page },
      },
    }));
    const { store } = await openAs(["SUPER_ADMIN"], "products");

    fireEvent.click(byPw("pagination-next"));
    await settle();
    expect(screen.queryByText("Page 2 Shirt"), "Next did not load page 2 from the core backend").not.toBeNull();

    fireEvent.click(buttonWithText("Previous"));
    await settle();
    expect(screen.queryByText("Page 1 Shirt"), "Previous did not load page 1 again").not.toBeNull();

    fireEvent.click(byPw("seller-product-card"), { ctrlKey: true });
    expect((store.getState() as any).isNavigating, "opening a product card did not show the navigation loader").toBe(true);
    expect((store.getState() as any).lastPathname, "opening a product card did not record the dashboard as the way back").toBe(DASH_PATH);
  });

  it("logs a thrown social-count batch", async () => {
    getSellerProducts.mockResolvedValue(productsPayload([product(1, "Counted Shirt")]));
    GetProductsSocial.mockRejectedValue(new Error("comments down"));
    await openAs(["SUPER_ADMIN"], "products");

    expect(LogError, "a thrown social-count batch was not logged").toHaveBeenCalledWith({
      scenario: "SellerDashboard.getProductsSocial",
      error: "comments down",
    });
  });

  it("asks again for social counts the comments backend refused", async () => {
    // Same mount throughout: a remount would forget the asked-for ids anyway.
    getSellerProducts.mockImplementation(async (_id: string, page: number) => ({
      success: true,
      data: {
        products: page === 1 ? [product(1, "Counted Shirt")] : [product(1, "Counted Shirt"), product(2, "Second Shirt")],
        meta: { total: 2, last_page: 2, current_page: page },
      },
    }));
    GetProductsSocial.mockResolvedValue({ success: false });
    await openAs(["SUPER_ADMIN"], "products");

    fireEvent.click(byPw("pagination-next"));
    await settle();

    expect(
      GetProductsSocial.mock.calls.some((c) => (c[1] as string[]).includes("1") && (c[1] as string[]).includes("2")),
      "a refused social batch kept product 1 marked as asked, so its counts are never requested again",
    ).toBe(true);
  });

  it("logs a thrown non-Error social batch as a string", async () => {
    getSellerProducts.mockResolvedValue(productsPayload([product(1, "Counted Shirt")]));
    GetProductsSocial.mockRejectedValue("plain failure");
    await openAs(["SUPER_ADMIN"], "products");

    expect(LogError, "a thrown string social batch was not logged as that string").toHaveBeenCalledWith({
      scenario: "SellerDashboard.getProductsSocial",
      error: "plain failure",
    });
  });
});

describe("the seller dashboard boutiques tab", () => {
  it("shows the permissions failure before anything else", async () => {
    getSellerPermissions.mockResolvedValue({ success: false, message: "permissions are down" });
    await openAs(null, "boutiques");

    expect(screen.queryByText("permissions are down"), "the boutiques tab hid the permissions failure").not.toBeNull();
  });

  it("shows the boutiques failure, then the empty state after a retry", async () => {
    getSellerBoutiques.mockResolvedValueOnce({ success: false, message: "boutiques refused" });
    await openAs(["CREATE_BUTIKS", "READ_BUTIKS"], "boutiques");

    expect(screen.queryByText("boutiques refused"), "the boutiques failure was not shown").not.toBeNull();

    getSellerBoutiques.mockResolvedValue({ success: true, data: { boutiques: null } });
    fireEvent.click(buttonWithText("Retry"));
    await settle();

    expect(screen.queryByText("No boutiques found"), "a retry that found nothing did not show the empty state").not.toBeNull();
    expect(screen.queryByText(/Add your first boutique/), "a seller who may create boutiques got no create link").not.toBeNull();
  });

  it("logs a thrown non-Error boutiques failure and shows the generic message", async () => {
    getSellerBoutiques.mockRejectedValueOnce("socket closed");
    await openAs(["READ_BUTIKS"], "boutiques");

    expect(LogError, "a thrown string was not logged as that string").toHaveBeenCalledWith({
      scenario: "SellerDashboard.getSellerBoutiques",
      error: "socket closed",
    });
    expect(screen.queryByText("Failed to load boutiques"), "the generic boutiques failure was not shown").not.toBeNull();
  });
});

describe("the seller dashboard permissions tab", () => {
  it("files an unknown permission under 'Other'", async () => {
    await openAs(["SUPER_ADMIN", "BRAND_NEW_RIGHT"], "permissions");

    expect(screen.queryAllByRole("heading", { name: "Other" }).length > 0, "an unknown permission was not filed under 'Other'").toBe(true);
  });

  it("shows the permissions failure", async () => {
    getSellerPermissions.mockResolvedValue({ success: false, message: "permissions are down" });
    await openAs(null, "permissions");

    expect(screen.queryByText("permissions are down"), "the permissions tab hid its own failure").not.toBeNull();
  });

  it("says no permissions are assigned when the shop has none", async () => {
    await openAs([], "permissions");

    expect(screen.queryByText("No permissions assigned"), "an empty permission list did not show the empty state").not.toBeNull();
  });

  it("treats an answer with no entry for this shop as a failure", async () => {
    getSellerPermissions.mockResolvedValue({ success: true, data: [] });
    await openAs(null, "permissions");

    expect(screen.queryByText("Failed to load permissions"), "a permissions answer with no entry for this shop was not treated as a failure").not.toBeNull();
  });

  it("reads the permissions and role from the shop list without calling the backend", async () => {
    await openSeeded(
      [{ seller_id: Number(SELLER_ID), shop_name: "Seeded Shop", shop_role: "Curator", permissions: ["READ_PRODUCTS"] }],
      "permissions",
    );

    expect(screen.queryAllByText("Curator").length > 0, "the role from the shop list is not on the page").toBe(true);
    expect(getSellerPermissions, "the page asked the backend for permissions it already had").not.toHaveBeenCalled();
  });

  it("keeps the shop list's empty permissions when the backend fails", async () => {
    getSellerPermissions.mockRejectedValue(new Error("permissions exploded"));
    await openSeeded([{ seller_id: Number(SELLER_ID), shop_name: "Seeded Shop", permissions: [] }], "permissions");

    expect(screen.queryByText("permissions exploded"), "the thrown permissions failure was not shown").not.toBeNull();
  });
});

describe("the seller dashboard users tab", () => {
  const ROLES = {
    success: true,
    data: { shop_roles: [{ id: 1, name: "Manager", description: "runs" }], meta: { has_more_pages: true } },
  };
  const USERS = [
    { id: 1, name: "Me", role_name: "Owner" },
    { id: 9, name: "A Teammate", role: { id: 5, name: "Staff" } },
    { id: 10, phone: "row-ten", role: "Plain" },
  ];

  beforeEach(() => {
    getRoles.mockResolvedValue(ROLES);
    getUsers.mockResolvedValue({ success: true, data: { users: USERS, meta: { has_more_pages: true, total: 4 } } });
  });

  const roleOptions = () => Array.from(document.querySelectorAll("div.cursor-pointer")) as HTMLElement[];
  const changeOption = () => roleOptions().find((el) => el.closest(".w-56")) as HTMLElement;

  it("refuses a seller who may not manage users", async () => {
    await openAs(["READ_ORDERS"], "users");

    expect(screen.queryByText("You don't have permission to manage users"), "no refusal for a seller without user rights").not.toBeNull();
  });

  it("shows the permissions failure", async () => {
    getSellerPermissions.mockResolvedValue({ success: false, message: "permissions are down" });
    await openAs(null, "users");

    expect(screen.queryByText("permissions are down"), "the users tab hid the permissions failure").not.toBeNull();
  });

  it("shows the users backend's refusal", async () => {
    getUsers.mockResolvedValue({ success: false, message: "users refused" });
    await openAs(["USER_MANAGEMENT_ACCESS"], "users");

    expect(screen.queryByText("users refused"), "the users refusal was not shown").not.toBeNull();
  });

  it("shows the generic users failure for a thrown value", async () => {
    getUsers.mockRejectedValue("socket closed");
    await openAs(["USER_MANAGEMENT_ACCESS"], "users");

    expect(screen.queryByText("Failed to load users"), "the generic users failure was not shown").not.toBeNull();
  });

  it("appends the next page of users", async () => {
    await openAs(["SUPER_ADMIN"], "users");

    getUsers.mockResolvedValue({ success: true, data: { users: [{ id: 11, name: "Page Two Person" }], meta: null } });
    fireEvent.click(buttonWithText("Load more"));
    await settle();

    expect(screen.queryByText("Page Two Person"), "Load more did not add the next page of users").not.toBeNull();
    expect(screen.queryByText("A Teammate"), "Load more replaced the first page instead of adding to it").not.toBeNull();
    expect(getUsers, "Load more did not ask for page 2").toHaveBeenLastCalledWith(SELLER_ID, 2, "en");
  });

  it("refuses an empty add-user form without calling the backend", async () => {
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.submit(document.querySelector("form")!);

    expect(screen.queryByText("Please fill in all fields"), "an empty form was not refused").not.toBeNull();
    expect(addUserToShop, "an empty form reached the backend").not.toHaveBeenCalled();
  });

  it("adds a user with the picked role, then clears the success banner after 3 seconds", async () => {
    addUserToShop.mockResolvedValue({ isSuccessful: true });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.change(screen.getByPlaceholderText("+(country_code)XXX"), { target: { value: "+000" } });
    fireEvent.focus(screen.getByPlaceholderText("Search roles..."));
    fireEvent.mouseDown(roleOptions()[0]);
    fireEvent.change(document.querySelector("select")!, { target: { value: "1" } });
    fireEvent.change(document.querySelector('input[type="number"]')!, { target: { value: "5" } });

    await act(async () => {
      fireEvent.submit(document.querySelector("form")!);
    });
    await settle();

    expect(addUserToShop, "the add-user call did not carry the picked role and this shop").toHaveBeenCalledWith({
      phone: "+000",
      role_id: 1,
      seller_id: SELLER_ID,
    });
    expect(screen.queryByText("User added successfully!"), "no success banner after the user was added").not.toBeNull();

    await wait(3100);
    expect(screen.queryByText("User added successfully!"), "the success banner never went away").toBeNull();
  }, 10000);

  it("shows the add-user refusal, with the generic message when there is none", async () => {
    addUserToShop.mockResolvedValueOnce({ success: false, message: "phone not registered" });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.change(screen.getByPlaceholderText("+(country_code)XXX"), { target: { value: "+000" } });
    fireEvent.change(document.querySelector("select")!, { target: { value: "1" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form")!);
    });
    await settle();
    expect(screen.queryByText("phone not registered"), "the add-user refusal was not shown").not.toBeNull();

    addUserToShop.mockResolvedValueOnce({ success: false });
    await act(async () => {
      fireEvent.submit(document.querySelector("form")!);
    });
    await settle();
    expect(screen.queryByText("Failed to add user"), "the generic add-user refusal was not shown").not.toBeNull();

    addUserToShop.mockRejectedValueOnce("socket closed");
    await act(async () => {
      fireEvent.submit(document.querySelector("form")!);
    });
    await settle();
    expect(screen.queryByText("Failed to add user to shop"), "a thrown add-user failure did not show the generic message").not.toBeNull();
  });

  it("searches roles after the debounce, loads more, and closes the list on blur", async () => {
    await openAs(["SUPER_ADMIN"], "users");
    const search = screen.getByPlaceholderText("Search roles...");

    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "Ma" } });
    fireEvent.change(search, { target: { value: "Man" } });
    await wait(450);
    expect(getRoles, "typing in the role search did not ask the backend after the debounce").toHaveBeenCalledWith(SELLER_ID, 1, "Man");
    expect(
      getRoles.mock.calls.some((c) => c[2] === "Ma"),
      "a search typed over within 400 ms was still sent",
    ).toBe(false);

    fireEvent.mouseDown(buttonWithText("Load more roles"));
    await settle();
    expect(getRoles, "Load more roles did not ask for page 2 of the search").toHaveBeenCalledWith(SELLER_ID, 2, "Man");

    fireEvent.blur(search);
    await wait(200);
    expect(screen.queryByText("Load more roles"), "the role list stayed open after the input lost focus").toBeNull();
  });

  it("shows the roles failure in the add-user panel", async () => {
    getRoles.mockResolvedValue({ success: false, message: "roles refused" });
    await openAs(["SUPER_ADMIN"], "users");

    expect(screen.queryAllByText("roles refused").length > 0, "the roles refusal was not shown").toBe(true);

    LogError.mockClear();
    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    expect(LogError, "the per-user roles refusal was not logged").toHaveBeenCalledWith({
      scenario: "SellerDashboard.getRolesForChange",
      error: "roles refused",
    });
  });

  it("logs thrown roles failures for both role lists", async () => {
    getRoles.mockRejectedValue("roles socket closed");
    getUsers.mockResolvedValue({ success: true, data: { users: USERS } });
    await openAs(["SUPER_ADMIN"], "users");
    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();

    expect(screen.queryAllByText("Failed to load roles").length > 0, "the generic roles failure was not shown").toBe(true);
    expect(LogError, "the change-role roles failure was not logged").toHaveBeenCalledWith({
      scenario: "SellerDashboard.getRolesForChange",
      error: "roles socket closed",
    });
  });

  it("changes a user's role from the per-user list", async () => {
    updateUserRole.mockResolvedValue({ success: true });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    await act(async () => {
      fireEvent.mouseDown(changeOption());
    });
    await settle();

    expect(updateUserRole, "the role change did not reach the backend for that user").toHaveBeenCalledWith(
      { user_id: 9, role_id: 1 },
      SELLER_ID,
    );
    expect(screen.queryByText("Staff"), "the user's row still shows the old role").toBeNull();
  });

  it("keeps the user's old role name when the chosen role is not in the add-user list", async () => {
    updateUserRole.mockResolvedValue({ success: true });
    getRoles.mockResolvedValue({ success: true, data: [] });
    await openAs(["SUPER_ADMIN"], "users");
    getRoles.mockResolvedValue({ success: true, data: { shop_roles: [{ id: 3, name: "Picker" }] } });

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    await act(async () => {
      fireEvent.mouseDown(changeOption());
    });
    await settle();

    expect(screen.queryByText("Staff"), "the row lost its role name when the new role was unknown to the add-user list").not.toBeNull();
  });

  it("shows the role-change refusal, and the generic one for a thrown value", async () => {
    updateUserRole.mockResolvedValueOnce({ success: false, message: "role change refused" });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    await act(async () => {
      fireEvent.mouseDown(changeOption());
    });
    await settle();
    expect(screen.queryByText("role change refused"), "the role-change refusal was not shown").not.toBeNull();

    updateUserRole.mockRejectedValueOnce("socket closed");
    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    await act(async () => {
      fireEvent.mouseDown(changeOption());
    });
    await settle();
    expect(screen.queryByText("Failed to update user role"), "a thrown role change did not show the generic message").not.toBeNull();
  });

  it("opens, searches, pages and closes the per-user role list", async () => {
    await openAs(["SUPER_ADMIN"], "users");
    const dropdown = () => document.querySelector(".w-56");

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    expect(dropdown(), "Change Role did not open the per-user list").not.toBeNull();
    fireEvent.click(buttonWithText("Change Role", 1));
    expect(dropdown(), "a second press on Change Role did not close the list").toBeNull();

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    const input = dropdown()!.querySelector("input")!;
    fireEvent.change(input, { target: { value: "Pick" } });
    await wait(450);
    expect(getRoles, "the per-user role search was not sent after the debounce").toHaveBeenCalledWith(SELLER_ID, 1, "Pick");

    fireEvent.mouseDown(dropdown()!.querySelector("button")!);
    await settle();
    expect(getRoles, "Load more in the per-user list did not ask for page 2").toHaveBeenCalledWith(SELLER_ID, 2, "Pick");

    fireEvent.mouseDown(input);
    expect(dropdown(), "a click inside the per-user list closed it").not.toBeNull();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(dropdown(), "a key other than Escape closed the per-user list").not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dropdown(), "Escape did not close the per-user list").toBeNull();

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    fireEvent.mouseDown(byPw("seller-dashboard-panel"));
    expect(dropdown(), "a click outside did not close the per-user list").toBeNull();
  });

  it("asks for roles again when the per-user search gets focus with an empty list", async () => {
    await openAs(["SUPER_ADMIN"], "users");
    getRoles.mockResolvedValue({ success: true, data: { shop_roles: [] } });

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    expect(screen.queryByText("No roles found"), "an empty per-user role list did not say so").not.toBeNull();
    getRoles.mockClear();
    fireEvent.focus(document.querySelector(".w-56 input")!);
    await settle();

    expect(getRoles, "focusing the empty per-user search did not ask for roles again").toHaveBeenCalledWith(SELLER_ID, 1, "");
  });

  it("stops listening for outside clicks on a row that was deleted while its list was open", async () => {
    deleteUser.mockResolvedValue({ success: true });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.click(buttonWithText("Change Role", 1));
    await settle();
    await act(async () => {
      fireEvent.click(buttonWithText("Delete", 1));
    });
    await settle();
    expect(screen.queryByText("A Teammate"), "the deleted user is still listed").toBeNull();

    fireEvent.mouseDown(byPw("seller-dashboard-panel"));
    expect(deleteUser, "the delete did not reach the backend for that user").toHaveBeenCalledWith(9, SELLER_ID);
  });

  it("shows the delete refusal, and the generic one for a thrown value", async () => {
    deleteUser.mockResolvedValueOnce({ success: false, message: "delete refused" });
    await openAs(["SUPER_ADMIN"], "users");

    await act(async () => {
      fireEvent.click(buttonWithText("Delete", 1));
    });
    await settle();
    expect(screen.queryByText("delete refused"), "the delete refusal was not shown").not.toBeNull();
    expect(screen.queryByText("A Teammate"), "a refused delete removed the user anyway").not.toBeNull();

    deleteUser.mockRejectedValueOnce("socket closed");
    await act(async () => {
      fireEvent.click(buttonWithText("Delete", 1));
    });
    await settle();
    expect(screen.queryByText("Failed to delete user"), "a thrown delete did not show the generic message").not.toBeNull();
  });

  it("asks before leaving the shop and leaves on confirm", async () => {
    leaveShop.mockResolvedValue({ success: true });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.click(buttonWithText("Leave Shop"));
    expect(screen.queryByRole("dialog"), "Leave Shop did not ask for confirmation").not.toBeNull();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog"), "Cancel did not close the leave confirmation").toBeNull();

    fireEvent.click(buttonWithText("Leave Shop"));
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm"));
    });
    await settle();
    expect(leaveShop, "confirming did not ask the core backend to leave this shop").toHaveBeenCalledWith(SELLER_ID);
  });

  it("shows the leave refusal and closes the confirmation", async () => {
    leaveShop.mockResolvedValueOnce({ success: false, message: "owner cannot leave" });
    await openAs(["SUPER_ADMIN"], "users");

    fireEvent.click(buttonWithText("Leave Shop"));
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm"));
    });
    await settle();
    expect(screen.queryByText("owner cannot leave"), "the leave refusal was not shown").not.toBeNull();
    expect(screen.queryByRole("dialog"), "the confirmation stayed open after a refused leave").toBeNull();

    leaveShop.mockRejectedValueOnce("socket closed");
    fireEvent.click(buttonWithText("Leave Shop"));
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm"));
    });
    await settle();
    expect(screen.queryByText("Failed to leave shop"), "a thrown leave did not show the generic message").not.toBeNull();
  });
});

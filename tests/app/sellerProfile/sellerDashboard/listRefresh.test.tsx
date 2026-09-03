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

import { act, renderWithProviders, screen, waitFor } from "../../../render";

/* ------------------------------ the backends ----------------------------- */

const getSellerProducts = vi.fn();
const getSellerBoutiques = vi.fn();
const getSellerPermissions = vi.fn();
const getRoles = vi.fn();
const getUsers = vi.fn();
const getShopes = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerProducts: (...a: unknown[]) => getSellerProducts(...a),
    getSellerBoutiques: (...a: unknown[]) => getSellerBoutiques(...a),
    getSellerPermissions: (...a: unknown[]) => getSellerPermissions(...a),
    getRoles: (...a: unknown[]) => getRoles(...a),
    getUsers: (...a: unknown[]) => getUsers(...a),
    getShopes: (...a: unknown[]) => getShopes(...a),
    getShopInfo: vi.fn(),
    leaveShop: vi.fn(),
    addUserToShop: vi.fn(),
    changeUserRole: vi.fn(),
    removeUserFromShop: vi.fn(),
  },
}));

vi.mock("services/sellerDashboard/comments", () => ({
  default: { GetProductsSocial: vi.fn(async () => ({ success: true, data: {} })) },
}));

vi.mock("services/auth", () => ({ default: { UserID: () => 1 } }));

// The tabs this file never opens. They pull in maps, image cropping and the
// media server, none of which this behaviour depends on.
vi.mock("components/SellerDashboard/GalleryTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/StoriesTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/CommentsTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/ExcelUploadTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/locations/LocationsTab", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/orders", () => ({ default: () => null }));
vi.mock("components/SellerDashboard/ShopInfo", () => ({ default: () => null }));

import SellerDashBoard from "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page";
import { SellerProfileProvider } from "app/(client)/[lang]/sellerProfile/SellerProfileContext";

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

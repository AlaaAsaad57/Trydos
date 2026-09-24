// The seller dashboard's Permissions tab: the role banner and the permission
// group headings.
//
// WHY THE SHAPE OF THIS FILE MATTERS
// Both bugs here only appear on an ARRIVAL BY URL — the seller pastes the
// dashboard link, or reloads while on this tab. Then `shopes` (the shop list,
// held in SellerProfileProvider) is empty, so the page knows the shop only from
// what /shop/auth/permissions answers. A test that seeded the provider with a
// shop list would carry the role in with it and pass against the broken code.
// So every test below mounts the page with an empty provider, exactly as a cold
// URL arrival does.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderWithProviders, screen } from "../../../render";

/* ------------------------------ the backends ----------------------------- */

const getSellerPermissions = vi.fn();
const getShopes = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerProducts: vi.fn(async () => ({ success: true, data: { products: [] } })),
    getSellerBoutiques: vi.fn(async () => ({ success: true, data: { boutiques: [] } })),
    getSellerPermissions: (...a: unknown[]) => getSellerPermissions(...a),
    getRoles: vi.fn(async () => ({ success: true, data: { shop_roles: [] } })),
    getUsers: vi.fn(async () => ({ success: true, data: { users: [] } })),
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

/** What /shop/auth/permissions answers for this seller id. */
const permissionsPayload = (permissions: string[], shop_role?: string) => ({
  success: true,
  data: [
    {
      seller_id: Number(SELLER_ID),
      shop_name: "A Shop",
      ...(shop_role ? { shop_role } : {}),
      permissions,
    },
  ],
});

/* -------------------------------- harness --------------------------------- */

/** Let every promise the mount started run to the end. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** A cold arrival by URL: the provider is mounted empty, as the layout mounts it. */
async function arriveOnPermissionsTab(language: "en" | "ar" = "en") {
  const country = "sy";
  const result = await renderWithProviders(
    <SellerProfileProvider>
      <SellerDashBoard />
    </SellerProfileProvider>,
    {
      language,
      country,
      path: `/sellerProfile/sellerDashboard/${SELLER_ID}`,
      params: { lang: `${country}-${language}`, sellerId: SELLER_ID },
      search: "tab=permissions",
    },
  );
  await settle();
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  // The side menu is never opened in these tests, so this must not be called.
  // It is armed only so a stray call cannot reject.
  getShopes.mockResolvedValue({ success: true, data: [] });
});

/* --------------------------------- tests ---------------------------------- */

describe("the Permissions tab group headings", () => {
  it("names a group in words rather than printing the raw permission key", async () => {
    getSellerPermissions.mockResolvedValue(
      permissionsPayload(["READ_PRODUCTS", "READ_ORDERS"], "Store Manager"),
    );

    await arriveOnPermissionsTab();

    // By role, not by text: the side menu names its sections with the same
    // words, so a plain text query matches the menu button as well.
    expect(
      screen.queryAllByRole("heading", { name: "Products" }).length,
      "the product permissions are filed under a heading that is not the readable word 'Products'",
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("PRODUCTS"),
      "the Permissions tab printed the raw group key 'PRODUCTS' as a heading; only six of the groups have a readable label, so the rest reach the seller in shouting capitals",
    ).toBeNull();
    expect(
      screen.queryByText("ORDERS"),
      "the Permissions tab printed the raw group key 'ORDERS' as a heading",
    ).toBeNull();
    expect(
      screen.queryByText("Read Products"),
      "the permission chip itself is missing, so the heading is not the only thing that failed to render",
    ).not.toBeNull();
  });

  // Comments, and not one of the other groups, for a reason worth knowing before
  // you edit this file. Most group headings already read in Arabic: the raw keys
  // have entries in the three translation files, written unquoted as
  // `ORDERS: "الطلبات"`, so they shouted only in English. Comments is the group
  // that had a readable label and no entry in any of the three files, so it is
  // the one that leaked an English word onto an Arabic page.
  it("translates the group heading (ar)", async () => {
    getSellerPermissions.mockResolvedValue(
      permissionsPayload(["READ_COMMENTS"], "Store Manager"),
    );

    await arriveOnPermissionsTab("ar");

    expect(
      screen.queryAllByRole("heading", { name: "التعليقات" }).length,
      "the Comments group heading stayed in English for an Arabic seller; 'Comments' has no key in translations.ar.js",
    ).toBeGreaterThan(0);
    expect(
      screen.queryAllByRole("heading", { name: "Comments" }).length,
      "the Comments group heading is still the English word on an Arabic page",
    ).toBe(0);
  });
});

describe("the Permissions tab role banner, on an arrival by URL", () => {
  it("shows the role the permissions call named", async () => {
    getSellerPermissions.mockResolvedValue(
      permissionsPayload(["READ_PRODUCTS"], "Store Manager"),
    );

    await arriveOnPermissionsTab();

    expect(
      screen.queryByText("Your role in this shop"),
      "the role banner never appeared; the tab is stuck on the spinner it shows while the role name is unknown, and nothing else will ever set it unless the seller opens the side menu",
    ).not.toBeNull();
    expect(
      screen.queryAllByText("Store Manager").length,
      "the role name the permissions call returned (shop_role: 'Store Manager') is nowhere on the page",
    ).toBeGreaterThan(0);
  });

  it("names the role in the page header instead of falling back to 'Member'", async () => {
    getSellerPermissions.mockResolvedValue(
      permissionsPayload(["READ_PRODUCTS"], "Store Manager"),
    );

    await arriveOnPermissionsTab();

    expect(
      screen.queryByText("Member"),
      "the header badge says 'Member' although the permissions call named the seller's role for this shop",
    ).toBeNull();
  });

  it("shows the Super Admin banner without waiting for a role name", async () => {
    // No shop_role in the answer: a Super Admin's banner does not need one.
    getSellerPermissions.mockResolvedValue(permissionsPayload(["SUPER_ADMIN"]));

    await arriveOnPermissionsTab();

    expect(
      screen.queryByText("You have full access to all features"),
      "the Super Admin banner is missing; the tab waits for a role name it does not need before it will draw the banner",
    ).not.toBeNull();
  });
});

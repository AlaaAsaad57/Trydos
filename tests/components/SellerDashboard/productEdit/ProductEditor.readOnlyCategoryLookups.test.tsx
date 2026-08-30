// A seller with read-only product permission opens a product.
//
// The backend allows GET /shop/products/{id}/edit for read permission, but the
// cascading endpoint GET /shop/products/categories/{id}/lookups still requires
// UPDATE_PRODUCT, so it answers 403. That call exists only to load the children
// of a category the seller has just PICKED — a reader picks nothing, and the
// /edit response already carries the product's own branch. So the refusal must
// not take anything off the screen.
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  act,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../render";

/** Let every promise the mount started run to the end.
 *
 *  The damage this file is about does NOT happen on the first render: the base
 *  lookups from /edit are put on screen straight away, and only the LATER,
 *  failed category-lookups round replaces them. Asserting before that round has
 *  settled reads the good frame and passes for the wrong reason, so every check
 *  here waits for the whole mount to go quiet first. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const getProductForEdit = vi.fn();
const getCategoryLookups = vi.fn();
const getSellerPermissions = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getProductForEdit: (...args: unknown[]) => getProductForEdit(...args),
    getCategoryLookups: (...args: unknown[]) => getCategoryLookups(...args),
    getSellerPermissions: (...args: unknown[]) => getSellerPermissions(...args),
  },
}));

import ProductEditor from "components/SellerDashboard/productEdit/ProductEditor";
import { SellerProfileProvider } from "app/(client)/[lang]/sellerProfile/SellerProfileContext";

const SELLER_ID = "77";
const PRODUCT_ID = "9001";

/** The shop record the dashboard loader puts in the store. The editor refuses to
 *  render any price input until this is settled, so every test needs it. */
const shopInfo = {
  sellerId: SELLER_ID,
  currency: { code: "SYP", name: "Syrian Pound" },
  newProductsApproval: true,
  available: true,
  permitted: true,
};

/** What /edit answers: the product sits in one branch, and `lookups` already
 *  names every level of that branch plus the branch's attribute groups. */
const editResponse = {
  data: {
    product: {
      name: "Suede Boot",
      status: 1,
      selected_categories: { main: [1], sub: [21], sub_sub: [31] },
    },
    lookups: {
      parent_categories: [{ id: 1, name: "Shoes" }],
      sub_categories: [{ id: 21, name: "Running Shoes" }],
      sub_sub_categories: [{ id: 31, name: "Trail Running Shoes" }],
      descriptor_groups: [
        {
          id: 5,
          name: "Leather",
          descriptors: [
            { id: 51, name: "Luster", type: "string_choice", options: '["Matte","Glossy"]' },
          ],
        },
      ],
    },
    descriptor_values: [{ descriptor_group_id: 5, descriptor_id: 51, value: "Matte" }],
  },
};

async function renderReadOnlyEditor() {
  return renderWithProviders(
    <SellerProfileProvider>
      <ProductEditor sellerId={SELLER_ID} productId={PRODUCT_ID} local="sy-en" />
    </SellerProfileProvider>,
    {
      store: { dashboardShopInfo: shopInfo },
      path: `/sellerProfile/sellerDashboard/${SELLER_ID}/products/${PRODUCT_ID}`,
    },
  );
}

describe("ProductEditor — read-only seller, category lookups refused", () => {
  beforeEach(() => {
    getProductForEdit.mockReset();
    getCategoryLookups.mockReset();
    getSellerPermissions.mockReset();
    getProductForEdit.mockResolvedValue(editResponse);
    // The whole point of this file: READ_PRODUCTS and nothing else. No
    // UPDATE_PRODUCT, so the form never leaves read mode.
    getSellerPermissions.mockResolvedValue({
      data: [{ seller_id: Number(SELLER_ID), permissions: ["READ_PRODUCTS"] }],
    });
    // What the seller's browser really gets: the gateway refuses the cascading
    // call because it is gated on UPDATE_PRODUCT.
    getCategoryLookups.mockRejectedValue(
      new Error("403 forbidden: you do not have permission to perform this action"),
    );
  });

  it("still shows the product's saved sub-category, sub-sub-category and attribute value", async () => {
    await renderReadOnlyEditor();

    await waitFor(() =>
      expect(
        screen.queryByText("Suede Boot"),
        "the product editor never finished loading — /shop/products/{id}/edit did not render the product name",
      ).not.toBeNull(),
    );

    await settle();

    expect(
      screen.queryByText("Running Shoes"),
      "the saved sub-category disappeared after the category-lookups call was refused — /edit had already returned it in data.lookups.sub_categories",
    ).not.toBeNull();

    expect(
      screen.queryByText("Trail Running Shoes"),
      "the saved sub-sub-category disappeared after the category-lookups call was refused — /edit had already returned it in data.lookups.sub_sub_categories",
    ).not.toBeNull();

    expect(
      screen.queryByText("Luster"),
      "the saved attribute disappeared after the category-lookups call was refused — /edit had already returned its group in data.lookups.descriptor_groups",
    ).not.toBeNull();

    expect(
      screen.queryByText("Matte"),
      "the saved attribute VALUE disappeared — it comes from /edit data.descriptor_values, not from the category-lookups call",
    ).not.toBeNull();
  });

  it("does not call the category-lookups endpoint at all while the form is read-only", async () => {
    await renderReadOnlyEditor();

    await waitFor(() =>
      expect(
        screen.queryByText("Suede Boot"),
        "the product editor never finished loading — /shop/products/{id}/edit did not render the product name",
      ).not.toBeNull(),
    );
    await settle();

    expect(
      getCategoryLookups.mock.calls.length,
      `the editor asked the gateway for category lookups ${getCategoryLookups.mock.calls.length} time(s) in read mode; that endpoint needs UPDATE_PRODUCT, so every call is a 403 and a Sentry report for an expected refusal`,
    ).toBe(0);
  });

  // The guard above is `!editMode`, not "never". This is the other side of it:
  // a seller who CAN edit must still get the branch, only later — on the Edit
  // click instead of on page open. Without this check the fix would also pass
  // with the sync removed outright.
  it("still loads the branch lookups when a seller with UPDATE_PRODUCT clicks Edit", async () => {
    getSellerPermissions.mockResolvedValue({
      data: [
        {
          seller_id: Number(SELLER_ID),
          permissions: ["READ_PRODUCTS", "UPDATE_PRODUCT"],
        },
      ],
    });
    getCategoryLookups.mockResolvedValue({
      sub_categories: [],
      sub_sub_categories: [],
      descriptor_groups: [],
    });

    await renderReadOnlyEditor();

    const edit = await screen.findByRole("button", { name: "Edit" });
    expect(
      getCategoryLookups.mock.calls.length,
      "the editor fetched category lookups before the seller asked to edit anything",
    ).toBe(0);

    await userEvent.click(edit);
    await settle();

    expect(
      getCategoryLookups.mock.calls.map((call) => call[1]),
      "clicking Edit did not load the product's category branch, so the sub-category and attribute pickers would open with no options to choose from",
    ).toEqual([1, 21, 31]);
  });
});

// The product editor as a whole: how it loads, what it shows around the form,
// how it saves, how it changes the purchase status, and the confirm dialog.
//
// The form sections themselves are replaced by one small stand-in. They have
// their own tests; here the stand-in only hands the editor's callbacks
// (`patch`, the three uploads) to the test, and prints the few values the
// editor passes down, so a check can read what the editor decided.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { useEffect } from "react";

import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../render";
import { routerSpies } from "../../../mocks/nextNavigation";

const h = vi.hoisted(() => ({ props: null as any }));

const svc = vi.hoisted(() => ({
  getSellerPermissions: vi.fn(),
  getProductCreateForm: vi.fn(),
  getProductForEdit: vi.fn(),
  getCategoryLookups: vi.fn(),
  bulkUploadImages: vi.fn(),
  uploadShopImage: vi.fn(),
  addProduct: vi.fn(),
  updateProduct: vi.fn(),
  syncProductDescriptors: vi.fn(),
  changeProductStatus: vi.fn(),
}));

vi.mock("services/sellerDashboard", () => ({ default: svc }));

const toast = vi.hoisted(() => ({
  showErrorMessage: vi.fn(),
  showSuccessMessage: vi.fn(),
}));
vi.mock("components/global/AddToCartMessage", () => toast);

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: logError,
}));

vi.mock("components/SellerDashboard/productEdit/helpers", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    validate: vi.fn(actual.validate),
    buildDiff: vi.fn(actual.buildDiff),
    scrollToFirstError: vi.fn(),
  };
});

// The read-only block at the end of this file needs the REAL sections: it checks
// text the real CoreSection / DescriptorsSection print. `realSections.on` makes
// every stand-in below hand over to the real export. It is off for every other
// block, and that block turns it on and off again in its own hooks.
const realSections = vi.hoisted(() => ({ on: false }));

vi.mock("components/SellerDashboard/productEdit/sections", async (importOriginal) => {
  const actual = await importOriginal<any>();
  const marker = (name: string, Real: any) =>
    function Section(p: any) {
      if (realSections.on) return <Real {...p} />;
      if (name === "core") h.props = p;
      return (
        <div data-testid={`section-${name}`}>
          {name === "core" && (
            <>
              <span data-testid="errors">{JSON.stringify(p.errors)}</span>
              <span data-testid="subs">
                {p.lookups.sub_categories?.map((s: any) => s.name).join("|")}
              </span>
              <span data-testid="subsubs">
                {p.lookups.sub_sub_categories?.map((s: any) => s.name).join("|")}
              </span>
              <span data-testid="descriptors">
                {p.lookups.descriptor_groups
                  ?.map(
                    (g: any) =>
                      `${g.name}:${(g.descriptors || []).map((d: any) => d.name).join(",")}`,
                  )
                  .join("|")}
              </span>
              <span data-testid="form">
                {JSON.stringify({
                  sub: p.form.sub_category_id,
                  subSub: p.form.sub_sub_category_id,
                  desc: p.form.descriptor_values,
                  images: p.form.images.map((i: any) => `${i.name}@${i.url}`),
                  meta: p.form.meta_image,
                  metaUrl: p.form.meta_image_url,
                  video: p.form.cloud_video,
                })}
              </span>
              <span data-testid="flags">
                {JSON.stringify({
                  disabled: p.disabled,
                  busy: p.busy,
                  pricesLocked: p.pricesLocked,
                  currency: p.currency,
                  canUseGallery: p.canUseGallery,
                  uploading: p.uploading,
                })}
              </span>
            </>
          )}
        </div>
      );
    };
  return {
    ...actual,
    CoreSection: marker("core", actual.CoreSection),
    PricingSection: marker("pricing", actual.PricingSection),
    CategoriesSection: marker("categories", actual.CategoriesSection),
    DescriptorsSection: marker("descriptors", actual.DescriptorsSection),
    ClassificationSection: marker("classification", actual.ClassificationSection),
    CountriesSection: marker("countries", actual.CountriesSection),
    SeoSection: marker("seo", actual.SeoSection),
    MediaSection: marker("media", actual.MediaSection),
    VariantsSection: marker("variants", actual.VariantsSection),
    TranslationsSection: marker("translations", actual.TranslationsSection),
    VideosSection: marker("videos", actual.VideosSection),
  };
});

import ProductEditor from "components/SellerDashboard/productEdit/ProductEditor";
import {
  SellerProfileProvider,
  useSellerProfile,
} from "app/(client)/[lang]/sellerProfile/SellerProfileContext";
import {
  buildDiff,
  scrollToFirstError,
  validate,
} from "components/SellerDashboard/productEdit/helpers";

const SELLER_ID = "77";
const PRODUCT_ID = "9001";

const shopInfo = {
  sellerId: SELLER_ID,
  currency: { code: "SYP", name: "Syrian Pound" },
  newProductsApproval: true,
  available: true,
  permitted: true,
};

const ALL = ["UPDATE_PRODUCT", "CHANGE_PRODUCT_STATUS", "READ_PRODUCT_IMAGES"];

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Puts permissions and the product list into the seller context BEFORE the
 *  editor mounts, the way the dashboard page does. */
function Seeded({
  perms,
  products,
  children,
}: {
  perms: string[];
  products: any[];
  children: React.ReactNode;
}) {
  const { sellerPermissions, setSellerPermissions, setSellerProducts } =
    useSellerProfile();
  useEffect(() => {
    if (perms.length) setSellerPermissions?.(perms);
    setSellerProducts?.(products);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (perms.length && !sellerPermissions?.length) return null;
  return <>{children}</>;
}

async function renderEditor({
  mode = "edit",
  perms = ALL,
  products = [],
  shop = shopInfo as any,
  productId = PRODUCT_ID as string | undefined,
}: {
  mode?: "edit" | "create";
  perms?: string[];
  products?: any[];
  shop?: any;
  productId?: string;
} = {}) {
  const r = await renderWithProviders(
    <SellerProfileProvider>
      <Seeded perms={perms} products={products}>
        <ProductEditor
          sellerId={SELLER_ID}
          productId={productId}
          local="sy-en"
          mode={mode}
        />
      </Seeded>
    </SellerProfileProvider>,
    { store: { dashboardShopInfo: shop } },
  );
  await settle();
  return r;
}

const editProduct = (over: any = {}) => ({
  data: {
    product: {
      name: "Suede Boot",
      seller_product_id: "SB-1",
      status: 0,
      ...over,
    },
    lookups: { seller_product_id: ["SB-1", "TAKEN-9"] },
  },
});

const oneDiff = [{ key: "name", label: "Name", from: "Suede Boot", to: "Suede Boot 2" }];

beforeEach(() => {
  Object.values(svc).forEach((f) => f.mockReset());
  toast.showErrorMessage.mockReset();
  toast.showSuccessMessage.mockReset();
  logError.mockReset();
  vi.mocked(validate).mockReset().mockReturnValue({});
  vi.mocked(buildDiff).mockReset().mockReturnValue(oneDiff as any);
  vi.mocked(scrollToFirstError).mockReset();
  routerSpies.push.mockClear();
  routerSpies.replace.mockClear();
  h.props = null;
  svc.getSellerPermissions.mockResolvedValue({ data: [] });
  svc.getProductForEdit.mockResolvedValue(editProduct());
  svc.getCategoryLookups.mockResolvedValue({
    sub_categories: [],
    sub_sub_categories: [],
    descriptor_groups: [],
  });
  (URL as any).createObjectURL = vi.fn(() => "blob:preview");
});

const text = (id: string) => screen.getByTestId(id).textContent || "";
const formState = () => JSON.parse(text("form"));
const flags = () => JSON.parse(text("flags"));

/* ------------------------------ permissions ------------------------------ */

describe("ProductEditor — permissions", () => {
  it("loads this shop's permissions when the context has none", async () => {
    svc.getSellerPermissions.mockResolvedValue({
      data: [{ seller_id: 77, permissions: ["UPDATE_PRODUCT"] }],
    });
    await renderEditor({ perms: [] });
    expect(
      await screen.findByRole("button", { name: "Edit" }),
      "the permissions from /seller/permissions were not applied — the Edit button needs UPDATE_PRODUCT",
    ).toBeInTheDocument();
  });

  it("keeps view-only when the permissions answer is not a list", async () => {
    svc.getSellerPermissions.mockResolvedValue({ data: null });
    await renderEditor({ perms: [] });
    expect(screen.getByText("View Only"), "a seller with no permissions must see 'View Only'").toBeInTheDocument();
  });

  it("logs a refused permissions call", async () => {
    svc.getSellerPermissions.mockRejectedValueOnce(new Error("boom"));
    await renderEditor({ perms: [] });
    expect(logError, "the failed permissions call was not reported").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "ProductEditor.getSellerPermissions", error: "boom" }),
    );
  });

  it("logs a refused permissions call that throws a non-Error", async () => {
    svc.getSellerPermissions.mockRejectedValueOnce("plain");
    await renderEditor({ perms: [] });
    expect(logError, "a thrown string was not reported as the error text").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "ProductEditor.getSellerPermissions", error: "plain" }),
    );
  });

  it("does not ask for permissions when the context already has them", async () => {
    await renderEditor();
    expect(svc.getSellerPermissions, "permissions were fetched again although the context had them").not.toHaveBeenCalled();
  });
});

/* -------------------------------- loading -------------------------------- */

describe("ProductEditor — loading and shop info", () => {
  it("shows the skeleton while shop info is not settled", async () => {
    const { container } = await renderEditor({ shop: null });
    expect(screen.queryByTestId("section-core"), "the form rendered before shop info settled").toBeNull();
    expect(container.innerHTML, "no skeleton was shown while waiting for shop info").toContain("animate-pulse");
  });

  it("says a missing READ_SHOP_INFO blocks opening a product", async () => {
    await renderEditor({ shop: { ...shopInfo, permitted: false } });
    expect(
      screen.getByText(/Opening a product needs permission to view shop info/),
      "the edit path did not explain the missing shop-info permission",
    ).toBeInTheDocument();
  });

  it("says a missing READ_SHOP_INFO blocks adding a product", async () => {
    svc.getProductCreateForm.mockResolvedValue({ data: {} });
    await renderEditor({ mode: "create", shop: { ...shopInfo, permitted: false } });
    expect(
      screen.getByText(/Adding a product needs permission to view shop info/),
      "the create path did not explain the missing shop-info permission",
    ).toBeInTheDocument();
  });

  it("offers a retry when shop info could not be read, and the retry clears it and reloads", async () => {
    const { store } = await renderEditor({ shop: { ...shopInfo, available: false } });
    expect(
      screen.getByText(/Editing this product is unavailable until they load/),
      "the edit path did not say shop details failed to load",
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await settle();
    expect(store.getState().dashboardShopInfo, "retry did not clear the stored shop info").toBeNull();
    expect(svc.getProductForEdit, "retry did not reload the product").toHaveBeenCalledTimes(2);
  });

  it("tells a creating seller that shop details failed", async () => {
    svc.getProductCreateForm.mockResolvedValue({ data: {} });
    await renderEditor({ mode: "create", shop: { ...shopInfo, available: false } });
    expect(
      screen.getByText(/Product creation is unavailable until they load/),
      "the create path did not say shop details failed to load",
    ).toBeInTheDocument();
  });

  it("shows access denied when /edit is forbidden", async () => {
    svc.getProductForEdit.mockRejectedValue(new Error("403 Forbidden"));
    await renderEditor();
    expect(
      screen.getByText("You Don't Have Permission To View Or Edit This Product."),
      "a 403 from /edit was not shown as access denied",
    ).toBeInTheDocument();
  });

  it("shows the load error and retries when the product is missing", async () => {
    svc.getProductForEdit.mockResolvedValueOnce({ data: {} });
    await renderEditor();
    expect(screen.getByText("Product not found"), "an empty /edit answer did not say the product is missing").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await settle();
    expect(screen.getByTestId("section-core"), "retry did not load the form").toBeInTheDocument();
  });

  it("falls back to a generic message when the load error has no text", async () => {
    svc.getProductForEdit.mockRejectedValue("");
    await renderEditor();
    expect(screen.getByText("Failed To Load Product"), "an empty load error left no message").toBeInTheDocument();
  });

  it("opens an empty create form in edit mode with the taken ids from the flat create answer", async () => {
    svc.getProductCreateForm.mockResolvedValue({ data: { seller_product_id: ["USED-1"] } });
    await renderEditor({ mode: "create", productId: undefined });
    expect(screen.getByRole("heading", { name: "New Product" }), "the create header is missing").toBeInTheDocument();
    expect(flags().disabled, "the create form must open editable").toBe(false);
    expect(screen.queryByTestId("section-descriptors"), "attributes must not show on create").toBeNull();
    expect(screen.queryByTestId("section-videos"), "videos must not show on create").toBeNull();
    act(() => h.props.patch({ seller_product_id: "USED-1" }));
    expect(
      JSON.parse(text("errors")).seller_product_id,
      "a seller product id already used in the shop was not flagged",
    ).toBe("This Seller Product ID is already used");
  });

  it("builds the create form when the create answer carries no data", async () => {
    svc.getProductCreateForm.mockResolvedValue({});
    await renderEditor({ mode: "create", productId: undefined });
    expect(screen.getByTestId("section-core"), "a create answer with no data did not open the form").toBeInTheDocument();
  });
});

/* -------------------------------- header --------------------------------- */

describe("ProductEditor — header", () => {
  it("uses the list product's image as cover, shows Pending Approval and Disabled", async () => {
    svc.getProductForEdit.mockResolvedValue(editProduct({ request_status: 0 }));
    await renderEditor({ products: [{ id: 9001, images: ["https://example.com/c.jpg"] }] });
    expect(screen.getByRole("img", { name: "Suede Boot" }).getAttribute("src"), "the cover did not come from the product list").toBe(
      "https://example.com/c.jpg",
    );
    expect(screen.getByText("Pending Approval"), "a request_status 0 product lacks the pending pill").toBeInTheDocument();
    expect(screen.getByText("Disabled"), "a status 0 product must read Disabled").toBeInTheDocument();
    expect(screen.getByText(/ID: 9001 · SB-1/), "the id line is wrong").toBeInTheDocument();
    expect(flags().currency, "the shop currency was not passed down").toBe("SYP");
    expect(flags().canUseGallery, "READ_PRODUCT_IMAGES was not passed down").toBe(true);
  });

  it("shows Untitled Product, the pending-update banner and no pending pill", async () => {
    svc.getProductForEdit.mockResolvedValue(
      editProduct({ name: "", request_status: 0, is_product_updated_and_need_approval: 1 }),
    );
    await renderEditor({ perms: ["READ_PRODUCTS"] });
    expect(screen.getByText("Untitled Product"), "an unnamed product needs a placeholder title").toBeInTheDocument();
    expect(screen.getByText(/pending changes awaiting admin approval/), "the pending-update banner is missing").toBeInTheDocument();
    expect(screen.queryByText("Pending Approval"), "the pill contradicts the pending-update banner").toBeNull();
  });

  it("shows the denied banner for request_status 2", async () => {
    svc.getProductForEdit.mockResolvedValue(editProduct({ request_status: 2 }));
    await renderEditor();
    expect(screen.getByText(/Your last changes to this product were denied/), "the denied banner is missing").toBeInTheDocument();
  });
});

/* ------------------------- category lookups sync ------------------------- */

describe("ProductEditor — category lookups", () => {
  const branch = {
    data: {
      product: {
        name: "Boot",
        status: 0,
        selected_categories: { main: [1], sub: [21], sub_sub: [31] },
      },
      lookups: {
        parent_categories: [{ id: 1, name: "Shoes" }],
        sub_categories: [{ id: 21, name: "Running" }],
        sub_sub_categories: [{ id: 31, name: "Trail" }],
        descriptor_groups: [],
      },
    },
  };

  it("merges each level's answer into the right bucket and dedupes descriptor groups", async () => {
    svc.getProductForEdit.mockResolvedValue(branch);
    svc.getCategoryLookups.mockImplementation(async (_s: string, id: number) => {
      if (id === 1)
        return {
          sub_categories: [{ id: 21, name: "Running" }],
          sub_sub_categories: [{ id: 31, name: "Trail" }],
          descriptor_groups: [{ id: 5, name: "Leather", descriptors: [{ id: 51, name: "Luster" }] }],
        };
      if (id === 21)
        return {
          sub_categories: [{ id: 32, name: "Road" }],
          sub_sub_categories: [],
          descriptor_groups: [
            { id: 5, name: "Leather", descriptors: [{ id: 51, name: "Luster" }, { id: 52, name: "Grain" }] },
            { id: 6, name: "Empty" },
          ],
        };
      return { sub_categories: [], sub_sub_categories: [], descriptor_groups: [{ id: 6, name: "Empty" }] };
    });
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    expect(text("subs"), "a main category's children are sub-categories").toBe("Running");
    expect(text("subsubs"), "a sub category's children are sub-sub categories").toBe("Trail|Road");
    expect(text("descriptors"), "descriptor groups were not merged by id").toBe("Leather:Luster,Grain|Empty:");
  });

  it("prunes selections that the loaded branch no longer contains", async () => {
    svc.getProductForEdit.mockResolvedValue(branch);
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    act(() => h.props.patch({ descriptor_values: { 51: "Matte" }, category_id: [1, 2] }));
    await settle();
    expect(formState().desc, "an attribute value outside the loaded branch was kept").toEqual({});
    expect(formState().sub, "a sub-category missing from the loaded branch was kept").toEqual([]);
    expect(formState().subSub, "a sub-sub category missing from the loaded branch was kept").toEqual([]);
  });

  it("keeps selections and retries when one branch fails to load", async () => {
    svc.getProductForEdit.mockResolvedValue(branch);
    svc.getCategoryLookups.mockImplementation(async (_s: string, id: number) => {
      if (id === 21) throw "down";
      return { sub_categories: [], sub_sub_categories: [], descriptor_groups: [] };
    });
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    expect(formState().sub, "a failed branch load must not drop the saved sub-category").toEqual([21]);
    expect(logError, "the failed category lookup was not reported").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "ProductEditor.getCategoryLookups", error: "down", categoryId: 21 }),
    );
    svc.getCategoryLookups.mockClear();
    act(() => h.props.patch({ category_id: [1, 2] }));
    await settle();
    expect(
      svc.getCategoryLookups.mock.calls.map((c) => c[1]).sort(),
      "the failed id was cached instead of retried, or a cached id was fetched again",
    ).toEqual([2, 21]);
  });

  it("ignores an older lookup answer that lands after a newer selection", async () => {
    svc.getProductCreateForm.mockResolvedValue({ data: {} });
    let releaseFirst: (v: any) => void = () => {};
    svc.getCategoryLookups.mockImplementation(async (_s: string, id: number) => {
      if (id === 1) return new Promise((r) => (releaseFirst = r));
      return { sub_categories: [{ id: 99, name: "Fresh" }], sub_sub_categories: [], descriptor_groups: [] };
    });
    await renderEditor({ mode: "create", productId: undefined });
    act(() => h.props.patch({ category_id: [1] }));
    await settle();
    expect(flags().busy, "the form was not marked busy while lookups load").toBe(true);
    act(() => h.props.patch({ category_id: [2] }));
    await settle();
    await act(async () => {
      releaseFirst({ sub_categories: [{ id: 11, name: "Stale" }], sub_sub_categories: [], descriptor_groups: [] });
    });
    await settle();
    expect(text("subs"), "the stale answer for a deselected category replaced the newer one").toBe("Fresh");
    expect(flags().busy, "busy stayed on after the newest sync finished").toBe(false);
  });
});

/* -------------------------------- uploads -------------------------------- */

describe("ProductEditor — uploads", () => {
  const file = (n: string) => new File(["x"], n, { type: "image/png" });

  it.each([
    ["files", { files: ["https://m/a/one.png"] }],
    ["urls", { urls: [{ url: "https://m/one.png" }] }],
    ["results", { results: [{ path: "p/one.png" }] }],
    ["data", { data: [{ file_name: "one.png" }] }],
    ["url", { url: "https://m/one.png" }],
    ["array", [{ name: "one.png" }]],
  ])("adds uploaded images from a %s-shaped answer", async (_label, answer) => {
    svc.bulkUploadImages.mockResolvedValue(answer);
    await renderEditor();
    await act(() => h.props.onUploadImages([file("one.png")]));
    expect(formState().images, "the uploaded file was not added to the gallery").toEqual(["one.png@blob:preview"]);
  });

  it("gives an extra name with no matching file an empty preview and drops blank names", async () => {
    svc.bulkUploadImages.mockResolvedValue({ files: ["a.png", {}, "b.png"] });
    await renderEditor();
    await act(() => h.props.onUploadImages([file("a.png")]));
    expect(formState().images, "names beyond the sent files must still be added, blanks dropped").toEqual([
      "a.png@blob:preview",
      "b.png@",
    ]);
  });

  it("reports an upload that returned no files", async () => {
    svc.bulkUploadImages.mockResolvedValue({ files: "not-a-list" });
    await renderEditor();
    await act(() => h.props.onUploadImages([file("a.png")]));
    expect(toast.showErrorMessage, "an empty upload answer was not reported").toHaveBeenCalledWith("Upload returned no files");
    expect(flags().uploading.images, "the images upload flag stayed on").toBe(false);
  });

  it("falls back to a generic image error for an empty thrown value", async () => {
    svc.bulkUploadImages.mockRejectedValue("");
    await renderEditor();
    await act(() => h.props.onUploadImages([file("a.png")]));
    expect(toast.showErrorMessage, "an empty upload failure left no message").toHaveBeenCalledWith("Image upload failed");
  });

  it("sets the meta image from the upload", async () => {
    svc.bulkUploadImages.mockResolvedValue({ files: ["meta.png"] });
    await renderEditor();
    await act(() => h.props.onUploadMeta(file("meta.png")));
    expect(formState().meta, "the meta image name was not stored").toBe("meta.png");
    expect(formState().metaUrl, "the meta image preview was not stored").toBe("blob:preview");
  });

  it("reports a meta upload with no file, and one that throws empty", async () => {
    svc.bulkUploadImages.mockResolvedValueOnce({ files: [] }).mockRejectedValueOnce("");
    await renderEditor();
    await act(() => h.props.onUploadMeta(file("m.png")));
    expect(toast.showErrorMessage, "a meta upload with no file was not reported").toHaveBeenCalledWith("Upload returned no file");
    await act(() => h.props.onUploadMeta(file("m.png")));
    expect(toast.showErrorMessage, "an empty meta failure left no message").toHaveBeenCalledWith("Image upload failed");
  });

  it("stores the uploaded video's file name", async () => {
    svc.uploadShopImage.mockResolvedValue("https://m/product/videos/clip.mp4");
    await renderEditor();
    await act(() => h.props.onUploadVideo(file("clip.mp4")));
    expect(formState().video, "the uploaded video name was not stored").toBe("clip.mp4");
  });

  it("reports a video upload with no file, and one that throws empty", async () => {
    svc.uploadShopImage.mockResolvedValueOnce("").mockRejectedValueOnce("");
    await renderEditor();
    await act(() => h.props.onUploadVideo(file("c.mp4")));
    expect(toast.showErrorMessage, "a video upload with no file was not reported").toHaveBeenCalledWith("Upload returned no file");
    await act(() => h.props.onUploadVideo(file("c.mp4")));
    expect(toast.showErrorMessage, "an empty video failure left no message").toHaveBeenCalledWith("Video upload failed");
  });
});

/* --------------------------------- save ---------------------------------- */

async function openEditAndSave() {
  await renderEditor();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  await settle();
  fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
}

describe("ProductEditor — save (edit)", () => {
  it("blocks the save on validation errors and scrolls to them", async () => {
    vi.mocked(validate).mockReturnValue({ name: "Required" });
    await openEditAndSave();
    expect(toast.showErrorMessage, "invalid fields did not block the save").toHaveBeenCalledWith(
      "Please fix the highlighted fields before saving.",
    );
    expect(scrollToFirstError, "the page did not move to the first error").toHaveBeenCalledWith({ name: "Required" });
  });

  it("blocks the save when the seller product id is already used", async () => {
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    act(() => h.props.patch({ seller_product_id: "TAKEN-9" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    expect(scrollToFirstError, "a taken seller product id did not block the save").toHaveBeenCalledWith({
      seller_product_id: "This Seller Product ID is already used",
    });
  });

  it("says there is nothing to save when the diff is empty", async () => {
    vi.mocked(buildDiff).mockReturnValue([]);
    await openEditAndSave();
    expect(toast.showErrorMessage, "an empty diff did not say there is nothing to save").toHaveBeenCalledWith("No changes to save.");
  });

  it("cancel restores view mode", async () => {
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
    expect(flags().disabled, "the sticky-bar cancel did not leave edit mode").toBe(true);
  });

  it("marks backend field refusals, clears one on edit, and caps loose messages", async () => {
    svc.updateProduct.mockResolvedValue({
      success: false,
      httpStatus: 422,
      message: "invalid",
      detailed_error: [
        { code: "name", message: "Name taken" },
        ...["a", "b", "c", "d", "e", "f", "a"].map((m) => ({ code: `zzz_${m}`, message: `row ${m}` })),
      ],
    });
    await openEditAndSave();
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(JSON.parse(text("errors")).name, "the backend's field message was not placed on the field").toBe("Name taken");
    expect(scrollToFirstError, "the page did not move to the refused field").toHaveBeenCalled();
    expect(screen.getByText("row e"), "the fifth loose message is missing").toBeInTheDocument();
    expect(screen.queryByText("row f"), "more than five loose messages were shown").toBeNull();
    expect(screen.getByText("More Problems Were Reported: 1"), "the hidden-message count is wrong").toBeInTheDocument();
    expect(toast.showErrorMessage, "the refusal summary did not point at the fields").toHaveBeenCalledWith(
      "Please fix the highlighted fields before saving.",
    );
    act(() => h.props.patch({ name: "New name" }));
    expect(JSON.parse(text("errors")).name, "editing the field did not clear the backend's message").toBeUndefined();
  });

  it("uses the fallback when a refusal names nothing", async () => {
    svc.updateProduct.mockResolvedValue(null);
    await openEditAndSave();
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(toast.showErrorMessage, "an empty refusal did not use the fallback text").toHaveBeenCalledWith("Failed to update product");
    expect(logError, "the refusal was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "ProductEditor.saveRejected", error: "rejected" }),
    );
  });

  it("saves, syncs changed attributes and reports success", async () => {
    svc.updateProduct.mockResolvedValue({ success: true, data: {} });
    svc.syncProductDescriptors.mockResolvedValue({ success: true });
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    act(() => h.props.patch({ descriptor_values: { 7: "Red" } }));
    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(svc.syncProductDescriptors, "changed attributes were not synced").toHaveBeenCalled();
    expect(toast.showSuccessMessage, "a clean save did not report success").toHaveBeenCalledWith("Product updated successfully.");
    expect(flags().disabled, "a saved form must go back to view mode").toBe(true);
  });

  it("rolls attributes back when their sync fails", async () => {
    svc.updateProduct.mockResolvedValue({ success: true, data: {} });
    svc.syncProductDescriptors.mockResolvedValue({ success: false, message: "nope" });
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    act(() => h.props.patch({ descriptor_values: { 7: "Red" } }));
    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(toast.showErrorMessage, "the failed attribute sync was not reported").toHaveBeenCalledWith(
      "Product updated, but attributes failed to save.",
    );
    expect(formState().desc, "unsaved attribute values were left on screen").toEqual({});
    expect(toast.showSuccessMessage, "a partial save must not claim full success").not.toHaveBeenCalled();
  });

  it("rolls attributes back when the sync answers nothing", async () => {
    svc.updateProduct.mockResolvedValue({ success: true, data: {} });
    svc.syncProductDescriptors.mockResolvedValue(undefined);
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    act(() => h.props.patch({ descriptor_values: { 7: "Red" } }));
    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(logError, "an empty sync answer was not logged as rejected").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "ProductEditor.syncDescriptors", error: "rejected" }),
    );
  });

  it.each([
    [true, "Changes Were Submitted"],
    [false, "Changes Were Submitted And Are Pending Admin Approval — They Go Live Once Approved."],
  ])("shows the approval note when the save needs approval (newProductsApproval %s)", async (approved, note) => {
    svc.updateProduct.mockResolvedValue({ success: true, data: { requires_approval: true } });
    await renderEditor({ shop: { ...shopInfo, newProductsApproval: approved } });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await settle();
    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(screen.getByText(note), "the approval note is missing or wrong").toBeInTheDocument();
    expect(toast.showSuccessMessage, "a save waiting for approval must not show the plain success toast").not.toHaveBeenCalled();
  });

  it("reports a save that throws", async () => {
    svc.updateProduct.mockRejectedValue(new Error("network down"));
    await openEditAndSave();
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(toast.showErrorMessage, "a thrown save error was not shown").toHaveBeenCalledWith("network down");
    expect(screen.queryByRole("button", { name: "Confirm & Save" }), "the dialog stayed open after the error").toBeNull();
  });

  it("reports a save that throws a non-Error", async () => {
    svc.updateProduct.mockRejectedValue("raw");
    await openEditAndSave();
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
    expect(toast.showErrorMessage, "a thrown string was not shown").toHaveBeenCalledWith("raw");
  });

  it("closes the confirm dialog on Cancel and on the backdrop, but not while saving", async () => {
    let finish: (v: any) => void = () => {};
    svc.updateProduct.mockImplementation(() => new Promise((r) => (finish = r)));
    await openEditAndSave();
    const cancels = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancels[cancels.length - 1]);
    expect(screen.queryByText("Confirm Changes"), "Cancel did not close the confirm dialog").toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    const backdrop = document.querySelector(".bg-black\\/45") as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.getByText("Confirm Changes"), "the backdrop closed the dialog while the save was running").toBeInTheDocument();
    await act(async () => finish({ success: true, data: {} }));
    await settle();
    expect(screen.queryByText("Confirm Changes"), "a finished save left the dialog open").toBeNull();
  });
});

describe("ProductEditor — save (create)", () => {
  async function openCreateAndConfirm() {
    svc.getProductCreateForm.mockResolvedValue({ data: {} });
    await renderEditor({ mode: "create", productId: undefined });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Product" })[0]);
    expect(screen.getByText("Confirm New Product"), "the create confirm dialog did not open").toBeInTheDocument();
    expect(screen.getByText("These Details Will Be Saved (1 Item(s))."), "the create dialog count line is wrong").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Save" }));
    await settle();
  }

  it("goes to the new product after a create that returns its id", async () => {
    svc.addProduct.mockResolvedValue({ success: true, data: { product_id: 55 } });
    await openCreateAndConfirm();
    expect(toast.showSuccessMessage, "a created product did not report success").toHaveBeenCalledWith("Product created successfully.");
    expect(routerSpies.replace, "the seller was not sent to the new product").toHaveBeenCalledWith(
      "/sy-en/sellerProfile/sellerDashboard/77/products/55",
    );
  });

  it("goes back to the dashboard when the create returns no id", async () => {
    svc.addProduct.mockResolvedValue({ success: true, data: {} });
    await openCreateAndConfirm();
    expect(routerSpies.replace, "a create with no id did not return to the dashboard").toHaveBeenCalledWith(
      "/sy-en/sellerProfile/sellerDashboard/77",
    );
  });

  it("shows the refusal of a create with the backend's own message", async () => {
    svc.addProduct.mockResolvedValue({
      success: false,
      httpStatus: 422,
      detailed_error: [{ code: "zzz", message: "Row broken" }],
    });
    await openCreateAndConfirm();
    expect(toast.showErrorMessage, "a create refusal did not show the backend line").toHaveBeenCalledWith("Row broken");
  });

  it("Cancel buttons on create return to the dashboard", async () => {
    svc.getProductCreateForm.mockResolvedValue({ data: {} });
    await renderEditor({ mode: "create", productId: undefined });
    const cancels = screen.getAllByRole("button", { name: "Cancel" });
    cancels.forEach((b) => fireEvent.click(b));
    expect(routerSpies.push.mock.calls, "both create Cancel buttons must go to the dashboard").toEqual([
      ["/sy-en/sellerProfile/sellerDashboard/77"],
      ["/sy-en/sellerProfile/sellerDashboard/77"],
    ]);
  });
});

/* -------------------------------- status --------------------------------- */

describe("ProductEditor — purchase status", () => {
  const lastButton = (name: string) => {
    const all = screen.getAllByRole("button", { name });
    return all[all.length - 1];
  };

  it("disables a purchasable product and shows the new status", async () => {
    svc.getProductForEdit.mockResolvedValue(editProduct({ status: 1 }));
    svc.changeProductStatus.mockResolvedValue({ success: true, data: { status: 0 } });
    await renderEditor();
    expect(screen.getByText("Purchasable"), "a status 1 product must read Purchasable").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    expect(screen.getByText("Disable Purchasing?"), "the disable dialog did not open").toBeInTheDocument();
    fireEvent.click(lastButton("Disable"));
    await settle();
    expect(svc.changeProductStatus, "the status call carried the wrong target").toHaveBeenCalledWith("77", "9001", 0);
    expect(screen.getByText("Disabled"), "the header did not show the new status").toBeInTheDocument();
    expect(toast.showSuccessMessage, "the status change was not confirmed").toHaveBeenCalledWith("Status updated.");
  });

  it("falls back to the requested status when the answer carries none", async () => {
    svc.changeProductStatus.mockResolvedValue({ success: true });
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Allow Purchase" }));
    expect(screen.getByText("Allow This Product To Be Purchased?"), "the enable dialog did not open").toBeInTheDocument();
    fireEvent.click(lastButton("Allow Purchase"));
    await settle();
    expect(screen.getByText("Purchasable"), "the requested status was not applied").toBeInTheDocument();
  });

  it.each([
    ["detailed errors", { success: false, detailed_error: [{ message: "Add a price" }] }, "Add a price"],
    ["a message", { success: false, message: "Not allowed", detailed_error: [] }, "Not allowed"],
    ["nothing", null, "Could Not Change Status"],
  ])("lists the blockers when the backend refuses with %s", async (_l, answer, shown) => {
    svc.changeProductStatus.mockResolvedValue(answer);
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Allow Purchase" }));
    fireEvent.click(lastButton("Allow Purchase"));
    await settle();
    expect(screen.getByText("Cannot Enable Yet — Resolve These First:"), "the blocker list is missing").toBeInTheDocument();
    expect(screen.getByText(shown), "the blocker text is wrong").toBeInTheDocument();
  });

  it("shows a thrown status error as a blocker", async () => {
    svc.changeProductStatus.mockRejectedValueOnce(new Error("offline")).mockRejectedValueOnce("raw");
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Allow Purchase" }));
    fireEvent.click(lastButton("Allow Purchase"));
    await settle();
    expect(screen.getByText("offline"), "a thrown status error was not listed").toBeInTheDocument();
    fireEvent.click(lastButton("Allow Purchase"));
    await settle();
    expect(screen.getByText("raw"), "a thrown string was not listed").toBeInTheDocument();
  });

  it("does not close while saving, and closes on Cancel after", async () => {
    let finish: (v: any) => void = () => {};
    svc.changeProductStatus.mockImplementation(() => new Promise((r) => (finish = r)));
    await renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Allow Purchase" }));
    fireEvent.click(lastButton("Allow Purchase"));
    expect(screen.getByText("Saving…"), "the dialog did not show it is saving").toBeInTheDocument();
    fireEvent.click(document.querySelector(".bg-black\\/45") as HTMLElement);
    expect(screen.getByText("Allow This Product To Be Purchased?"), "the dialog closed during the save").toBeInTheDocument();
    await act(async () => finish({ success: false, message: "Blocked" }));
    fireEvent.click(lastButton("Cancel"));
    expect(screen.queryByText("Allow This Product To Be Purchased?"), "Cancel did not close the status dialog").toBeNull();
  });
});

/* ---------------------------- confirm dialog ----------------------------- */

describe("ProductEditor — confirm dialog diff views", () => {
  const img = (name: string) => ({ name, url: `https://example.com/${name}` });
  const richDiff = [
    { key: "", label: "Plain", from: "a", to: "b" },
    {
      key: "tr",
      label: "Translations",
      type: "translations",
      translationsDetails: [
        { langCode: "ar", langName: "Arabic", status: "added", changes: [{ fieldLabel: "Name", from: "", to: "Boot AR" }] },
        { langCode: "tr", langName: "Turkish", status: "removed", changes: [] },
        { langCode: "ku", langName: "Kurdish", status: "modified", changes: [] },
      ],
    },
    {
      key: "var",
      label: "Variants",
      type: "variants",
      variantsDetails: [
        { key: "k1", title: "Black / M", colorCode: "#000000", status: "changed", changes: [{ fieldLabel: "Price", from: "1", to: "2" }] },
        { key: "k2", title: "No colour", status: "kept", changes: [] },
      ],
    },
    {
      key: "img",
      label: "Images",
      type: "image",
      to: "3 images",
      imageDetails: { oldList: [], newList: [img("n.png")], added: [img("add.png")], removed: [img("rem.png")] },
    },
    {
      key: "img2",
      label: "Images unchanged",
      type: "image",
      to: "1 image",
      imageDetails: { oldList: [], newList: [], added: [], removed: [] },
    },
    {
      key: "col",
      label: "Colours",
      type: "color",
      colorDetails: {
        oldList: [{ code: "#fff", name: "White" }],
        newList: [{ code: "#000", name: "Black", translatedName: "Noir" }],
        added: [],
        removed: [],
      },
    },
    {
      key: "col2",
      label: "Colours empty",
      type: "color",
      colorDetails: { oldList: [], newList: [], added: [], removed: [] },
    },
    {
      key: "cty",
      label: "Countries",
      type: "country",
      countryDetails: [
        { iso: "sy", name: "Syria", extraPrice: "5", oldExtraPrice: "3", status: "changed" },
        { iso: "iq", name: "Iraq", extraPrice: "2", status: "added" },
        { iso: "tr", name: "Turkey", status: "removed" },
      ],
    },
    { key: "cty2", label: "Countries none", type: "country", countryDetails: [] },
    {
      key: "cat",
      label: "Categories",
      type: "categories",
      categoryDetails: [{ groupLabel: "Main", added: ["Shoes"], removed: ["Bags"] }],
    },
    { key: "cat2", label: "Categories none", type: "categories", categoryDetails: [] },
    {
      key: "desc",
      label: "Attributes",
      type: "descriptors",
      descriptorDetails: [{ descriptorId: 1, name: "Luster", from: "Matte", to: "Glossy" }],
    },
    { key: "desc2", label: "Attributes none", type: "descriptors", descriptorDetails: [] },
    { key: "lst", label: "Labels", type: "list", listDetails: { added: ["New"], removed: ["Old"] } },
  ];

  it("renders every expandable section once opened", async () => {
    vi.mocked(buildDiff).mockReturnValue(richDiff as any);
    await openEditAndSave();
    expect(screen.getByText("These Fields Will Be Updated (14 Item(s))."), "the edit count line is wrong").toBeInTheDocument();
    expect(screen.getByText("3 Languages"), "the translations badge is wrong").toBeInTheDocument();
    expect(screen.getByText("2 Variants"), "the variants badge is wrong").toBeInTheDocument();
    expect(screen.getByText("3 images"), "the images badge is wrong").toBeInTheDocument();
    expect(screen.getByText("1 colors"), "the colours badge is wrong").toBeInTheDocument();
    expect(screen.getByText("3 countries"), "the countries badge is wrong").toBeInTheDocument();

    for (const label of richDiff.slice(1).map((d) => d.label)) {
      fireEvent.click(screen.getByText(label));
    }

    const checks: [string, string][] = [
      ["Arabic", "an added translation"],
      ["Added", "the Added badge"],
      ["Removed", "the Removed badge"],
      ["Boot AR", "a translation change"],
      ["Black / M", "a variant row"],
      ["No colour", "a variant without colour"],
      ["New Images Added (1)", "the added images block"],
      ["Removed Images (1)", "the removed images block"],
      ["Noir", "a translated colour name"],
      ["White", "an original colour"],
      ["Syria", "a changed country"],
      ["+2", "a new country's extra price"],
      ["Turkey", "a removed country"],
      ["+ Shoes", "an added category"],
      ["- Bags", "a removed category"],
      ["Glossy", "an attribute change"],
      ["+ New", "an added label"],
      ["- Old", "a removed label"],
    ];
    for (const [needle, what] of checks) {
      expect(screen.queryAllByText(needle).length > 0, `${what} is missing from the opened dialog`).toBe(true);
    }
    expect(screen.queryAllByText("Updated").length > 0, "the Updated badge is missing").toBe(true);
    expect(screen.getAllByText("None").length, "empty colour lists must read None on both sides").toBe(2);

    fireEvent.click(screen.getByText("Labels"));
    expect(screen.queryByText("+ New"), "a second click did not collapse the section").toBeNull();
  });
});


/* ------------- read-only seller, category lookups refused (real sections) ------------- */

// A seller with read-only product permission opens a product.
//
// The backend allows GET /shop/products/{id}/edit for read permission, but the
// cascading endpoint GET /shop/products/categories/{id}/lookups still requires
// UPDATE_PRODUCT, so it answers 403. That call exists only to load the children
// of a category the seller has just PICKED — a reader picks nothing, and the
// /edit response already carries the product's own branch. So the refusal must
// not take anything off the screen.
//
// These checks read text the REAL sections print, so this block turns the
// stand-ins off (`realSections.on`) and puts the real helpers back.
//
// The damage this block is about does NOT happen on the first render: the base
// lookups from /edit are put on screen straight away, and only the LATER,
// failed category-lookups round replaces them. Asserting before that round has
// settled reads the good frame and passes for the wrong reason, so every check
// here waits for the whole mount to go quiet first (`settle`).

/** What /edit answers: the product sits in one branch, and `lookups` already
 *  names every level of that branch plus the branch's attribute groups. */
const readOnlyEditResponse = {
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
  beforeEach(async () => {
    realSections.on = true;
    const actual = await vi.importActual<any>(
      "components/SellerDashboard/productEdit/helpers",
    );
    vi.mocked(validate).mockImplementation(actual.validate);
    vi.mocked(buildDiff).mockImplementation(actual.buildDiff);
    vi.mocked(scrollToFirstError).mockImplementation(actual.scrollToFirstError);

    svc.getProductForEdit.mockResolvedValue(readOnlyEditResponse);
    // The whole point of this block: READ_PRODUCTS and nothing else. No
    // UPDATE_PRODUCT, so the form never leaves read mode.
    svc.getSellerPermissions.mockResolvedValue({
      data: [{ seller_id: Number(SELLER_ID), permissions: ["READ_PRODUCTS"] }],
    });
    // What the seller's browser really gets: the gateway refuses the cascading
    // call because it is gated on UPDATE_PRODUCT.
    svc.getCategoryLookups.mockRejectedValue(
      new Error("403 forbidden: you do not have permission to perform this action"),
    );
  });

  afterEach(() => {
    realSections.on = false;
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
      svc.getCategoryLookups.mock.calls.length,
      `the editor asked the gateway for category lookups ${svc.getCategoryLookups.mock.calls.length} time(s) in read mode; that endpoint needs UPDATE_PRODUCT, so every call is a 403 and a Sentry report for an expected refusal`,
    ).toBe(0);
  });

  // The guard above is `!editMode`, not "never". This is the other side of it:
  // a seller who CAN edit must still get the branch, only later — on the Edit
  // click instead of on page open. Without this check the fix would also pass
  // with the sync removed outright.
  it("still loads the branch lookups when a seller with UPDATE_PRODUCT clicks Edit", async () => {
    svc.getSellerPermissions.mockResolvedValue({
      data: [
        {
          seller_id: Number(SELLER_ID),
          permissions: ["READ_PRODUCTS", "UPDATE_PRODUCT"],
        },
      ],
    });
    svc.getCategoryLookups.mockResolvedValue({
      sub_categories: [],
      sub_sub_categories: [],
      descriptor_groups: [],
    });

    await renderReadOnlyEditor();

    const edit = await screen.findByRole("button", { name: "Edit" });
    expect(
      svc.getCategoryLookups.mock.calls.length,
      "the editor fetched category lookups before the seller asked to edit anything",
    ).toBe(0);

    await userEvent.click(edit);
    await settle();

    expect(
      svc.getCategoryLookups.mock.calls.map((call: unknown[]) => call[1]),
      "clicking Edit did not load the product's category branch, so the sub-category and attribute pickers would open with no options to choose from",
    ).toEqual([1, 21, 31]);
  });
});

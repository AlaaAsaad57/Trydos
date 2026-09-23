// What `PUT /shop/info` is actually sent, and why a shop with no logo used to
// be unable to save its own address.
//
// `ShopInfo.tsx` builds the media fields with `normializeImage`, which answers
// `null` for a shop that has no picture. That `null` went straight into the
// body, and the core backend refuses it:
//
//     422  The image field must be a string.   (fields: image, banner)
//
// So the whole save was refused — name, address and contact included — for any
// seller who had never uploaded a logo. Nothing on the screen said why: the form
// raised its generic "Failed to update".
//
// The fix is to leave a media field out when there is no media to send. `PUT`
// here rewrites every field it is **given**, so sending nothing for a picture is
// "do not touch it", which is exactly right both for a shop that has none and
// for one whose picture this save is not changing.
//
// Seen on the browser suite as `SD-12 a contact and address change reaches the
// backend, and is put back`, red on every run against staging.

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const fetchData = vi.fn().mockResolvedValue({ success: true });

vi.mock("utils/fetchData", () => ({
  default: (...args: unknown[]) => fetchData(...args),
  fetchData: (...args: unknown[]) => fetchData(...args),
}));

import sellerDashboard from "services/sellerDashboard";

/** The body the service actually sent, parsed back from the request. */
const sentBody = (): Record<string, unknown> => {
  const call = fetchData.mock.calls.at(-1)?.[0] as { body?: string } | undefined;
  return JSON.parse(call?.body ?? "{}");
};

describe("updateShopInfo — the body sent to PUT /shop/info", () => {
  it("leaves out a picture the shop does not have, rather than sending null", async () => {
    fetchData.mockClear();

    await sellerDashboard.updateShopInfo("77", {
      name: "Trydos QA shop",
      address: "a new address",
      contact: "0900000000",
      image: null,
      banner: null,
    });

    const body = sentBody();

    // The whole point. `null` is what the backend refuses with
    // "The image field must be a string", and it refuses the entire save with
    // it — the address below never reaches the shop.
    expect(
      "image" in body,
      "a shop with no logo still sends `image`, and the core backend answers 422 The image field must be a string — which refuses the address change too",
    ).toBe(false);
    expect(
      "banner" in body,
      "a shop with no banner still sends `banner`, and the core backend answers 422 The banner field must be a string",
    ).toBe(false);

    // The fields the seller actually changed must still be there, or this would
    // pass by sending nothing at all.
    expect(
      body.address,
      "the address the seller typed is not in the body, so the save would change nothing",
    ).toBe("a new address");
    expect(
      body.contact,
      "the contact the seller typed is not in the body",
    ).toBe("0900000000");
    expect(body.name, "the shop name is not in the body").toBe(
      "Trydos QA shop",
    );
  });

  it("sends a picture the shop does have, so the save does not wipe it", async () => {
    fetchData.mockClear();

    await sellerDashboard.updateShopInfo("77", {
      name: "Trydos QA shop",
      address: "a new address",
      contact: "0900000000",
      image: "logo.png",
      banner: "banner.png",
    });

    const body = sentBody();

    // The opposite failure, and it is the worse one: `PUT /shop/info` rewrites
    // every field it is given, so a save that dropped a picture the shop HAS
    // would delete the seller's logo while putting their address right.
    expect(
      body.image,
      "the shop's existing logo is not in the body, so this save would wipe it",
    ).toBe("logo.png");
    expect(
      body.banner,
      "the shop's existing banner is not in the body, so this save would wipe it",
    ).toBe("banner.png");
  });
});

// ---------------------------------------------------------------------------
// The rest of the seller-dashboard service. Most methods are thin wrappers
// round `fetchData` (or the media server), so each case checks the request the
// method builds — address, verb, backend and shop — and what it does with the
// answer.
// ---------------------------------------------------------------------------

vi.mock("utils/UploadUtils", () => ({
  GetTicket: vi.fn().mockResolvedValue("ticket-1"),
}));

/** The options object the service handed to fetchData on its last call. */
const lastCall = (): Record<string, any> =>
  (fetchData.mock.calls.at(-1)?.[0] ?? {}) as Record<string, any>;

type RequestCase = {
  name: string;
  run: () => Promise<unknown>;
  url: string;
  method: string;
  server: string;
  sellerId?: string;
  body?: unknown;
};

const s = sellerDashboard as any;
const MD = "market-dashboard";

const requestCases: RequestCase[] = [
  { name: "getShopes", run: () => s.getShopes(true), url: "/shop/auth/permissions", method: "GET", server: "market" },
  { name: "getSellerProducts page 1", run: () => s.getSellerProducts("9"), url: "/shop/products", method: "GET", server: MD, sellerId: "9" },
  { name: "getSellerProducts page 3", run: () => s.getSellerProducts("9", 3), url: "/shop/products?page=3", method: "GET", server: MD, sellerId: "9" },
  { name: "getSellerBoutiques", run: () => s.getSellerBoutiques("9"), url: "/shop/boutiques", method: "GET", server: MD, sellerId: "9" },
  { name: "getSellerPermissions", run: () => s.getSellerPermissions("9"), url: "/shop/auth/permissions", method: "GET", server: "market", sellerId: "9" },
  { name: "getSellerOrders no filters", run: () => s.getSellerOrders("9"), url: "/shop/orders", method: "GET", server: MD, sellerId: "9" },
  { name: "getSellerOrders page and status", run: () => s.getSellerOrders("9", 2, "on way"), url: "/shop/orders?page=2&status=on%20way", method: "GET", server: MD, sellerId: "9" },
  { name: "updateOrderStatus", run: () => s.updateOrderStatus("9", { id: 5, status: "done" }), url: "/shop/orders/status", method: "PATCH", server: MD, sellerId: "9", body: { id: 5, status: "done" } },
  { name: "confirmOrderDetailStatus", run: () => s.confirmOrderDetailStatus("9", { order_detail_id: 4 }), url: "/shop/orders/details/status/confirmed", method: "PUT", server: MD, sellerId: "9", body: { order_detail_id: 4 } },
  { name: "packOrderDetailStatus", run: () => s.packOrderDetailStatus("9", { order_detail_id: 4 }), url: "/shop/orders/details/status/packed", method: "PUT", server: MD, sellerId: "9", body: { order_detail_id: 4 } },
  { name: "cancelOrderDetail", run: () => s.cancelOrderDetail("9", { detail_id: 1, order_id: 2, qty: 3 }), url: "/api/v1/shop/orders/details/cancel", method: "PUT", server: MD, sellerId: "9", body: { detail_id: 1, order_id: 2, qty: 3 } },
  { name: "getRoles no filters", run: () => s.getRoles("9"), url: "/shop/users/roles", method: "GET", server: MD, sellerId: "9" },
  { name: "getRoles page and search", run: () => s.getRoles("9", 2, "a b"), url: "/shop/users/roles?page=2&search=a%20b", method: "GET", server: MD, sellerId: "9" },
  { name: "addUserToShop", run: () => s.addUserToShop({ phone: "x", role_id: 1, seller_id: "9" }), url: "/shop/users/add", method: "POST", server: MD, sellerId: "9", body: { phone: "x", role_id: 1, seller_id: "9" } },
  { name: "getUsers page 1", run: () => s.getUsers("9"), url: "/shop/users", method: "GET", server: MD, sellerId: "9" },
  { name: "getUsers language only", run: () => s.getUsers("9", 1, "ar"), url: "/shop/users?lang=ar", method: "GET", server: MD, sellerId: "9" },
  { name: "getUsers page and language", run: () => s.getUsers("9", 2, "ar"), url: "/shop/users?page=2&lang=ar", method: "GET", server: MD, sellerId: "9" },
  { name: "deleteUser", run: () => s.deleteUser(12, "9"), url: "/shop/users/12/delete", method: "DELETE", server: MD, sellerId: "9" },
  { name: "updateUserRole", run: () => s.updateUserRole({ user_id: 1, role_id: 2 }, "9"), url: "/shop/users/role/update", method: "PUT", server: MD, sellerId: "9", body: { user_id: 1, role_id: 2 } },
  { name: "leaveShop", run: () => s.leaveShop("9"), url: "/shop/users/leave", method: "DELETE", server: MD, sellerId: "9" },
  { name: "getUploadedImages defaults", run: () => s.getUploadedImages(undefined, undefined, undefined, undefined, "9"), url: "/seller/product/get-uploaded-images?page=1&per_page=60&date=&search=", method: "GET", server: MD, sellerId: "9" },
  { name: "deleteImage", run: () => s.deleteImage(3, "9"), url: "/seller/product/delete-image/3", method: "DELETE", server: MD, sellerId: "9" },
  { name: "getSellerStories", run: () => s.getSellerStories("9", 7), url: "/api/v1/stories/seller-stories?user_id=7&seller_id=9&page=1&perPage=20", method: "GET", server: "stories" },
  { name: "getSellerStories with no user", run: () => s.getSellerStories("9", undefined, 2, 5), url: "/api/v1/stories/seller-stories?user_id=&seller_id=9&page=2&perPage=5", method: "GET", server: "stories" },
  { name: "deleteSellerStory", run: () => s.deleteSellerStory(4, "9", 7), url: "/api/v1/stories/delete-seller-story", method: "POST", server: "stories", body: { user_id: 7, seller_id: "9", story_id: 4 } },
  { name: "getProductImages with no search", run: () => s.getProductImages("9"), url: "/shop/products/images?page=1&per_page=60", method: "GET", server: MD, sellerId: "9" },
  { name: "getProductImages with a search", run: () => s.getProductImages("9", 2, 10, "shoe"), url: "/shop/products/images?page=2&per_page=10&search=shoe", method: "GET", server: MD, sellerId: "9" },
  { name: "saveProductImages", run: () => s.saveProductImages("9", [{ url: "/p/a.png", name: "a" }]), url: "/shop/products/images", method: "POST", server: MD, sellerId: "9", body: { images: [{ url: "/p/a.png", name: "a" }] } },
  { name: "deleteProductImages one id", run: () => s.deleteProductImages(5, "9"), url: "/shop/products/images", method: "DELETE", server: MD, sellerId: "9", body: { ids: [5] } },
  { name: "deleteProductImages many ids", run: () => s.deleteProductImages([5, 6], "9"), url: "/shop/products/images", method: "DELETE", server: MD, sellerId: "9", body: { ids: [5, 6] } },
  { name: "getShopInfo", run: () => s.getShopInfo("9"), url: "/shop/info", method: "GET", server: MD, sellerId: "9" },
  { name: "getExcelCategories", run: () => s.getExcelCategories("9"), url: "/shop/excel/categories", method: "GET", server: MD, sellerId: "9" },
  { name: "processExcel", run: () => s.processExcel("9", "k.xlsx"), url: "/shop/excel/processExcel", method: "POST", server: MD, sellerId: "9", body: { file_url: "https://example.com/file/upload/k.xlsx" } },
  { name: "getExcelFiles", run: () => s.getExcelFiles("9"), url: "/shop/excel/getUploadedExcelFiles", method: "GET", server: MD, sellerId: "9" },
  { name: "getProductForEdit", run: () => s.getProductForEdit("9", 8), url: "/shop/products/8/edit", method: "GET", server: MD, sellerId: "9" },
  { name: "getProductCreateForm", run: () => s.getProductCreateForm("9"), url: "/shop/products/lookups", method: "GET", server: MD, sellerId: "9" },
  { name: "syncProductDescriptors", run: () => s.syncProductDescriptors("9", 8, { "1": { "2": "red" } }), url: "/shop/products/8/descriptors", method: "POST", server: MD, sellerId: "9", body: { descriptors: { "1": { "2": "red" } } } },
  { name: "changeProductStatus", run: () => s.changeProductStatus("9", 8, 1), url: "/shop/products/8/change-status", method: "POST", server: MD, sellerId: "9", body: { status: 1 } },
  { name: "getBoutiqueForEdit", run: () => s.getBoutiqueForEdit("9", 6), url: "/shop/boutiques/6/edit", method: "GET", server: MD, sellerId: "9" },
  { name: "updateBoutique", run: () => s.updateBoutique("9", 6, { a: 1 }), url: "/shop/boutiques/6/update", method: "POST", server: MD, sellerId: "9", body: { a: 1 } },
  { name: "changeBoutiqueStatus", run: () => s.changeBoutiqueStatus("9", 6, 0), url: "/shop/boutiques/6/change-status", method: "POST", server: MD, sellerId: "9", body: { status: 0 } },
  { name: "getBoutiqueCreateForm", run: () => s.getBoutiqueCreateForm("9"), url: "/shop/boutiques/lookups", method: "GET", server: MD, sellerId: "9" },
  { name: "addBoutique", run: () => s.addBoutique("9", { b: 2 }), url: "/shop/boutiques", method: "POST", server: MD, sellerId: "9", body: { b: 2 } },
  { name: "deleteBoutique", run: () => s.deleteBoutique("9", 6), url: "/shop/boutiques/6/delete", method: "DELETE", server: MD, sellerId: "9" },
  { name: "getShopLocations with no filters", run: () => s.getShopLocations("9"), url: "/shop/locations", method: "GET", server: MD, sellerId: "9" },
  { name: "getShopLocations status 0, country and page", run: () => s.getShopLocations("9", { status: 0, countryId: 3, page: 2 }), url: "/shop/locations?status=0&country_id=3&page=2", method: "GET", server: MD, sellerId: "9" },
  { name: "getShopLocations null status and page 1", run: () => s.getShopLocations("9", { status: null, page: 1 }), url: "/shop/locations", method: "GET", server: MD, sellerId: "9" },
  { name: "getShopLocationLookups", run: () => s.getShopLocationLookups("9"), url: "/shop/locations/lookups", method: "GET", server: MD, sellerId: "9" },
  { name: "addShopLocation", run: () => s.addShopLocation("9", { name: "W" }), url: "/shop/locations", method: "POST", server: MD, sellerId: "9", body: { name: "W" } },
  { name: "getShopLocationForEdit", run: () => s.getShopLocationForEdit("9", 2), url: "/shop/locations/2/edit", method: "GET", server: MD, sellerId: "9" },
  { name: "updateShopLocation", run: () => s.updateShopLocation("9", 2, { name: "W" }), url: "/shop/locations/2/update", method: "POST", server: MD, sellerId: "9", body: { name: "W" } },
  { name: "changeShopLocationStatus", run: () => s.changeShopLocationStatus("9", 2, 1), url: "/shop/locations/2/change-status", method: "POST", server: MD, sellerId: "9", body: { status: 1 } },
  { name: "getLanguages", run: () => s.getLanguages(), url: "/languages", method: "GET", server: "market" },
];

describe("seller-dashboard service — the request each method sends", () => {
  it.each(requestCases)("$name", async (c) => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true, data: {} });
    await c.run();
    const call = lastCall();
    expect(call.url, `${c.name} called the wrong address`).toBe(c.url);
    expect(call.method, `${c.name} used the wrong HTTP verb`).toBe(c.method);
    expect(call.server, `${c.name} went to the wrong backend`).toBe(c.server);
    if (c.sellerId)
      expect(call.sellerId, `${c.name} did not scope the call to the shop`).toBe(c.sellerId);
    if (c.body !== undefined)
      expect(JSON.parse(call.body), `${c.name} sent the wrong body`).toEqual(c.body);
  });

  it("saveSellerStory sends the shop id as a number and rounds the video length", async () => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true });
    await s.saveSellerStory("9", 7, {
      file_path: "/stories/a.mp4",
      is_video: 1,
      link: null,
      product_id: 3,
      product_slug: "p",
      video_duration_in_seconds: 4.6,
    });
    const call = lastCall();
    expect(call.url, "the story went to the wrong address").toBe("/api/v1/stories/add-seller-story");
    expect(call.server, "the story did not go to the stories backend").toBe("stories");
    const body = JSON.parse(call.body);
    expect(body.seller_id, "the shop id was not sent as a number").toBe(9);
    expect(body.video_duration_in_second, "the video length was not rounded").toBe(5);
    expect(body.order_detail_id, "a seller story must carry no order detail").toBeNull();
  });

  it("updateProduct and addProduct send the form data as it is", async () => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true });
    const fd = new FormData();
    await s.updateProduct("9", 8, fd);
    expect(lastCall().url, "update went to the wrong address").toBe("/shop/products/8/update");
    expect(lastCall().body, "update did not send the form data object").toBe(fd);
    await s.addProduct("9", fd);
    expect(lastCall().url, "create went to the wrong address").toBe("/shop/products");
    expect(lastCall().body, "create did not send the form data object").toBe(fd);
  });

  it("getCategoryLookups fills missing lists with empty arrays", async () => {
    fetchData.mockReset();
    fetchData.mockResolvedValueOnce({ success: true, data: { sub_categories: [{ id: 1 }] } });
    const out = await s.getCategoryLookups("9", 4);
    expect(lastCall().url, "wrong lookups address").toBe("/shop/products/categories/4/lookups");
    expect(out, "missing lists should come back empty, present ones as sent").toEqual({
      sub_categories: [{ id: 1 }],
      sub_sub_categories: [],
      descriptor_groups: [],
    });
    fetchData.mockResolvedValueOnce({ success: true });
    expect(
      await s.getCategoryLookups("9", 4),
      "an answer with no data should give three empty lists",
    ).toEqual({ sub_categories: [], sub_sub_categories: [], descriptor_groups: [] });
  });
});

describe("seller-dashboard service — a refused answer becomes an error", () => {
  const refusals: Array<[string, () => Promise<unknown>, string]> = [
    ["getSellerBoutiques", () => s.getSellerBoutiques("9"), "Failed to fetch seller boutiques"],
    ["getSellerPermissions", () => s.getSellerPermissions("9"), "Failed to fetch seller permissions"],
    ["confirmOrderDetailStatus", () => s.confirmOrderDetailStatus("9", { order_detail_id: 1 }), "Failed to confirm order detail status"],
    ["leaveShop", () => s.leaveShop("9"), "Failed to leave shop"],
    ["getProductForEdit", () => s.getProductForEdit("9", 1), "Failed to load product for edit"],
    ["getProductCreateForm", () => s.getProductCreateForm("9"), "Failed to load product form"],
    ["getCategoryLookups", () => s.getCategoryLookups("9", 1), "Failed to load category lookups"],
    ["getBoutiqueForEdit", () => s.getBoutiqueForEdit("9", 1), "Failed to load boutique for edit"],
    ["getBoutiqueCreateForm", () => s.getBoutiqueCreateForm("9"), "Failed to load boutique form"],
    // The six below share a wrong fallback — see BUG-seller-400.
    ["packOrderDetailStatus", () => s.packOrderDetailStatus("9", { order_detail_id: 1 }), ""],
    ["cancelOrderDetail", () => s.cancelOrderDetail("9", { detail_id: 1, order_id: 1, qty: 1 }), ""],
    ["getRoles", () => s.getRoles("9"), ""],
    ["addUserToShop", () => s.addUserToShop({ phone: "x", role_id: 1, seller_id: "9" }), ""],
    ["deleteUser", () => s.deleteUser(1, "9"), ""],
    ["updateUserRole", () => s.updateUserRole({ user_id: 1, role_id: 1 }, "9"), ""],
  ];

  it.each(refusals)("%s passes the backend's own message on", async (name, run) => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: false, message: "backend said no" });
    await expect(run(), `${name} did not throw the backend's message`).rejects.toThrow(
      "backend said no",
    );
  });

  it.each(refusals.filter(([, , fallback]) => fallback))(
    "%s has its own fallback message when the backend gives none",
    async (name, run, fallback) => {
      fetchData.mockReset();
      fetchData.mockResolvedValue({ success: false });
      await expect(run(), `${name} threw the wrong fallback message`).rejects.toThrow(fallback);
    },
  );

  // BUG-seller-400: six methods copy the fallback "Failed to confirm order
  // detail status" (services/sellerDashboard/index.ts lines 147, 168, 191, 213,
  // 248, 270). The dashboard shows error.message before its own translated
  // text, so a refused "delete user" with no backend message tells the seller
  // that an order item could not be confirmed.
  it.each(refusals.filter(([, , fallback]) => !fallback))(
    "BUG-seller-400: %s names its own operation, not 'confirm order detail status', when it fails with no backend message",
    async (name, run) => {
      fetchData.mockReset();
      fetchData.mockResolvedValue({ success: false });
      let message = "";
      try {
        await run();
      } catch (e: any) {
        message = e.message;
      }
      expect(message, `${name} failed, so it must throw`).not.toBe("");
      expect(
        message,
        `${name} blames an order-detail confirmation it never tried`,
      ).not.toContain("confirm order detail status");
    },
  );

  it("a fetchData error goes through the try/catch wrappers unchanged", async () => {
    const boom = new Error("network down");
    const wrapped: Array<[string, () => Promise<unknown>]> = [
      ["getShopes", () => s.getShopes()],
      ["getSellerProducts", () => s.getSellerProducts("9")],
      ["getSellerBoutiques", () => s.getSellerBoutiques("9")],
      ["getSellerPermissions", () => s.getSellerPermissions("9")],
      ["getSellerOrders", () => s.getSellerOrders("9")],
      ["updateOrderStatus", () => s.updateOrderStatus("9", { id: 1, status: "a" })],
      ["confirmOrderDetailStatus", () => s.confirmOrderDetailStatus("9", { order_detail_id: 1 })],
      ["packOrderDetailStatus", () => s.packOrderDetailStatus("9", { order_detail_id: 1 })],
      ["cancelOrderDetail", () => s.cancelOrderDetail("9", { detail_id: 1, order_id: 1, qty: 1 })],
      ["getRoles", () => s.getRoles("9")],
      ["addUserToShop", () => s.addUserToShop({ phone: "x", role_id: 1, seller_id: "9" })],
      ["getUsers", () => s.getUsers("9")],
      ["deleteUser", () => s.deleteUser(1, "9")],
      ["updateUserRole", () => s.updateUserRole({ user_id: 1, role_id: 1 }, "9")],
      ["leaveShop", () => s.leaveShop("9")],
      ["getShopInfo", () => s.getShopInfo("9")],
      [
        "updateShopInfo",
        () => s.updateShopInfo("9", { name: "", address: "", contact: "", image: null, banner: null }),
      ],
    ];
    for (const [name, run] of wrapped) {
      fetchData.mockReset();
      fetchData.mockRejectedValue(boom);
      await expect(run(), `${name} swallowed or changed a network error`).rejects.toBe(boom);
    }
  });
});

describe("seller-dashboard service — media server calls when it is not configured", () => {
  // The test env leaves NEXT_PUBLIC_MEDIA_API_KEY empty, so the module loaded
  // at the top of this file has no media key.
  it.each([
    ["uploadStoryToMediaServer", () => s.uploadStoryToMediaServer(new File(["a"], "a.png")), "Media server upload is not configured"],
    ["bulkUploadImages", () => s.bulkUploadImages([]), "Media server is not configured"],
    ["uploadShopImage", () => s.uploadShopImage(new File(["a"], "a.png")), "Media server upload is not configured"],
    ["uploadExcelFile", () => s.uploadExcelFile(new File(["a"], "a.xlsx")), "Media server upload is not configured"],
  ] as const)("%s refuses before sending anything", async (name, run, message) => {
    await expect(run(), `${name} should stop when the media key is missing`).rejects.toThrow(message);
  });
});

describe("seller-dashboard service — media server calls", () => {
  let svc: any;
  const fetchMock = vi.fn();

  const reply = (status: number, json: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: json instanceof Error ? () => Promise.reject(json) : () => Promise.resolve(json),
  });

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_API_KEY", "media-key");
    vi.stubEnv("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL", "https://media.example.com/");
    vi.resetModules();
    svc = (await import("services/sellerDashboard")).default;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("uploadStoryToMediaServer sends a video to the story upload and returns its url and length", async () => {
    fetchMock.mockResolvedValue(reply(200, { url: "/stories/v.mp4", durationSeconds: 7 }));
    const out = await svc.uploadStoryToMediaServer(new File(["a"], "v.mp4", { type: "video/mp4" }));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url, "a video must go to the story upload address").toBe(
      "https://media.example.com/gated/upload?story=true",
    );
    expect(init.headers["X-Upload-Ticket"], "the upload ticket was not sent").toBe("ticket-1");
    expect(out, "the uploaded url and length were not returned").toEqual({
      url: "/stories/v.mp4",
      durationSeconds: 7,
    });
  });

  it("uploadStoryToMediaServer sends a picture to the plain upload", async () => {
    fetchMock.mockResolvedValue(reply(200, { url: "/stories/p.png" }));
    await svc.uploadStoryToMediaServer(new File(["a"], "p.png", { type: "image/png" }));
    expect(fetchMock.mock.calls[0][0], "a picture must go to the plain upload address").toBe(
      "https://media.example.com/gated/upload",
    );
  });

  it("uploadStoryToMediaServer fails on a refused or unreadable answer", async () => {
    fetchMock.mockResolvedValue(reply(500, { url: "x" }));
    await expect(
      svc.uploadStoryToMediaServer(new File(["a"], "p.png")),
      "a 500 must fail",
    ).rejects.toThrow("Media server upload failed");
    fetchMock.mockResolvedValue(reply(200, new Error("not json")));
    await expect(
      svc.uploadStoryToMediaServer(new File(["a"], "p.png")),
      "an answer with no JSON must fail",
    ).rejects.toThrow("Media server upload failed");
  });

  it("bulkUploadImages returns the media answer, and fails with its message", async () => {
    fetchMock.mockResolvedValue(reply(200, { urls: ["a.png"] }));
    expect(
      await svc.bulkUploadImages([new File(["a"], "a.png")]),
      "the media answer was not returned",
    ).toEqual({ urls: ["a.png"] });
    expect(fetchMock.mock.calls[0][0], "bulk upload went to the wrong address").toBe(
      "https://media.example.com/gated/upload/bulk",
    );
    fetchMock.mockResolvedValue(reply(400, { message: "too big" }));
    await expect(svc.bulkUploadImages([]), "the media server's message was lost").rejects.toThrow(
      "too big",
    );
    fetchMock.mockResolvedValue(reply(400, new Error("not json")));
    await expect(
      svc.bulkUploadImages([]),
      "a refusal without JSON needs the default message",
    ).rejects.toThrow("Bulk upload failed");
  });

  it("uploadProductImages turns each media answer shape into a saved image", async () => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true });
    fetchMock.mockResolvedValue(
      reply(200, {
        urls: [
          "a.png",
          { url: "https://cdn/x.png" },
          { path: "/abs/y.png", originalName: "orig-y" },
          { file_name: "z.png" },
          { name: "n.png" },
          {},
          "dir/",
        ],
      }),
    );
    const files = [new File(["1"], "one.png"), new File(["2"], "two.png")];
    await svc.uploadProductImages(files, "9");
    const call = lastCall();
    expect(call.url, "the images were not saved to the product images address").toBe(
      "/shop/products/images",
    );
    expect(
      JSON.parse(call.body).images,
      "each media answer shape should become one saved image, and an empty one none",
    ).toEqual([
      { url: "/product/a.png", name: "one.png" },
      { url: "https://cdn/x.png", name: "two.png" },
      { url: "/abs/y.png", name: "orig-y" },
      { url: "/product/z.png", name: "z.png" },
      { url: "/product/n.png", name: "n.png" },
      { url: "/product/dir/", name: "dir/" },
    ]);
  });

  it("uploadProductImages accepts a single-url answer", async () => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true });
    fetchMock.mockResolvedValue(reply(200, { url: "only.png" }));
    await svc.uploadProductImages([new File(["1"], "one.png")], "9");
    expect(JSON.parse(lastCall().body).images, "a single url answer should save one image").toEqual([
      { url: "/product/only.png", name: "one.png" },
    ]);
  });

  it("uploadProductImages fails when the media server stored nothing", async () => {
    fetchMock.mockResolvedValue(reply(200, {}));
    await expect(
      svc.uploadProductImages([], "9"),
      "no stored image must be an error",
    ).rejects.toThrow("No images were uploaded to the media server");
  });

  it("uploadShopImage returns the stored url, and fails with the media message", async () => {
    const logo = () => new File(["a"], "l.png");
    fetchMock.mockResolvedValue(reply(201, { url: "/shops/logo.png" }));
    expect(await svc.uploadShopImage(logo()), "the stored logo url was not returned").toBe(
      "/shops/logo.png",
    );
    fetchMock.mockResolvedValue(reply(400, { error: "bad type" }));
    await expect(svc.uploadShopImage(logo()), "the media `error` field was lost").rejects.toThrow(
      "bad type",
    );
    fetchMock.mockResolvedValue(reply(400, { message: "too big" }));
    await expect(svc.uploadShopImage(logo()), "the media `message` field was lost").rejects.toThrow(
      "too big",
    );
    fetchMock.mockResolvedValue(reply(500, new Error("not json")));
    await expect(svc.uploadShopImage(logo()), "no JSON needs the default message").rejects.toThrow(
      "Media server upload failed",
    );
  });

  it("uploadExcelFile returns the stored file, and fails with the media message", async () => {
    const sheet = () => new File(["a"], "f.xlsx");
    fetchMock.mockResolvedValue(reply(201, { url: "/excel/f.xlsx", key: "f.xlsx" }));
    expect(await svc.uploadExcelFile(sheet(), "my folder"), "the stored file was not returned").toEqual({
      url: "/excel/f.xlsx",
      key: "f.xlsx",
    });
    expect(fetchMock.mock.calls[0][0], "the folder must be in the query string").toBe(
      "https://media.example.com/gated/upload/excel?folder=my%20folder",
    );
    fetchMock.mockResolvedValue(reply(400, { error: "bad sheet" }));
    await expect(svc.uploadExcelFile(sheet()), "the media `error` field was lost").rejects.toThrow(
      "bad sheet",
    );
    fetchMock.mockResolvedValue(reply(400, { message: "too big" }));
    await expect(svc.uploadExcelFile(sheet()), "the media `message` field was lost").rejects.toThrow(
      "too big",
    );
    fetchMock.mockResolvedValue(reply(500, new Error("not json")));
    await expect(svc.uploadExcelFile(sheet()), "no JSON needs the default message").rejects.toThrow(
      "Excel upload to media server failed",
    );
  });
});

describe("seller-dashboard service — downloadExcelTemplate", () => {
  const fetchMock = vi.fn();
  const response = (opts: {
    ok?: boolean;
    status?: number;
    headers?: Record<string, string>;
    json?: unknown;
  }) => ({
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: new Headers(opts.headers ?? {}),
    json:
      opts.json instanceof Error
        ? () => Promise.reject(opts.json)
        : () => Promise.resolve(opts.json),
    blob: () => Promise.resolve(new Blob(["x"])),
  });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterAll(() => vi.unstubAllGlobals());

  it("asks the proxy for the template with the shop, country and language", async () => {
    window.history.pushState({}, "", "/iq-ar/seller");
    fetchMock.mockResolvedValue(
      response({
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": "attachment; filename*=UTF-8''my%20sheet.xlsx",
        },
      }),
    );
    const out = await s.downloadExcelTemplate("9", 4);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url, "the template must be asked for through the proxy").toBe("/api/proxy");
    expect(init.headers["x-proxy-url"], "wrong template address").toBe("/shop/excel/downloadExcel/4");
    expect(init.headers["x-country"], "the country was not read from the path").toBe("iq");
    expect(init.headers["x-language"], "the language was not read from the path").toBe("ar");
    expect(init.headers["x-seller-id"], "the shop was not sent").toBe("9");
    expect(out.filename, "the file name from the header was not decoded").toBe("my sheet.xlsx");
    expect(out.blob, "the file itself was not returned").toBeInstanceOf(Blob);
  });

  it("uses the default country, language and file name when none are known", async () => {
    window.history.pushState({}, "", "/");
    fetchMock.mockResolvedValue(response({}));
    const out = await s.downloadExcelTemplate("9", 4);
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["x-country"], "the default country should be sy").toBe("sy");
    expect(init.headers["x-language"], "the default language should be en").toBe("en");
    expect(out.filename, "the default file name should name the category").toBe("template-4.xlsx");
  });

  it("fails with the backend message when the backend answers JSON", async () => {
    fetchMock.mockResolvedValue(
      response({ headers: { "content-type": "application/json" }, json: { message: "no template" } }),
    );
    await expect(s.downloadExcelTemplate("9", 4), "the backend message was lost").rejects.toThrow(
      "no template",
    );
    fetchMock.mockResolvedValue(response({ ok: false, status: 404, json: { error: "gone" } }));
    await expect(s.downloadExcelTemplate("9", 4), "the backend `error` field was lost").rejects.toThrow(
      "gone",
    );
    fetchMock.mockResolvedValue(response({ ok: false, status: 502, json: new Error("not json") }));
    await expect(
      s.downloadExcelTemplate("9", 4),
      "the status should be in the default message",
    ).rejects.toThrow("Failed to download template (502)");
  });
});

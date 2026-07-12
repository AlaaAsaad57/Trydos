import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

const MEDIA_SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL?.replace(/\/$/, "") ?? "";
const MEDIA_API_KEY = process.env.NEXT_PUBLIC_MEDIA_API_KEY ?? "";

class SellerDashboardService {
  async getShopes(noMessage = false) {
    try {
      let res = await fetchData({
        url: `/shop/auth/permissions`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.GET_SHOPES_FOR_SELLER,
        noMessage,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getSellerProducts(sellerId: string, page: number = 1) {
    try {
      let res = await fetchData({
        url: `/shop/products${page > 1 ? `?page=${page}` : ""}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_PRODUCTS,
        sellerId,
      });
      
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerBoutiques(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/boutiques`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_BOUTIQUES,
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to fetch seller boutiques");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerPermissions(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/auth/permissions`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.GET_SELLER_PERMISSIONS,
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to fetch seller permissions");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getSellerOrders(sellerId: string, page: number = 1, status?: string) {
    try {
      const params: string[] = [];
      if (page > 1) params.push(`page=${page}`);
      if (status) params.push(`status=${encodeURIComponent(status)}`);
      const queryString = params.length ? `?${params.join("&")}` : "";

      let res = await fetchData({
        url: `/shop/orders${queryString}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SELLER_ORDERS,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async updateOrderStatus(
    sellerId: string,
    data: { id: number | string; status: string },
  ) {
    try {
      let res = await fetchData({
        url: `/shop/orders/status`,
        method: "PATCH",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SELLER_ORDER_STATUS,
        body: JSON.stringify(data),
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
  async confirmOrderDetailStatus(
    sellerId: string,
    data: { order_detail_id: number },
  ) {
    try {
      let res = await fetchData({
        url: `/shop/orders/details/status/confirmed`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SELLER_ORDER_DETAIL_STATUS,
        body: JSON.stringify(data),
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async packOrderDetailStatus(
    sellerId: string,
    data: { order_detail_id: number },
  ) {
    try {
      let res = await fetchData({
        url: `/shop/orders/details/status/packed`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SELLER_ORDER_DETAIL_STATUS,
        body: JSON.stringify(data),
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async cancelOrderDetail(
    sellerId: string,
    data: { detail_id: number; order_id: number; qty: number },
  ) {
    try {
      let res = await fetchData({
        url: `/api/v1/shop/orders/details/cancel`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.CANCEL_SELLER_ORDER_DETAIL,
        body: JSON.stringify(data),
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async getRoles(sellerId: string, page: number = 1, search: string = "") {
    try {
      const params: string[] = [];
      if (page > 1) params.push(`page=${page}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      const queryString = params.length ? `?${params.join("&")}` : "";

      let res = await fetchData({
        url: `/shop/users/roles${queryString}`,
        method: "GET",
        server: "market-dashboard",

        reqTitle: REQUESTS_DATA.GET_SHOP_ROLES,
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }
  async addUserToShop(data: {
    phone: string;
    role_id: number;
    seller_id: string;
  }) {
    try {
      let res = await fetchData({
        url: `/shop/users/add`,
        method: "POST",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.ADD_USER_TO_SHOP,
        body: JSON.stringify(data),
        sellerId: data.seller_id,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getUsers(sellerId: string, page: number = 1, lang?: string) {
    try {
      const pageQuery = page > 1 ? `?page=${page}` : "";
      const langQuery = lang ? `${pageQuery ? "&" : "?"}lang=${lang}` : "";
      let res = await fetchData({
        url: `/shop/users${pageQuery}${langQuery}`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SHOP_USERS,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(userId: number | string, sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/users/${userId}/delete`,
        method: "DELETE",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.DELETE_SHOP_USER,
        sellerId,
      });
            if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(
    data: { user_id: number; role_id: number },
    sellerId: string,
  ) {
    try {
      let res = await fetchData({
        url: `/shop/users/role/update`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_USER_ROLE,
        body: JSON.stringify(data),
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to confirm order detail status");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async leaveShop(sellerId: string) {
    try {
      let res = await fetchData({
        url: `/shop/users/leave`,
        method: "DELETE",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.LEAVE_SHOP,
        sellerId,
      });
      if(!res.success){
        throw new Error(res.message || "Failed to leave shop");
      }
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getUploadedImages(
    page: number = 1,
    perPage: number = 60,
    date: string = "",
    search: string = "",
    sellerId: string,
  ) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      date,
      search,
    });
    return fetchData({
      url: `/seller/product/get-uploaded-images?${params.toString()}`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_UPLOADED_IMAGES,
         sellerId,
    });
  }

  async deleteImage(imageId: number | string, sellerId: string) {
    return fetchData({
      url: `/seller/product/delete-image/${imageId}`,
      method: "DELETE",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.DELETE_UPLOADED_IMAGE,
        sellerId,

    });
  }

  async uploadStoryToMediaServer(
    file: File,
  ): Promise<{ url: string; durationSeconds?: number }> {
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server upload is not configured");
    }
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "stories");
    const uploadUrl = file.type.startsWith("video/")
      ? `${MEDIA_SERVER_BASE_URL}/upload?story=true`
      : `${MEDIA_SERVER_BASE_URL}/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "x-api-key": MEDIA_API_KEY },
      body: form,
    });
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok || !data?.url) {
      throw new Error("Media server upload failed");
    }
    return { url: data.url as string, durationSeconds: data?.durationSeconds as number | undefined };
  }

  // ---------- Seller Stories (READ_STORY / CREATE_STORY / DELETE_STORY) ----------
  // These hit the dedicated stories server (`server: "stories"`), mirroring the
  // user-stories flow in `services/story.ts`. `userId` is the original/inventory
  // user id (AuthService.UserID()); `sellerId` is the shop id being managed.

  // GET /api/v1/stories/seller_stories?user_id=&seller_id=&page=&perPage= (like users_stories)
  async getSellerStories(
    sellerId: string,
    userId: number | string,
    page: number = 1,
    perPage: number = 20,
  ) {
    const params = new URLSearchParams({
      user_id: String(userId ?? ""),
      seller_id: String(sellerId),
      page: String(page),
      perPage: String(perPage),
    });
    return fetchData({
      url: `/api/v1/stories/seller-stories?${params.toString()}`,
      method: "GET",
      server: "stories",
      reqTitle: REQUESTS_DATA.GET_SELLER_STORIES,
    });
  }

  // POST /api/v1/stories/add-seller-story (like add_story for a user)
  async saveSellerStory(
    sellerId: string,
    userId: number | string,
    data: {
      file_path: string;
      is_video: 0 | 1;
      link: string | null;
      product_id: number | null;
      product_slug: string | null;
      video_duration_in_seconds: number | null;
    },
  ) {
    return fetchData({
      url: `/api/v1/stories/add-seller-story`,
      method: "POST",
      server: "stories",
      reqTitle: REQUESTS_DATA.SAVE_SELLER_STORY,
      body: JSON.stringify({
        user_id: userId,
        seller_id: Number(sellerId),
        file_path: data.file_path,
        is_video: data.is_video,
        link: data.link,
        product_id: data.product_id,
        product_slug: data.product_slug,
        video_duration_in_second: Math.round(data.video_duration_in_seconds),
        order_detail_id: null,
      }),
    });
  }

  // POST /api/v1/stories/delete-seller-story
  async deleteSellerStory(
    storyId: string | number,
    sellerId: string,
    userId: number | string,
  ) {
    return fetchData({
      url: `/api/v1/stories/delete-seller-story`,
      method: "POST",
      server: "stories",
      reqTitle: REQUESTS_DATA.DELETE_SELLER_STORY,
      noMessage: true,
      body: JSON.stringify({
        user_id: userId,
        seller_id: sellerId,
        story_id: storyId,
      }),
    });
  }

  async bulkUploadImages(files: File[], folder: string = "product") {
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server is not configured");
    }
    const form = new FormData();
    form.append("folder", folder);
    files.forEach((file) => form.append("files", file));

    const response = await fetch(`${MEDIA_SERVER_BASE_URL}/upload/bulk`, {
      method: "POST",
      headers: { "x-api-key": MEDIA_API_KEY },
      body: form,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || "Bulk upload failed");
    }
    return data;
  }

  // ---------- Product Images Gallery ----------
  // (READ_PRODUCT_IMAGES / UPLOAD_PRODUCT_IMAGES / DELETE_PRODUCT_IMAGES)

  // GET /shop/products/images — protected by READ_PRODUCT_IMAGES
  async getProductImages(
    sellerId: string,
    page: number = 1,
    perPage: number = 60,
    search: string = "",
  ) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search) params.set("search", search);
    return fetchData({
      url: `/shop/products/images?${params.toString()}`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_PRODUCT_IMAGES,
      sellerId,
    });
  }

  // POST /shop/products/images — protected by UPLOAD_PRODUCT_IMAGES
  // Persists already-uploaded media URLs as product images.
  async saveProductImages(
    sellerId: string,
    images: { url: string; name: string }[],
  ) {
    return fetchData({
      url: `/shop/products/images`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.UPLOAD_PRODUCT_IMAGES,
      body: JSON.stringify({ images }),
      sellerId,
    });
  }

  // DELETE /shop/products/images — protected by DELETE_PRODUCT_IMAGES
  // Same endpoint for single and bulk deletes: the id(s) are always sent as an
  // `ids` array in the body, so deleting one image and deleting a selection
  // share one code path.
  async deleteProductImages(
    imageIds: number | string | (number | string)[],
    sellerId: string,
  ) {
    const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
    let normalizeId=Array.isArray
    return fetchData({
      url: `/shop/products/images`,
      method: "DELETE",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.DELETE_PRODUCT_IMAGE,
      body: JSON.stringify({ ids }),
      sellerId,
    });
  }

  // Normalize the media server bulk-upload response into { url, name }[].
  // The bulk endpoint returns only the stored file name (e.g. "1781080470388204.png"),
  // not a full URL — so we prefix it with the folder to build the "/folder/file" path
  // the backend expects (matching the full URLs returned by getProductImages).
  private normalizeBulkUpload(
    data: any,
    files: File[],
    folder: string,
  ): { url: string; name: string }[] {
    const arr: any[] =
      data?.urls ??( data?.url&&[data?.url]);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item: any, i: number) => {
        const raw =
          typeof item === "string"
            ? item
            : item?.url ?? item?.path ?? item?.file_name ?? item?.name ?? "";
        if (!raw) return { url: "", name: "" };
        // Keep absolute URLs as-is; otherwise build "/folder/filename".
        const isAbsolute = /^https?:\/\//i.test(raw) || raw.startsWith("/");
        const fileName = raw.replace(/^\/+/, "").split("/").pop() || raw;
        const url = isAbsolute ? raw : `/${folder}/${fileName}`;
        const name =
          (typeof item === "object" &&
            (item?.originalName ?? item?.name ?? item?.file_name)) ||
          files[i]?.name ||
          fileName ||
          `image-${i + 1}`;
        return { url, name };
      })
      .filter((x) => x.url);
  }

  // Full upload flow: media server (bulk) -> persist URLs to the backend.
  async uploadProductImages(files: File[], sellerId: string) {
    const folder = "product";
    const uploadRes = await this.bulkUploadImages(files, folder);
    const images = this.normalizeBulkUpload(uploadRes, files, folder);
    if (images.length === 0) {
      throw new Error("No images were uploaded to the media server");
    }
    return this.saveProductImages(sellerId, images);
  }

  // ---------- Shop Info (READ_SHOP_INFO / UPDATE_SHOP_INFO) ----------

  // Upload a single shop image (logo/banner) to the media server.
  // Returns the stored file URL/key the backend expects in `image` / `banner`.
  async uploadShopImage(
    file: File,
    folder: string = "shops",
  ): Promise<string> {
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server upload is not configured");
    }
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);

    const response = await fetch(`${MEDIA_SERVER_BASE_URL}/upload`, {
      method: "POST",
      headers: { "x-api-key": MEDIA_API_KEY },
      body: form,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.url) {
      throw new Error(data?.error || data?.message || "Media server upload failed");
    }
    return data.url as string;
  }

  // GET /shop/info — protected by READ_SHOP_INFO
  async getShopInfo(sellerId: string) {
    try {
      const res = await fetchData({
        url: `/shop/info`,
        method: "GET",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.GET_SHOP_INFO,
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  // PUT /shop/info — protected by UPDATE_SHOP_INFO
  async updateShopInfo(
    sellerId: string,
    data: {
      name: string;
      address: string;
      contact: string;
      image: string | null;
      banner: string | null;
    },
  ) {
    try {
      const res = await fetchData({
        url: `/shop/info`,
        method: "PUT",
        server: "market-dashboard",
        reqTitle: REQUESTS_DATA.UPDATE_SHOP_INFO,
        body: JSON.stringify(data),
        sellerId,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  // ---------- Excel Bulk Upload ----------
  // Flow: pick category -> download its template -> fill it ->
  //       upload file to media server -> processExcel(url) on the backend.

  // GET /shop/excel/categories — categories that expose an excel template.
  async getExcelCategories(sellerId: string) {
    return fetchData({
      url: `/shop/excel/categories`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_EXCEL_CATEGORIES,
      sellerId,
    });
  }

  // GET /shop/excel/downloadExcel/{category_id} — the template for a category.
  // The backend streams the .xlsx file itself (binary), not a URL. We can't use
  // fetchData (it always parses JSON), so we hit the proxy directly — which
  // injects the auth token server-side and passes binary responses through —
  // and return the blob + filename so the caller can trigger a download.
  async downloadExcelTemplate(
    sellerId: string,
    categoryId: string | number,
  ): Promise<{ blob: Blob; filename: string }> {
    const [country, lang] = (
      window.location.pathname.split("/")[1] || ""
    ).split("-");
    const targetUrl = `/shop/excel/downloadExcel/${categoryId}`;

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "x-proxy-server": "market-dashboard",
        "x-proxy-url": encodeURI(targetUrl),
        "x-proxy-method": "GET",
        "x-country": country || "sy",
        "x-language": lang || "en",
        "x-need-decode": "true",
        "x-seller-id": sellerId,
      },
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";

    // On error (or "no template") the backend/proxy returns JSON, not a file.
    if (!res.ok || contentType.includes("application/json")) {
      let message = `Failed to download template (${res.status})`;
      try {
        const data = await res.json();
        message = data?.message || data?.error || message;
      } catch {}
      throw new Error(message);
    }

    const blob = await res.blob();

    // The proxy doesn't forward Content-Disposition, so fall back to a default
    // name (still try the header in case it's present).
    const disposition = res.headers.get("content-disposition") || "";
    const match = disposition.match(
      /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i,
    );
    const filename = match?.[1]
      ? decodeURIComponent(match[1])
      : `template-${categoryId}.xlsx`;

    return { blob, filename };
  }

  // POST /shop/excel/processExcel — process a filled excel by its media url.
  async processExcel(sellerId: string, url: string) {
    return fetchData({
      url: `/shop/excel/processExcel`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.PROCESS_EXCEL,
      body: JSON.stringify({ file_url:url }),
      sellerId,
    });
  }

  // Upload a filled excel file to the media server.
  // POST /upload/excel?folder=<folder> — multipart field "file", X-API-Key header.
  // Accepted: .xlsx, .xls, .xlsm, .xlsb (max 512 MB).
  // Success 201 → { url, key, filename, originalName, contentType }.
  //
  // NOTE: dummy implementation — replace with the real upload logic.
  async uploadExcelFile(
    file: File,
    folder: string = "excel",
  ): Promise<{
    url: string;
    key?: string;
    filename?: string;
    originalName?: string;
    contentType?: string;
  }> {
    if (!MEDIA_SERVER_BASE_URL || !MEDIA_API_KEY) {
      throw new Error("Media server upload is not configured");
    }

    // folder must be in the query string — it's read before the file streams.
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(
      `${MEDIA_SERVER_BASE_URL}/upload/excel?folder=${encodeURIComponent(folder)}`,
      {
        method: "POST",
        headers: { "x-api-key": MEDIA_API_KEY },
        body: form,
      },
    );

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.url) {
      throw new Error(
        data?.error || data?.message || "Excel upload to media server failed",
      );
    }

    return data;
  }

   async getExcelFiles(sellerId: string) {
    return fetchData({
      url: `/shop/excel/getUploadedExcelFiles`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.PROCESS_EXCEL,
      sellerId,
    });
  }

  // ---------- Product Edit / Update / Change-status ----------
  // The three seller-product endpoints (see docs/product-edit.md). They reuse
  // the website seller-edit service + validation, so a product edited here
  // behaves exactly like one edited on the website (incl. the admin-approval
  // flow). All are scoped to `X-Seller-ID` (attached by fetchData via sellerId).

  // GET /shop/products/{id}/edit — UPDATE_PRODUCT | SUPER_ADMIN
  // Returns the product's editable columns + precomputed selections + `lookups`
  // (every dataset needed to render the form).
  async getProductForEdit(sellerId: string, productId: string | number) {
    const res = await fetchData({
      url: `/shop/products/${productId}/edit`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_PRODUCT_FOR_EDIT,
      sellerId,
    });
    if (!res?.success) {
      throw new Error(res?.message || "Failed to load product for edit");
    }
    return res;
  }

  // POST /shop/products/{id}/update — UPDATE_PRODUCT | SUPER_ADMIN
  // Sends the same field set as the website edit form (multipart FormData:
  // flat variant keys, indexed custom_data, JSON sync_color_images, etc.).
  // Prices are sent in the display currency (driven by the `country` header)
  // and converted server-side. Resolves to the standard envelope; on a
  // requires-approval seller the change is stored pending until admin approval.
  async updateProduct(
    sellerId: string,
    productId: string | number,
    formData: FormData,
  ) {
    return fetchData({
      url: `/shop/products/${productId}/update`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.UPDATE_PRODUCT,
      body: formData,
      sellerId,
      noMessage: true,
    });
  }

  // POST /shop/products/{id}/change-status — CHANGE_PRODUCT_STATUS | SUPER_ADMIN
  // Toggles the "allow to purchase" switch. status=0 always succeeds; status=1
  // only succeeds if the product passes activation checks, otherwise a 422 with
  // `detailed_error` listing the blocking reasons is returned.
  async changeProductStatus(
    sellerId: string,
    productId: string | number,
    status: 0 | 1,
  ) {
    return fetchData({
      url: `/shop/products/${productId}/change-status`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.CHANGE_PRODUCT_STATUS,
      body: JSON.stringify({ status }),
      sellerId,
      noMessage: true,
    });
  }

}
export default new SellerDashboardService();

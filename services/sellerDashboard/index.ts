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
        throw new Error(res.message || "Failed to confirm order detail status");
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

  // TODO: replace stub URLs with real endpoints once the API is ready
  async getSellerStories(sellerId: string, page: number = 1) {
    return fetchData({
      url: `/shop/stories?page=${page}`, // TODO: update endpoint
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_SELLER_STORIES,
      sellerId,
    });
  }

  async saveSellerStory(
    sellerId: string,
    data: {
      file_path: string;
      is_video: 0 | 1;
      is_photo: 0 | 1;
      link: string | null;
      product_id: number | null;
      video_duration_in_second: number | null;
    },
  ) {
    return fetchData({
      url: `/shop/stories/add`, // TODO: update endpoint
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.SAVE_SELLER_STORY,
      sellerId,
      body: JSON.stringify(data),
    });
  }

  async deleteSellerStory(storyId: string | number, sellerId: string) {
    return fetchData({
      url: `/shop/stories/${storyId}/delete`, // TODO: update endpoint
      method: "DELETE",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.DELETE_SELLER_STORY,
      sellerId,
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

  // DELETE /shop/products/images/{id} — protected by DELETE_PRODUCT_IMAGES
  async deleteProductImage(imageId: number | string, sellerId: string) {
    return fetchData({
      url: `/shop/products/images/${imageId}`,
      method: "DELETE",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.DELETE_PRODUCT_IMAGE,
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
      data?.files ?? data?.urls ?? data?.results ?? data?.data ?? data ?? [];
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
  // Backend returns the template location; we surface the url to the caller.
  async downloadExcelTemplate(sellerId: string, categoryId: string | number) {
    return fetchData({
      url: `/shop/excel/downloadExcel/${categoryId}`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.DOWNLOAD_EXCEL_TEMPLATE,
      sellerId,
    });
  }

  // POST /shop/excel/processExcel — process a filled excel by its media url.
  async processExcel(sellerId: string, url: string) {
    return fetchData({
      url: `/shop/excel/processExcel`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.PROCESS_EXCEL,
      body: JSON.stringify({ url }),
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
}
export default new SellerDashboardService();

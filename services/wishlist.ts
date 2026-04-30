import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

interface WishlistItem {
  id: number;
  name: string;
  slug: string;
  image: string;
}

interface WishlistResponse {
  data: WishlistItem[];
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface WishlistExistenceResponse {
  data?: { is_exist: boolean };
}

class WishlistService {
  async addToWishlist(productId: number): Promise<void> {
    let res = await fetchData({
      url: "/checklist",
      method: "POST",
      server: "market",
      body: JSON.stringify({
        product_id: productId,
      }),
      reqTitle: REQUESTS_DATA.ADD_CHECKLIST,
    });

    if (!res.success) {
      throw new Error(res.message || "Failed to add product to wishlist");
    }
  }

  async removeFromWishlist(productId: string): Promise<void> {
    let res = await fetchData({
      url: `/checklist/${productId}`,
      method: "DELETE",
      server: "market",
      reqTitle: REQUESTS_DATA.DEL_CHECKLIST,
    });

    if (!res.success) {
      throw new Error(res.message || "Failed to add product to wishlist");
    }
  }

  async getWishlist(page = 1): Promise<WishlistResponse> {
    const data = await fetchData({
      url: `/checklist?page=${page}&page_size=10`,
      method: "GET",
      server: "market",
      reqTitle: REQUESTS_DATA.GET_CHECKLIST,
    });
    return data?.data;
  }

  async isInWishlist(productId: string): Promise<boolean> {
    const data = await fetchData<WishlistExistenceResponse>({
      url: `/checklist/product/${productId}/exist`,
      method: "GET",
      server: "market",
      reqTitle: REQUESTS_DATA.GET_CHECKLIST,
      noMessage: true,
    });

    if (data.data.is_exist) {
      return true;
    }
    return false;
  }
}

export const wishlistService = new WishlistService();
export type { WishlistItem };

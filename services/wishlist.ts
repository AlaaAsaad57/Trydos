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
  total_items: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

class WishlistService {
  async addToWishlist(productId: number): Promise<void> {
    let data = await fetchData({
      url: "/checklist",
      method: "POST",
      server: "market",
      body: JSON.stringify({
        product_id: productId,
      }),
      reqTitle: REQUESTS_DATA.ADD_CHECKLIST,
    });
  }

  async removeFromWishlist(productId: string): Promise<void> {
    let data = await fetchData({
      url: "/checklist?product_id=" + productId,
      method: "DELETE",
      server: "market",
      reqTitle: REQUESTS_DATA.DEL_CHECKLIST,
    });
  }

  async getWishlist(): Promise<WishlistResponse> {
    let data = await fetchData({
      url: "/checklist?page=1&page_size=10&limit=10",
      method: "GET",
      server: "market",
      reqTitle: REQUESTS_DATA.GET_CHECKLIST,
    });
    console.log("Wishlist data:", data);
    return data?.data;
  }

  async isInWishlist(productId: string): Promise<boolean> {
    // isInCheckList()
    return false;
  }
}

export const wishlistService = new WishlistService();
export type { WishlistItem };

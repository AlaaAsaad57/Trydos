import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

interface WishlistItem {
  id: number;
  name: string;
  slug: string;
  image: string;
}

/** One page of the shopper's checklist, as the shop actually answers it.
 *
 * The fields below are the ones that really arrive. An earlier version of this
 * type declared `page_size`, `total_items`, `total_pages`, `has_next` and
 * `has_prev` — **none of which any backend sends.** Checked against staging on
 * 2026-09-19 with twelve saved products, so a second page genuinely existed:
 * the gateway and the core backend both answered with the same key set, and
 * neither carried `has_next`.
 *
 * `ChecklistView` read `result?.has_next ?? false`, which was therefore always
 * `false`, so "Load more" was never rendered and a shopper with more than ten
 * saved products could only ever reach ten of them.
 *
 * `has_next` is kept as a field, but it is **derived here** rather than read —
 * see `getWishlist`. Keeping the name means the two places that use it did not
 * have to change, so the fix is one calculation instead of one per caller.
 */
interface WishlistResponse {
  data: WishlistItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  /** Not from the shop. Worked out from `current_page` and `last_page`. */
  has_next: boolean;
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
      throw new Error(res.message || "Failed to remove product from wishlist");
    }
  }

  async getWishlist(page = 1): Promise<WishlistResponse> {
    const data = await fetchData({
      url: `/checklist?page=${page}&page_size=10`,
      method: "GET",
      server: "market",
      reqTitle: REQUESTS_DATA.GET_CHECKLIST,
    });

    const paginator = data?.data;

    // Worked out here, because the shop never says it. See WishlistResponse.
    //
    // `current_page < last_page` rather than `next_page_url !== null`: both
    // backends send both, and a number cannot be confused by an address that is
    // present but empty.
    //
    // `Number()` is a guard, not a fix for something seen — staging sent both
    // as numbers. It is here because comparing them as text would be wrong and
    // silent: "2" < "10" is false, so a shopper on page 2 of 10 would be told
    // there was nothing more.
    //
    // A missing answer must mean "no more pages", never "one more page" — an
    // undefined field would otherwise leave a Load more button that fetches the
    // same page for ever.
    return {
      ...paginator,
      has_next:
        Number(paginator?.current_page ?? 0) < Number(paginator?.last_page ?? 0),
    };
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

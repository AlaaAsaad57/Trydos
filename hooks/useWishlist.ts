import { useState, useEffect, useCallback } from "react";
import { wishlistService, WishlistItem } from "services/wishlist";

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState<Record<string, boolean>>({});

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const items = await wishlistService.getWishlist();
      setWishlistItems(items);

      // Create a map of product IDs in wishlist
      const wishlistMap: Record<string, boolean> = {};
      items.forEach((item) => {
        wishlistMap[item.id] = true;
      });
      setIsInWishlist(wishlistMap);
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(
    async (product: Omit<WishlistItem, "added_at">) => {
      try {
        await wishlistService.addToWishlist(product);
        setIsInWishlist((prev) => ({ ...prev, [product.id]: true }));
        await loadWishlist();
      } catch (error) {
        console.error("Error adding to wishlist:", error);
      }
    },
    [loadWishlist]
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      try {
        await wishlistService.removeFromWishlist(productId);
        setIsInWishlist((prev) => ({ ...prev, [productId]: false }));
        await loadWishlist();
      } catch (error) {
        console.error("Error removing from wishlist:", error);
      }
    },
    [loadWishlist]
  );

  const checkIfInWishlist = useCallback(async (productId: string) => {
    try {
      const exists = await wishlistService.isInWishlist(productId);
      setIsInWishlist((prev) => ({ ...prev, [productId]: exists }));
      return exists;
    } catch (error) {
      console.error("Error checking wishlist:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  return {
    wishlistItems,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    checkIfInWishlist,
    refreshWishlist: loadWishlist,
  };
};

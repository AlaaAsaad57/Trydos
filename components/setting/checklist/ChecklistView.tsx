"use client";
import { useCallback, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import BackBar from "components/setting/BackBar";
import ChecklistItem from "./ChecklistItem";
import { translateFunction } from "utils/functions";
import {
  CHECKLIST_PAGE_SIZE,
  wishlistService,
  WishlistItem,
} from "services/wishlist";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@/store/notifications/reducer";

// The checklist screen. Replaces the old header slide-over panel: same data
// (GET /checklist, paged), settings-screen layout. Removals are tracked per
// product id so each row can show its own spinner while the request is in
// flight — a failed remove leaves the row in place and surfaces the error.
function ChecklistView({
  isRtl,
  language,
  local,
}: {
  isRtl: boolean;
  language: string;
  local: string;
}) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  // A failed first load shows an error with "Try again", never the empty list.
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Rows removed since the last page was read. Each removal moves the shop's
  // later rows one place back, so `loadMore` must ask for an earlier page.
  const [removedSinceLoad, setRemovedSinceLoad] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadChecklist = async () => {
      try {
        setLoading(true);
        setLoadFailed(false);
        const result = await wishlistService.getWishlist(1);
        if (cancelled) return;
        setItems(result?.data ?? []);
        setHasNext(result?.has_next ?? false);
        setPage(1);
        setRemovedSinceLoad(0);
      } catch (error) {
        if (!cancelled) {
          setLoadFailed(true);
          showErrorNotification(
            translateFunction("Something went wrong", language),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadChecklist();
    return () => {
      cancelled = true;
    };
  }, [language, reloadKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    // Ask for the page that holds the first row not shown yet. With no
    // removals this is `page + 1`. After removals the shop's rows have moved
    // back, so it can be the same page again — rows already shown are dropped.
    const nextPage =
      Math.floor(
        (page * CHECKLIST_PAGE_SIZE - removedSinceLoad) / CHECKLIST_PAGE_SIZE,
      ) + 1;
    try {
      setLoadingMore(true);
      const result = await wishlistService.getWishlist(nextPage);
      setItems((prev) => {
        const shown = new Set(prev.map((item) => String(item.id)));
        const fresh = (result?.data ?? []).filter(
          (item) => !shown.has(String(item.id)),
        );
        return [...prev, ...fresh];
      });
      setHasNext(result?.has_next ?? false);
      setPage(nextPage);
      setRemovedSinceLoad(0);
    } catch (error) {
      showErrorNotification(translateFunction("Something went wrong", language));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNext, page, removedSinceLoad, language]);

  const handleRemove = async (productId: string) => {
    if (removingIds.includes(productId)) return;
    setRemovingIds((prev) => [...prev, productId]);
    try {
      await wishlistService.removeFromWishlist(productId);
      setItems((prev) =>
        prev.filter((item) => String(item.id) !== String(productId)),
      );
      setRemovedSinceLoad((count) => count + 1);
      showSuccessNotification(
        translateFunction("Removed from checklist", language),
      );
    } catch (error) {
      showErrorNotification(
        translateFunction("Failed to remove from checklist", language),
      );
    } finally {
      setRemovingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  return (
    <>
      <BackBar
        isRtl={isRtl}
        local={local}
        DataCy="checklist-screen"
        name={translateFunction("My Checklist", language)}
        Icon={"/icons/Heart.svg"}
        preivous_page={`/${local}/settings`}
      />

      {loading ? (
        <div className="flex-col w-full" data-pw="checklist-loading">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton
              key={key}
              className="w-full h-[96px] rounded-[15px] mt-[8px]"
            />
          ))}
        </div>
      ) : loadFailed ? (
        <div
          data-pw="checklist-error"
          className="flex-col w-full items-center justify-center gap-[12px] mt-[40px] py-[40px] rounded-[15px] bg-[#F8F8F8]"
        >
          <span className="text-[14px] regular text-[#8D8D8D]">
            {translateFunction("Something went wrong", language)}
          </span>
          <button
            type="button"
            data-pw="checklist-retry"
            onClick={() => setReloadKey((key) => key + 1)}
            className="h-[40px] px-[20px] rounded-[15px] bg-white text-[14px] medium text-[#402CDD] cursor-pointer"
          >
            {translateFunction("Try again", language)}
          </button>
        </div>
      ) : items.length > 0 ? (
        <div className="flex-col w-full pb-[20px]" data-pw="checklist-list">
          {items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              local={local}
              language={language}
              isRtl={isRtl}
              isRemoving={removingIds.includes(String(item.id))}
              onRemove={handleRemove}
            />
          ))}

          {hasNext && (
            <button
              type="button"
              data-pw="checklist-load-more"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full h-[45px] mt-[12px] rounded-[15px] bg-[#F8F8F8] text-[14px] medium text-[#402CDD] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore
                ? translateFunction("Loading...", language)
                : translateFunction("Load more", language)}
            </button>
          )}
        </div>
      ) : (
        <div
          data-pw="checklist-empty"
          className="flex-col w-full items-center justify-center gap-[12px] mt-[40px] py-[40px] rounded-[15px] bg-[#F8F8F8]"
        >
          <img src="/icons/Heart.svg" alt="" className="w-[40px] h-[40px]" />
          <span className="text-[14px] regular text-[#8D8D8D]">
            {translateFunction("Your CheckList is empty", language)}
          </span>
        </div>
      )}
    </>
  );
}

export default ChecklistView;

"use client";
import "styles/home.css";
import dynamic from "next/dynamic";
import { useEffect } from "react";

import { translateFunction } from "utils/functions";
const NameModal = dynamic(() => import("components/global/NameModal"));
import StoryServiceClass from "services/story";
import { useAppStore } from "store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { showErrorNotification } from "@/store/notifications/reducer";
import { deleteCookie } from "utils/cookies/cookie-manager";
import { EnableScroll } from "utils/tinyUtils";
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Selectors (not getState() at render): the name-modal condition must
  // re-evaluate when CheckLogin seeds userChat/userStories after boot, and a
  // narrowed subscription no longer re-renders this component on every write.
  const nameModal = useAppStore((s) => s.nameModal);
  const userName = useAppStore((s) => s.userProfile?.name);
  const userChatId = useAppStore((s) => s.userChat?.id);
  const userStoriesId = useAppStore((s) => s.userStories?.id);
  const message = searchParams?.get("message");
  // Mount-only housekeeping. Deliberately keeps empty deps: re-running the
  // cookie cleanup, nav-state reset and story-token init on every query-string
  // change would be wrong.
  useEffect(() => {
    deleteCookie("last-page");
    const { setIsNavigating, setIsProductPage } = useAppStore.getState();
    setIsNavigating(null);
    setIsProductPage(false);
    EnableScroll();
    initStoryToken();
  }, []);
  // Split out of the mount effect and keyed on `message` so the toast still
  // fires when Home is ALREADY mounted — e.g. a dead product opened from the
  // home page redirects back to `/{lang}?message=product_not_found`, which does
  // not remount this component. Stripping the param below flips `message` to
  // null, so the early return makes the follow-up run a no-op (no double toast).
  useEffect(() => {
    if (!message?.length) return;
    if (message === "product_not_found") {
      showErrorNotification(translateFunction("Product not found"));
    }
    if (message === "boutique_not_found") {
      showErrorNotification(translateFunction("Boutique not found"));
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("message");
    const query = newParams.toString();
    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
    router.push(query ? `${pathname}?${query}` : pathname, { shallow: true });
  }, [message]);
  const initStoryToken = async () => {
    if (StoryServiceClass.getUserStories()?.id) {
      const Cookies = (await import("js-cookie")).default;
      Cookies.set("token", StoryServiceClass.getUserStories()?.access_token);
    }
  };

  const nameModalOpen =
    userChatId &&
    userStoriesId &&
    (!userName || userName?.length === 0) &&
    nameModal;
  return <>{nameModalOpen && <NameModal />}</>;
}

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
  useEffect(() => {
    deleteCookie("last-page");
    const { setIsNavigating, setIsProductPage } = useAppStore.getState();
    setIsNavigating(null);
    setIsProductPage(false);
    EnableScroll();
    initStoryToken();
    if (searchParams?.get("message")?.length > 0) {
      let message = searchParams.get("message");
      if (message === "product_not_found") {
        showErrorNotification(translateFunction("Product not found"));
      }
      if (message === "boutique_not_found") {
        showErrorNotification(translateFunction("Boutique not found"));
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("message");
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
  }, []);
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

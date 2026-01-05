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
import {
  COOKIE_NAMES,
  deleteCookie,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { EnableScroll } from "utils/tinyUtils";
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resetFilters, nameModal } =
    useAppStore();
  useEffect(() => {
    deleteCookie("last-page");
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
    EnableScroll();
    try {
      initFB();
    } catch (e) {}
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
  const initFB = async () => {
    resetFilters();
    if (StoryServiceClass.getUserStories()?.id) {
      const Cookies = (await import("js-cookie")).default;
      Cookies.set("token", StoryServiceClass.getUserStories()?.access_token);
    }
  };

  const getNameModalOpen = () => {
    if (typeof window === "undefined") {
      return false;
    } else {
      const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
      const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
      const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
      let name = user?.name;
      return (
        userChat?.id &&
        userStories?.id &&
        (!name || name?.length === 0) &&
        nameModal
      );
    }
  };
  return (
    <>
      {getNameModalOpen() && <NameModal />}

   
    </>
  );
}

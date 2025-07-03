"use client";
import "styles/home.css";
import dynamic from "next/dynamic";
import { useEffect } from "react";

import ChatService from "services/chat";
import { getUserChat, translateFunction } from "utils/functions";
const NameModal = dynamic(() => import("components/global/NameModal"));
import StoriesContainer from "./Stories/NewStories";
import StoryServiceClass from "services/story";
import { dispatchRouteChangeEvent } from "utils/events";
import SearchContainer from "./Search/SearchContainer";
import auth from "services/auth";
import { useAppStore } from "store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { showErrorNotification } from "@/store/notifications/reducer";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resetFilters, selectedStory, enable_search, nameModal } =
    useAppStore();
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;

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

    if (getUserChat()?.id) {
      const { requestFirebaseNotificationPermission } = await import(
        "utils/firebaseInitv1"
      );
      requestFirebaseNotificationPermission().then(async (fbtoken) => {
        if (fbtoken && getUserChat()?.id) {
          fbtoken &&
            ChatService.StoreToken({
              id: getUserChat()?.id,
              token: fbtoken,
              user: getUserChat(),
            });
        }
      });
    }
  };

  const getNameModalOpen = () => {
    if (typeof window === "undefined") {
      return false;
    } else {
      const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
      let name = user?.name;
      return (
        getUserChat()?.id &&
        auth.getUser()?.id &&
        (!name || name?.length === 0) &&
        nameModal
      );
    }
  };
  return (
    <>
      {getNameModalOpen() && <NameModal />}
      {selectedStory?.id && <StoriesContainer selectedStory={selectedStory} />}
      {enable_search && <SearchContainer active={enable_search} />}
    </>
  );
}

"use client";
import "styles/home.css";
import "styles/unused-onload.css";
import { useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import Stories from "./Stories/index";
import ChatService from "services/chat";
const NotificationContainer = dynamic(() => import("./Notifications"), {
  ssr: false,
});
import { getUserChat } from "utils/functions";
const NameModal = dynamic(() => import("components/global/NameModal"));
const StoriesContainer = dynamic(() => import("./Stories/NewStories"), {
  loading: () => <LandingPage afterLoad={true} />,
});
import { getUserStories } from "../../utils/functions";
import StoryServiceClass from "services/story";
import LandingPage from "./LandingPage";
import { dispatchRouteChangeEvent } from "Hooks/events";
export default function Home() {
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    StoryServiceClass.getStories();
    try {
      initFB();
    } catch (e) {}
  }, []);
  const initFB = async () => {
    if (getUserStories()?.id) {
      const Cookies = (await import("js-cookie")).default;
      Cookies.set("token", getUserStories()?.access_token);
    }

    if (getUserChat()?.id) {
      const { requestFirebaseNotificationPermission, onMessageListener } =
        await import("utils/firebaseInitv1");
      requestFirebaseNotificationPermission().then((fbtoken) => {
        if (fbtoken) {
          fbtoken &&
            ChatService.StoreToken({
              id: getUserChat()?.id,
              token: fbtoken,
              user: getUserChat(),
            });
        }
      });
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        onMessageListener()
          .then((payload) => {})
          .catch((err) => {});
    }
  };
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const enableNotifications = useSelector(
    (state: any) => state.homepage.enableNotifications
  );
  const nameModal = useSelector((state: any) => state.chat.nameModal);
  useEffect(() => {
    if (selectedStory) {
      document.documentElement
        .getElementsByTagName("meta")[0]
        .setAttribute("content", "");
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "initial";
    }
  }, [selectedStory]);
  return (
    <>
      {enableNotifications && <NotificationContainer />}
      <Stories />
      {nameModal && <NameModal />}
      {selectedStory?.id && (
        <StoriesContainer
          activeId={selectedStory?.id}
          selectedStory={selectedStory}
        />
      )}
    </>
  );
}

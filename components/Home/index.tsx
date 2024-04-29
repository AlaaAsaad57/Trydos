"use client";
import "styles/home.css";
import "styles/unused-onload.css";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { GetMainData, LogData } from "store/homepage/actions";
import Stories from "./Stories/index";
import BrandsBar from "./Bars/BrandsBar";
const QuickOffer = dynamic(() => import("./Bars/QuickOffer"), { ssr: false });
const OfferBar = dynamic(() => import("./Bars/OfferBar"), { ssr: false });
const CategoryBar = dynamic(() => import("./Bars/CategoryBar"), { ssr: false });
import OffersList from "./OfferWidgets/OfferList";
import StoriesComponent from "./Stories/StoriesComponent";

import ChatService from "services/chat";
const NotificationContainer = dynamic(() => import("./Notifications"), {
  ssr: false,
});
import { getUserChat } from "utils/functions";
import NameModal from "components/global/NameModal";
import { getUserStories } from "../../utils/functions";
import StoryServiceClass from "services/story";
import NewLoginWidget from "components/Login/NewLoginWidget";
import StoreisCompnent from "./Stories/StoreisCompnent";
export default function Home({
  HomeData_res,
  HomeData,
}: {
  HomeData_res: Object;
  HomeData: Object;
}) {
  useEffect(() => {
    StoryServiceClass.getStories();
    LogData({ HomeData_req_data: HomeData_res });
    dispatch(GetMainData(HomeData));
    try {
      initFB();
    } catch (e) {
      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(e);
    }
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
          .then((payload) => {
            if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
              console.log(payload);
          })
          .catch((err) => {
            if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
              console.log("failed: ", err);
          });
    }
  };
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const enableNotifications = useSelector(
    (state: any) => state.homepage.enableNotifications
  );
  const nameModal = useSelector((state: any) => state.chat.nameModal);
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  const setLoginOpen = (e: boolean) => {
    dispatch({ type: "LOGIN-OPEN", payload: e });
  };
  useEffect(() => {
    if (selectedStory) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "initial";
    }
  }, [selectedStory]);
  const dispatch = useDispatch();
  return (
    <>
      {loginOpen && (
        <div onClick={() => setLoginOpen(false)} className="backdrop-login" />
      )}
      {loginOpen && <NewLoginWidget close={() => setLoginOpen(false)} />}
      {enableNotifications && <NotificationContainer />}
      <Stories />
      {nameModal && <NameModal />}
      <StoriesComponent />
      <BrandsBar />
      <OffersList key={2} offers={[1, 1, 1]} quick={false} />
      <CategoryBar />
      <OfferBar />
      <QuickOffer />
      <OffersList quick={true} offers={[1]} />
    </>
  );
}

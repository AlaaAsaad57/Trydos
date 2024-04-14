"use client";
import "styles/home.css";
import "styles/unused-onload.css";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { GetMainData, LogData } from "store/homepage/actions";
import Stories from "./Stories/index";
import CategoriesBar from "./CategoriesBar";
import BrandsBar from "./Bars/BrandsBar";
const QuickOffer = dynamic(() => import("./Bars/QuickOffer"), { ssr: false });
const OfferBar = dynamic(() => import("./Bars/OfferBar"), { ssr: false });
const CategoryBar = dynamic(() => import("./Bars/CategoryBar"), { ssr: false });
import OffersList from "./OfferWidgets/OfferList";
const StoriesComponent = dynamic(() => import("./Stories/StoriesComponent"), {
  ssr: false,
});
import ChatService from "services/chat";
const NotificationContainer = dynamic(() => import("./Notifications"), {
  ssr: false,
});
import { getUserChat } from "utils/functions";
import NameModal from "components/global/NameModal";
import { getUserStories } from "../../utils/functions";
export default function Home({
  HomeData_res,
  HomeData,
  storiesData,
}: {
  HomeData_res: Object;
  HomeData: Object;
  storiesData: any[];
}) {
  useEffect(() => {
    dispatch({ type: "STORY-DATA", payload: storiesData[0] });
    LogData({ HomeData_req_data: HomeData_res, stories: storiesData });
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
      {enableNotifications && <NotificationContainer />}
      <Stories />
      {nameModal && <NameModal />}
      {<StoriesComponent />}
      <CategoriesBar key={1} forMobile={true} />
      <BrandsBar />
      <OffersList key={2} offers={[1, 1, 1]} quick={false} />
      <CategoryBar />
      <OfferBar />
      <QuickOffer />
      <OffersList quick={true} offers={[1]} />
    </>
  );
}

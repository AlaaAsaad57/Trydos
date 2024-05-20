"use client";
import "styles/home.css";
import "styles/unused-onload.css";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import {
  GetMainCategories,
  GetMainData,
  LogData,
} from "store/homepage/actions";
import Stories from "./Stories/index";
import BrandsBar from "./Bars/BrandsBar";
import QuickOffer from "./Bars/QuickOffer";
import OfferBar from "./Bars/OfferBar";
import CategoryBar from "./Bars/CategoryBar";
import OffersList from "./OfferWidgets/OfferList";
import ChatService from "services/chat";
const NotificationContainer = dynamic(() => import("./Notifications"), {
  ssr: false,
});
import { getUserChat } from "utils/functions";
import NameModal from "components/global/NameModal";
import { getUserStories } from "../../utils/functions";
import StoryServiceClass from "services/story";
import StoriesContainer from "./Stories/NewStories";
export default function Home({
  HomeData_res,
  HomeData,
  mainCategories,
  mainCategories_res,
}: {
  HomeData_res: Object;
  HomeData: Object;
  mainCategories: Object;
  mainCategories_res: Object;
}) {
  useEffect(() => {
    StoryServiceClass.getStories();
    LogData({
      HomeData_req_data: HomeData_res,
      mainCategories,
      mainCategories_res,
    });
    dispatch(GetMainData(HomeData));
    dispatch(GetMainCategories(mainCategories));
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
  const dispatch = useDispatch();
  return (
    <>
      {enableNotifications && <NotificationContainer />}
      <Stories />
      {nameModal && <NameModal />}
      {/* <StoriesComponent /> */}
      {selectedStory?.id && (
        <StoriesContainer
          activeId={selectedStory?.id}
          selectedStory={selectedStory}
        />
      )}
      <BrandsBar />
      <OffersList key={2} offers={[1, 1, 1]} quick={false} />
      <CategoryBar />
      <OfferBar />
      <QuickOffer />
    </>
  );
}

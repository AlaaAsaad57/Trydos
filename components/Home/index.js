"use client";
import "styles/home.css";
import "styles/unused-onload.css";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { GetMainData, GetStoryData, LogData } from "store/homepage/actions";
import Stories from "./Stories/index";
const CategoriesBar = dynamic(() => import("./CategoriesBar"), { ssr: false });
const BrandsBar = dynamic(() => import("./Bars/BrandsBar"), { ssr: false });
const QuickOffer = dynamic(() => import("./Bars/QuickOffer"), { ssr: false });
const OfferBar = dynamic(() => import("./Bars/OfferBar"), { ssr: false });
const CategoryBar = dynamic(() => import("./Bars/CategoryBar"), { ssr: false });
import OffersList from "./OfferWidgets/OfferList";
const StoriesComponent = dynamic(() => import("./Stories/StoriesComponent"), {
  ssr: false,
});
import { StoreToken } from "store/auth/actions";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  onMessageListener,
  requestFirebaseNotificationPermission,
} from "utils/firebaseInitv1";
import { getUserChat } from "utils/functions";
export default function Home({ stories, HomeData_res, stories_res, HomeData }) {
  var bool = true;
  useEffect(() => {
    LogData({ stories_req_data: stories_res, HomeData_req_data: HomeData_res });
    dispatch(GetStoryData(stories));
    dispatch(GetMainData(HomeData));
    try {
      requestFirebaseNotificationPermission().then((fbtoken) => {
        if (fbtoken) {
          fbtoken &&
            StoreToken({
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
    } catch (e) {
      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(e);
    }
  }, []);

  const selectedStory = useSelector((state) => state.homepage.selectedStory);
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
      <ToastContainer position="bottom-right" />

      <Stories />
      <StoriesComponent />
      <CategoriesBar forMobile={true} />
      <BrandsBar />
      <OffersList offers={[1, 1, 1]} />
      <CategoryBar />
      <OfferBar />
      <QuickOffer />
      <OffersList quick={true} offers={[1]} />
    </>
  );
}

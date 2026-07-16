"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import home from "services/home";
import {
  addToCompare,
  COMPARE_CHANGED_EVENT,
  LogError,
  removeFromCompare,
  translateFunction,
} from "utils/functions";
import { getCookie } from "utils/cookies/cookie-manager";
import Spinner from "components/global/Spinner";

import { useAppStore } from "store";
import { getNotificationsTypes } from "services/notifications";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import auth from "services/auth";
import { wishlistService } from "services/wishlist";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";

function MoreOptionsSection({ product }) {
  const {
    disableNotification,
    enableNotification,
    firebaseSettings,
    NotificationsType,
    setNotificationsType,
    language,
  } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const getNotificationsType = async () => {
    if (NotificationsType?.length === 0) {
      const response = await getNotificationsTypes();
      setNotificationsType(response?.data?.notification_types);
    } else {
      setNotificationsType(NotificationsType);
    }
  };
  useEffect(() => {
    getNotificationsType();
  }, []);

  const [loading, setLoading] = useState(false);
  const [addedToCompare, setAddedToCompare] = useState(
    getCookie<string>("f_p") === product?.slug ||
      getCookie<string>("s_p") === product?.slug,
  );
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const isRtl = language === "ar" || language === "ku";

  const AddedToCompare = () => {
    return addedToCompare;
  };

  
  const enableNotificationTopic = async (payload, type) => {
    if (loading) return;
    try {
      setLoading(true);
      // Returns the FCM token, or undefined when this device can't register for
      // push (unsupported browser, no service worker, permission not granted).
      const fbtoken = await home.AllowNotifications();

      const isCurrentlyEnabled = firebaseSettings?.subscribed_topics?.some(
        (s) => s.topic === payload,
      );

      if (isCurrentlyEnabled) {
        const res = await home.UnsubscribeToTopicInventory({ topic: payload });
        // `fetchData` resolves to `{ success: false }` on failure instead of
        // throwing, so check it explicitly. Only reflect the change locally
        // once the backend confirms it — otherwise the UI would show a state
        // the next page load (GetFireBaseSettings) silently undoes.
        if (res?.success === false) {
          throw new Error(res?.message);
        }
        disableNotification(payload);
      } else {
        // No usable token → the backend has no device to subscribe, so the
        // topic would fail to persist and reappear as "off" on revisit. Refuse
        // instead of showing a green check that isn't real.
        if (!fbtoken) {
          throw new Error(
            translateFunction(
              "Notification Is Not Enabled! please Allow Notification Access",
            ),
          );
        }
        const res = await home.subscribeToTopicInventory({ topic: payload });
        if (res?.success === false) {
          throw new Error(res?.message);
        }
        // Paint the topic green only after the backend confirms the
        // subscription, so the check mark matches what a revisit will show.
        send_GA_EVENT(type);
        enableNotification(payload);
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In enableNotificationTopic in MoreOptionsSection",
      });
      showErrorNotification(
        error?.message ??
          translateFunction(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
      );
    } finally {
      setLoading(false);
    }
  };
  const checkIfTopicEnabled = (topic) => {
    return firebaseSettings?.subscribed_topics.some((s) => {
      return s.topic === topic;
    });
  };
  const getData = async () => {
    setLoading(true);
    await home.GetFireBaseSettings();
    await getNotificationsType();
    setLoading(false);
  };
  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (product?.id) {
        try {
          const inWishlist = await wishlistService.isInWishlist(
            String(product?.id),
          );
          setIsInWishlist(inWishlist);
        } catch (error) {
          console.error("Error checking wishlist status:", error);
        }
      }
    };
    checkWishlistStatus();
  }, [product?.id]);

  const toggleWishlist = async () => {
    if (wishlistLoading || !product?.id) return;

    setWishlistLoading(true);

    try {
      const productId = String(product.id);
      const currentlyInWishlist = await wishlistService.isInWishlist(productId);

      if (currentlyInWishlist) {
        await wishlistService.removeFromWishlist(productId);
        setIsInWishlist(false);
        showSuccessNotification(translate("Removed from checklist", language));
      } else {
        await wishlistService.addToWishlist(Number(productId));
        setIsInWishlist(true);
        showSuccessNotification(translate("Added to checklist", language));

        // Only the "add" is a favourite event — firing on remove inflated the metric.
        GAevent({
          action: GA_EVENT_NAMES.ADD_TO_FAV,
          params: {
            user_id_custom: auth.UserID(),
            item_id: product?.id,
            item_name: product?.name,
            brand: product?.brand?.name,
            brand_id: product?.brand?.id,
            category: product?.category?.name,
            category_id: product?.category?.id,
            price: product?.price,
          },
        });
      }
    } catch (error) {
      showErrorNotification(translate("Failed to update checklist", language));
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const checkCompareStatus = () => {
      const f_p = getCookie<string>("f_p");
      const s_p = getCookie<string>("s_p");
      const isAdded = f_p === product?.slug || s_p === product?.slug;
      setAddedToCompare(isAdded);
    };
    checkCompareStatus();
    // Cookies don't emit change events, so sync on the compare-changed event
    // (fired by add/removeFromCompare) and on window focus — no timer polling.
    window.addEventListener(COMPARE_CHANGED_EVENT, checkCompareStatus);
    window.addEventListener("focus", checkCompareStatus);
    return () => {
      window.removeEventListener(COMPARE_CHANGED_EVENT, checkCompareStatus);
      window.removeEventListener("focus", checkCompareStatus);
    };
  }, [product?.slug]);
  const send_GA_EVENT = (notification_type) => {
    GAevent({
      action: GA_EVENT_NAMES.ENABLE_PRODUCT_NOTIFICATION,
      params: {
        user_id_custom: auth.UserID(),

        type_notification: notification_type,
        item_id: product?.id,
        item_name: product?.name,
        brand_id: product?.brand?.id,
        category: product?.categories?.[0]?.name,
        category_id: product?.categories?.[0]?.id,
        brand: product?.brand?.name,
        price: product?.offer_price,
      },
    });
  };
  return (
    <div className="extended-section" data-cy="ExtendThreePointsSection">
      <div className="extended-bar-top share-bar-top">
        <span className="flex">
          {translate("More Options", language)}

          {loading && (
            <span className="ml-1">
              <Spinner />
            </span>
          )}
        </span>
      </div>
      <div
        className="content-extended"
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <div className="Notify-button-container px-[20px]">
          <div className="notify-row">
            <svg
              id="_25x25_Back"
              data-name="25x25 Back"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="25"
              height="25"
              viewBox="0 0 25 25"
            >
              <g
                id="Mask_Group_361"
                data-name="Mask Group 361"
                clipPath="url(#clipPath)"
              >
                <g id="ringing">
                  <g id="Group_11156" data-name="Group 11156">
                    <path
                      id="Path_21464"
                      data-name="Path 21464"
                      d="M23.438,10.938a.521.521,0,0,1-.521-.521,11.381,11.381,0,0,0-3.356-8.1.521.521,0,1,1,.736-.736,12.414,12.414,0,0,1,3.661,8.839A.521.521,0,0,1,23.438,10.938Z"
                      fill="#8d8d8d"
                    />
                  </g>
                  <g id="Group_11157" data-name="Group 11157">
                    <path
                      id="Path_21465"
                      data-name="Path 21465"
                      d="M1.563,10.938a.521.521,0,0,1-.521-.521A12.414,12.414,0,0,1,4.7,1.578a.521.521,0,1,1,.736.736,11.381,11.381,0,0,0-3.356,8.1.521.521,0,0,1-.521.521Z"
                      fill="#8d8d8d"
                    />
                  </g>
                  <g id="Group_11158" data-name="Group 11158">
                    <path
                      id="Path_21466"
                      data-name="Path 21466"
                      d="M14.062,4.354a.521.521,0,0,1-.521-.521V2.083a1.042,1.042,0,1,0-2.083,0v1.75a.521.521,0,1,1-1.042,0V2.083a2.083,2.083,0,0,1,4.167,0v1.75A.52.52,0,0,1,14.062,4.354Z"
                      fill="#8d8d8d"
                    />
                  </g>
                  <g id="Group_11159" data-name="Group 11159">
                    <path
                      id="Path_21467"
                      data-name="Path 21467"
                      d="M12.5,25a3.65,3.65,0,0,1-3.646-3.646.521.521,0,1,1,1.042,0,2.6,2.6,0,0,0,5.208,0,.521.521,0,1,1,1.042,0A3.65,3.65,0,0,1,12.5,25Z"
                      fill="#8d8d8d"
                    />
                  </g>
                  <g id="Group_11160" data-name="Group 11160">
                    <path
                      id="Path_21468"
                      data-name="Path 21468"
                      d="M21.354,21.875H3.646a1.563,1.563,0,0,1-1.016-2.75,7.242,7.242,0,0,0,2.578-5.544V10.417a7.292,7.292,0,0,1,14.583,0v3.165a7.234,7.234,0,0,0,2.57,5.536,1.563,1.563,0,0,1-1.007,2.757ZM12.5,4.167a6.256,6.256,0,0,0-6.25,6.25v3.165a8.276,8.276,0,0,1-2.939,6.332.521.521,0,0,0,.334.92H21.354a.521.521,0,0,0,.339-.917,8.282,8.282,0,0,1-2.943-6.335V10.417a6.256,6.256,0,0,0-6.25-6.25Z"
                      fill="#8d8d8d"
                    />
                  </g>
                </g>
              </g>
            </svg>
            <span>
              {translate("Notify Me About The Product When", language)}
            </span>
          </div>
          <HortiznalScrollBar id="slider-options" className="notify-row">
            {NotificationsType.length === 0 ? (
              <div className="flex items-center w-full h-full justify-center">
                <Spinner />
              </div>
            ) : (
              NotificationsType?.map((type) => (
                <div
                  key={type.topic}
                  className={`button-option  ${
                    checkIfTopicEnabled(`${type.topic}_${product?.id}`) &&
                    "bg-green-300 px-[16px]"
                  }`}
                  onClick={async () => {
                    enableNotificationTopic(
                      `${type.topic}_${product?.id}`,
                      type,
                    );
                  }}
                  data-cy={`notify-type`}
                >
                  {checkIfTopicEnabled(`${type.topic}_${product?.id}`) && (
                    <img src="/icons/CheckIcon.svg" className="mx-1" />
                  )}
                  {type.showed_name}
                </div>
              ))
            )}
          </HortiznalScrollBar>
        </div>
        <div
          className={`px-[20px] more-options-button ${
            isInWishlist ? "bg-green-300" : ""
          }`}
          data-cy="add-checkList"
          onClick={toggleWishlist}
        >
          <svg
            data-cy="add-checkList-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="25"
            height="25"
            viewBox="0 0 25 25"
          >
            <g id="Mask_Group_363" data-name="Mask Group 363">
              <g
                id="Group_3487"
                data-name="Group 3487"
                transform="translate(3.75 0)"
              >
                <g
                  id="Rectangle_4147"
                  data-name="Rectangle 4147"
                  fill="none"
                  stroke="#404040"
                  strokeWidth="0.625"
                >
                  <rect width="17.5" height="25" rx="2.5" stroke="none" />
                  <rect
                    x="0.313"
                    y="0.313"
                    width="16.875"
                    height="24.375"
                    rx="2.188"
                    fill="none"
                  />
                </g>
                <g
                  id="Group_3484"
                  data-name="Group 3484"
                  transform="translate(1.247 4.546)"
                >
                  <line
                    id="Line_872"
                    data-name="Line 872"
                    x2="10"
                    transform="translate(4.375 5)"
                    fill="none"
                    stroke="#404040"
                    strokeLinecap="round"
                    strokeWidth="0.625"
                  />
                  <line
                    id="Line_873"
                    data-name="Line 873"
                    x2="10"
                    transform="translate(4.375 8.75)"
                    fill="none"
                    stroke="#404040"
                    strokeLinecap="round"
                    strokeWidth="0.625"
                  />
                  <line
                    id="Line_874"
                    data-name="Line 874"
                    x2="10"
                    transform="translate(4.375 12.5)"
                    fill="none"
                    stroke="#404040"
                    strokeLinecap="round"
                    strokeWidth="0.625"
                  />
                  <line
                    id="Line_875"
                    data-name="Line 875"
                    x2="10"
                    transform="translate(4.375 16.25)"
                    fill="none"
                    stroke="#404040"
                    strokeLinecap="round"
                    strokeWidth="0.625"
                  />
                  <line
                    id="Line_871"
                    data-name="Line 871"
                    x2="10"
                    transform="translate(4.375 1.25)"
                    fill="none"
                    stroke="#404040"
                    strokeLinecap="round"
                    strokeWidth="0.625"
                  />
                  <circle
                    id="Ellipse_261"
                    data-name="Ellipse 261"
                    cx="1.25"
                    cy="1.25"
                    r="1.25"
                    fill="#404040"
                  />
                  <circle
                    id="Ellipse_262"
                    data-name="Ellipse 262"
                    cx="1.25"
                    cy="1.25"
                    r="1.25"
                    transform="translate(0 3.75)"
                    fill="#404040"
                  />
                  <circle
                    id="Ellipse_263"
                    data-name="Ellipse 263"
                    cx="1.25"
                    cy="1.25"
                    r="1.25"
                    transform="translate(0 7.5)"
                    fill="#404040"
                  />
                  <circle
                    id="Ellipse_264"
                    data-name="Ellipse 264"
                    cx="1.25"
                    cy="1.25"
                    r="1.25"
                    transform="translate(0 11.25)"
                    fill="#404040"
                  />
                  <circle
                    id="Ellipse_265"
                    data-name="Ellipse 265"
                    cx="1.25"
                    cy="1.25"
                    r="1.25"
                    transform="translate(0 15)"
                    fill="#404040"
                  />
                </g>
              </g>
            </g>
          </svg>

          <span data-cy="add-checkList-text">
            {translate("Add To My Checklist", language)}
          </span>
        </div>
        <div
          className={`more-options-button px-[20px] ${
            AddedToCompare() ? "bg-green-300" : ""
          }`}
          data-cy="add-compare"
          onClick={() => {
            if (AddedToCompare()) {
              removeFromCompare(product?.slug);
              setAddedToCompare(false);
              showSuccessNotification(
                translate("Removed From Compare", language),
              );
            } else {
              const f_p = getCookie<string>("f_p");
              const s_p = getCookie<string>("s_p");
              // Both slots are taken by other products → addToCompare replaces
              // the first one. Tell the shopper instead of overwriting silently.
              const willReplaceFirst =
                !!f_p &&
                !!s_p &&
                f_p !== product?.slug &&
                s_p !== product?.slug;
              setAddedToCompare(true);
              addToCompare(product?.slug);
              showSuccessNotification(
                translate(
                  willReplaceFirst
                    ? "Compare was full — replaced the first product. Click To Go To Compare Page"
                    : "Added To Compare! Click To Go To Compare Page",
                  language,
                ),
                5000,
                `/${lang}/compare`,
              );
            }
          }}
        >
          <svg
            data-cy="add-compare-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="25"
            height="25"
            viewBox="0 0 25 25"
          >
            <g
              id="Mask_Group_364"
              data-name="Mask Group 364"
              clipPath="url(#clipPath)"
            >
              <g
                id="Group_3489"
                data-name="Group 3489"
                transform="translate(3.75 0)"
              >
                <g id="Group_3488" data-name="Group 3488">
                  <g
                    id="Rectangle_4149"
                    data-name="Rectangle 4149"
                    fill="none"
                    stroke="#404040"
                    strokeWidth="0.625"
                  >
                    <rect width="17.5" height="12.5" rx="2.5" stroke="none" />
                    <rect
                      x="0.313"
                      y="0.313"
                      width="16.875"
                      height="11.875"
                      rx="2.188"
                      fill="none"
                    />
                  </g>
                  <rect
                    id="Rectangle_4150"
                    data-name="Rectangle 4150"
                    width="5"
                    height="7.5"
                    rx="1.25"
                    transform="translate(6.25 2.5)"
                    fill="#8e8e8e"
                  />
                </g>
                <g
                  id="Group_3486"
                  data-name="Group 3486"
                  transform="translate(0 12.5)"
                >
                  <g
                    id="Rectangle_4148"
                    data-name="Rectangle 4148"
                    fill="none"
                    stroke="#404040"
                    strokeWidth="0.625"
                  >
                    <rect width="17.5" height="12.5" rx="2.5" stroke="none" />
                    <rect
                      x="0.313"
                      y="0.313"
                      width="16.875"
                      height="11.875"
                      rx="2.188"
                      fill="none"
                    />
                  </g>
                  <rect
                    id="Rectangle_4151"
                    data-name="Rectangle 4151"
                    width="5"
                    height="7.5"
                    rx="1.25"
                    transform="translate(6.25 2.5)"
                    fill="#8e8e8e"
                  />
                </g>
              </g>
            </g>
          </svg>
          <span data-cy="add-compare-text">
            {AddedToCompare() ? (
              <>{translate("Added To Compare", language)}</>
            ) : (
              translate("Add To Compare", language)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MoreOptionsSection;

"use client";
import { useParams } from "next/navigation";
import auth from "services/auth";
import chat from "services/chat";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";

import { LogError, translateFunction } from "utils/functions";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";

function ShareButton({
  id,
  slug,
  details,
  brand,
  category,
  price,
  name,
  close,
  Image,
}) {
  const {
    shareLoading,
    setShareLoading,
    language,
    selectedContactsForShare,
    setSelectedContactsForShare,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const shareAction = () => {
    try {
      if (selectedContactsForShare.length > 0) {
        const messageShare = {
          product_id: id,
          product_image_url: Image,
          product_name: name,
          product_slug: slug,
          product_description: details,
        };
        setShareLoading(true);
        chat.ShareProduct({
          userId: selectedContactsForShare,
          product: messageShare,
          callback: () => {
            setShareLoading(false);
            setSelectedContactsForShare([]);
            close();
          },
        });

        GAevent({
          action: GA_EVENT_NAMES.SHARE_CONTENT,
          params: {
            content_id: id,
            item_id: id,
            item_name: name,
            user_id_custom: auth.UserID(),
            brand_id: brand.id,
            category: category,
            category_id: category.id,
            brand: brand,
            price: price,
            share_context: "internal",
            shared_from_page: window.location.pathname,
            screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
            screen_path: window.location.pathname,
            method_share: "chat_in_share",
          },
        });
      } else {
        showErrorNotification(
          translate("please select one contact at least", language),
        );
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In shareAction in ShareButton",
      });
      setShareLoading(false);
    }
  };
  return (
    <div
      onClick={() => {
        if (!shareLoading) {
          // Sendevent({
          //   event: "button_clicked",
          //   value: "share_with_chat_button",
          // });
          shareAction();
        }
      }}
      className={`share-button ${shareLoading && "opacity-65"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="20"
        height="20"
        viewBox="0 0 20 20"
      >
        <g
          id="Mask_Group_369"
          data-name="Mask Group 369"
          transform="translate(0 -0.238)"
        >
          <path
            id="send-2"
            d="M16.716,3.123,7.4,6.217c-6.26,2.094-6.26,5.508,0,7.591l2.764.918.918,2.764c2.083,6.261,5.507,6.261,7.591,0l3.1-9.3c1.382-4.177-.887-6.457-5.064-5.064Zm.33,5.549-3.919,3.94a.772.772,0,0,1-1.093,0,.778.778,0,0,1,0-1.093l3.919-3.94a.773.773,0,1,1,1.093,1.093Z"
            transform="translate(-2.708 -2.212)"
            fill="#fff"
          />
        </g>
      </svg>
      <span>{translate("Share", language)}</span>
    </div>
  );
}

export default ShareButton;

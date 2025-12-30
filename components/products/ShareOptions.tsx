"use client";
import React from "react";
import ShareAvatar from "./ShareAvatar";
import "styles/share-options.css";
import {
  EmailIcon,
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { getUserChat, RoundPrice, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import CopyIcon from "public/svg/copyIcon";
import { ShareOptionsPropsType } from "models/componentType/ShareOptionsPropsType";
import { showSuccessNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
import { useParams } from "next/navigation";
function ShareOptions({
  setShareContacts,
  sharedContacts,
  product,
}: ShareOptionsPropsType) {
  const {
    editInfo,
    sharesCount,
    shareLoading,
    user,
    contacts,
    SelectedProduct,
    currency,
  } = useAppStore();
  const params = useParams();

  const [country, language] = (params.lang as string).split("-");

  const shareSocial = async (appName) => {
    try {
      let response = await fetchData({
        url: "/api/v2/elastic/share_product_on_apps",
        reqTitle: REQUESTS_DATA.SHARE_SOCIAL,
        method: "POST",
        server: "chat",
        body: JSON.stringify({
          app_name: appName,
          product_id: product.id,
          shared_count: 1,
        }),
      });
      if (!response.success) {
        throw new Error("");
      }
      GAevent({
        action: GA_EVENT_NAMES.SHARE_CONTENT,
        params: {
          user_id_custom: auth.UserID(),
          content_id: product?.id,
          item_id: product?.id,
          item_name: product?.name,
          brand_id: product?.brand?.id,
          category: product?.category?.name || product?.categories?.[0]?.name,
          category_id: product?.category?.id || product?.categories?.[0]?.id,
          brand: product?.brand?.name,
          price: product?.offer_price,
          share_context: "external",
          screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
          screen_path: window.location.pathname,
          shared_from_page: window.location.pathname,
          method_share: appName,
        },
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }

      editInfo({
        ...SelectedProduct,
        sharesCount: (SelectedProduct?.sharesCount || 0) + 1,
      });
    } catch (err) {
      console.error(err);
    }
  };
  const generateUrlForSharing = (app) => {
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.set("utm_source", app);
    return `${window.location.origin}${
      window.location.pathname
    }?${searchParams.toString()}`;
  };
  return (
    <div className="share-options">
      <div className={`share-avatar`}>
        <div className="share-image social shadow-none">
          <FacebookShareButton
            data-cy="Facebook"
            url={generateUrlForSharing("facebook")}
            beforeOnClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SHARE_WITH_FACEBOOK_BUTTON,
              // });
              shareSocial("Facebook");
            }}
          >
            <FacebookIcon size={70} borderRadius={20} />
          </FacebookShareButton>
        </div>
        <div className="share-name">Facebook</div>
      </div>
      <div className={`share-avatar`} data-cy="Twitter">
        <div className="share-image social shadow-none">
          <TwitterShareButton
            beforeOnClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SHARE_WITH_TWITTER_BUTTON,
              // });
              shareSocial("Twitter");
            }}
            url={generateUrlForSharing("X")}
            title={generateUrlForSharing("X")}
          >
            <TwitterIcon size={70} borderRadius={20} />
          </TwitterShareButton>
        </div>
        <div className="share-name">Twitter / X</div>
      </div>
      <div className={`share-avatar`} data-cy="Whatsapp">
        <div className="share-image social shadow-none">
          <WhatsappShareButton
            beforeOnClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SHARE_WITH_WHATSAPP_BUTTON,
              // });
              shareSocial("WhatsApp");
            }}
            url={generateUrlForSharing("whatsapp")}
          >
            <WhatsappIcon size={70} borderRadius={20} />
          </WhatsappShareButton>
        </div>
        <div className="share-name">WhatsApp</div>
      </div>
      <div className={`share-avatar`} data-cy="Whatsapp">
        <div className="share-image social shadow-none">
          <TelegramShareButton
            beforeOnClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SHARE_WITH_TELEGRAM_BUTTON,
              // });
              shareSocial("Telegram");
            }}
            url={generateUrlForSharing("Telegram")}
          >
            <TelegramIcon size={70} borderRadius={20} />
          </TelegramShareButton>
        </div>
        <div className="share-name">Telegram</div>
      </div>
      <div className={`share-avatar`} data-cy="Whatsapp">
        <div className="share-image social shadow-none">
          <a
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SHARE_WITH_EMAIL_BUTTON,
              // });
              shareSocial("email");
            }}
            href={`https://mail.google.com/mail/?view=cm&fs=1&su=Check%20this%20out&body=${
              product?.name
            } %0A ${generateUrlForSharing("email")}`}
            target="_blank"
          >
            <EmailIcon size={70} borderRadius={20} />
          </a>
        </div>
        <div className="share-name">Gmail</div>
      </div>
      <div className={`share-avatar`}>
        <div
          data-cy="copy_link_button"
          className="share-image social shadow-none flex justify-center items-center bg-[#f8f8e4]"
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.SHARE_WITH_COPY_LINK_BUTTON,
            // });
            if (typeof navigator !== "undefined") {
              navigator.clipboard.writeText(window.location.href).then(() => {
                showSuccessNotification(
                  translateFunction("Link Copied to Clipboard")
                );
              });
            }
          }}
        >
          <CopyIcon />
        </div>
        <div className="share-name">Copy Link</div>
      </div>
      {getUserChat() &&
        user &&
        contacts
          .filter((s) => s.contact_user_id)
          .map((key, i) => (
            <ShareAvatar
              key={i}
              contact={key}
              disable={shareLoading}
              active={sharedContacts.some((s) => s === key.contact_user_id)}
              setActive={() => {
                if (sharedContacts.some((s) => s === key.contact_user_id))
                  setShareContacts([
                    ...sharedContacts.filter((s) => s !== key.contact_user_id),
                  ]);
                else setShareContacts([...sharedContacts, key.contact_user_id]);
              }}
            />
          ))}
    </div>
  );
}

export default ShareOptions;

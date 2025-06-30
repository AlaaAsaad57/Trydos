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
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import CopyIcon from "public/svg/copyIcon.svg";
import { ShareOptionsPropsType } from "models/componentType/ShareOptionsPropsType";
import { showSuccessNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
function ShareOptions({
  setShareContacts,
  sharedContacts,
  product,
}: ShareOptionsPropsType) {
  const { incrementSharesCount, sharesCount, shareLoading, user, contacts } =
    useAppStore();

  const shareSocial = async (appName) => {
    await fetchData({
      url: "/api/v2/elastic/share_product_on_apps",
      reqTitle: "Share Product on Social",
      method: "POST",
      server: "chat",
      body: {
        app_name: appName,
        product_id: product.id,
        shared_count: 1,
      },
    });

    incrementSharesCount();
  };
  return (
    <div className="share-options">
      <div className={`share-avatar`}>
        <div className="share-image social shadow-none">
          <FacebookShareButton
            data-cy="Facebook"
            url={window.location.href}
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
            url={window.location.href}
            title={window.location.href}
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
            url={window.location.href}
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
            url={window.location.href}
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
            href={`https://mail.google.com/mail/?view=cm&fs=1&su=Check%20this%20out&body=${product?.name} %0A ${window.location.href}`}
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
            navigator.clipboard.writeText(window.location.href).then(() => {
              showSuccessNotification(
                translateFunction("Link Copied to Clipboard")
              );
            });
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

import React from "react";
import ShareAvatar from "./ShareAvatar";
import "styles/share-options.css";
import {
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";

import { ProductInterface } from "models/product";
import { getUserChat, Sendevent } from "utils/functions";
import { AxiosPost } from "utils/AxiosApi";
import { useAppStore } from "store";
function ShareOptions({
  setShareContacts,
  sharedContacts,
  product,
}: {
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
  product: ProductInterface;
}) {
  const { incrementSharesCount, sharesCount, shareLoading, user, contacts } =
    useAppStore();

  const shareSocial = async (appName) => {
    await AxiosPost({
      url:
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        "/api/v2/elastic/share_product_on_apps",
      body: {
        app_name: appName,
        product_id: product.id,
        shared_count: sharesCount,
      },
      title: "Share Product on Social",
    });

    incrementSharesCount();
  };
  return (
    <div className="share-options">
      <div className={`share-avatar`} data-cy="Facebook">
        <div className="share-image social shadow-none">
          <FacebookShareButton
            url={window.location.href}
            beforeOnClick={() => {
              Sendevent({
                event: "button_clicked",
                value: "share_with_facebook_button",
              });
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
              Sendevent({
                event: "button_clicked",
                value: "share_with_twiter_button",
              });
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
              Sendevent({
                event: "button_clicked",
                value: "share_with_whatsapp_button",
              });
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
              Sendevent({
                event: "button_clicked",
                value: "share_with_whatsapp_button",
              });
              shareSocial("Telegram");
            }}
            url={window.location.href}
          >
            <TelegramIcon size={70} borderRadius={20} />
          </TelegramShareButton>
        </div>
        <div className="share-name">Telegram</div>
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

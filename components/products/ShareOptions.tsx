import React from "react";
import ShareAvatar from "./ShareAvatar";
import "styles/share-options.css";
import { useDispatch, useSelector } from "react-redux";
import {
  FacebookIcon,
  FacebookShareButton,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import axios from "axios";
import { ProductInterface } from "models/product";
import { Sendevent } from "utils/functions";
function ShareOptions({
  setShareContacts,
  sharedContacts,
  product,
}: {
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
  product: ProductInterface;
}) {
  const sharesCount = useSelector((state: any) => state.details.sharesCount);
  const shareLoading = useSelector((state: any) => state.details.shareLoading);
  const dispatch = useDispatch();
  const shareSocial = async (appName) => {
    await axios.post(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        "/api/v2/elastic/share_product_on_apps",
      { app_name: appName, product_id: product.id, shared_count: sharesCount }
    );
    dispatch({ type: "SHARE-SOCIAL" });
  };
  const contacts = useSelector((state: any) => state.chat.contacts);
  return (
    <div className="share-options">
      {contacts
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
      {window.innerWidth < 550 && (
        <>
          <div className={`share-avatar`}>
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
          <div className={`share-avatar`}>
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
          <div className={`share-avatar`}>
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
        </>
      )}
    </div>
  );
}

export default ShareOptions;

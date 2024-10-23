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
                  shareSocial("WhatsApp");
                }}
                url={window.location.href}
                title={window.location.href}
                separator=":: "
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

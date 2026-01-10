"use client";
import React, { useEffect } from "react";
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

import { showSuccessNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";

function ShareOptions({ product }: any) {
  const {
    setSelectedContactsForShare,
    selectedContactsForShare,
    shareLoading,
    user,
    contacts,
    data,
  } = useAppStore();

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
          category: product?.categories?.[0]?.name,
          category_id: product?.categories?.[0]?.id,
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

      // editInfo({
      //   ...SelectedProduct,
      //   sharesCount: (SelectedProduct?.sharesCount || 0) + 1,
      // });
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

  const getContactsForSharing = () => {
    const currentUserId = getUserChat()?.id;

    // 1. Process existing contacts (already in the correct schema)
    const user_contacts = contacts.filter((s) => Boolean(s.contact_user_id));

    // 2. Process chat data and transform into the contact schema
    const user_chat_contacts = (data || [])
      .map((channel) => {
        // Find the member who is NOT the current user
        const otherMember = channel.channel_members?.find(
          (member) => String(member.user_id) !== String(currentUserId)
        );

        const user = otherMember?.user;

        if (!user) return null;

        // Transform chat user into your specific schema
        return {
          id: user.its_record_in_my_contact?.id || `chat_${user.id}`,
          user_id: String(currentUserId),
          name: user.its_record_in_my_contact?.name || user.name,
          mobile_phone: user.mobile_phone,
          contact_user_id: String(user.id),
          contact_user: {
            ...user,
            id: String(user.id),
            its_record_in_my_contact: user.its_record_in_my_contact || {
              id: null,
              user_id: String(currentUserId),
              name: user.name,
              mobile_phone: user.mobile_phone,
              contact_user_id: String(user.id),
            },
          },
        };
      })
      .filter(Boolean); // Remove nulls where no other member was found

    // 3. Merge and De-duplicate using a Map (Key = contact_user_id)
    // We spread user_chat_contacts first and user_contacts last
    // so that the formal contact list takes priority if duplicates exist.
    const allContactsMap = new Map();

    [...user_chat_contacts, ...user_contacts].forEach((contact) => {
      allContactsMap.set(String(contact.contact_user_id), contact);
    });

    return Array.from(allContactsMap.values()).filter(
      (s) => String(s.contact_user_id) !== String(getUserChat()?.id)
    );
  };
  useEffect(() => {
    console.log(getContactsForSharing());
  }, [contacts]);
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
        getContactsForSharing().map((key, i) => (
          <ShareAvatar
            key={i}
            contact={key}
            disable={shareLoading}
            active={selectedContactsForShare?.some(
              (s) => s === key.contact_user_id
            )}
            setActive={() => {
              if (
                selectedContactsForShare.some((s) => s === key.contact_user_id)
              )
                setSelectedContactsForShare([
                  ...selectedContactsForShare.filter(
                    (s) => s !== key.contact_user_id
                  ),
                ]);
              else
                setSelectedContactsForShare([
                  ...selectedContactsForShare,
                  key.contact_user_id,
                ]);
            }}
          />
        ))}
    </div>
  );
}

export default ShareOptions;

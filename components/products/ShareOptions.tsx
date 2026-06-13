"use client";
import { useEffect, useState } from "react";
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
import { getUserChat, LogError, translateFunction } from "utils/functions";
import { useAppStore } from "store";
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

  // The Web Share API isn't available on every browser (e.g. Firefox
  // desktop). Detect after mount to avoid a hydration mismatch, and only
  // render the native "Share" button where it actually works — elsewhere
  // the explicit network buttons below remain the fallback.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.name,
        url: generateUrlForSharing("native_share"),
      });
      // navigator.share resolves only on a successful share and rejects
      // with AbortError when the user dismisses the sheet, so we count
      // the share here rather than before opening it.
      shareSocial("native_share");
    } catch (err: any) {
      if (err?.name === "AbortError") return; // user cancelled — not an error
      LogError({
        error: err,
        scenario: "Error In nativeShare in ShareOptions",
      });
    }
  };

  const shareSocial = async (appName) => {
    try {
      let response = await fetchData({
        url: "/api/v1/elasticsearch/share_product_on_apps",
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
          boutique_id: product?.boutique_id,
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
      LogError({
        error: err,
        scenario: "Error In shareSocial in ShareOptions",
      });
    }
  };
  const generateUrlForSharing = (app) => {
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.set("utm_source", app);
    return `${window.location.origin}${
      window.location.pathname
    }?${searchParams.toString()}`;
  };

  const shareViaEmail = () => {
    shareSocial("email");

    const subject = product?.name || "Check this out";
    const body = `${product?.name ?? ""}\n\n${generateUrlForSharing("email")}`;

    // On mobile a mail handler (Gmail/Mail/Outlook) is always registered, so
    // mailto: opens the user's chosen mail app. On desktop mailto: silently
    // does nothing when no default mail client is set (the navigation is
    // handed off to the OS and the request just "closes"), so fall back to
    // Gmail's web compose window — something always opens.
    const isMobile =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function";

    if (isMobile) {
      window.location.href = `mailto:?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      return;
    }

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`,
      "_blank",
      "noopener,noreferrer",
    );
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
          (member) => String(member.user_id) !== String(currentUserId),
        );

        const user = otherMember?.user;

        if (!user) return null;

        // Transform chat user into your specific schema
        return {
          id: user.contact_user?.id || `chat_${user.id}`,
          user_id: String(currentUserId),
          name: user.contact_user?.name || user.name,
          mobile_phone: user.mobile_phone,
          contact_user_id: String(user.id),
          contact_user: {
            ...user,
            id: String(user.id),
            contact_user: user.contact_user || {
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
      (s) => String(s.contact_user_id) !== String(getUserChat()?.id),
    );
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
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              shareViaEmail();
            }}
          >
            <EmailIcon size={70} borderRadius={20} />
          </a>
        </div>
        <div className="share-name">{translateFunction("Email")}</div>
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
                  translateFunction("Link Copied to Clipboard"),
                );
              });
            }
          }}
        >
          <img src="/icons/copyIcon.svg" />
        </div>
        <div className="share-name">Copy Link</div>
      </div>
 {canNativeShare && (
        <div className={`share-avatar`} data-cy="NativeShare">
          <div
            className="share-image social shadow-none flex justify-center items-center bg-[#f0f0f0]"
            onClick={nativeShare}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#505050"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <div className="share-name">{translateFunction("More")}</div>
        </div>
      )}
      {getUserChat() &&
        user &&
        getContactsForSharing().map((key, i) => (
          <ShareAvatar
            key={i}
            contact={key}
            disable={shareLoading}
            active={selectedContactsForShare?.some(
              (s) => s === key.contact_user_id,
            )}
            setActive={() => {
              if (
                selectedContactsForShare.some((s) => s === key.contact_user_id)
              )
                setSelectedContactsForShare([
                  ...selectedContactsForShare.filter(
                    (s) => s !== key.contact_user_id,
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

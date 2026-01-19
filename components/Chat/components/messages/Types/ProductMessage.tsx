import React from "react";
import { useAppStore } from "store";
import {
  getConfiguredImage,
  getUserChat,
  translateFunction,
} from "utils/functions";
import ChatPhoto from "../../ChatPhoto";
import NextLink from "components/global/NextLink";
import { isSamePage } from "utils/navigationsUtils";
import { GetImageUrl } from "utils/tinyUtils";
import {
  copyText,
  DeleteMessage,
  getMessageStatus,
  getMessageTime,
} from "store/chat/chatUtils";
import OptionsMenu from "../../OptionsMenu";
import { useParams } from "next/navigation";

function ProductMessage({
  setOpen,
  setDelete,
  openMenu,
  type,
  is_forward,
  message_content,
  isPrivate,
  message_status,
  created_at,
  mid,
  id,
  DeleteModal,
  channel_id,
  channel_member,
  is_from_sender,
  setImg,
  sender_user_id,
}) {
  const user = getUserChat();
  const { setForwardMessage, setReplyMessage, activeChat } = useAppStore();
  const showTextAvatar = React.useMemo(() => {
    if (!activeChat) return false;
    const member = activeChat.channel_members.find(
      (a) => parseInt(a.user_id.toString()) === parseInt(user?.id),
    );
    return (
      (!member?.user?.photo_path || member?.user?.photo_path?.includes("eu")) &&
      !!member?.user?.name
    );
  }, [activeChat, user]);
  const { lang } = useParams();
  return (
    <div
      onMouseLeave={() => {
        setOpen(false);
        setDelete(false);
      }}
      className={"message-hold" + " " + `${openMenu && "ac"}`}
    >
      <div
        onClick={() => setOpen(true)}
        className={
          "message-element-body flex-col message-body message-img-body product-share-message " +
          type
        }
      >
        {is_forward === 1 && (
          <div className="forwarded-message-icon">
            <img src="/icons/chat/forwarded.svg" />
          </div>
        )}

        {(type === "first-chat" || type === "lonely") && (
          <div
            className={
              "absolute-avatar " + `${showTextAvatar && "text-avatar"}`
            }
          >
            <ChatPhoto
              user={channel_member}
              width={30}
              className="abs-avva"
              height={30}
            />
          </div>
        )}
        <div className="flex justify-center z-[9999999999] absolute bottom-[20px] left-0 right-0 mx-auto my-0">
          <NextLink
            className="py-2 px-4 text-center flex justify-center light text-[12px] text-[#1d1d1d] bg-slate-50 rounded-md"
            data={{
              is_product: true,
              slug: JSON.parse(
                !Array.isArray(message_content) && message_content.content,
              )[0].product_slug,
              href: `/${lang}/products/${
                JSON.parse(
                  !Array.isArray(message_content) && message_content.content,
                )[0].product_slug
              }`,
            }}
            href={`/${lang}/products/${
              JSON.parse(
                !Array.isArray(message_content) && message_content.content,
              )[0].product_slug
            }`}
            sameHref={isSamePage(
              `/${lang}/products/${
                JSON.parse(
                  !Array.isArray(message_content) && message_content.content,
                )[0].product_slug
              }`,
            )}
          >
            {translateFunction("View Product")}
          </NextLink>
        </div>
        <img
          alt="user"
          onClick={() =>
            setImg(
              getConfiguredImage({
                src: GetImageUrl(
                  JSON.parse(
                    !Array.isArray(message_content) && message_content.content,
                  )[0].product_image_url,
                ),
                width: 315,
                height: 521,
                q: 80,
              }),
            )
          }
          className="message-img product-share-image w-full min-w-[280px]"
          src={getConfiguredImage({
            src: GetImageUrl(
              JSON.parse(
                !Array.isArray(message_content) && message_content.content,
              )[0].product_image_url,
            ),
            width: 315,
            height: 521,
            q: 80,
          })}
        />
        <span className="product-share-span flex-col px-[10px]">
          {
            JSON.parse(
              !Array.isArray(message_content) && message_content.content,
            )[0].product_name
          }
        </span>
        {is_from_sender ? (
          <div className="message-date">
            {getMessageStatus({
              mid: mid,
              created_at: created_at,
              message_status: message_status,
            })}
          </div>
        ) : (
          <div className="other-date">{getMessageTime(created_at, true)}</div>
        )}
      </div>
      <OptionsMenu
        isPrivate={isPrivate}
        isSender={false}
        message={{
          sender_user_id,
          type,
          is_forward,
          isPrivate,
          message_status,
          created_at,
          mid,
          id,
          message_type: {
            name: "ShareProduct",
          },
          message_content,
        }}
        DeleteModal={DeleteModal}
        setDelete={(e) => setDelete(e)}
        deleteMessage={(e) => DeleteMessage(channel_id, id, e)}
        copy={() =>
          copyText({
            message_content: {
              content:
                window.location.origin +
                `/${lang}/products/${
                  JSON.parse(
                    !Array.isArray(message_content) && message_content.content,
                  )[0].product_slug
                }`,
              is_locked_by_admin_for_delete: 0,
              is_locked_by_admin_for_update: 0,
              message_id: id,
            },
          })
        }
        forward={() =>
          setForwardMessage({
            type,
            is_forward,
            isPrivate,
            message_status,
            created_at,
            mid,
            id,
            message_type: {
              name: "ShareProduct",
            },
            message_content,
          })
        }
        click={() =>
          setReplyMessage({
            type,
            is_forward,
            isPrivate,
            message_status,
            created_at,
            mid,
            id,
            message_type: {
              name: "ShareProduct",
            },
            message_content,
          })
        }
      />
    </div>
  );
}

export default ProductMessage;

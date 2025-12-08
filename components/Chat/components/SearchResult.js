import { useAppStore } from "store";
import { getTwoLetters, getUser } from "../chatsFunctions";
import ProfilePicture from "public/images/profileNo.png";
import { GetImageUrl } from "utils/tinyUtils";
import { translateFunction } from "utils/functions";
import { useState } from "react";

function SearchResult({
  key,
  photo,
  SenderName,
  isUser,
  handleClickChat,
  item,
}) {
  const { setMain, language } = useAppStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleClick = () => {
    if (isUser) {
      setTimeout(() => {
        handleClickChat({
          channel_name: item.name,
          mobile_phone: item.mobile_phone,
          photo_path: item.photo_path,
          channel_members: [
            {
              user_id: item.contact_user_id,
              user: item,
              mute: 0,
              pin: 0,
              archived: 0,
            },
            {
              mute: 0,
              pin: 0,
              archived: 0,
              user_id: getUser()?.id,
              user: getUser(),
            },
          ],
          messages: [],
          id: "ch-" + item.contact_user_id,
          mid: "ch-" + item.contact_user_id,
        });
        setMain("chat");
      }, 500);
    } else {
    }
  };

  const handleInviteClick = () => {
    setShowInviteModal(true);
  };

  const handleSMS = () => {
    const text = `Hey! Join us at ${window.location.origin} \n Get the app: https://play.google.com/store/apps/details?id=your.app.id`;
    window.location.href = `sms:${item.mobile_phone}?body=${text}`;
    setShowInviteModal(false);
  };

  const handleWhatsApp = () => {
    const text = `Hey! Join us at ${window.location.origin} \n Get the app: https://play.google.com/store/apps/details?id=your.app.id`;
    const encodedText = encodeURIComponent(text);
    window.open(
      `https://wa.me/${item.mobile_phone}?text=${encodedText}`,
      "_blank"
    );
    setShowInviteModal(false);
  };
  const isRtl = language === "ar" || language === "ku";
  const handleModalClose = () => {
    setShowInviteModal(false);
  };

  return (
    <div>
      <div
        data-cy="ContactItem"
        className="chat-conversation-item-container"
        key={key}
      >
        {!isUser && (
          <div
            className="chat-activated-options"
            onClick={handleInviteClick}
            style={{
              color: "#388cff",
              fontSize: "16px",
              bottom: "22px",
              cursor: "pointer",
            }}
          >
            {translateFunction("Invite")}
          </div>
        )}
        <div
          className={`chat-conversation-item  ${
            isRtl ? "p-[10px_20px_10px_10px] flex-row-reverse" : "flex-row"
          }  `}
          onClick={() => handleClick()}
        >
          {photo ? (
            <img
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = ProfilePicture;
              }}
              alt=""
              src={photo ? GetImageUrl(photo) : ProfilePicture.src}
            />
          ) : (
            <div className="text-avatar">{getTwoLetters(SenderName)}</div>
          )}
          <div className="chat-info">
            <div className="chat-name">{SenderName}</div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-w-sm mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {translateFunction("Invite")} {SenderName}
              </h3>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-6 text-sm">
              {translateFunction("Choose how to send the invitation")}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z" />
                </svg>
                WhatsApp
              </button>

              <button
                onClick={handleSMS}
                className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
                SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResult;

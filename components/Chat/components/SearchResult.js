import { useAppStore } from "store";
import { getTwoLetters, getUser } from "../chatsFunctions";
import ProfilePicture from "public/images/profileNo.png";
import { GetImageUrl } from "utils/tinyUtils";

function SearchResult({
  key,
  photo,
  SenderName,
  isUser,
  handleClickChat,
  item,
}) {
  const { setMain } = useAppStore();
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
            style={{
              color: "#388cff",
              fontSize: "16px",
              bottom: "22px",
              cursor: "pointer",
            }}
          >
            Invite
          </div>
        )}
        <div
          className={`chat-conversation-item `}
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
    </div>
  );
}

export default SearchResult;

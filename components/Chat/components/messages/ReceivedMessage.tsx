import RepliedMessageWrapper from "./RepliedMessage";

/**
 * The stacking level a row takes while its options menu is open.
 *
 * Just enough to beat its own siblings, which ask for nothing. See the comment
 * on the style below for why it is not a big number.
 */
const MENU_OPEN_LEVEL = 2;

function ReceivedMessage({
  id,
  parent_message,
  message_type,
  children,
  isLonely,
  closeMenu,
  channel_member,
  isDeleted,
  onClick,
  sender_message_id,
  isMenuOpen,
}) {
  return (
    <div
      id={`main-container-${id}`}
      onMouseLeave={() => {
        closeMenu();
      }}
      style={{
        marginTop: !parent_message && `12px`,
        // The option labels of the hover menu hang below this row. Rows are
        // painted in document order, so without this the next message covers
        // them. One row at a time has its menu open, and the scroll list
        // clips the row, so a small level is enough and cannot reach the
        // chat header or the input bar.
        zIndex: isMenuOpen ? MENU_OPEN_LEVEL : undefined,
      }}
      className={`message-container ${
        parent_message && "flex-wrap"
      } message-element ${!parent_message && "mt25"}   ${
        (message_type === "VideoCall" || message_type === "VoiceCall") &&
        " center-align"
      }
      }`}
    >
      {parent_message && (
        <RepliedMessageWrapper
          channel_member={channel_member}
          isDeleted={isDeleted}
          onClick={onClick}
          parent_message={parent_message}
          sender_user_id={sender_message_id}
        />
      )}
      {children}
    </div>
  );
}

export default ReceivedMessage;

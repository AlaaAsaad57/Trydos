import { useEffect, useState } from "react";
import { getChatName, getChatPhoto, showDate } from "../chatsFunctions";
import CallItem from "components/Chat/components/CallItem";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { DeleteMessageApi } from "store/chat/actions";
import { useAppStore } from "store";
import chat, { CALLS_PAGE_SIZE } from "services/chat";
import Skeleton from "react-loading-skeleton";

// The chat backend keeps a deleted call in my_calls, with
// auth_message_status.is_deleted 1.
const isDeletedCall = (call) =>
  Number(call.auth_message_status?.is_deleted) === 1;

function CallList() {
  const {
    calls,
    call_loading,
    deleteMessage,
    deleteCall,
    activeChat,
    data: chats,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  // False once there is nothing older to load. Without it, the end of the log
  // asked again on every scroll and got the same calls back each time.
  const [hasOlder, setHasOlder] = useState(true);
  // True while loadPages runs. It hides the "load older calls" trigger, so a
  // scroll in the middle of a run does not start a second one.
  const [paging, setPaging] = useState(false);
  const init = async () => {
    setLoading(true);
    await loadPages();
    setLoading();
  };
  useEffect(() => {
    init();
  }, [activeChat]);
  const DeleteCall = (id, ch_id) => {
    deleteMessage({ ch_id: ch_id, msg_id: id, bool: false });
    deleteCall(id);
    DeleteMessageApi(id, false);
  };
  const getOldestCallId = (calls) => {
    if (!calls || calls.length === 0) return null;

    const oldestCall = calls.reduce((oldest, current) => {
      // Compare current call date with the "oldest found so far"
      return new Date(current.created_at) < new Date(oldest.created_at)
        ? current
        : oldest;
    });

    return oldestCall.id;
  };
  // Loads a page: the newest calls, or the ones before call `cursor`. The
  // chat backend always sends deleted calls back, so a page can hold only
  // deleted calls. Then it loads the page before it too, and so on, until a
  // page brings a call that is not deleted, or there is nothing older.
  // A short page is the last one. An older page with no call we do not already
  // hold means the chat backend has nothing older either.
  const loadPages = async (cursor) => {
    for (;;) {
      const known = new Set(
        useAppStore.getState().calls.map((c) => String(c.id)),
      );
      const page = await chat.getCalls(cursor);
      if (!Array.isArray(page)) return;
      const fresh = page.filter((c) => !known.has(String(c.id)));
      if (page.length < CALLS_PAGE_SIZE || (cursor && fresh.length === 0)) {
        setHasOlder(false);
        return;
      }
      if (page.some((c) => !isDeletedCall(c))) return;
      cursor = getOldestCallId(useAppStore.getState().calls);
    }
  };
  const loadOlder = async () => {
    setPaging(true);
    await loadPages(getOldestCallId(calls));
    setPaging(false);
  };
  if (loading) {
    return (
      <div className="chat-list-items">
        {[1, 1, 1].map((s, idx) => (
          <div
            key={idx}
            className="call-conversation-item call-item-row"
          >
            <div className="flex grow-0">
              <Skeleton width={55} height={55} borderRadius={12} />
            </div>
            <div className="call-info chat-info">
              <div className="call-name chat-name grow-0">
                <Skeleton width={30} height={10} />
              </div>
              <div className="call-type grow-0">
                <Skeleton width={30} height={10} />
              </div>
            </div>
            <div className="chat-date call-date grow-0">
              <Skeleton width={30} height={10} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  // The chat a call belongs to, with its members. The call record may carry
  // its channel without the members, so the chat from the list fills in.
  const chatOf = (call) =>
    call.channel?.channel_members
      ? call.channel
      : chats?.find((c) => String(c.id) === String(call.channel_id));
  return (
    <div className="chat-list-items">
      {calls
        .slice() // Create a shallow copy to avoid mutating the original array
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((call, index) =>
          // A deleted call gets no name, picture or date: the shopper deleted
          // it to hide them.
          isDeletedCall(call) ? (
            <CallItem key={index} deleted />
          ) : (
            <CallItem
              duration={call.duration_in_seconds}
              key={index}
              Delete={() => {
                DeleteCall(call.id, call.channel_id);
              }}
              photo={getChatPhoto(chatOf(call))}
              name={call.channel?.channel_name || getChatName(chatOf(call))}
              type={{
                type: call.message_type.name,
                sender: call.sender_user_id,
                duration: call.duration_in_seconds,
              }}
              date={showDate(call.created_at)}
            />
          ),
        )}
      {!call_loading && !paging && hasOlder && (
        <InView
          className="inview-calls"
          as="div"
          onChange={(inView) => {
            if (inView && !call_loading && !paging) loadOlder();
          }}
        >
          <span
            style={{
              width: "100%",
              padding: "10px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: 0,
            }}
          >
            loading Calls
          </span>
        </InView>
      )}
      {(call_loading || paging) && (
        <span
          style={{
            width: "100%",
            padding: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spinner />
        </span>
      )}
    </div>
  );
}

export default CallList;

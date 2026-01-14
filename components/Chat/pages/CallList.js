import { useEffect, useState } from "react";
import { showDate } from "../chatsFunctions";
import CallItem from "components/Chat/components/CallItem";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { DeleteMessageApi } from "store/chat/actions";
import { useAppStore } from "store";
import chat from "services/chat";
import Skeleton from "node_modules/react-loading-skeleton/dist";

function CallList() {
  const { calls, call_loading, deleteMessage, deleteCall, activeChat } =
    useAppStore();
  const [loading, setLoading] = useState(true);
  const init = async () => {
    setLoading(true);
    await chat.getCalls();
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
  if (loading) {
    return (
      <div className="chat-list-items">
        {[1, 1, 1].map((s) => (
          <div className={`call-conversation-item ${type} call-item-row `}>
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
  return (
    <div className="chat-list-items">
      {calls
        .slice() // Create a shallow copy to avoid mutating the original array
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((call, index) => (
          <CallItem
            duration={call.duration_in_seconds}
            key={index}
            Delete={() => {
              DeleteCall(call.id, call.channel_id);
            }}
            photo={call.channel.photo_path}
            name={call.channel.channel_name}
            type={{
              type: call.message_type.name,
              sender: call.sender_user_id,
              duration: call.duration_in_seconds,
            }}
            date={showDate(call.created_at)}
          />
        ))}
      {!call_loading && (
        <InView
          className="inview-calls"
          as="div"
          onChange={(inView, entry) => {
            if (inView && !call_loading) {
              const oldestId = getOldestCallId(calls);
              chat.getCalls(oldestId);
            }
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
      {call_loading && (
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

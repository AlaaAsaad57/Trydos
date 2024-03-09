import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMessageTime, showDate } from "../chatsFunctions";
import CallItem from "components/Chat/components/CallItem";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { DeleteMessageApi, getCalls } from "store/chat/actions";

function CallList() {
  const calls = useSelector((state) => state.chat.calls);
  const call_loading = useSelector((state) => state.chat.call_loading);
  const dispatch = useDispatch();
  useEffect(() => {
    getCalls();
  }, []);
  const DeleteCall = (id, ch_id) => {
    dispatch({
      type: "DELETE_MESSAGE",
      payload: { ch_id: ch_id, msg_id: id, bool: false },
    });
    dispatch({ type: "DELETE_CALL", payload: id });
    DeleteMessageApi(id, false);
  };
  return (
    <div className="chat-list-items">
      {calls.map((call, index) => (
        <CallItem
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
              getCalls(calls[calls.length - 1].id);
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

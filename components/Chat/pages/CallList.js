import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { getMessageTime, showDate } from "../chatsFunctions";
import CallItem from "components/Chat/components/CallItem";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { getCalls } from "store/chat/actions";

function CallList() {
  const calls = useSelector((state) => state.chat.calls);
  const call_loading = useSelector((state) => state.chat.call_loading);
  useEffect(() => {
    getCalls();
  }, []);
  return (
    <div className="chat-list-items">
      {calls.map((call, index) => (
        <CallItem
          key={index}
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
            console.log("view");
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

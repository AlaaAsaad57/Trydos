import React from "react";
import { useSelector } from "react-redux";
import { getMessageTime, showDate } from "../chatsFunctions";
import CallItem from "components/Chat/components/CallItem";

function CallList() {
  const calls = useSelector((state) => state.chat.calls);
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
    </div>
  );
}

export default CallList;

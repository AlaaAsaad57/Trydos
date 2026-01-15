import React from "react";
import SendMessage from "./SentMessage";

function MessageContainer({ is_sender }) {
  if (is_sender) {
    return <SendMessage></SendMessage>;
  }
  return <div>MessageContainer</div>;
}

export default MessageContainer;

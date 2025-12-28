import React, { useState } from "react";

function BuyersCommentsModal({ children, offset }) {
  const [commentsNodes, setCommentNodes] = useState(children);
  const [offsetValue, setOffsetValue] = useState(offset);

  return <div>BuyersCommentsModal</div>;
}

export default BuyersCommentsModal;

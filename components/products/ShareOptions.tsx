import React from "react";
import ShareAvatar from "./ShareAvatar";
import "styles/share-options.css";
function ShareOptions({
  setShareContacts,
  sharedContacts,
}: {
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
}) {
  return (
    <div className="share-options">
      {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((key, i) => (
        <ShareAvatar
          key={i}
          active={sharedContacts.some((s) => s === i)}
          setActive={() => {
            if (sharedContacts.some((s) => s === i))
              setShareContacts([...sharedContacts.filter((s) => s !== i)]);
            else setShareContacts([...sharedContacts, i]);
          }}
        />
      ))}
    </div>
  );
}

export default ShareOptions;

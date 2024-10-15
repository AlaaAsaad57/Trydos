import React from "react";
import ShareAvatar from "./ShareAvatar";
import "styles/share-options.css";
import { useSelector } from "react-redux";
function ShareOptions({
  setShareContacts,
  sharedContacts,
}: {
  sharedContacts: Array<number>;
  setShareContacts: (e: Array<number>) => void;
}) {
  const contacts = useSelector((state: any) => state.chat.contacts);
  return (
    <div className="share-options">
      {contacts
        .filter((s) => s.contact_user_id)
        .map((key, i) => (
          <ShareAvatar
            key={i}
            contact={key}
            active={sharedContacts.some((s) => s === key.contact_user_id)}
            setActive={() => {
              if (sharedContacts.some((s) => s === key.contact_user_id))
                setShareContacts([
                  ...sharedContacts.filter((s) => s !== key.contact_user_id),
                ]);
              else setShareContacts([...sharedContacts, key.contact_user_id]);
            }}
          />
        ))}
    </div>
  );
}

export default ShareOptions;

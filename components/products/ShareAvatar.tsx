import Image from "next/image";
import React from "react";
import profilePng from "public/images/profileNo.png";

function ShareAvatar({
  active,
  setActive,
  contact,
  disable,
}: {
  active: boolean;
  setActive: () => void;
  contact: any;
  disable: boolean;
}) {
  return (
    <div
      className={`share-avatar ${active && "selected"} ${
        disable && "opacity-50"
      }`}
      onClick={() => {
        if (!disable) setActive();
      }}
    >
      <div className="share-image">
        <Image
          width={70}
          height={80}
          alt="Omar"
          src={contact.contact_user?.photo_path ?? profilePng}
          unoptimized
        />
      </div>
      <div className="share-name">
        {contact?.name ?? contact?.contact_user?.name ?? contact?.mobile_phone}
      </div>
      <div className="selected-share">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19.477"
          height="19.472"
          viewBox="0 0 19.477 19.472"
        >
          <path
            id="send-2"
            d="M16.716,3.123,7.4,6.217c-6.26,2.094-6.26,5.508,0,7.591l2.764.918.918,2.764c2.083,6.261,5.507,6.261,7.591,0l3.1-9.3c1.382-4.177-.887-6.457-5.064-5.064Zm.33,5.549-3.919,3.94a.772.772,0,0,1-1.093,0,.778.778,0,0,1,0-1.093l3.919-3.94a.773.773,0,1,1,1.093,1.093Z"
            transform="translate(-2.708 -2.714)"
            fill="#0859d9"
          />
        </svg>
      </div>
    </div>
  );
}

export default ShareAvatar;

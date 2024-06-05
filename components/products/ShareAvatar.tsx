import Image from "next/image";
import React from "react";

function ShareAvatar({
  active,
  setActive,
}: {
  active: boolean;
  setActive: () => void;
}) {
  return (
    <div
      className={`share-avatar ${active && "selected"}`}
      onClick={() => setActive()}
    >
      <div className="share-image">
        <Image
          width={70}
          height={80}
          alt="Omar"
          src="https://res.cloudinary.com/dtcmozf4d/image/upload/h_100/f_avif/q_100/v1/product/thumbnail/2024-05-12-663fce81803c3.png"
          unoptimized
        />
      </div>
      <div className="share-name">Omar</div>
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

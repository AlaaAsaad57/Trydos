import Image from "next/image";
import React from "react";
import { getTwoLetters } from "../chatsFunctions";
import profile from "public/images/profileNo.png";
import { GetImageUrl } from "utils/tinyUtils";

function ChatPhoto({
  user,
  className,
  width = 30,
  height = 30,
}: {
  user: any;
  className?: string;
  width?: number;
  height?: number;
}) {
  if (user?.photo_path)
    return (
      <Image
        src={GetImageUrl(user.photo_path)}
        alt=""
        width={width}
        height={height}
        className={
          className +
          " rounded-[10px] object-cover object-center w-[" +
          width +
          "px] h-[" +
          height +
          "px]"
        }
      />
    );
  if (user?.name?.length > 1)
    return (
      <div className={`text-avatar w-[${width}px] h-[${height}px]`}>
        {getTwoLetters(user.name)}
      </div>
    );
  else
    return (
      <Image
        src={profile}
        alt="user-photo"
        width={width}
        height={height}
        className="rounded-[10px]"
      />
    );
}

export default ChatPhoto;

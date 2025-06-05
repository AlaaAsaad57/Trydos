import Image from "next/image";
import React from "react";
import { getTwoLetters } from "../chatsFunctions";
import profile from "public/images/profileNo.png";

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
        src={
          user.photo_path?.includes("http")
            ? user.photo_path
            : process.env.NEXT_PUBLIC_CLOUDINARY_URL + user.photo_path
        }
        alt=""
        width={width}
        height={height}
        className={className + " object-cover object-center"}
      />
    );
  if (user.name?.length > 1)
    return (
      <div className={`text-avatar w-[${width}px] h-[${height}px]`}>
        {getTwoLetters(user.name)}
      </div>
    );
  else return <Image src={profile} alt="user-photo" />;
}

export default ChatPhoto;

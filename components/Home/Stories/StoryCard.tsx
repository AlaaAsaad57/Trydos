import Image from "next/image";
import React from "react";
import StoryServiceClass from "services/story";

export default function StoryCard({ Name, media, isVideo }) {
  return (
    <>
      <div className="absolute top-0 left-0 w-[100px] h-[150px] rounded-[20px] z-[5] bg-[linear-gradient(180deg,#00000000_0%,#000_181%)]" />
      <div className="absolute bottom-[2px] left-0 right-0 mx-auto w-[81px] block text-center text-[12px] regular text-white z-[12] whitespace-nowrap  text-ellipsis tracking-[0.003em]  items-center justify-center overflow-hidden">
        {Name}
      </div>

      <div
        className="relative w-[100px] h-[150px] rounded-[20px] flex"
        style={{ display: "flex" }}
      >
        <Image
          className="thumb-img object-cover object-center flex w-[100px] h-[150px] rounded-[20px] z-[2]"
          alt="story"
          width={100}
          height={160}
          priority={true}
          loading="eager"
          //   onError={(e) => {
          //     e.currentTarget.src = pngErr.src;
          //     e.currentTarget.onerror = null;
          //   }}
          src={StoryServiceClass.getThumb(media, isVideo)}
        />
      </div>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { getMedia } from "../../../store/chat/actions";
import filePng from "../../../public/images/filePng.png";
import Image from "next/image";
function MediaContainer({ id, mediaFiles }) {
  const [media, setMedia] = useState("ImageMessage");
  useEffect(() => {
    getMedia(id, media);
  }, [media]);
  return (
    <div className="media-container">
      <div className="media-tabs text-[#1d1d1d]">
        <div
          onClick={() => setMedia("ImageMessage")}
          className={
            "media-tab " + (media === "ImageMessage" && "active-tab-media")
          }
        >
          Image
        </div>
        <div
          onClick={() => setMedia("VideoMessage")}
          className={
            "media-tab " + (media === "VideoMessage" && "active-tab-media")
          }
        >
          Video
        </div>
        <div
          onClick={() => setMedia("FileMessage")}
          className={
            "media-tab " + (media === "FileMessage" && "active-tab-media")
          }
        >
          File
        </div>
      </div>
      <div className="media-tab-container gap-y-[5px]">
        {media === "ImageMessage" &&
          mediaFiles?.image_messages.map((image, index) => (
            <a
              href={image.message_files[0]?.file_path}
              target="_blank"
              key={index}
            >
              <Image
                className="max-h-full"
                src={image.message_files[0]?.file_path}
                width={100}
                height={130}
                alt="Image"
              />
            </a>
          ))}
        {media === "VideoMessage" &&
          mediaFiles?.video_messages.map((image, index) => (
            <a
              key={index}
              href={image.message_files[0]?.file_path}
              target="_blank"
            >
              <video
                className="max-h-full"
                autoPlay={false}
                src={image.message_files[0]?.file_path}
                width={100}
                height={130}
              ></video>
            </a>
          ))}
        {media === "FileMessage" &&
          mediaFiles?.file_messages.map((image, index) => (
            <a
              key={index}
              href={image.message_files[0]?.file_path}
              target="_blank"
            >
              <Image
                className="max-h-full"
                src={filePng}
                width={100}
                height={130}
                alt="Image"
              />
            </a>
          ))}
      </div>
    </div>
  );
}

export default MediaContainer;

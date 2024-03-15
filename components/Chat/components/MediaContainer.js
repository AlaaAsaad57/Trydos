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
      <div className="media-tabs">
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
      <div className="media-tab-container">
        {media === "ImageMessage" &&
          mediaFiles.image_messages.map((image) => (
            <a href={image.message_files[0]?.file_path} target="_blank">
              <Image
                src={image.message_files[0]?.file_path}
                width={100}
                height={130}
              />
            </a>
          ))}
        {media === "VideoMessage" &&
          mediaFiles.video_messages.map((image) => (
            <a href={image.message_files[0]?.file_path} target="_blank">
              <video
                autoPlay={false}
                src={image.message_files[0]?.file_path}
                width={100}
                height={130}
              ></video>
            </a>
          ))}
        {media === "FileMessage" &&
          mediaFiles.file_messages.map((image) => (
            <a href={image.message_files[0]?.file_path} target="_blank">
              <Image src={filePng} width={100} height={130} />
            </a>
          ))}
      </div>
    </div>
  );
}

export default MediaContainer;

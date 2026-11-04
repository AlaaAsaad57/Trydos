import { useEffect, useState } from "react";
import { getMedia } from "../../../store/chat/actions";
import { translateFunction } from "utils/functions";
import filePng from "../../../public/images/filePng.png";
import Image from "next/image";
import { downloadFile } from "components/Chat/downloadFile";
// A tap on a photo or a video opens the same full-screen viewer the chat uses
// (`onOpenImage` / `onOpenVideo`). A tap on a file saves it on the user's
// machine, the same as the file bubble in the chat.
//
// Both callbacks are optional. The component calls them with `?.`.
/**
 * @param {object} props
 * @param {any} props.id
 * @param {any} props.mediaFiles
 * @param {(filePath: string) => void} [props.onOpenImage]
 * @param {(filePath: string) => void} [props.onOpenVideo]
 */
function MediaContainer({ id, mediaFiles, onOpenImage, onOpenVideo }) {
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
          {translateFunction("Image")}
        </div>
        <div
          onClick={() => setMedia("VideoMessage")}
          className={
            "media-tab " + (media === "VideoMessage" && "active-tab-media")
          }
        >
          {translateFunction("Video")}
        </div>
        <div
          onClick={() => setMedia("FileMessage")}
          className={
            "media-tab " + (media === "FileMessage" && "active-tab-media")
          }
        >
          {translateFunction("File")}
        </div>
      </div>
      <div className="media-tab-container gap-y-[5px]">
        {media === "ImageMessage" &&
          mediaFiles?.image_messages?.map((image, index) => (
            <a
              href={image.message_files[0]?.file_path}
              key={index}
              data-pw="media-image"
              onClick={(e) => {
                e.preventDefault();
                onOpenImage?.(image.message_files[0]?.file_path);
              }}
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
          mediaFiles?.video_messages?.map((image, index) => (
            <a
              key={index}
              href={image.message_files[0]?.file_path}
              data-pw="media-video"
              onClick={(e) => {
                e.preventDefault();
                onOpenVideo?.(image.message_files[0]?.file_path);
              }}
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
          mediaFiles?.file_messages?.map((image, index) => (
            <a
              key={index}
              href={image.message_files[0]?.file_path}
              download
              data-pw="media-file"
              onClick={(e) => {
                e.preventDefault();
                downloadFile(image.message_files[0]?.file_path);
              }}
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

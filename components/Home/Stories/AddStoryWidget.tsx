"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAppStore } from "store";
import NewStoryModal from "./CameraStory";
import { dataURLtoFile } from "components/Chat/chatsFunctions";

// Icons
const CameraIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z"
      fill="currentColor"
    />
    <path
      d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
      fill="currentColor"
    />
  </svg>
);

const FileIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"
      fill="currentColor"
    />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z"
      fill="currentColor"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
      fill="currentColor"
    />
  </svg>
);

const PlaceholderIcon = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM15 15V13H13V15H11V13H9V11H11V9H13V11H15V9H17V11H19V13H17V15H15Z"
      fill="currentColor"
    />
  </svg>
);

interface AddStoryWidgetProps {
  onClose: () => void;
  selectMedia: ({ media, link }) => void;
}

const isValidUrl = (urlString: string) => {
  if (!urlString) return true;
  try {
    // Add https:// if no protocol is specified
    const url =
      urlString.startsWith("http://") || urlString.startsWith("https://")
        ? urlString
        : `https://${urlString}`;
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export default function AddStoryWidget({
  onClose,
  selectMedia,
}: AddStoryWidgetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const { setOpenCamera, OpenCamera } = useAppStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    // TODO: Integrate with existing camera component
    setOpenCamera(true);
    // onClose();
  };

  const handleFileClick = () => {
    document.querySelector<HTMLInputElement>("#stories-input-holder").click();
  };

  const handleClearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    // Reset file input value
    const fileInput = document.querySelector<HTMLInputElement>(
      "#stories-input-holder"
    );
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLink(value);

    if (value && !isValidUrl(value)) {
      setLinkError(
        "Please enter a valid URL (e.g., example.com or www.example.com)"
      );
    } else {
      setLinkError("");
    }
  };

  const handleShareStory = () => {
    if (link && !isValidUrl(link)) {
      setLinkError(
        "Please enter a valid URL (e.g., example.com or www.example.com)"
      );
      return;
    }
    // Add https:// if no protocol is specified
    const finalLink =
      link && !link.startsWith("http://") && !link.startsWith("https://")
        ? `https://${link}`
        : link;
    selectMedia({ media: selectedFile, link: finalLink });
    setPreview(null);
    setSelectedFile(null);
    onClose();
  };

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    // @ts-ignore
    document.querySelector(".stories-bar-container").style.zIndex =
      "999999999999999";
    return () => {
      document.documentElement.style.overflow = "auto";
      // @ts-ignore
      document.querySelector(".stories-bar-container").style.zIndex = "1";
    };
  }, []);

  return (
    <>
      {OpenCamera && (
        <NewStoryModal
          send={(e) => {
            let a = dataURLtoFile(
              e,
              "image-story" + parseInt((Math.random() * 1000).toString())
            );

            // @ts-ignore
            handleFileSelect({ target: { files: [a] } });
          }}
          HandleUploadedVideo={(e) => {
            //   HandleUploadedVideo({ target: { files: [a] } });
          }}
          close={() => {
            setOpenCamera(false);
            document.body.style.overflow = "scroll";
          }}
        />
      )}
      <div className="fixed top-[-130px] left-0 w-screen h-screen text-[#5d5d5d] regular z-[999999999] bg-white rounded-t-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Story</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex h-[calc(100vh-100px)]">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center border-r border-gray-200 pr-4">
            {preview ? (
              <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
                <button
                  onClick={handleClearPreview}
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <PlaceholderIcon />
                <p className="mt-2">No media selected</p>
              </div>
            )}
          </div>

          {/* Options Area */}
          <div className="w-64 pl-4 flex flex-col gap-4 items-start">
            <button
              onClick={handleCameraClick}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <CameraIcon />
              <span>Take Photo</span>
            </button>

            <button
              onClick={handleFileClick}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <FileIcon />
              <span>Upload Phoro/Video</span>
            </button>

            <div className="flex items-center gap-3 p-3">
              <LinkIcon />
              <div className="flex-1">
                <input
                  type="url"
                  value={link}
                  onChange={handleLinkChange}
                  placeholder="Add link..."
                  className={`w-full outline-none ${
                    linkError ? "border-b border-red-500" : ""
                  }`}
                />
                {linkError && (
                  <p className="text-red-500 text-sm mt-1">{linkError}</p>
                )}
              </div>
            </div>

            {preview && (
              <button
                onClick={handleShareStory}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 mt-auto disabled:bg-blue-200"
                disabled={link && !isValidUrl(link)}
              >
                Share Story
              </button>
            )}
          </div>
        </div>

        <input
          id="stories-input-holder"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            handleFileSelect(e);
          }}
          className="hidden"
        />
      </div>
    </>
  );
}

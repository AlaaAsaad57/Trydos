"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAppStore } from "store";
import NewStoryModal from "./CameraStory";
import { dataURLtoFile } from "components/Chat/chatsFunctions";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";
import { getUserStories, LogError, translateFunction } from "utils/functions";
import StoryServiceClass from "services/story";
import { DisableScroll, EnableScroll, pollinateInput } from "@/utils/tinyUtils";
import Spinner from "components/global/Spinner";
import SearchParamUpdater from "components/global/ParamsUpdater";
import { fetchStoriesForUser } from "serverRequests";
import { ImageCropWidget } from "components/global/ImageCropWidget";

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

// New: Validate link for host and coupon
const validateLink = (urlString: string) => {
  if (!urlString) return { valid: true, error: "" };
  if (!isValidUrl(urlString)) {
    return {
      valid: false,
      error: translateFunction(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
    };
  }
  try {
    const url =
      urlString.startsWith("http://") || urlString.startsWith("https://")
        ? urlString
        : `https://${urlString}`;
    if (url?.split(".")?.length < 2) {
      return {
        valid: false,
        error: translateFunction(
          "Please enter a valid URL (e.g., example.com or www.example.com)",
        ),
      };
    }

    const parsed = new URL(url);

    return { valid: true, error: "" };
  } catch {
    return {
      valid: false,
      error: translateFunction(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
    };
  }
};

export default function AddStoryWidget() {
  useEffect(() => {
    getUserStories();
  }, []);
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<File | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const {
    setOpenCamera,
    OpenCamera,
    cameraPermissions,
    checkCameraPermissions,
    setAddStory,
    addStoryEnable,
    setStoryData,
    setStoriesRefreshing,
  } = useAppStore();
  const [uploaded, setUpload] = useState(-1);
  const [isSelected, setIsSelected] = useState(null);
  const [file, setFile] = useState(null);
  const { lang }: { lang: string } = useParams();
  const [country, language] = lang.split("-");
  const [loading, setLoading] = useState(false);
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleChange = async (e, link) => {
    const file = e.target.files[0];
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      showErrorNotification(
        translateFunction(
          `File size should not exceed ${MAX_FILE_SIZE_MB} MB`,
          language,
        ),
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (file?.type.includes("video")) {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(e.target.files[0]);
          reader.onload = async () => {
            setFile(e.target.files[0]);
            setIsSelected(reader.result);
            var videoElement: HTMLVideoElement =
              document.createElement("video");
            videoElement.src = reader.result.toString();
            var timer = setInterval(async function () {
              if (videoElement.readyState === 4) {
                let getTime = videoElement.duration;
                if (getTime > 59) {
                  showErrorNotification(
                    translateFunction("1 minutes video only"),
                  );

                  setFile(null);
                  setIsSelected(null);
                  clearInterval(timer);
                  return;
                } else {
                  clearInterval(timer);

                  let path = await StoryServiceClass.upload(
                    e.target.files[0],
                    (e) => setUpload(e),
                    1,
                    () => {
                      setIsSelected(null);
                      setFile(null);
                    },
                    link,
                  )
                    .then((data) => {
                      resolve(true);
                    })
                    .catch((e) => {
                      // Sendevent({
                      //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
                      //   value: GA_PROGRAMMING_EVENT_VALUES.UPLOAD_STORY_FAILED,
                      // });
                      LogError({
                        error: e,
                        scenario: "Upload Video Story",
                      });
                      setUpload(0);
                      setLoading(false);
                      showErrorNotification(
                        translateFunction("Upload Failed Try Again"),
                      );
                    });
                  setIsSelected(null);
                  setFile(null);
                  setUpload(0);
                }

                clearInterval(timer);
              }
            }, 500);
          };
        });
        let storiesData = await fetchStoriesForUser(language, country, 1);
        setStoriesRefreshing(true);
        router.refresh();

        setStoryData(storiesData.data);
        showSuccessNotification("Story Uploaded");
        setPreview(null);
        setFile(null);
        setSelectedFile(null);
        setLoading(false);
        setLink("");
        onClose();
      } else if (file?.type.includes("image")) {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(e.target.files[0]);
          reader.onload = async () => {
            setIsSelected(reader.result);
            let path = await StoryServiceClass.upload(
              e.target.files[0],
              (e) => setUpload(e),
              0,
              () => {},
              link,
            )
              .then((data) => {
                resolve(true);
              })
              .catch((e) => {
                LogError({
                  error: e,
                  scenario: "Upload Image Story",
                });
                setUpload(0);
                setLoading(false);
                showErrorNotification(
                  translateFunction("Upload Failed Try Again"),
                );
              });
            setIsSelected(null);
            setFile(null);
            setUpload(0);
          };
        });
        let storiesData = await fetchStoriesForUser(language, country, 1);
        setStoriesRefreshing(true);
        router.refresh();
        setStoryData(storiesData.data);
        showSuccessNotification("Story Uploaded");
        setPreview(null);
        setFile(null);
        setSelectedFile(null);
        setLoading(false);
        setLink("");
        onClose();
      }
      setTimeout(() => {
        setStoriesRefreshing(false);
      }, 6000);
    } catch (error) {
      setStoriesRefreshing(false);
      LogError({
        error: error,
        scenario: "Upload Image Story",
      });
      showErrorNotification("Error Uploading Story");
    }
  };
  const selectMedia = async ({ imageFile, link }) => {
    handleChange({ target: { files: [imageFile] } }, link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      showErrorNotification(
        translateFunction("SVG Images Not Allowed", language),
      );
      e.target.value = ""; // reset input
      return;
    }
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErrorNotification(
        translateFunction(
          `File size should not exceed ${MAX_FILE_SIZE_MB} MB`,
          language,
        ),
      );
      e.target.value = "";
      return;
    }

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      if (file.type.startsWith("image/")) {
        setImageToEdit(file);
        setShowImageEditor(true);
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditedImageSave = (editedImage: File) => {
    setSelectedFile(editedImage);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setShowImageEditor(false);
      setImageToEdit(null);
    };
    reader.readAsDataURL(editedImage);
  };

  const closeImageEditor = () => {
    setShowImageEditor(false);
    setImageToEdit(null);
    const fileInput = document.querySelector<HTMLInputElement>(
      "#stories-input-holder",
    );
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const onClose = () => {
    setLoading(false);
    setIsSelected(null);
    setFile(null);
    setUpload(-1);
    setLink("");
    setLinkError(null);
    setOpenCamera(false);
    setShowImageEditor(false);
    setImageToEdit(null);
    setSelectedFile(null);
    setPreview(null);
    setAddStory(null);
    setStoriesRefreshing(false);
  };
  const handleCameraClick = async () => {
    if (cameraPermissions === "revoked") {
      checkCameraPermissions();
      showErrorNotification(
        translateFunction(
          "Please enable camera permissions to use camera features",
        ),
      );
      return;
    }
    if (cameraPermissions === "asked") {
      await checkCameraPermissions();
    }
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.CHOOSE_CAMERA_FOR_ADD_STORY,
    // });

    // TODO: Integrate with existing camera component
    setOpenCamera(true);
    // onClose();
  };

  const handleFileClick = () => {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.CHOOSE_GALLERY_FOR_ADD_STORY,
    // });
    document.querySelector<HTMLInputElement>("#stories-input-holder").click();
  };

  const handleClearPreview = () => {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.CLEAR_MEDIA_SELECTION_FOR_ADD_STORY,
    // });
    setPreview(null);
    setSelectedFile(null);
    // Reset file input value
    const fileInput = document.querySelector<HTMLInputElement>(
      "#stories-input-holder",
    );
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always sanitize the value before setting state
    const sanitized = pollinateInput(e.target.value);
    setLink(sanitized);
    const { valid, error } = validateLink(sanitized);
    setLinkError(error);
  };

  const handleShareStory = () => {
    const { valid, error } = validateLink(link);
    if (!valid) {
      setLinkError(error);
      return;
    }
    // Add https:// if no protocol is specified
    const finalLink =
      link && !link.startsWith("http://") && !link.startsWith("https://")
        ? `https://${link}`
        : link;
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.CONFIRM_UPLOAD_STORY_BUTTON,
    // });
    selectMedia({ imageFile: selectedFile, link: finalLink });
  };

  useEffect(() => {
    if (addStoryEnable) {
      DisableScroll();
    }
    return () => {
      EnableScroll();
    };
  }, [addStoryEnable]);
  if (!addStoryEnable) return <></>;
  return (
    <>
      {showImageEditor && imageToEdit && (
        <ImageCropWidget
          image={imageToEdit}
          onSave={handleEditedImageSave}
          onClose={closeImageEditor}
        />
      )}
      <SearchParamUpdater searchKey="StoryModal" searchValue="true" />
      {OpenCamera && (
        <NewStoryModal
          send={(e) => {
            let a = dataURLtoFile(
              e,
              "image-story" + parseInt((Math.random() * 1000).toString()),
            );

            // @ts-ignore
            handleFileSelect({ target: { files: [a] } });
          }}
          HandleUploadedVideo={(videoFile) => {
            // Convert to a pseudo ChangeEvent target structure expected by handleFileSelect
            handleFileSelect({ target: { files: [videoFile] } } as any);
          }}
          close={() => {
            setOpenCamera(false);
            document.body.style.overflow = "scroll";
          }}
        />
      )}
      <div className="fixed top-0 left-0 w-screen h-screen text-[#5d5d5d] regular z-999999999 bg-white rounded-t-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {translateFunction("Add Story")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <CloseIcon />
          </button>
        </div>

        <div
          className={`${
            loading && "opacity-70 scale-90 origin-center"
          } flex h-[calc(100vh-250px)] max-w-[1250px]`}
        >
          {/* Preview Area */}
          <div className="flex-1 flex items-center w-1/2 justify-center border-r border-gray-200 pr-4">
            {preview ? (
              <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
                {preview?.includes("video") ? (
                  <video
                    controls={false}
                    className="object-contain"
                    src={preview}
                  ></video>
                ) : (
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                )}
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
                <p className="mt-2">{translateFunction("No media selected")}</p>
              </div>
            )}
          </div>

          {/* Options Area */}
          <div className=" pl-4 w-1/2 flex flex-col gap-4 items-start">
            <button
              onClick={handleCameraClick}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                cameraPermissions !== "revoked"
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "opacity-50 cursor-not-allowed bg-gray-50"
              }`}
            >
              <CameraIcon />
              <span>{translateFunction("Take Photo")}</span>
            </button>

            <button
              data-cy="Gallery-Photo-Option"
              onClick={handleFileClick}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <FileIcon />
              <span>{translateFunction("Upload Photo/Video")}</span>
            </button>

            <div className="flex items-center gap-3 p-3">
              <LinkIcon />
              <div className="flex-1">
                <input
                  type="url"
                  value={link}
                  data-cy="link-story-input"
                  onChange={handleLinkChange}
                  onBlur={() => {
                    // On blur, re-sanitize and update state in case of paste or autofill
                    const sanitized = pollinateInput(link);
                    if (link !== sanitized) setLink(sanitized);
                    if (sanitized?.length > 0) {
                      // Sendevent({
                      //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
                      //   value: GA_PROGRAMMING_EVENT_VALUES.ADD_LINK_TO_STORY,
                      // });
                    }
                  }}
                  placeholder={translateFunction("Add link...")}
                  className={`w-full outline-hidden ${
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
                data-cy="share-story-button"
                className="w-full bg-blue-500 text-white flex justify-center items-center py-2 rounded-lg hover:bg-blue-600 mt-auto disabled:bg-blue-200"
                disabled={!!linkError || (link && !isValidUrl(link)) || loading}
              >
                {loading ? <Spinner /> : translateFunction("Share Story")}
              </button>
            )}
          </div>
        </div>

        <input
          id="stories-input-holder"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.3gp,.avi"
          onChange={(e) => {
            handleFileSelect(e);
          }}
          className="hidden"
        />
      </div>
    </>
  );
}

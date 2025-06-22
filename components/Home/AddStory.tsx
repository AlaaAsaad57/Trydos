"use client";
import StoryService from "services/story";
import { useState } from "react";
const CircularProgressbarComponent = dynamic(() => import("./Progress"), {
  ssr: false,
});
import PlusIcon from "public/svg/chatplus.svg";
import { AddStoryAction } from "store/homepage/actions";
import { revalidateStories } from "utils/serverActions";
import dynamic from "next/dynamic";

import { useAppStore } from "store";
import AddStoryWidget from "./Stories/AddStoryWidget";
import { fetchStories } from "Server Requests";
import { useParams } from "next/navigation";
import { UnAuthintacetedAction } from "utils/tinyUtils";

function AddStory() {
  const { user, setNameModal, addStoryEnable, setAddStory } = useAppStore();
  const [uploaded, setUpload] = useState(0);
  const [isSelected, setIsSelected] = useState(null);
  const [file, setFile] = useState(null);
  const { lang }: { lang: string } = useParams();
  const [language, country] = lang.split("-");
  const handleChange = async (e, link) => {
    const { toast } = await import("react-toastify");
    if (e.target.files[0]?.type.includes("video")) {
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = async () => {
          setFile(e.target.files[0]);
          setIsSelected(reader.result);
          var videoElement: HTMLVideoElement = document.createElement("video");
          videoElement.src = reader.result.toString();
          var timer = setInterval(async function () {
            if (videoElement.readyState === 4) {
              let getTime = videoElement.duration;
              if (getTime > 59) {
                toast.error("1 minutes video only");
                setFile(null);
                setIsSelected(null);
                clearInterval(timer);
                return;
              } else {
                clearInterval(timer);

                let path = await StoryService.upload(
                  e.target.files[0],
                  (e) => setUpload(e),
                  1,
                  () => {
                    setIsSelected(null);
                    setFile(null);
                  },
                  link
                )
                  .then((data) => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
                    //   value: GA_PROGRAMMING_EVENT_VALUES.UPLOAD_STORY_SUCCESS,
                    // });

                    AddStoryAction(data);
                  })
                  .catch((e) => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
                    //   value: GA_PROGRAMMING_EVENT_VALUES.UPLOAD_STORY_FAILED,
                    // });

                    setFile(null);
                    setIsSelected(null);
                    setUpload(0);
                    if (e?.status === 401) {
                      UnAuthintacetedAction();
                    } else {
                      toast.error("Upload Failed Try Again");
                    }
                    toast.error("Upload Failed Try Again");
                  });
                setIsSelected(path);

                setFile(e.target.files[0]);

                setIsSelected(null);
                setFile(null);
                revalidateStories();
                let stories = await fetchStories(
                  language,
                  country,
                  1,
                  JSON.parse(localStorage.getItem("USER-STORIES"))?.access_token
                );
                setUpload(0);
              }

              clearInterval(timer);
            }
          }, 500);
        };
      });
    } else if (e.target.files[0]?.type.includes("image")) {
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = async () => {
          setIsSelected(reader.result);

          let path = await StoryService.upload(
            e.target.files[0],
            (e) => setUpload(e),
            0,
            () => {},
            link
          )
            .then((data) => {
              AddStoryAction(data);
            })
            .catch((e) => {
              setUpload(0);
              setFile(null);
              setIsSelected(null);
              if (e?.status === 401) {
                UnAuthintacetedAction();
              } else {
                toast.error("Upload Failed Try Again");
              }
            });
          setIsSelected(path);
          setFile(e.target.files[0]);

          setIsSelected(null);
          setFile(null);
          revalidateStories();
          setUpload(0);
        };
      });
    }
  };
  // const HandleUploadedVideo = async (e) => {
  //   if (e.target.files[0]?.type.includes("video")) {
  //     new Promise((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.readAsDataURL(e.target.files[0]);
  //       reader.onload = async () => {
  //         setFile(e.target.files[0]);
  //         setIsSelected(reader.result);
  //         let path = await StoryService.upload(
  //           e.target.files[0],
  //           (e: any) => setUpload(e),
  //           1,

  //           () => {
  //             setIsSelected(null);
  //             setFile(null);
  //           }
  //         )
  //           .then((data) => {
  //             AddStoryAction(data);
  //           })
  //           .catch((e) => {
  //             setFile(null);
  //             setIsSelected(null);

  //             toast.error("Upload Failed Try Again");
  //           });
  //         setIsSelected(path);
  //         setFile(e.target.files[0]);

  //         setIsSelected(null);
  //         setFile(null);
  //         revalidateStories();
  //       };
  //     });
  //   }
  // };
  const selectMedia = async ({ imageFile, link }) => {
    handleChange({ target: { files: [imageFile] } }, link);
  };

  if (user)
    return (
      <>
        {addStoryEnable && (
          <AddStoryWidget
            selectMedia={({ media, link }) => {
              selectMedia({ imageFile: media, link: link });
            }}
            onClose={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.CLOSE_ADD_STORY_WIDGET_BUTTON,
              // });
              setAddStory(false);
            }}
          />
        )}
        <div
          data-cy="Add-Story-Button"
          className="story-element-container add-story-container flex align-center justify-center ml-[20px]"
          style={{
            borderRadius: "20px",
            animation: "none",
            backgroundColor: !isSelected && "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => {
            if (JSON.parse(localStorage.getItem("USER"))?.name?.length > 1) {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.UPLOAD_STORY_BUTTON,
              // });
              setAddStory(true);
            } else {
              setNameModal(true);
            }
          }}
        >
          {isSelected ? (
            <>
              {uploaded > 0 && (
                <div
                  className="progress-container"
                  style={{
                    borderRadius: "20px",
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    zIndex: "20",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgressbarComponent
                    strokeWidth={2}
                    value={uploaded}
                    text={`${uploaded} %`}
                  />
                </div>
              )}
              {file?.type?.includes("video") ? (
                <video
                  style={{
                    borderRadius: "20px",
                    objectFit: "cover",
                    height: "100%",
                  }}
                  src={isSelected}
                />
              ) : (
                <img
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    borderRadius: "20px",
                  }}
                  className="thumb-img"
                  alt="story"
                  src={isSelected}
                />
              )}
            </>
          ) : (
            <>
              <PlusIcon />
            </>
          )}
        </div>
      </>
    );
  else return <></>;
}

export default AddStory;

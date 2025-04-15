"use client";
import StoryService from "services/story";
import { useState } from "react";
const CircularProgressbarComponent = dynamic(() => import("./Progress"), {
  ssr: false,
});
import PlusIcon from "public/svg/chatplus.svg";
import { useDispatch, useSelector } from "react-redux";
import { AddStoryAction } from "store/homepage/actions";
import { revalidateStories } from "utils/serverActions";
const NewStoryModal = dynamic(() => import("./Stories/CameraStory"), {
  ssr: false,
});
import { dataURLtoFile } from "components/Chat/chatsFunctions";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { Sendevent, translateFunction } from "utils/functions";

function AddStory() {
  const [uploaded, setUpload] = useState(0);
  const user = useSelector((state: StateInterface) => state.auth.user);
  const language: string = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const [openMenu, setOpenMenu] = useState(false);
  const OpenCamera = useSelector(
    (state: StateInterface) => state.homepage.OpenCamera
  );
  const setOpenCamera = (value: boolean) => {
    if (value) {
      // @ts-ignore
      document.querySelector(".stories-bar-container").style.zIndex =
        "999999999999999999999999";
      // @ts-ignore
      document.querySelector(".stories-bars").classList.add("overflow-visible");
      dispatch({ type: "OPEN_CAMERA", payload: value });
    } else {
      // @ts-ignore
      document.querySelector(".stories-bar-container").style.zIndex =
        "99999999";
      // @ts-ignore
      document
        .querySelector(".stories-bars")
        .classList.remove("overflow-visible");
      dispatch({ type: "OPEN_CAMERA", payload: value });
    }
  };
  const [isSelected, setIsSelected] = useState(null);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();
  const handleChange = async (e: any) => {
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
                Sendevent({
                  event: "button_clicked",
                  value: "confirm_upload_story_button",
                });
                let path = await StoryService.upload(
                  e.target.files[0],
                  (e) => setUpload(e),
                  1,
                  () => {
                    setIsSelected(null);
                    setFile(null);
                  }
                )
                  .then((data) => {
                    Sendevent({
                      event: "programming_event",
                      value: "upload_story_success",
                    });

                    dispatch(AddStoryAction(data));
                  })
                  .catch((e) => {
                    Sendevent({
                      event: "programming_event",
                      value: "upload_story_failed",
                    });

                    setFile(null);
                    setIsSelected(null);

                    toast.error("Upload Failed Try Again");
                  });
                setIsSelected(path);

                setFile(e.target.files[0]);

                setIsSelected(null);
                setFile(null);
                revalidateStories();
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
            () => {}
          ).then((data) => {
            dispatch(AddStoryAction(data));
          });
          setIsSelected(path);
          setFile(e.target.files[0]);

          setIsSelected(null);
          setFile(null);
          revalidateStories();
        };
      });
    }
  };
  const HandleUploadedVideo = async (e) => {
    if (e.target.files[0]?.type.includes("video")) {
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = async () => {
          setFile(e.target.files[0]);
          setIsSelected(reader.result);
          let path = await StoryService.upload(
            e.target.files[0],
            (e: any) => setUpload(e),
            1,
            () => {
              setIsSelected(null);
              setFile(null);
            }
          )
            .then((data) => {
              dispatch(AddStoryAction(data));
            })
            .catch((e) => {
              setFile(null);
              setIsSelected(null);

              toast.error("Upload Failed Try Again");
            });
          setIsSelected(path);
          setFile(e.target.files[0]);

          setIsSelected(null);
          setFile(null);
          revalidateStories();
        };
      });
    }
  };
  const sendStory = async (imageFile) => {
    let a = dataURLtoFile(
      imageFile,
      "image-story" + parseInt((Math.random() * 1000).toString())
    );
    handleChange({ target: { files: [a] } });
  };
  if (user)
    return (
      <>
        {OpenCamera && (
          <NewStoryModal
            send={(e) => {
              sendStory(e);
            }}
            HandleUploadedVideo={(e) => {
              let a = dataURLtoFile(
                e,
                "image-story" + parseInt((Math.random() * 1000).toString())
              );
              HandleUploadedVideo({ target: { files: [a] } });
            }}
            close={() => {
              setOpenCamera(false);
              document.body.style.overflow = "scroll";
            }}
          />
        )}
        {openMenu && (
          <div
            className={`lang-modalDisable addStory-modal ${openMenu && "open"}`}
            onClick={() => setOpenMenu(false)}
          >
            <div
              className="file-picker"
              style={{
                width: "150px",
                height: "auto",
                backgroundColor: "#FAFAFA",
                position: "absolute",
                top: "200px",
                overflow: "hidden",
                left: "20px",

                zIndex: 999999,
                borderRadius: "15px",
              }}
            >
              <div
                className="menuItem"
                style={{
                  width: "100%",
                  borderTopRightRadius: "15px",
                  borderTopLeftRadius: "15px",
                  padding: "10px",
                  cursor: "pointer",
                  textAlign: "center",
                  border: "#00000029 1px solid",
                }}
                onClick={(e) => {
                  setOpenCamera(true);
                  Sendevent({
                    event: "button_clicked",
                    value: "upload_camera_button",
                  });
                  document.body.style.overflow = "hidden";
                }}
              >
                {translateFunction("From Camera")}
              </div>
              <div
                className="menuItem"
                data-cy="Gallery-Photo-Option"
                style={{
                  width: "100%",
                  borderBottomRightRadius: "15px",
                  cursor: "pointer",
                  borderBottomLeftRadius: "15px",
                  padding: "10px",
                  textAlign: "center",
                  border: "#00000029 1px solid",
                }}
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "upload_gallery_button",
                  });

                  if (!isSelected) {
                    let Image = document.createElement("input");
                    Image.onblur = () => {};
                    Image["data-cy"] = "Input-Story-File";
                    Image.onchange = async (e) => {
                      handleChange(e);
                    };
                    Image.type = "file";
                    Image.hidden = true;
                    Image.accept =
                      "image/*;capture=camera,video/*;capture=camera";
                    Image.style.position = "absolute";
                    Image.style.position = "0";
                    let i = document.body.appendChild(Image);
                    i.click();
                  }
                }}
              >
                {translateFunction("From Files")}
              </div>
            </div>
          </div>
        )}
        <div
          data-cy="Add-Story-Button"
          className="story-element-container add-story-container flex align-center justify-center"
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
              Sendevent({
                event: "button_clicked",
                value: "upload_story_button",
              });
              setOpenMenu(true);
            } else dispatch({ type: "SHOW-MODAL", payload: true });
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

"use client";
import { upload } from "store/homepage/actions";
import React, { useState } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import PlusIcon from "public/svg/chatplus.svg";
import { useDispatch, useSelector } from "react-redux";
import { AddStoryAction } from "store/homepage/actions";
import { revalidateStories } from "utils/serverActions";
import NewStoryModal from "./Stories/CameraStory";
import { dataURLtoFile } from "components/Chat/chatsFunctions";

function AddStory() {
  const [uploaded, setUpload] = useState(0);
  const language = useSelector((state) => state.homepage.language);
  const [openMenu, setOpenMenu] = useState(false);
  const [OpenCamera, setOpenCamera] = useState(false);
  const [isSelected, setIsSelected] = useState(null);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();
  const handleChange = async (e) => {
    const { toast } = await import("react-toastify");
    if (e.target.files[0]?.type.includes("video")) {
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = async () => {
          setFile(e.target.files[0]);
          setIsSelected(reader.result);
          var videoElement = document.createElement("video");
          videoElement.src = reader.result;
          var timer = setInterval(async function () {
            if (videoElement.readyState === 4) {
              let getTime = videoElement.duration;
              if (getTime > 59) {
                dispatch({ type: "enableNotifications" });

                toast.error("1 minutes video only");
                setFile(null);
                setIsSelected(null);
                clearInterval(timer);
                return;
              } else {
                clearInterval(timer);
                let path = await upload(
                  e.target.files[0],
                  (e) => setUpload(e),
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
                    dispatch({ type: "enableNotifications" });

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
          let path = await upload(
            e.target.files[0],
            (e) => setUpload(e),
            0,
            () => {}
          ).then((data) => {
            dispatch(AddStoryAction(data));
          });
          console.log(path);
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
          let path = await upload(
            e.target.files[0],
            (e) => setUpload(e),
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
              dispatch({ type: "enableNotifications" });
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
      "image-story" + parseInt(Math.random() * 1000)
    );
    handleChange({ target: { files: [a] } });
  };
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
              "image-story" + parseInt(Math.random() * 1000)
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
          className={`lang-modalDisable ${openMenu && "open"}`}
          onClick={() => setOpenMenu(false)}
          style={{
            width: "100vw",
            height: "100vh",
            maxWidth: "1365px",
            top: "-113px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="file-picker"
            style={{
              width: "150px",
              height: "auto",
              backgroundColor: "#FAFAFA",
              position: "absolute",
              top: "263px",
              overflow: "hidden",
              left: language !== "ar" ? "22px" : "initial",
              right: language !== "ar" ? "initial" : "22px",
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
                document.body.style.overflow = "hidden";
              }}
            >
              From Camera
            </div>
            <div
              className="menuItem"
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
                if (!isSelected) {
                  let Image = document.createElement("input");
                  Image.onblur = () => {};
                  Image.onchange = async (e) => {
                    handleChange(e);
                  };
                  Image.type = "file";
                  Image.hidden = true;
                  Image.accept =
                    "image/*;capture=camera,video/*;capture=camera";
                  Image.style = { position: "absolute", opacity: "0" };
                  let i = document.body.appendChild(Image);
                  i.click();
                }
              }}
            >
              From Files
            </div>
          </div>
        </div>
      )}
      <div
        className="story-element-container"
        style={{
          borderRadius: "20px",
          animation: "none",
          backgroundColor: !isSelected && "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          setOpenMenu(true);
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
                <CircularProgressbar
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
}

export default AddStory;

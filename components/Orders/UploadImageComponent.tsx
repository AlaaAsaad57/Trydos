"use client";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Image from "next/image";
import { showErrorNotification } from "store/notifications/reducer";
import { LogError, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";

import { ImageCropWidget } from "components/global/ImageCropWidget";
import order from "services/order";
import CustomPopup from "components/global/Popup";

const UploadImageComponent = ({
  images,
  setImages,
  loading,
  setLoading,
  removeImageAction,
  isForRating = false,
}) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasTwoCameras, setHasTwoCameras] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<File | null>(null);
  const [showCropWidget, setShowCropWidget] = useState(false);
  const webcamRef = useRef(null);
  const streamRef = useRef(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for multiple cameras
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator?.mediaDevices?.enumerateDevices();
        const cameras = devices?.filter((dev) => dev?.kind === "videoinput");
        setHasTwoCameras(cameras && cameras.length >= 2);
      } catch (error) {
        console.error("Error checking cameras:", error);
      }
    };
    checkCameras();
  }, []);

  // Close menu when clicking outside

  // FILE UPLOAD HANDLER
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        setShowMenu(false);
        setImageToCrop(file);
        setShowCropWidget(true);
        e.target.value = "";
      }
    } catch (error) {
      showErrorNotification(
        translateFunction("Failed To Upload Image..Try Again"),
      );
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // CAMERA HANDLERS
  const onUserMedia = (stream: MediaStream) => {
    streamRef.current = stream;
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const uploadCroppedImage = async (croppedImageFile: File) => {
    setShowCropWidget(false);
    setCameraOpen(false);
    try {
      setLoading(true);
      let data;
      if (isForRating)
        data = await order.UploadImageForRating({ image: croppedImageFile });
      else
        data = await order.UploadImageForOrderReturn({
          image: croppedImageFile,
        });

      setImages([...images, data.sub_path]);
      setShowCropWidget(false);
      setImageToCrop(null);
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In handleFileUpload in UploadImageComponent",
      });
      setLoading(false);
      showErrorNotification(
        translateFunction("Failed To Upload Image..Try Again"),
      );
    }
  };

  const uploadCameraPhoto = async () => {
    if (!capturedImage) return;

    try {
      // Convert base64 to blob
      const blob = await fetch(capturedImage, {
        credentials: "omit",
      }).then((res) => res.blob());
      const file = new File([blob], `camera-${Date.now()}.webp`, {
        type: "image/webp",
      });

      setImageToCrop(file);
      setShowCropWidget(true);
      setCapturedImage(null);
    } catch (error) {
      showErrorNotification(
        translateFunction("Failed To Upload Image..Try Again"),
      );
    }
  };

  const stopAllStreams = () => {
    if (webcamRef.current?.stream) {
      webcamRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const closeCamera = () => {
    stopAllStreams();
    setCameraOpen(false);
    setCapturedImage(null);
    setFacingMode("user");
  };

  useEffect(() => {
    return () => stopAllStreams();
  }, []);

  const GetImageUrl = (img: string) => {
    let url_file_path = isForRating
      ? "/rating_orders/"
      : "/return_request_products/";
    if (img.includes(process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL)) return img;
    else
      return process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + url_file_path + img;
  };

  const removeImage = async (e: React.MouseEvent, i: string) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (loading) return;
      await removeImageAction(i);
      setImages(images.filter((im) => im !== i));
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In removeImage in UploadImageComponent",
      });
      showErrorNotification(
        translateFunction("Failed To Remove Image..Try Again"),
      );
    }
  };

  // IMAGE CROP WIDGET
  if (showCropWidget && imageToCrop) {
    return (
      <ImageCropWidget
        image={imageToCrop}
        onSave={uploadCroppedImage}
        onClose={() => {
          setShowCropWidget(false);
          setImageToCrop(null);
        }}
      />
    );
  }

  // CAMERA VIEW WITH PREVIEW
  if (cameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        {capturedImage ? (
          <>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                fill
                sizes="100vw"
                className="object-contain"
                alt="captured"
                src={capturedImage}
              />
            </div>
            <div className="fixed bottom-[20px] left-0 right-0 flex items-center justify-around px-[20px]">
              <button
                className="w-[50px] h-[50px] cursor-pointer rounded-full bg-[#dddddd] p-[10px] flex items-center justify-center shadow-[0_3px_6px_#0000002a]"
                onClick={() => setCapturedImage(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.362 4.431A9 9 0 0 0 3.172 12.066M3.639 19.571A9 9 0 0 0 20.83 11.945"></path>
                </svg>
              </button>
              <button
                className="w-[50px] h-[50px] cursor-pointer rounded-full bg-[#402CDD] p-[10px] flex items-center justify-center shadow-[0_3px_6px_#0000002a] disabled:opacity-50"
                onClick={uploadCameraPhoto}
                disabled={loading}
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
              <button
                className="w-[50px] h-[50px] cursor-pointer rounded-full bg-[#FF6B6B] p-[10px] flex items-center justify-center shadow-[0_3px_6px_#0000002a]"
                onClick={() => setCapturedImage(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/webp"
              width={430}
              height={400}
              onUserMedia={onUserMedia}
              videoConstraints={{
                width: 430,
                height: 400,
                facingMode: { ideal: facingMode },
              }}
              className="w-full h-full object-contain"
            />
            <div className="fixed bottom-[20px] left-0 right-0 flex items-center justify-around px-[20px]">
              <button
                className="w-[50px] h-[50px] cursor-pointer rounded-full bg-[#dddddd] p-[10px] flex items-center justify-center shadow-[0_3px_6px_#0000002a]"
                onClick={closeCamera}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>

              {hasTwoCameras && (
                <button
                  className="w-[50px] h-[50px] cursor-pointer rounded-full bg-[#dddddd] p-[10px] flex items-center justify-center shadow-[0_3px_6px_#0000002a] hover:scale-110 transition-transform"
                  onClick={flipCamera}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="2"
                  >
                    <path d="M1 4v6h6M23 20v-6h-6"></path>
                    <path d="M20.354 15.354A9 9 0 0 0 5.646 8.646"></path>
                  </svg>
                </button>
              )}

              <button
                className="w-[50px] h-[50px] cursor-pointer rounded-full bg-[#dddddd] p-[10px] flex items-center justify-center shadow-[0_3px_6px_#0000002a] hover:scale-110 transition-transform"
                onClick={capturePhoto}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#555"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6" fill="#555"></circle>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // NORMAL UPLOAD VIEW
  return (
    <>
      {showMenu && (
        <>
          <CustomPopup
            modalTitle={translateFunction(
              "chosse an image or video from camera or files",
            )}
            close={() => setShowMenu(false)}
            options={[
              {
                render: () => <>{translateFunction("files")}</>,
                onClick: triggerFileInput,
              },
              {
                render: () => <>{translateFunction("camera")}</>,
                onClick: () => setCameraOpen(true),
              },
            ]}
          />
        </>
      )}
      <div className="flex-col w-full items-center mt-[12px] px-[24px]">
        <input
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          type="file"
          className="hidden"
          data-cy="return-modal-file-input"
        />

        <div
          key={showMenu ? "1" : "2"}
          style={{
            border: images.length === 0 ? "1px solid #402CDD80" : "none",
          }}
          onClick={() => {
            setShowMenu(!showMenu);
          }}
          className={`${
            images.length === 0 ? "justify-center" : "justify-between pr-[12px]"
          } flex-row w-full items-center justify-center bg-[#F8F8F8] rounded-[12px] h-[80px] cursor-pointer relative`}
        >
          {!loading && images.length > 0 && (
            <div className="flex-row gap-[3px]">
              {images.map((s, i) => (
                <div
                  key={i}
                  className="flex-row items-center justify-center cursor-pointer order-return-item-image relative"
                >
                  <div
                    onClick={(e) => {
                      removeImage(e, s);
                    }}
                    style={{
                      padding: "5px",
                      width: "25px",
                      fontSize: "12px",
                      height: "25px",
                      boxShadow: "#0000006e 0px 3px 6px",
                    }}
                    className="absolute top-[-5px] right-[-5px] z-40 cursor-pointer rounded-full bg-white text-red-500 light flex justify-center items-center hover:bg-red-100"
                  >
                    X
                  </div>
                  <img
                    className="rounded-[12px] object-cover h-[80px] w-[57px]"
                    src={GetImageUrl(s)}
                    alt="image"
                    width={57}
                    height={80}
                  />
                  <span
                    style={{
                      boxShadow: "inset 0px 3px 6px #ffffff80",
                      border: "1px solid #ffffff80",
                    }}
                    className="absolute w-[57px] h-[80px] rounded-[12px]"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex-col items-center justify-center gap-[8px] relative">
            {loading ? (
              <div className="px-[30px] flex w-full items-center justify-center">
                {<Spinner />}
              </div>
            ) : (
              <>
                <button className="w-full flex flex-col items-center justify-center gap-[4px]">
                  <img src="/icons/UploadImageOrder.svg" />
                  {images.length === 0 && (
                    <span className="text-[#402CDD] text-[10px] regular">
                      {translateFunction("Add Photo")}
                    </span>
                  )}
                </button>

                {/* POPUP MENU */}
              </>
            )}
          </div>
        </div>
        {!isForRating && images.length === 0 && (
          <div className="flex-row w-full text-center items-center justify-center mt-[12px] text-[#402CDD] text-[10px] regular">
            {translateFunction(
              "Please Add Photos Of The Product You Received So That We Can Provide You With The Best Service To Avoid This Issue.",
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UploadImageComponent;

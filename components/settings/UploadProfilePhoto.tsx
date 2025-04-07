import React, { useState } from "react";
import SettingTopBar from "./TopBar";

function UploadProfilePhoto({
  swipeToScreen,
  goBack,
}: {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}) {
  return (
    <div className="flex-col">
      <SettingTopBar
        goBack={() => goBack()}
        screenName="Profile"
        Save={() => {
          goBack();
        }}
      />
      <div className="flex-row justify-center mt-[12px] px-[12px]">
        <ProfilePicture photo={null} />
      </div>
    </div>
  );
}

export default UploadProfilePhoto;
const ProfilePicture = ({ photo }: { photo?: string }) => {
  const [file, setFile] = useState(photo);
  const [isUploading, setIsUploading] = useState(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const UploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Simulate file upload delay
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setFile(objectUrl);

      // Cleanup object URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      UploadFile(file);
    }
  };

  const [imageAdjustment, setImageAdjustment] = useState({
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  const handleImageAdjust = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageAdjustment.isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const touch = "touches" in e ? e.touches[0] : e;
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    const deltaX = currentX - imageAdjustment.lastX;
    const deltaY = currentY - imageAdjustment.lastY;

    setImageAdjustment((prev) => {
      const newX = prev.x + deltaX;
      const newY = prev.y + deltaY;

      return {
        ...prev,
        x: newX,
        y: newY,
        lastX: currentX,
        lastY: currentY,
      };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setImageAdjustment((prev) => ({
      ...prev,
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    setImageAdjustment((prev) => ({
      ...prev,
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
    }));
  };

  const handleMouseUp = () => {
    setImageAdjustment((prev) => ({ ...prev, isDragging: false }));
  };

  const handleTouchEnd = () => {
    setImageAdjustment((prev) => ({ ...prev, isDragging: false }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use requestAnimationFrame for smoother zooming
    requestAnimationFrame(() => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;

      // Calculate new scale
      const newScale = Math.min(Math.max(imageAdjustment.scale * delta, 1), 3);

      // If zooming out, adjust position to maintain center
      if (newScale < imageAdjustment.scale) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const maxX = (rect.width * (newScale - 1)) / 2;
        const maxY = (rect.height * (newScale - 1)) / 2;

        setImageAdjustment((prev) => ({
          ...prev,
          scale: newScale,
          x: Math.min(Math.max(prev.x, -maxX), maxX),
          y: Math.min(Math.max(prev.y, -maxY), maxY),
        }));
      } else {
        setImageAdjustment((prev) => ({
          ...prev,
          scale: newScale,
        }));
      }
    });
  };

  const getAdjustedImage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        ctx.save();
        ctx.translate(imageAdjustment.x, imageAdjustment.y);
        ctx.scale(imageAdjustment.scale, imageAdjustment.scale);
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Log the adjusted image data
        console.log("Adjusted Image Data:", canvas.toDataURL());
      }
    };

    if (selectedFile) {
      img.src = URL.createObjectURL(selectedFile);
    }
  };

  const openCamera = () => {
    // Check if mobile using userAgent
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const container = document.createElement("div");
    const captureBtn = document.createElement("button");
    const CancelButton = document.createElement("button");

    CancelButton.style.position = "absolute";
    CancelButton.style.top = "30px";
    CancelButton.style.right = "15px";
    CancelButton.style.zIndex = "30";
    CancelButton.onclick = () => {
      container.remove();
    };
    CancelButton.innerHTML = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z"/></svg>`;
    container.appendChild(CancelButton);
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "100%";
    container.style.height = "405px";

    container.style.backgroundColor = "#F8f8f8";
    container.style.zIndex = "9999";

    video.style.maxWidth = "100%";
    video.style.height = "405px";

    video.style.margin = "20px auto";
    video.style.objectFit = "cover";
    video.style.display = "block";
    video.style.marginTop = "0px";
    video.style.width = "100%";
    captureBtn.style.width = "50px";
    captureBtn.style.position = "absolute";
    captureBtn.style.bottom = "10px";
    captureBtn.style.right = "0";
    captureBtn.style.left = "0";
    captureBtn.style.display = "flex";
    captureBtn.style.justifyContent = "center";
    captureBtn.style.alignItems = "center";
    captureBtn.style.height = "50px";
    captureBtn.style.borderRadius = "50px";
    captureBtn.style.backgroundColor = "#f8f8f8";
    captureBtn.style.margin = "10px auto";
    captureBtn.innerHTML = `<svg id="_15x15" data-name="15x15" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="15" height="15" viewBox="0 0 15 15">
  <g id="Mask_Group_316" data-name="Mask Group 316" >
    <g id="Mask_Group_272" data-name="Mask Group 272" >
      <g id="photo-camera" transform="translate(0 -29.091)">
        <g id="Group_3488" data-name="Group 3488" transform="translate(0 30.089)">
          <path id="Path_14690" data-name="Path 14690" d="M14.411,32.675A1.927,1.927,0,0,0,13,32.089H11.25l-.4-1.062a1.451,1.451,0,0,0-.543-.658,1.392,1.392,0,0,0-.809-.278h-4a1.391,1.391,0,0,0-.809.277,1.451,1.451,0,0,0-.543.658l-.4,1.062H2a1.927,1.927,0,0,0-1.414.586A1.927,1.927,0,0,0,0,34.092v7a1.927,1.927,0,0,0,.586,1.414A1.927,1.927,0,0,0,2,43.092H13a2,2,0,0,0,2-2v-7a1.927,1.927,0,0,0-.59-1.417ZM9.969,40.062A3.371,3.371,0,0,1,7.5,41.09a3.37,3.37,0,0,1-2.475-1.027,3.489,3.489,0,0,1,0-4.945A3.371,3.371,0,0,1,7.5,34.089a3.37,3.37,0,0,1,2.47,1.028,3.489,3.489,0,0,1,0,4.945Z" transform="translate(0 -30.089)" fill="#8e8d92"/>
          <path id="Path_14691" data-name="Path 14691" d="M160.237,188.081a2.254,2.254,0,1,0,1.59.658A2.167,2.167,0,0,0,160.237,188.081Z" transform="translate(-152.738 -182.833)" fill="#8e8d92"/>
        </g>
      </g>
    </g>
  </g>
</svg>
`;

    container.appendChild(video);
    container.appendChild(captureBtn);
    document.querySelector("#camera-photo-holder").appendChild(container);

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.play();

        captureBtn.onclick = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            const file = new File([blob], "photo.jpg", {
              type: "image/jpeg",
            });
            setSelectedFile(file);
            // Cleanup
            stream.getTracks().forEach((track) => track.stop());
            container.remove();
          }, "image/jpeg");
        };
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        container.remove();
      });
  };

  return (
    <div className="flex flex-col w-full">
      <input
        onChange={handleFileChange}
        type="file"
        hidden
        id="profile-file-picker"
        accept="images/*"
      />
      <div
        id="camera-photo-holder"
        onClick={() => {}}
        className={`${
          !selectedFile && "items-center justify-center"
        } w-full relative h-[406px] rounded-[22px] bg-[#f8f8f8] flex overflow-hidden`}
        style={{
          filter: "drop-shadow(0px 3px 6px #0000002a)",
        }}
      >
        {!selectedFile && (
          <>
            {isUploading ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                className="animate-[bounce_.7s_infinite]"
              >
                <path
                  id="Path_23072"
                  data-name="Path 23072"
                  d="M10,0A10,10,0,1,1,0,10,10,10,0,0,1,10,0Z"
                  fill="#402cdd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="104"
                height="64.999"
                viewBox="0 0 104 64.999"
              >
                <path
                  id="Path_23092"
                  data-name="Path 23092"
                  d="M24.9-21.206a2.544,2.544,0,0,1,1.95,1.032,4.042,4.042,0,0,1,.879,2.715,4.086,4.086,0,0,1-2.256,3.479,9.372,9.372,0,0,1-5.085,1.415A14.825,14.825,0,0,1,12.4-14.591q-3.25-2.026-3.25-8.6V-44.3H5.632a4.15,4.15,0,0,1-3.059-1.224A4.15,4.15,0,0,1,1.35-48.582a3.933,3.933,0,0,1,1.224-2.944,4.221,4.221,0,0,1,3.059-1.185H9.15v-4.894a4.516,4.516,0,0,1,1.338-3.326,4.516,4.516,0,0,1,3.326-1.338,4.3,4.3,0,0,1,3.212,1.338,4.586,4.586,0,0,1,1.3,3.326v4.894h5.429a4.15,4.15,0,0,1,3.059,1.224,4.15,4.15,0,0,1,1.224,3.059,3.933,3.933,0,0,1-1.224,2.944A4.221,4.221,0,0,1,23.756-44.3H18.326v20.723a2.926,2.926,0,0,0,.841,2.332,3.392,3.392,0,0,0,2.294.726,6.562,6.562,0,0,0,1.682-.306A4.569,4.569,0,0,1,24.9-21.206ZM58.091-54.241a5.848,5.848,0,0,1,3.862,1.3,3.876,3.876,0,0,1,1.568,3.059A4.737,4.737,0,0,1,62.3-46.326a4.034,4.034,0,0,1-2.906,1.185,7.63,7.63,0,0,1-2.6-.535q-.229-.076-1.032-.306a6.238,6.238,0,0,0-1.721-.229,6.8,6.8,0,0,0-3.824,1.224,8.927,8.927,0,0,0-3.021,3.709,13.655,13.655,0,0,0-1.185,5.926v18.123a4.586,4.586,0,0,1-1.3,3.326,4.39,4.39,0,0,1-3.288,1.338A4.39,4.39,0,0,1,38.132-13.9a4.586,4.586,0,0,1-1.3-3.326V-48.811a4.586,4.586,0,0,1,1.3-3.326,4.39,4.39,0,0,1,3.288-1.338,4.39,4.39,0,0,1,3.288,1.338,4.586,4.586,0,0,1,1.3,3.326v.994A11.585,11.585,0,0,1,51.056-52.6,15.517,15.517,0,0,1,58.091-54.241Zm42.67.765a4.39,4.39,0,0,1,3.288,1.338,4.586,4.586,0,0,1,1.3,3.326v32.5q0,9.941-5.353,14.491T85.7,2.729a34.687,34.687,0,0,1-5.315-.421,19.936,19.936,0,0,1-4.4-1.109Q72.238-.406,72.238-3.235a3.928,3.928,0,0,1,.229-1.224,4.74,4.74,0,0,1,1.568-2.562A3.8,3.8,0,0,1,76.444-7.9a4.564,4.564,0,0,1,1.453.229q.535.229,1.874.765a19.281,19.281,0,0,0,2.829.879,13.731,13.731,0,0,0,3.1.344q5.429,0,7.991-2.332t2.562-7.991v-.765Q92.273-11.8,83.861-11.8a13.2,13.2,0,0,1-7.035-1.874,12.652,12.652,0,0,1-4.741-5.2A16.63,16.63,0,0,1,70.4-26.482V-48.811a4.586,4.586,0,0,1,1.3-3.326,4.39,4.39,0,0,1,3.288-1.338,4.39,4.39,0,0,1,3.288,1.338,4.586,4.586,0,0,1,1.3,3.326v19.576q0,4.818,2.1,6.921t6.156,2.1a8.012,8.012,0,0,0,6.156-2.332q2.179-2.332,2.179-6.691V-48.811a4.586,4.586,0,0,1,1.3-3.326A4.39,4.39,0,0,1,100.761-53.476Z"
                  transform="translate(-1.35 62.27)"
                  fill="#d3d3d3"
                />
              </svg>
            )}
            <div className="absolute cursor-pointer bottom-[12px] left-0 w-full justify-center items-center flex-row flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="18"
                height="18"
                viewBox="0 0 18 18"
              >
                <defs>
                  <clipPath id="clip-path">
                    <rect
                      id="Rectangle_4718"
                      data-name="Rectangle 4718"
                      width="18"
                      height="18"
                      fill="none"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Group_13681"
                  data-name="Group 13681"
                  transform="translate(-203 -428)"
                >
                  <g
                    id="Mask_Group_493"
                    data-name="Mask Group 493"
                    transform="translate(203 428)"
                    clip-path="url(#clip-path)"
                  >
                    <g id="image-add" transform="translate(0 1.498)">
                      <path
                        id="Path_22042"
                        data-name="Path 22042"
                        d="M19.26,13.867A3.244,3.244,0,1,0,22.5,17.111,3.248,3.248,0,0,0,19.26,13.867Zm1.269,3.526h-.987v.987a.282.282,0,0,1-.564,0v-.987H17.99a.282.282,0,0,1,0-.564h.987v-.987a.282.282,0,0,1,.564,0v.987h.987a.282.282,0,1,1,0,.564Z"
                        transform="translate(-4.45 -5.405)"
                        fill="#5d5c5d"
                      />
                      <path
                        id="Path_22043"
                        data-name="Path 22043"
                        d="M13.938,10.147a.282.282,0,0,0,.147-.46L11.325,6.538a1.129,1.129,0,0,0-.848-.385h0a1.128,1.128,0,0,0-.849.386L5.88,10.826,4.142,8.844a1.129,1.129,0,0,0-.848-.385h0a1.128,1.128,0,0,0-.849.386l-1.88,2.15v-6.8A1.481,1.481,0,0,1,2.045,2.713H13.752a1.481,1.481,0,0,1,1.481,1.481V9.829a.279.279,0,0,0,.231.275h.006a.28.28,0,0,0,.328-.275V4.194a2.045,2.045,0,0,0-2.045-2.045H2.045A2.045,2.045,0,0,0,0,4.194v7.9a2.045,2.045,0,0,0,2.045,2.045h8.677A.28.28,0,0,0,11,13.858v0a3.815,3.815,0,0,1,2.937-3.708Z"
                        transform="translate(0 -2.148)"
                        fill="#5d5c5d"
                      />
                      <circle
                        id="Ellipse_331"
                        data-name="Ellipse 331"
                        cx="1.388"
                        cy="1.388"
                        r="1.388"
                        transform="translate(4.233 1.941) rotate(-8.568)"
                        fill="#5d5c5d"
                      />
                    </g>
                  </g>
                </g>
              </svg>
              <span
                className={`regular ${
                  isUploading ? "text-[#402CDD]" : "text-[#5D5C5D]"
                } text-[14px] ml-[6px]`}
              >
                {isUploading
                  ? "Uploading Profile Photo …"
                  : " Add Profile Picture"}
              </span>
            </div>
          </>
        )}
        {selectedFile && (
          <div className="relative w-full h-[406px] overflow-hidden border-2 border-gray-300 rounded-lg">
            <div
              className="w-full h-full cursor-move select-none"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleImageAdjust}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleImageAdjust}
              onWheel={handleWheel}
            >
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected"
                className="w-full h-[405px] object-contain pointer-events-none"
                style={{
                  transform: `scale(${imageAdjustment.scale}) translate(${imageAdjustment.x}px, ${imageAdjustment.y}px)`,
                  transition: imageAdjustment.isDragging
                    ? "none"
                    : "transform 0.1s",
                  willChange: "transform",
                  touchAction: "none",
                  userSelect: "none",
                }}
                draggable={false}
              />
            </div>
            <div className="absolute bottom-4 right-4 space-x-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel
              </button>
              <button
                onClick={getAdjustedImage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
      {selectedFile && (
        <div
          className="flex flex-row mt-[15px] cursor-pointer"
          onClick={() => setSelectedFile(null)}
        >
          <svg
            id="delete"
            xmlns="http://www.w3.org/2000/svg"
            width="14.619"
            height="18"
            viewBox="0 0 14.619 18"
          >
            <path
              id="Path_14710"
              data-name="Path 14710"
              d="M222.771,154.7a.372.372,0,0,0-.372.373v7.04a.372.372,0,1,0,.745,0v-7.04A.372.372,0,0,0,222.771,154.7Zm0,0"
              transform="translate(-212.956 -150.177)"
              fill="#ff5f61"
            />
            <path
              id="Path_14711"
              data-name="Path 14711"
              d="M104.771,154.7a.372.372,0,0,0-.372.373v7.04a.372.372,0,1,0,.745,0v-7.04A.372.372,0,0,0,104.771,154.7Zm0,0"
              transform="translate(-99.966 -150.177)"
              fill="#ff5f61"
            />
            <path
              id="Path_14712"
              data-name="Path 14712"
              d="M1.194,5.357V15.743a2.326,2.326,0,0,0,.618,1.6A2.076,2.076,0,0,0,3.319,18h7.976a2.075,2.075,0,0,0,1.506-.651,2.326,2.326,0,0,0,.618-1.6V5.357a1.61,1.61,0,0,0-.413-3.167H10.847V1.664A1.656,1.656,0,0,0,9.178,0H5.435A1.656,1.656,0,0,0,3.765,1.664v.527H1.607a1.61,1.61,0,0,0-.413,3.167Zm10.1,11.8H3.319a1.335,1.335,0,0,1-1.281-1.412V5.395H12.576V15.743A1.335,1.335,0,0,1,11.294,17.156ZM4.609,1.664A.812.812,0,0,1,5.435.842H9.178A.812.812,0,0,1,10,1.664v.527h-5.4Zm-3,1.37h11.4a.759.759,0,1,1,0,1.518H1.607a.759.759,0,1,1,0-1.518Zm0,0"
              transform="translate(0.003 0.001)"
              fill="#ff5f61"
            />
            <path
              id="Path_14713"
              data-name="Path 14713"
              d="M163.771,154.7a.372.372,0,0,0-.372.373v7.04a.372.372,0,1,0,.745,0v-7.04A.372.372,0,0,0,163.771,154.7Zm0,0"
              transform="translate(-156.461 -150.177)"
              fill="#ff5f61"
            />
          </svg>
          <span className="text-[#1D1D1D] text-[14px] regular ml-[6px] ">
            Remove Photo
          </span>
        </div>
      )}
      {!selectedFile && (
        <div
          className="flex flex-col mt-[10vh] items-start"
          id="pricker-options"
        >
          <div
            className="flex  flex-row cursor-pointer"
            onClick={() => {
              openCamera();
            }}
          >
            <svg
              id="_15x15_photo_back"
              data-name="15x15 photo back"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <defs>
                <clipPath id="clip-path">
                  <rect
                    id="Rectangle_4561"
                    data-name="Rectangle 4561"
                    width="18"
                    height="18"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <g
                id="Mask_Group_733"
                data-name="Mask Group 733"
                clip-path="url(#clip-path)"
              >
                <g id="Icons" transform="translate(-2.25 -2.25)">
                  <path
                    id="Path_23093"
                    data-name="Path 23093"
                    d="M11.25,7.2a4.5,4.5,0,1,0,4.5,4.5,4.5,4.5,0,0,0-4.5-4.5Zm0,8.1a3.6,3.6,0,1,1,3.6-3.6A3.6,3.6,0,0,1,11.25,15.3Z"
                    fill="#8e8e8e"
                  />
                  <path
                    id="Path_23094"
                    data-name="Path 23094"
                    d="M17.1,5.4H15.129l-.374-.747A2.061,2.061,0,0,0,13.05,3.6H9.45A2.061,2.061,0,0,0,7.744,4.653L7.371,5.4H5.4A3.15,3.15,0,0,0,2.25,8.55v7.2A3.15,3.15,0,0,0,5.4,18.9H17.1a3.15,3.15,0,0,0,3.15-3.15V8.55A3.15,3.15,0,0,0,17.1,5.4Zm2.25,10.35A2.25,2.25,0,0,1,17.1,18H5.4a2.25,2.25,0,0,1-2.25-2.25V8.55A2.25,2.25,0,0,1,5.4,6.3H7.65a.45.45,0,0,0,.4-.247l.5-.994a1.152,1.152,0,0,1,.9-.558h3.6a1.152,1.152,0,0,1,.9.558l.5.994a.45.45,0,0,0,.4.247H17.1a2.25,2.25,0,0,1,2.25,2.25Z"
                    fill="#8e8e8e"
                  />
                </g>
              </g>
            </svg>
            <span className="regular text-[14px] text-[#1D1D1D] ml-[10px]">
              take photo
            </span>
          </div>
          <div
            className="flex  flex-row mt-[10px] cursor-pointer"
            onClick={() => {
              document
                .querySelector<HTMLInputElement>("#profile-file-picker")
                ?.click();
            }}
          >
            <svg
              id="_15x15_photo_back"
              data-name="15x15 photo back"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <defs>
                <clipPath id="clip-path">
                  <rect
                    id="Rectangle_4561"
                    data-name="Rectangle 4561"
                    width="18"
                    height="18"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <g
                id="Mask_Group_734"
                data-name="Mask Group 734"
                clip-path="url(#clip-path)"
              >
                <g id="image-gallery-2" transform="translate(0 -0.75)">
                  <g id="Group_13684" data-name="Group 13684">
                    <path
                      id="Path_23095"
                      data-name="Path 23095"
                      d="M13.09,18a1.5,1.5,0,0,1-.382-.049L1.11,14.845a1.514,1.514,0,0,1-1.06-1.837L1.513,7.553a.375.375,0,1,1,.724.193L.775,13.2a.761.761,0,0,0,.532.922l11.593,3.1a.747.747,0,0,0,.913-.528l.586-2.17a.375.375,0,1,1,.724.195l-.585,2.167A1.5,1.5,0,0,1,13.09,18Z"
                      fill="#868686"
                    />
                  </g>
                  <g id="Group_13685" data-name="Group 13685">
                    <path
                      id="Path_23096"
                      data-name="Path 23096"
                      d="M16.5,13.5H4.5A1.5,1.5,0,0,1,3,12V3A1.5,1.5,0,0,1,4.5,1.5h12A1.5,1.5,0,0,1,18,3v9A1.5,1.5,0,0,1,16.5,13.5ZM4.5,2.25A.751.751,0,0,0,3.75,3v9a.751.751,0,0,0,.75.75h12a.751.751,0,0,0,.75-.75V3a.751.751,0,0,0-.75-.75Z"
                      fill="#868686"
                    />
                  </g>
                  <g id="Group_13686" data-name="Group 13686">
                    <path
                      id="Path_23097"
                      data-name="Path 23097"
                      d="M6.75,6.75a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,6.75,6.75Zm0-2.25a.75.75,0,1,0,.75.75A.751.751,0,0,0,6.75,4.5Z"
                      fill="#868686"
                    />
                  </g>
                  <g id="Group_13687" data-name="Group 13687">
                    <path
                      id="Path_23098"
                      data-name="Path 23098"
                      d="M3.427,12.7a.375.375,0,0,1-.265-.64L6.7,8.515a1.153,1.153,0,0,1,1.591,0L9.349,9.57l2.919-3.5a1.127,1.127,0,0,1,.856-.4h.008a1.124,1.124,0,0,1,.854.392l3.922,4.576a.375.375,0,1,1-.569.488L13.418,6.543a.371.371,0,0,0-.285-.13.4.4,0,0,0-.288.135L9.663,10.366a.374.374,0,0,1-.271.134.361.361,0,0,1-.282-.109L7.765,9.046a.385.385,0,0,0-.53,0L3.692,12.588a.374.374,0,0,1-.265.109Z"
                      fill="#868686"
                    />
                  </g>
                </g>
              </g>
            </svg>

            <span className="regular text-[14px] text-[#1D1D1D] ml-[10px]">
              Choose From Library
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

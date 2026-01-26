"use client";
import React, { useState, useRef, useEffect } from "react";

import { getConfiguredImage, translateFunction } from "utils/functions";
import { DisableScroll, EnableScroll, GetImageUrl } from "utils/tinyUtils";
import { useAppStore } from "store";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";

const TryOnModal = ({ isOpen, onClose, language }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [enableCamera, setEnableCamera] = useState<boolean>(false);
  const { isModalOpen } = useAppStore();
  // Handle modal close
  const handleClose = () => {
    if (isProcessing) return; // Prevent closing during processing
    setSelectedImage(null);
    setShowResult(false);
    setIsProcessing(false);
    stopCamera();
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    DisableScroll();
    let videoElem = document.querySelector<HTMLDivElement>(".product-video");
    if (videoElem) {
      videoElem.style.display = "none";
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (videoElem) {
        videoElem.style.display = "flex";
      }
      EnableScroll();
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle video stream when camera is enabled
  useEffect(() => {
    if (enableCamera && streamRef.current && videoRef.current) {
    }
  }, [enableCamera]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Fixed typo: "enviroment" -> "environment"
      });

      streamRef.current = stream;
      setEnableCamera(true);

      // Wait for the next tick to ensure the video element is rendered
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      alert(
        translateFunction(
          "Please enable notification permissions to use camera features",
        ),
      );
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg");
        setSelectedImage(imageData);
        stopCamera();
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setEnableCamera(false);
    }
  };

  // Handle try on
  const handleTryOn = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);

    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setShowResult(true);
    }, 3000);
  };

  // Handle retry
  const handleRetry = () => {
    setSelectedImage(null);
    setShowResult(false);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999999999] flex items-center justify-center ">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex-1">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-2">
          <div className="flex items-center justify-end">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <img src="/icons/CloseIcon.svg" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedImage && !showResult && !enableCamera && (
            <div className="text-center">
              <HortiznalScrollBar
                className="flex-row max-w-full gap-[4px] h-[150px]"
                id="try-on-product-images"
              >
                {typeof isModalOpen !== "boolean" &&
                  isModalOpen?.images?.map((s) => (
                    <div className="flex-row  relative">
                      <div
                        className="absolute top-0 z-10 right-0 w-full h-full "
                        style={{
                          boxShadow:
                            "inset 0px 3px 6px rgba(255, 255, 255, 0.5)",
                        }}
                      />
                      <img
                        className="min-w-[104px] w-[104px] h-[144px] rounded-[15px] object-cover object-center"
                        style={{
                          boxShadow: "0px 3px 6px #0000001f",
                        }}
                        src={getConfiguredImage({
                          src: GetImageUrl(s?.file_path ?? s),
                          width: 104,
                          height: 144,
                          q: 70,
                        })}
                        alt={"tryon-product-image"}
                      />
                    </div>
                  ))}
              </HortiznalScrollBar>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {translateFunction("Choose how to add your photo", language)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Camera Option */}
                <button
                  onClick={handleCameraCapture}
                  className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-[14px] bg-[#a3c0ff] rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <img
                        src="/icons/image.svg"
                        className=" text-white origin-center scale-150 "
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {translateFunction("Take Photo")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {translateFunction("Take a new photo with your camera")}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Upload Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-[14px] bg-[#d1a0ff] rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <img
                        src="/icons/UploadImageOrder.svg"
                        className=" text-white origin-center scale-150 [&>g>g>g>*]:fill-[#727272]"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {translateFunction("Upload Photo")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {translateFunction("Select from your gallery")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Camera View */}
          {!selectedImage && !showResult && enableCamera && (
            <div className="text-center flex-1">
              <div className="relative flex-1 bg-gray-900 rounded-2xl overflow-hidden mb-4 h-[80dvh] max-h-[80dvh]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {translateFunction("Capture Photo", language)}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {translateFunction("Cancel", language)}
                </button>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {selectedImage && !showResult && (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {translateFunction("Your photo is ready!")}
              </h3>

              <div className="relative mb-6">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              </div>

              <p className="text-gray-600 mb-6">
                {translateFunction(
                  "Click 'Try On' to see how this product looks on you",
                )}
              </p>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={handleTryOn}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {translateFunction("Try On")}
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {translateFunction("Try again", language)}
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse shadow-lg" />
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-ping opacity-20" />
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {translateFunction("Processing…")}
              </h3>
              <p className="text-gray-600">
                {translateFunction("Processing your virtual try-on...")}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {translateFunction("This may take a few moments")}
              </p>
            </div>
          )}

          {/* Result State */}
          {showResult && (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {translateFunction("Your photo is ready!")}
              </h3>

              <div className="relative mb-6">
                <img
                  src={selectedImage}
                  alt="Result"
                  className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {translateFunction("Try again")}
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {translateFunction("Close")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOnModal;

"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { translateFunction } from "utils/functions";
import { showErrorNotification } from "@/store/notifications/reducer";

interface CameraWidgetProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraWidget = ({ onCapture, onClose }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [constraintError, setConstraintError] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  // More flexible video constraints with fallbacks
  const getVideoConstraints = () => {
    if (constraintError) {
      // Fallback to basic constraints if there was an error
      return {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: facingMode,
      };
    }

    return {
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 },
      facingMode: facingMode,
      // Remove exact constraint to be more flexible
    };
  };

  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (error) {
        console.error("Error checking cameras:", error);
      }
    };

    checkCameras();
  }, []);

  const handleCapture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setCapturedImage(screenshot);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      // Convert base64 to File
      fetch(capturedImage, {
        credentials: "omit",
      })
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          onCapture(file);
        })
        .catch((error) => {
          console.error("Error converting image:", error);
          showErrorNotification(translateFunction("Failed to process image"));
        });
    }
  };

  const handleSwitchCamera = () => {
    if (hasMultipleCameras) {
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
      setConstraintError(false); // Reset error state when switching
    } else {
      showErrorNotification(
        translateFunction("This device has only one camera")
      );
    }
  };

  const handleUserMediaError = (error: any) => {
    console.error("Camera error:", error);

    if (error.name === "OverconstrainedError") {
      setConstraintError(true);
      showErrorNotification(
        translateFunction(
          "Camera constraints not supported, trying fallback settings"
        )
      );
    } else if (error.name === "NotAllowedError") {
      showErrorNotification(translateFunction("Camera access denied"));
      onClose();
    } else if (error.name === "NotFoundError") {
      showErrorNotification(translateFunction("No camera found"));
      onClose();
    } else {
      showErrorNotification(translateFunction("Camera error occurred"));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[99999999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {translateFunction("Take Photo")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={translateFunction("Close camera")}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="relative">
          {capturedImage ? (
            // Show captured image
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-sm mb-2">
                    {translateFunction("Photo captured!")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Show live camera
            <div className="relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={getVideoConstraints()}
                className="w-full h-64 object-cover"
                onUserMediaError={handleUserMediaError}
              />
              {/* Camera overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-xs opacity-75">
                      {translateFunction("Position your product here")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-50">
          {capturedImage ? (
            // Controls for captured image
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRetake}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {translateFunction("Retake")}
              </button>
              <button
                onClick={handleUsePhoto}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {translateFunction("Use Photo")}
              </button>
            </div>
          ) : (
            // Controls for live camera
            <div className="flex justify-center items-center space-x-6">
              {/* Switch Camera Button */}
              {hasMultipleCameras && (
                <button
                  onClick={handleSwitchCamera}
                  className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                  aria-label={translateFunction("Switch camera")}
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </button>
              )}

              {/* Capture Button */}
              <button
                onClick={handleCapture}
                className="p-4 bg-white border-4 border-gray-300 rounded-full hover:border-gray-400 transition-colors"
                aria-label={translateFunction("Capture photo")}
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              </button>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                aria-label={translateFunction("Cancel")}
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

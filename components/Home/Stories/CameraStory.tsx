import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Image from "next/image";
import UploadVideo from "../UploadVideo";
import { blobToDataURL } from "components/Chat/chatsFunctions";
import { useStopwatch } from "react-timer-hook";
import { translateFunction } from "utils/functions";

interface NewStoryModalProps {
  close: () => void;
  send: (imageFile: string) => void;
  HandleUploadedVideo: (videoFile: File) => void;
}

function NewStoryModal({ close, send, HandleUploadedVideo }: NewStoryModalProps) {
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [vidUrl, setVidUrl] = useState<string | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");
  const [switchCameraDisabled, setSwitchCameraDisabled] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [webcamConstraints, setWebcamConstraints] = useState({
    width: 1280,
    height: 720,
    facingMode: "user" as string | { exact: string },
  });

  const { seconds, minutes, start, pause, reset } = useStopwatch({ autoStart: false });

  // Check if device has multiple cameras
  const checkCameraDevices = async () => {
    try {
      const devices = await navigator?.mediaDevices?.enumerateDevices();
      const videoDevices = devices?.filter((dev) => dev?.kind === "videoinput");
      setSwitchCameraDisabled(videoDevices ? videoDevices.length <= 1 : true);
    } catch (err) {
      setSwitchCameraDisabled(true);
    }
  };

  useEffect(() => {
    checkCameraDevices();
  }, []);

  // Handle Photo Capture
  const capturePhoto = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setImageFile(screenshot);
    }
  };

  // Start Video Recording
  const handleStartCapture = useCallback(() => {
    if (!webcamRef.current?.stream) return;

    reset();
    start();
    setCapturing(true);
    setRecordedChunks([]);

    const stream = webcamRef.current.stream;
    const options = { mimeType: "video/webm" };

    const recorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = recorder;

    recorder.addEventListener("dataavailable", ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => [...prev, data]);
        const blob = new Blob([data], { type: "video/webm" });
        const localUrl = URL.createObjectURL(blob);
        setVidUrl(localUrl);
      }
    });

    recorder.start();
  }, [webcamRef, start, reset]);

  // Stop Video Recording
  const handleStopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stop();
    setCapturing(false);
  }, [stop]);

  // Max video length of 1 minute (60 seconds)
  useEffect(() => {
    if (capturing && (minutes > 0 || seconds >= 59)) {
      handleStopCapture();
    }
  }, [seconds, minutes, capturing, handleStopCapture]);

  // Share/Upload Video
  const handleShareVideo = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const videoFile = new File([blob], `video-story-${Date.now()}.webm`, {
        type: "video/webm",
      });

      HandleUploadedVideo(videoFile);
      close();
    }
  }, [recordedChunks, HandleUploadedVideo, close]);

  // Toggle Front/Back Camera
  const toggleCamera = () => {
    setWebcamConstraints((prev) => ({
      ...prev,
      facingMode: prev.facingMode === "user" ? "environment" : "user",
    }));
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-neutral-950 flex flex-col justify-between items-center z-[9999999999]">
      {/* Background Dimmer/Blur Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10" />

      {/* Modern Header / Tab Controller */}
      <div className="w-full max-w-full px-6 pt-6 z-10 block  gap-4">
        <div className="cursor-pointer flex flex-grow justify-between items-center text-white">
          <button
            onClick={() => {
              if (imageFile) setImageFile(null);
              else if (vidUrl) {
                setVidUrl(null);
                setRecordedChunks([]);
              } else {
                close();
              }
            }}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center backdrop-blur-md border border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="font-semibold text-lg tracking-wide text-white/90">
            {imageFile ? "Preview Photo" : vidUrl ? "Preview Video" : "Create Story"}
          </span>

          <div className="w-10 h-10" /> {/* Spacer */}
        </div>

        {!imageFile && !vidUrl && (
          <div className="cursor-pointer flex mt-[5px] bg-neutral-900/80 p-1 rounded-full border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("photo")}
              className={`cursor-pointer flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === "photo"
                ? "bg-white text-black shadow-md"
                : "text-white/60 hover:text-white"
                }`}
            >
              {translateFunction("Photo")}
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={` cursor-pointer flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === "video"
                ? "bg-white text-black shadow-md"
                : "text-white/60 hover:text-white"
                }`}
            >
              {translateFunction('Video')}
            </button>
          </div>
        )}
      </div>

      {/* Main Viewfinder / Media Container */}
      <div className="flex-1 w-full max-w-full relative flex items-center justify-center overflow-hidden my-4 px-4">
        <div className="w-full h-full rounded-[2rem] overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl relative flex items-center justify-center">
          {imageFile ? (
            <Image
              src={imageFile}
              alt="Story Preview"
              fill
              className="object-cover"
              loading="eager"
            />
          ) : vidUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <UploadVideo vidUrl={vidUrl} />
            </div>
          ) : (
            <Webcam
              audio={activeTab === "video"}
              muted={activeTab === "video"}
              ref={webcamRef}
              screenshotFormat="image/webp"
              videoConstraints={webcamConstraints}
              className="w-full h-full object-cover"
            />
          )}

          {/* Video Recording Timer Overlay */}
          {capturing && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-mono px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider flex items-center gap-2 shadow-lg animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white block" />
              {`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`}
            </div>
          )}
        </div>
      </div>

      {/* Premium Controls Panel */}
      <div className="w-full max-w-full px-6 pb-8 z-10 flex flex-col items-center">
        <div className="w-full flex justify-around items-center bg-neutral-900/60 backdrop-blur-xl border border-white/10 py-5 px-6 rounded-3xl shadow-xl">
          {/* Left Action: Toggle/Flip Camera (Only if camera mode is active) */}
          {!imageFile && !vidUrl ? (
            <button
              onClick={toggleCamera}
              disabled={switchCameraDisabled}
              className={`cursor-pointer p-3 rounded-full transition-all duration-200 ${switchCameraDisabled
                ? "opacity-30 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20 active:scale-95"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2z" />
              </svg>
            </button>
          ) : (
            <div className="w-12 h-12" /> // spacer
          )}

          {/* Center Action: Capture / Record / Share */}
          {imageFile ? (
            <button
              onClick={() => {
                send(imageFile);
                setImageFile(null);
                close();
              }}
              className="cursor-pointer w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <img src="/icons/chat/sharechat.svg" className="w-8 h-8  brightness-200 filter" alt="Share" />
            </button>
          ) : vidUrl ? (
            <button
              onClick={handleShareVideo}
              className="cursor-pointer w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <img src="/icons/chat/sharechat.svg" className="w-8 h-8  brightness-200 filter" alt="Share" />
            </button>
          ) : activeTab === "photo" ? (
            <button
              onClick={capturePhoto}
              className="cursor-pointer w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          ) : (
            // Video Record Button (Capturing vs Idle)
            <button
              onClick={capturing ? handleStopCapture : handleStartCapture}
              className="cursor-pointer w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {capturing ? (
                <div className="w-8 h-8 rounded bg-red-600 transition-all duration-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-600 transition-all duration-200" />
              )}
            </button>
          )}

          {/* Right Action: Close/Discard */}
          <button
            onClick={() => {
              if (imageFile) setImageFile(null);
              else if (vidUrl) {
                setVidUrl(null);
                setRecordedChunks([]);
              } else {
                close();
              }
            }}
            className="cursor-pointer p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewStoryModal;


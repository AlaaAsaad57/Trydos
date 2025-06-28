import React, { useEffect, useState, useRef } from "react";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import { useAppStore } from "store";
import search from "services/search";
import { useParams } from "next/navigation";
import { showErrorNotification } from "store/notifications/reducer";

function SearchVoice({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(8);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { lang } = useParams();

  // Start countdown timer
  const startCountdown = () => {
    setTimeLeft(8);
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop countdown timer
  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setTimeLeft(8);
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setIsRecording(false);

    // Clear timers
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    stopCountdown();

    // Clear media stream and stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear media recorder
    setMediaRecorder(null);
  };

  // Initialize media recorder
  const initializeMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Try different audio formats based on browser support
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/ogg;codecs=opus";
      }

      console.log("Using audio format:", mimeType);

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await processAudio(audioBlob);
        chunks.length = 0; // Clear chunks
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);

      // Start recording immediately after initialization
      recorder.start();
      setIsRecording(true);

      // Start countdown
      startCountdown();

      // Set maximum recording duration of 8 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        console.log("Maximum recording time reached (8 seconds)");
        stopRecording();
      }, 8000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      showErrorNotification("Microphone access denied");
    }
  };

  // Process audio with AssemblyAI API
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      const response = await fetch("/api/speech-recognition", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (
        result.success &&
        result.transcription &&
        result.transcription.trim().length > 0
      ) {
        setSearchValue(result.transcription);
        search.getSearchOptions({
          noProducts: false,
          lang: lang,
        });
      } else {
        console.log("Empty transcription");
        showErrorNotification("Try again with clear voice");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      showErrorNotification("Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle record button click
  const handleOnRecord = async () => {
    if (isProcessing) return;

    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Start recording
      await initializeMediaRecorder();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Clear all timers on unmount
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Check browser support
  const browserSupportsMediaRecorder =
    typeof MediaRecorder !== "undefined" &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia;

  return (
    <>
      <div className="input-icon h-full">
        {browserSupportsMediaRecorder ? (
          <div className="relative">
            {/* Show spinner instead of mic when processing */}
            {isProcessing ? (
              <div className="w-6 h-6 flex items-center justify-center cursor-wait">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="relative">
                <SearchMicIcon
                  data-cy="searchVoiceIcon"
                  onClick={handleOnRecord}
                  className={`${
                    isRecording ? "listening-icon-mic" : "ggg"
                  } cursor-pointer relative z-10`}
                />

                {/* Circular Progress Bar */}
                {isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      className="w-8 h-8 transform -rotate-90"
                      viewBox="0 0 32 32"
                    >
                      {/* Background circle */}
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="rgba(239, 68, 68, 0.2)"
                        strokeWidth="2"
                        fill="none"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="#ef4444"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 14 * (1 - timeLeft / 8)
                        }`}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute -top-2 -right-2">
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                </div>
              </div>
            )}

            {/* Recording Animation Ripple Effect */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 border-2 border-red-400 rounded-full animate-ping opacity-30"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <SearchMicIcon
              data-cy="searchVoiceIcon"
              onClick={() => {
                showErrorNotification("Browser does not support this feature");
              }}
              className={`opacity-50 cursor-pointer`}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default SearchVoice;

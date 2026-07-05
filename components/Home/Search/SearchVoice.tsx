import React, { useEffect, useState, useRef } from "react";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import { LogError } from "utils/functions";

// Live-mic fallback languages for the browser's Web Speech API (BCP-47). Only
// the app languages the API can actually recognize are listed — Kurdish (`ku`)
// is intentionally absent: no browser engine supports it, so a ku recording has
// no fallback and falls through to the toast (same as before).
const WEB_SPEECH_LANG: Record<string, string> = {
  en: "en-US",
  ar: "ar-SA",
  tr: "tr-TR",
};

function SearchVoice({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(8);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Speech API fallback: runs live on the mic in parallel with the recorder.
  // AssemblyAI stays primary; this only rescues a failed transcription.
  const recognitionRef = useRef<any>(null);
  const webSpeechTextRef = useRef<string>("");
  const webSpeechEndedRef = useRef<boolean>(false);
  const webSpeechResolveRef = useRef<(() => void) | null>(null);

  // Start live browser recognition alongside the recorder. Fully guarded — any
  // failure here must never disturb the primary AssemblyAI recording path.
  const startWebSpeech = () => {
    try {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const bcp47 = WEB_SPEECH_LANG[(language || "en").slice(0, 2)];
      // Unsupported browser (Firefox) or unsupported language (ku) → no fallback.
      if (!SR || !bcp47) return;

      const recognition = new SR();
      recognition.lang = bcp47;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      webSpeechTextRef.current = "";
      webSpeechEndedRef.current = false;

      recognition.onresult = (e: any) => {
        const t = e?.results?.[0]?.[0]?.transcript;
        if (t) webSpeechTextRef.current = t;
      };
      // Both a clean end and an error (no-speech / not-allowed /
      // language-not-supported) settle the fallback — errors are swallowed.
      const settle = () => {
        webSpeechEndedRef.current = true;
        if (webSpeechResolveRef.current) {
          webSpeechResolveRef.current();
          webSpeechResolveRef.current = null;
        }
      };
      recognition.onend = settle;
      recognition.onerror = settle;

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      // best-effort only — ignore
    }
  };

  // Finalize live recognition (keeps its result) when recording stops.
  const stopWebSpeech = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  };

  // Discard live recognition + its result (AssemblyAI already won, or unmount).
  const abortWebSpeech = () => {
    try {
      recognitionRef.current?.abort?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
  };

  // Wait (bounded) for the live recognition to settle so its transcript is
  // final before we decide whether to fall back to it.
  const waitForWebSpeech = (timeoutMs: number) =>
    new Promise<void>((resolve) => {
      if (!recognitionRef.current || webSpeechEndedRef.current) return resolve();
      webSpeechResolveRef.current = resolve;
      setTimeout(() => {
        if (webSpeechResolveRef.current) {
          webSpeechResolveRef.current = null;
          resolve();
        }
      }, timeoutMs);
    });

  // AssemblyAI failed: use the browser fallback's transcript if it heard
  // anything (en/ar/tr), otherwise show the give-up toast.
  const fallbackOrToast = async (toastKey: string) => {
    await waitForWebSpeech(1500);
    const fallback = webSpeechTextRef.current.trim();
    abortWebSpeech();
    if (fallback.length > 0) {
      setSearchValue(fallback);
    } else {
      showErrorNotification(translateFunction(toastKey));
    }
  };

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

    // Finalize the live fallback so its transcript is ready if AssemblyAI fails.
    stopWebSpeech();

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

      // Fire the live browser fallback in parallel (guarded, never blocks the
      // recorder). Started AFTER the recorder so the primary mic path wins setup.
      startWebSpeech();

      // Start countdown
      startCountdown();

      // Set maximum recording duration of 8 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 8000);
    } catch (error) {
      LogError({
        error: error,
        scenario: "initializeMediaRecorder in SearchVoice",
      });
      showErrorNotification(translateFunction("Microphone access denied"));
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
        credentials: "omit",
      });

      const result = await response.json();

      if (
        result.success &&
        result.transcription &&
        result.transcription.trim().length > 0
      ) {
        // AssemblyAI (primary) won — discard the browser fallback.
        abortWebSpeech();
        // Setting the search value drives the overlay's single GetSearchData
        // path directly (see SD-07); no separate store-based search needed.
        setSearchValue(result.transcription);
      } else {
        // AssemblyAI couldn't recognize — try the live browser fallback before
        // giving up (en/ar/tr only).
        await fallbackOrToast("Try again with clear voice");
      }
    } catch (error) {
      // AssemblyAI request failed — same fallback path before the error toast.
      await fallbackOrToast("Failed to process audio");
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
      // Tear down any live browser recognition still running.
      abortWebSpeech();
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
                <img
                  src="/icons/SearchMicIcon.svg"
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
            <img
              src="/icons/SearchMicIcon.svg"
              data-cy="searchVoiceIcon"
              onClick={() => {
                showErrorNotification(
                  translateFunction("Browser does not support this feature"),
                );
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

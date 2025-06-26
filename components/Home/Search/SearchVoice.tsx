import React, { useEffect, useState } from "react";
import "regenerator-runtime/runtime";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useAppStore } from "store";
import search from "services/search";
import { useParams } from "next/navigation";
import { showErrorNotification } from "store/notifications/reducer";

function SearchVoice({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();
  const { finalTranscript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [showError, setShowError] = useState(false);
  const [wasListening, setWasListening] = useState(false);

  function handleOnRecord() {
    setShowError(false); // Clear any previous errors

    if (listening) {
      // If currently listening, stop and process the transcript
      SpeechRecognition.stopListening();
    } else {
      // If not listening, start listening
      SpeechRecognition.startListening({
        language: language === "ar" ? "ar-SA" : "en-US",
      });
    }
  }

  const { lang } = useParams();

  // Track when listening starts
  useEffect(() => {
    if (listening) {
      setWasListening(true);
    }
  }, [listening]);

  // Handle when recording stops
  useEffect(() => {
    if (wasListening && !listening) {
      // Recording just stopped, wait a moment for finalTranscript to update
      setTimeout(() => {
        if (!finalTranscript || finalTranscript.trim().length === 0) {
          console.log("finalTranscript", finalTranscript);
          showErrorNotification("Try again ..could not transcribe your voice"); // Hide error after 3 seconds
        }
        setWasListening(false);
      }, 500);
    }
  }, [listening, wasListening, finalTranscript]);

  useEffect(() => {
    if (finalTranscript?.length > 0) {
      setSearchValue(finalTranscript);
      search.getSearchOptions({
        noProducts: false,
        lang: lang,
      });
    }
  }, [finalTranscript]);

  return (
    <>
      {browserSupportsSpeechRecognition && (
        <div className="relative">
          <SearchMicIcon
            data-cy="searchVoiceIcon"
            onTouchStart={handleOnRecord}
            onMouseDown={handleOnRecord}
            className={`${
              listening ? "listening-icon-mic" : "ggg"
            } cursor-pointer`}
          />

          {/* Recording Indicator */}
          {listening && (
            <div className="absolute -top-2 -right-2">
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
            </div>
          )}

          {/* Recording Animation Ripple Effect */}
          {listening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 border-2 border-red-500 rounded-full animate-pulse opacity-75"></div>
              <div className="absolute w-12 h-12 border-2 border-red-400 rounded-full animate-ping opacity-50"></div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">
              Couldn't transcribe your voice
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchVoice;

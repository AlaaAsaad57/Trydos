import React, { useEffect } from "react";
import "regenerator-runtime/runtime";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useAppStore } from "store";

function SearchVoice({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();
  const {
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  function handleOnRecord() {
    SpeechRecognition.startListening({
      language: language === "ar" ? "ar-SA" : "en-US",
    });
  }
  useEffect(() => {
    setSearchValue(finalTranscript);
  }, [finalTranscript]);
  return (
    <>
      {browserSupportsSpeechRecognition && (
        <SearchMicIcon
          data-cy="searchVoiceIcon"
          onTouchStart={handleOnRecord}
          onMouseDown={handleOnRecord}
          className={`${listening ? "listening-icon-mic" : "ggg"}`}
        />
      )}
    </>
  );
}

export default SearchVoice;

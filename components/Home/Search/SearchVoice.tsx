import React, { useEffect } from "react";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useSelector } from "react-redux";
function SearchVoice({ setSearchValue }: { setSearchValue: Function }) {
  const language = useSelector((state: any) => state.homepage.language);
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
          onTouchStart={handleOnRecord}
          onMouseDown={handleOnRecord}
          className={`${listening ? "listening-icon-mic" : "ggg"}`}
        />
      )}
    </>
  );
}

export default SearchVoice;

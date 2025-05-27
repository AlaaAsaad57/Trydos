import React, { useEffect } from "react";
import "regenerator-runtime/runtime";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useAppStore } from "store";
import search from "services/search";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { translateFunction } from "utils/functions";

function SearchVoice({ setSearchValue }: { setSearchValue: Function }) {
  const { language } = useAppStore();
  const { finalTranscript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  function handleOnRecord() {
    SpeechRecognition.startListening({
      language: language === "ar" ? "ar-SA" : "en-US",
    });
  }
  const { lang } = useParams();
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

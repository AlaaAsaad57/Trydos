"use client";
import "styles/Translations.css";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage, LogData } from "store/homepage/actions";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { getCurrency } from "store/chat/actions";

const ArabicCss = dynamic(() => import("./ArabicCss"), { ssr: true });
interface TranslationsMenuProps {
  init: string;
}
function TranslationsMenu({ init }: TranslationsMenuProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const dispatch = useDispatch();
  useEffect(() => {
    getCurrency({
      lang: init.split("-")[1],
      country: init.split("-")[0],
      callback: ({ currency, res }) => {
        dispatch({ type: "CURRENCY", payload: currency });
        LogData(res);
      },
    });
  }, []);
  return (
    <div className="translations-container">
      {language === "ar" && <ArabicCss />}
      <div className="translations-container-inner">
        <div className="translation-icon">
          <img
            src={"/svg/translations.svg"}
            width={30}
            height={30}
            alt="language"
          />
        </div>

        <div
          className={`translation-icon cursor-pointer tr-icon ${
            language === "tr" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("tr"));
            window.location.href = window.location.href.replace(
              init,
              `${init.split("-")[0]}-tr`
            );
          }}
        >
          <img
            src={"/svg/tr.svg"}
            width={30}
            height={20}
            alt="turkish language"
          />
        </div>
        <div
          className={`translation-icon cursor-pointer en-icon ${
            language === "en" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("en"));
            window.location.href = window.location.href.replace(
              init,
              `${init.split("-")[0]}-en`
            );
          }}
        >
          <img
            src={"/svg/uk.svg"}
            width={30}
            height={20}
            alt="english language"
          />
        </div>
        <div
          className={`translation-icon cursor-pointer ar-icon ${
            language === "ar" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("ar"));
            window.location.href = window.location.href.replace(
              init,
              `${init.split("-")[0]}-ar`
            );
          }}
        >
          <img
            src={"/svg/uae.svg"}
            width={30}
            height={20}
            alt="arabic language"
          />
        </div>
      </div>
    </div>
  );
}

export default TranslationsMenu;

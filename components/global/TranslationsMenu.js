import React, { useEffect } from "react";
import TranslationsIcon from "public/svg/translations.svg";
import UKIcon from "public/svg/uk.svg";
import UAEIcon from "public/svg/uae.svg";
import TRSvg from "public/svg/tr.svg";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage } from "store/homepage/actions";
function TranslationsMenu(init) {
  const language = useSelector((state) => state.homepage.language);
  const dispatch = useDispatch();

  return (
    <div className="translations-container">
      <div className="translations-container-inner">
        <div className="translation-icon">
          <TranslationsIcon />
        </div>

        <div
          className={`translation-icon cursor-pointer tr-icon ${
            language === "tr" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("tr"));
            window.location.href = window.location.href.replace(
              init.init,
              `${init.init.split("-")[0]}-tr`
            );
          }}
        >
          <TRSvg width={30} height={20} />
        </div>
        <div
          className={`translation-icon cursor-pointer en-icon ${
            language === "en" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("en"));
            window.location.href = window.location.href.replace(
              init.init,
              `${init.init.split("-")[0]}-en`
            );
          }}
        >
          <UKIcon width={30} height={20} />
        </div>
        <div
          className={`translation-icon cursor-pointer ar-icon ${
            language === "ar" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("ar"));
            window.location.href = window.location.href.replace(
              init.init,
              `${init.init.split("-")[0]}-ar`
            );
          }}
        >
          <UAEIcon />
        </div>
      </div>
    </div>
  );
}

export default TranslationsMenu;

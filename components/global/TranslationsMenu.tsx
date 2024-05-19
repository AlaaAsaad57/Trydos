import TranslationsIcon from "public/svg/translations.svg";
import UKIcon from "public/svg/uk.svg";
import UAEIcon from "public/svg/uae.svg";
import TRSvg from "public/svg/tr.svg";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage } from "store/homepage/actions";
import dynamic from "next/dynamic";
const ArabicCss = dynamic(() => import("./ArabicCss"), { ssr: false });
interface TranslationsMenuProps {
  init: string;
}
function TranslationsMenu({ init }: TranslationsMenuProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const dispatch = useDispatch();
  console.log(init);
  return (
    <div className="translations-container">
      {language === "ae" && <ArabicCss />}
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
              init,
              `${init.split("-")[0]}-tr`
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
              init,
              `${init.split("-")[0]}-en`
            );
          }}
        >
          <UKIcon width={30} height={20} />
        </div>
        <div
          className={`translation-icon cursor-pointer ae-icon ${
            language === "ae" && "selected-language"
          }`}
          onClick={() => {
            dispatch(changeAppLanguage("ae"));
            window.location.href = window.location.href.replace(
              init,
              `${init.split("-")[0]}-ae`
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

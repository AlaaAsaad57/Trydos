import { useParams } from "next/navigation";

import { useEffect, useState } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

function WelcomingWidget({
  inputValue,
  stepIndicator,
  signStep,
  Name,
  close,
}: {
  inputValue: string;
  stepIndicator: number;
  signStep: string;
  Name: string;
  close: Function;
}) {
  const { language, setLoginOpen } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [active, setActive] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      if (active) setLoginOpen(false);
    }, 5000);
  }, [active]);

  useEffect(() => {
    if (stepIndicator === 6 && signStep === "welcomeLogin") {
      setTimeout(() => {
        setActive(true);
      }, 50);
    } else {
      setTimeout(() => {
        setActive(false);
      }, 50);
    }
  }, [stepIndicator, signStep]);
  if (active)
    return (
      <div className="flex-col items-center w-full justify-center h-full ">
        <div className="welcoming-container">
          <div className="welcoming-label">{translate("Hello,", language)}</div>
          <div className="welcoming-user">{Name}</div>
        </div>
        <div
          className="welcoming-enjoy"
          data-cy="Wellcome-Enjoy"
          style={{ marginBottom: "20px", justifyContent: "center" }}
        >
          {translate("Enjoy With Our Services", language)}
        </div>
      </div>
    );
  else return <></>;
}

export default WelcomingWidget;

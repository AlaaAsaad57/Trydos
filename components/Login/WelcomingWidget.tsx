import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";

function WelcomingWidget({
  inputValue,
  setStepIndcator,
  Name,
  close,
}: {
  inputValue: string;
  setStepIndcator: Function;
  Name: string;
  close: Function;
}) {
  const language = useSelector((state: any) => state.homepage.language);
  useEffect(() => {
    setTimeout(() => {
      close();
    }, 2000);
  }, []);
  return (
    <>
      <div className="phone-input-desc" style={{ marginBottom: "0px" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <defs>
            <clipPath id="clip-path">
              <rect
                id="Rectangle_4720"
                data-name="Rectangle 4720"
                width="15"
                height="15"
                fill="none"
              />
            </clipPath>
          </defs>
          <g
            id="Mask_Group_299"
            data-name="Mask Group 299"
            clip-path="url(#clip-path)"
          >
            <path
              id="login"
              d="M18.235,16.912V6.324A1.325,1.325,0,0,0,16.912,5H15.147a.441.441,0,1,1,0-.882h1.765a2.208,2.208,0,0,1,2.206,2.206V16.912a2.208,2.208,0,0,1-2.206,2.206H15.147a.441.441,0,1,1,0-.882h1.765A1.325,1.325,0,0,0,18.235,16.912ZM4.559,12.059h7.758L8.659,15.717a.441.441,0,1,0,.624.624l4.412-4.412a.441.441,0,0,0,0-.624L9.282,6.894a.441.441,0,1,0-.624.624l3.659,3.659H4.559a.441.441,0,1,0,0,.882Z"
              transform="translate(-4.285 -4.118)"
              fill="#707070"
            />
          </g>
        </svg>
        <div className="text-login-desc">
          <div className="text-login-item">
            {translate("Logged In Successfully !", language)}
          </div>
          <div className="icon-detail">
            <svg
              id="Group_10806"
              data-name="Group 10806"
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 10 10"
            >
              <path
                id="Path_13937"
                data-name="Path 13937"
                d="M181.618,115.591a.3.3,0,0,0-.03.1.243.243,0,1,0,.483.04.494.494,0,0,1,.01-.111v-.111a2.663,2.663,0,0,0-.141-.846,2.512,2.512,0,0,0-1.712-1.581,2.671,2.671,0,0,0-.635-.081,1.707,1.707,0,0,0-.222.01l-.212.03a.235.235,0,0,0,.081.463.99.99,0,0,1,.171-.02h.03c.05,0,.1-.01.151-.01a1.992,1.992,0,0,1,1.43.594,2.029,2.029,0,0,1,.594,1.41v.111Z"
                transform="translate(-174.683 -110.326)"
                fill="#8d8d8d"
              />
              <path
                id="Path_13938"
                data-name="Path 13938"
                d="M173.589,63.952a.243.243,0,1,0,.483.04c.01-.111.01-.222.01-.332a4.512,4.512,0,0,0-.05-.645,3.863,3.863,0,0,0-3.495-3.2c-.1-.01-.212-.01-.312-.01s-.222,0-.332.01-.222.02-.332.04a.235.235,0,1,0,.081.463l.2-.03c.03,0,.06-.01.091-.01.1-.01.2-.01.292-.01a3.471,3.471,0,0,1,.977.141,3.348,3.348,0,0,1,1.42.846,3.459,3.459,0,0,1,.755,1.138,3.4,3.4,0,0,1,.242,1.249v.1A.823.823,0,0,0,173.589,63.952Z"
                transform="translate(-165.462 -58.423)"
                fill="#8d8d8d"
              />
              <path
                id="Path_13939"
                data-name="Path 13939"
                d="M164.183,6.544A5.229,5.229,0,0,0,160.467,5c-.151,0-.3.01-.453.02a3.493,3.493,0,0,0-.453.06.235.235,0,1,0,.081.463l.2-.03a1.5,1.5,0,0,1,.211-.02c.141-.01.272-.02.413-.02a4.745,4.745,0,0,1,4.754,4.754v.222c0,.06-.01.121-.01.191a.243.243,0,1,0,.483.04c.01-.151.02-.3.02-.443A5.215,5.215,0,0,0,164.183,6.544Z"
                transform="translate(-155.714 -5.003)"
                fill="#8d8d8d"
              />
              <path
                id="Path_13940"
                data-name="Path 13940"
                d="M9.636,26.481l-1.719-.946c-.573-.319-.593-.11-1.195.548-.146.159-.418.577-.738.5a7.05,7.05,0,0,1-2.331-1.633,5.575,5.575,0,0,1-1.039-1.6c-.019-.518,1.088-.777.729-1.762L2.574,19.82C1.855,18.127-.156,20.836.009,22.1c.427,3.116,5.76,8.154,8.733,6.492C9.4,28.213,10.3,26.889,9.636,26.481Z"
                transform="translate(0 -18.92)"
                fill="#8d8d8d"
              />
            </svg>

            <span style={{ color: "#5d5d5d" }}>+{inputValue}</span>
          </div>
        </div>
      </div>
      <div className="welcoming-container">
        <div className="welcoming-label">{translate("Hello,", language)}</div>
        <div className="welcoming-user">{Name || "Alaa Asaad"}</div>
      </div>
      <div className="welcoming-enjoy" style={{ marginBottom: "171px" }}>
        {translate("Enjoy With Our Services", language)}
      </div>
    </>
  );
}

export default WelcomingWidget;

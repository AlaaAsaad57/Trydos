import React from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

function RateOrderButton({ setExpanded }) {
  const { language } = useAppStore();
  const handleClick = () => {
    setExpanded();
    setTimeout(() => {
      document.querySelector(".rating-star-container").scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      document.querySelectorAll(".rating-star-container").forEach((elem) => {
        elem.classList.add("shake-anim");
        setTimeout(() => {
          elem.classList.remove("shake-anim");
        }, 1000);
      });
    }, 500);
  };
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className="flex px-[12px] mt-[8px] w-full"
      onClick={() => {
        handleClick();
      }}
    >
      <div
        className={`${
          isRtl ? "items-end" : "items-start"
        } flex-col pt-[8px] pb-[12px] px-[12px] justify-start  w-full bg-[#F4F4F4] rounded-[15px] border-[#412cdd8d] border h-[155px]`}
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="25"
            height="25"
            viewBox="0 0 25 25"
          >
            <g id="Mask_Group_801" data-name="Mask Group 801">
              <g id="_x32_2_Star" transform="translate(0 2.354)">
                <g id="Group_13772" data-name="Group 13772">
                  <path
                    id="Path_23387"
                    data-name="Path 23387"
                    d="M18.828,12.579a1.851,1.851,0,0,0-1.5-1.269l-2.656-.389-1.185-2.4a1.847,1.847,0,0,0-1.669-1.04h0a1.852,1.852,0,0,0-1.671,1.039l-1.186,2.4L6.3,11.31a1.864,1.864,0,0,0-1.031,3.178l1.922,1.87L6.734,19.01a1.861,1.861,0,0,0,2.7,1.964l2.378-1.25,2.37,1.246a1.864,1.864,0,0,0,2.705-1.964l-.455-2.648,1.922-1.869a1.853,1.853,0,0,0,.472-1.911ZM16.005,16.1a.244.244,0,0,0-.071.216l.477,2.775a1.378,1.378,0,0,1-2,1.452l-2.483-1.306a.244.244,0,0,0-.227,0L9.211,20.543a1.377,1.377,0,0,1-2-1.452l.477-2.776a.244.244,0,0,0-.071-.216L5.608,14.14a1.376,1.376,0,0,1,.76-2.348l2.784-.407a.244.244,0,0,0,.183-.133l1.243-2.519a1.385,1.385,0,0,1,1.964-.564,1.374,1.374,0,0,1,.506.566l1.24,2.517a.244.244,0,0,0,.183.133l2.784.407a1.377,1.377,0,0,1,.76,2.35Z"
                    transform="translate(0.587 -1.103)"
                    fill="#402cdd"
                  />
                  <path
                    id="Path_23388"
                    data-name="Path 23388"
                    d="M21.675,6.461,20.634,7.474l.246,1.434a1.153,1.153,0,0,1-1.674,1.216L17.922,9.45l-1.288.676a1.135,1.135,0,0,1-.536.135A1.157,1.157,0,0,1,14.96,8.908l.246-1.434L14.167,6.461A1.154,1.154,0,0,1,14.8,4.492l1.439-.209.643-1.3a1.146,1.146,0,0,1,1.034-.643h0a1.148,1.148,0,0,1,1.034.645l.64,1.3,1.439.209a1.154,1.154,0,0,1,.639,1.969Z"
                    transform="translate(2.773 -2.336)"
                    fill="#402cdd"
                  />
                  <path
                    id="Path_23389"
                    data-name="Path 23389"
                    d="M8.294,6.461,7.255,7.474,7.5,8.908a1.155,1.155,0,0,1-1.676,1.216L4.542,9.45l-1.287.676A1.154,1.154,0,0,1,1.581,8.908l.246-1.434L.787,6.461a1.154,1.154,0,0,1,.639-1.969l1.439-.209.642-1.3a1.155,1.155,0,0,1,2.071,0l.64,1.3,1.439.209a1.154,1.154,0,0,1,.637,1.969Z"
                    transform="translate(-0.437 -2.336)"
                    fill="#402cdd"
                  />
                </g>
              </g>
            </g>
          </svg>
        </span>
        <span className="text-[#1D1D1D] medium text-[12px] mt-[5px]">
          {translateFunction("Rate & Get Money")}
        </span>
        <p className="text-[#5d5c5d] regular text-[10px] ">
          {translateFunction(
            "Your Accurate Rating Of The Products You Receive Helps Us Improve Quality And Helps Other Customers Purchase."
          )}
        </p>
        <div className="flex-row justify-center items-center w-full mt-[12px] px-[50px]">
          <button
            className=" flex-row justify-center items-center w-full bg-[#402CDD] rounded-[12px] h-[42px]"
            style={{ boxShadow: "0px 3px 10px #00000024" }}
          >
            <RateIcon />
            <span className="text-[#FFD800] text-[14px] medium mx-[14px] ">
              {translateFunction("Rate & Get Money")}
            </span>
            <RateIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RateOrderButton;
const RateIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="18"
      height="18"
      viewBox="0 0 18 18"
    >
      <defs>
        <clipPath id="clip-path1">
          <rect
            id="Rectangle_4609"
            data-name="Rectangle 4609"
            width="18"
            height="18"
            transform="translate(0 0.436)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Group_13773"
        data-name="Group 13773"
        transform="translate(0 -0.436)"
      >
        <g
          id="Mask_Group_800"
          data-name="Mask Group 800"
          clipPath="url(#clip-path1)"
        >
          <g id="_x32_2_Star" transform="translate(0 1.625)">
            <g
              id="Group_13771"
              data-name="Group 13771"
              transform="translate(0 0)"
            >
              <path
                id="Path_23384"
                data-name="Path 23384"
                d="M16.132,13.051a1.343,1.343,0,0,0-1.091-.921l-1.928-.282-.86-1.744a1.341,1.341,0,0,0-1.212-.755h0a1.345,1.345,0,0,0-1.213.754l-.861,1.745-1.929.282a1.353,1.353,0,0,0-.748,2.307l1.4,1.358-.331,1.925a1.351,1.351,0,0,0,1.962,1.426l1.726-.907,1.72.9a1.353,1.353,0,0,0,1.963-1.426l-.331-1.922,1.4-1.356a1.345,1.345,0,0,0,.342-1.387Zm-2.049,2.555a.177.177,0,0,0-.052.156l.346,2.014a1,1,0,0,1-1.451,1.054l-1.8-.948a.177.177,0,0,0-.165,0l-1.808.949A1,1,0,0,1,7.7,17.778l.346-2.015A.177.177,0,0,0,8,15.606l-1.46-1.422a1,1,0,0,1,.552-1.7l2.021-.3a.177.177,0,0,0,.133-.1l.9-1.828A1.006,1.006,0,0,1,11.57,9.85a1,1,0,0,1,.367.411l.9,1.827a.177.177,0,0,0,.133.1l2.021.3a1,1,0,0,1,.552,1.706Z"
                transform="translate(-2.039 -4.72)"
                fill="#ffd800"
              />
              <path
                id="Path_23385"
                data-name="Path 23385"
                d="M22.975,5.914l-.755.735L22.4,7.691a.837.837,0,0,1-1.215.882l-.932-.489-.935.491a.824.824,0,0,1-.389.1.84.84,0,0,1-.826-.981L18.28,6.65l-.754-.735a.838.838,0,0,1,.462-1.429l1.045-.152.467-.946a.832.832,0,0,1,.751-.467h0A.833.833,0,0,1,21,3.388l.465.945,1.045.152a.838.838,0,0,1,.464,1.429Z"
                transform="translate(-5.229 -2.92)"
                fill="#ffd800"
              />
              <path
                id="Path_23386"
                data-name="Path 23386"
                d="M6.25,5.914,5.5,6.65l.179,1.041a.838.838,0,0,1-1.216.882l-.932-.489-.934.491a.837.837,0,0,1-1.215-.884L1.556,6.65.8,5.914a.838.838,0,0,1,.464-1.429l1.045-.152.466-.946a.838.838,0,0,1,1.5,0l.465.945,1.045.152A.838.838,0,0,1,6.25,5.914Z"
                transform="translate(-0.546 -2.92)"
                fill="#ffd800"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};

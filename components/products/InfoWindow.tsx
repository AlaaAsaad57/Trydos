import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";

function InfoWindow() {
  const InfoMessage = useSelector(
    (state: StateInterface) => state.details.InfoMessage
  );
  let { icon, text, title, showInfoMessage, value } = InfoMessage;
  const dispatch = useDispatch();
  const handlers = useSwipeable({
    onSwipedDown: (e) => {
      dispatch({ type: "CLOSE-INFO-MESSAGE" });
    },
    delta: 10,
    trackMouse: true,
    trackTouch: true,

    touchEventOptions: {
      passive: false,
    },
  });
  return (
    <>
      {showInfoMessage && (
        <div
          className="w-[100vw] h-[100vh] bg-[#1D1D1D] opacity-75 fixed top-0 left-0 z-[999999999989]"
          onClick={() => {
            dispatch({ type: "CLOSE-INFO-MESSAGE" });
          }}
        />
      )}
      <div
        {...handlers}
        className={`flex rounded-tl-[30px] w-full  p-5 pb-[70px] rounded-tr-[30px] bg-[#F4F4F4] min-h-[200px] left-0 fixed transition-all z-[999999999999] ${
          showInfoMessage ? "bottom-[0px]" : "bottom-[-100vh]"
        } `}
      >
        <div className="flex-col w-full pt-[15px] pl-[10px] pb-[10px] pr-[25px] relative">
          <svg
            className="absolute  top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="calc(100%)"
            height="calc(100%)"
          >
            <g
              id="Rectangle_5686"
              data-name="Rectangle 5686"
              fill="none"
              stroke="#707070"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            >
              <rect
                width="calc(100%)"
                height="calc(100%)"
                rx="15"
                stroke="none"
              />
              <rect
                x="0.25"
                y="0.25"
                width="calc(100%)"
                height="calc(100%)"
                rx="14.75"
                fill="none"
              />
            </g>
          </svg>
          <div className="flex-row items-center">
            <img width={20} height={20} src={icon} />
            <span className="medium text-[15px] text-[#8D8D8D] ml-[5px]">
              {title}
            </span>
          </div>
          <div className="mt-[10px] text-[13px] regular text-[#8D8D8D]">
            {text}
          </div>
          <div className="w-full flex-row items-center justify-center mt-[9px] text-[13px] regular text-[#8D8D8D]">
            {value.map((val, i) => (
              <>
                <span>{val}</span>
                {i < value.length - 1 && (
                  <span className="ml-[9px] mr-[5px]">|</span>
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default InfoWindow;

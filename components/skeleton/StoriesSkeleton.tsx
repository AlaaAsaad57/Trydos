import Skeleton from "react-loading-skeleton";
import React from "react";

function StoriesSkeleton() {
  return (
    <div className=" stories-bar-container h-[183px] items-center flex w-full z-99999999 max-w-[1365px] justify-start">
      <div
        id="stories-bar"
        className="stories-bar  w-full h-[183px] items-center flex justify-start false"
      >
        <div
          data-pw="Add-Story-Button"
          className="w-[100px] min-w-[100px] add-story-container flex align-center justify-center h-[150px] ml-[20px]"
          style={{
            borderRadius: "20px",
            animation: "none",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="43"
            height="40"
            viewBox="0 0 43 40"
          >
            <g
              id="Rectangle_4228"
              data-name="Rectangle 4228"
              fill="#f0f0f0"
              stroke="#404040"
              stroke-width="0.4"
            >
              <rect width="43" height="40" rx="15" stroke="none"></rect>
            </g>
            <g
              id="Group_3807"
              data-name="Group 3807"
              transform="translate(-5 -408)"
            >
              <line
                id="Line_893"
                data-name="Line 893"
                y2="15"
                transform="translate(26.5 420.5)"
                fill="none"
                stroke="#5d5d5d"
                stroke-linecap="round"
                stroke-width="4"
              ></line>
              <path
                id="Path_19352"
                data-name="Path 19352"
                d="M0,0V15"
                transform="translate(34 428) rotate(90)"
                fill="none"
                stroke="#5d5d5d"
                stroke-linecap="round"
                stroke-width="4"
              ></path>
            </g>
          </svg>
        </div>
        <div
          id="stories-bar-container"
          className="false flex h-full pl-[10px] gap-[15px] items-center horizntal-scroll overflow-x-scroll overflow-y-hidden whitespace-nowrap [&amp;&gt; *]: select-none [&amp;::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {[1, 1, 1, 1, 1, 1, 1, 1, 1].map((story, index) => (
            <div
              className="relative w-[100px] h-[150px] rounded-[20px] flex"
              key={index}
            >
              <div
                className="shadow-[0_3px_6px_rgba(0,0,0,0.2)] rounded-[20px]"
                data-pw="story-element"
              >
                <div className="relative w-[100px] h-[150px] rounded-[20px] flex">
                  <Skeleton
                    width={100}
                    key={index}
                    height={150}
                    borderRadius={20}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StoriesSkeleton;

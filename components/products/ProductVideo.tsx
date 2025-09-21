"use client";
import React, { useState } from "react";
import { translateFunction } from "utils/functions";
import { getVideoUrl } from "utils/tinyUtils";

function ProductVideo({ videos, language }) {
  const [showVideo, setShowVideo] = useState(true);
  if (!showVideo) return <></>;
  return (
    <div className="relative">
      <video
        src={getVideoUrl(videos, { width: 700, height: 900 })}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        className="w-[138px] bg-[#f8f8f8] h-[200px] object-cover  rounded-15 z-10"
      />
      <OverlayText language={language} />
      <VideoBorder />
      <CloseIcon
        clickHandler={() => {
          setShowVideo(false);
        }}
      />
    </div>
  );
}
const OverlayText = ({ language }) => {
  return (
    <div
      className="z-[999] absolute top-0 left-0 bold text-[13px] w-full h-full text-[#FFFFFF] text-center items-center justify-center flex "
      style={{
        textShadow: "0px 3px 6px rgba(0, 0, 0, 0.16)",
      }}
    >
      {translateFunction("Quick Video", language)}
    </div>
  );
};

export default ProductVideo;
const VideoBorder = () => {
  return (
    <svg
      className="absolute top-0 left-0 z-[9998]"
      xmlns="http://www.w3.org/2000/svg"
      width="138"
      height="200"
      viewBox="0 0 138 200"
    >
      <g id="Path_23648" data-name="Path 23648" fill="none">
        <path
          d="M15,0H123a15,15,0,0,1,15,15V185a15,15,0,0,1-15,15H15A15,15,0,0,1,0,185V15A15,15,0,0,1,15,0Z"
          stroke="none"
        />
        <path
          d="M 15 0.5 C 11.12689971923828 0.5 7.48565673828125 2.008270263671875 4.7469482421875 4.7469482421875 C 2.008270263671875 7.48565673828125 0.5 11.12690734863281 0.5 15 L 0.5 185 C 0.5 188.8731079101562 2.008270263671875 192.5143432617188 4.7469482421875 195.2530517578125 C 7.48565673828125 197.9917297363281 11.12689971923828 199.5 15 199.5 L 123 199.5 C 126.8731002807617 199.5 130.5143432617188 197.9917297363281 133.2530517578125 195.2530517578125 C 135.9917297363281 192.5143432617188 137.5 188.8731079101562 137.5 185 L 137.5 15 C 137.5 11.12690734863281 135.9917297363281 7.48565673828125 133.2530517578125 4.7469482421875 C 130.5143432617188 2.008270263671875 126.8731002807617 0.5 123 0.5 L 15 0.5 M 15 0 L 123 0 C 131.2842712402344 0 138 6.715728759765625 138 15 L 138 185 C 138 193.2842712402344 131.2842712402344 200 123 200 L 15 200 C 6.715728759765625 200 0 193.2842712402344 0 185 L 0 15 C 0 6.715728759765625 6.715728759765625 0 15 0 Z"
          stroke="none"
          fill="#513aaf"
        />
      </g>
    </svg>
  );
};
const CloseIcon = ({ clickHandler }) => {
  return (
    <div
      onClick={() => {
        clickHandler();
      }}
      className="absolute top-[-12px] right-[-7px] cursor-pointer w-[30px] z-[9999] h-[30px] flex justify-center items-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
      >
        <g
          id="Group_12369"
          data-name="Group 12369"
          transform="translate(0.458 0)"
        >
          <g
            id="Path_23583"
            data-name="Path 23583"
            transform="translate(-0.458 0)"
            fill="#fcfcfc"
          >
            <path
              d="M 10 19.85000038146973 C 4.568689823150635 19.85000038146973 0.1500000059604645 15.43130970001221 0.1500000059604645 10 C 0.1500000059604645 4.568689823150635 4.568689823150635 0.1500000059604645 10 0.1500000059604645 C 15.43130970001221 0.1500000059604645 19.85000038146973 4.568689823150635 19.85000038146973 10 C 19.85000038146973 15.43130970001221 15.43130970001221 19.85000038146973 10 19.85000038146973 Z"
              stroke="none"
            />
            <path
              d="M 10 0.2999992370605469 C 4.651399612426758 0.2999992370605469 0.2999992370605469 4.651399612426758 0.2999992370605469 10 C 0.2999992370605469 15.34860038757324 4.651399612426758 19.70000076293945 10 19.70000076293945 C 15.34860038757324 19.70000076293945 19.70000076293945 15.34860038757324 19.70000076293945 10 C 19.70000076293945 4.651399612426758 15.34860038757324 0.2999992370605469 10 0.2999992370605469 M 10 0 C 15.52285003662109 0 20 4.477149963378906 20 10 C 20 15.52285003662109 15.52285003662109 20 10 20 C 4.477149963378906 20 0 15.52285003662109 0 10 C 0 4.477149963378906 4.477149963378906 0 10 0 Z"
              stroke="none"
              fill="#ff5f61"
            />
          </g>
          <g
            id="Group_12328"
            data-name="Group 12328"
            transform="translate(4.621 4.686)"
          >
            <line
              id="Line_888"
              data-name="Line 888"
              x2="14.122"
              transform="matrix(0.695, -0.719, 0.719, 0.695, 0.174, 10.158)"
              fill="none"
              stroke="#ff5f61"
              stroke-linecap="round"
              strokeWidth="1"
            />
            <line
              id="Line_889"
              data-name="Line 889"
              x2="14.122"
              transform="matrix(0.719, 0.695, -0.695, 0.719, 0, 0.174)"
              fill="none"
              stroke="#ff5f61"
              stroke-linecap="round"
              strokeWidth="1"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

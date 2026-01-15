import Image from "next/image";
import React from "react";

function MediaMessagePreview({ setImgs, setVid, vid, imgs }) {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-transparent flex flex-col items-center justify-start p-5 z-[99999999999999]">
      <div className="absolute top-0 left-0 w-screen h-screen bg-[#585751] opacity-60 z-[9999]" />
      <div
        className="absolute top-[29px] right-[30px] cursor-pointer z-[9999999999999]"
        onClick={() => (setImgs(null), setVid(null))}
      >
        {/* close icon (duplicated) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17.828"
          height="17.829"
          viewBox="0 0 17.828 17.829"
        >
          <g transform="translate(-67.032 -2460.283)">
            <line
              y2="21.213"
              transform="translate(83.447 2461.697) rotate(45)"
              fill="none"
              stroke="#555"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <line
              y2="21.213"
              transform="translate(83.447 2476.697) rotate(135)"
              fill="none"
              stroke="#555"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>

      {vid ? (
        <video
          src={vid}
          controls
          className="object-contain h-full w-auto bg-[#0000005d] z-[999999]"
        >
          <source src={vid} />
        </video>
      ) : (
        imgs && (
          <Image
            src={imgs}
            alt="preview"
            fill
            sizes="100vw"
            className="object-contain h-full w-auto -[9999] left-0 right-0 m-[0_auto] p-4 z-[99999999]"
          />
        )
      )}
    </div>
  );
}

export default MediaMessagePreview;

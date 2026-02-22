"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { translateFunction } from "utils/functions";
import { DisableScroll, getVideoUrl } from "utils/tinyUtils";

function ProductVideo({ videos = [], language }) {
  const [showVideo, setShowVideo] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const isRtl = language === "ar" || language === "ku";

  // 1. Embla Setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: isRtl ? "rtl" : "ltr",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  // 2. Refs for video elements to manually control play/pause
  const videoRefs = useRef([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // 3. Handle Play/Pause logic when slide changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === selectedIndex) {
        // Play the active video
        video.play().catch(() => {
          /* Handle autoplay block if necessary */
        });
      } else {
        // Pause and reset non-active videos
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [selectedIndex, expanded]); // Also re-run when expanding to ensure the right video plays

  useEffect(() => {
    if (expanded) {
      DisableScroll();
      emblaApi?.reInit();
    }
  }, [expanded, emblaApi]);
  if (!showVideo || !videos?.length) return null;
  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-99999999999998"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Main Container */}
      <div
        className={`${isRtl ? "left-[6px]" : "right-[6px]"} 
        ${
          expanded
            ? "fixed inset-0 m-auto flex items-center justify-center h-full w-full"
            : "absolute bottom-[114px] w-[138px] h-[200px]"
        }
        z-99999999999999 transition-all duration-300`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Embla Viewport */}
          <div
            className={`embla overflow-hidden p-0 w-full h-full cursor-grab active:cursor-grabbing ${
              expanded ? "max-w-[700px] h-[65vh]" : "rounded-[15px]"
            }`}
            ref={emblaRef}
          >
            <div className="embla__container flex h-full gap-[4px]">
              {videos.map((vid, index) => (
                <div
                  key={index}
                  className="embla__slide flex-[0_0_100%] min-w-0 relative h-full"
                >
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    onClick={() => !expanded && setExpanded(true)}
                    src={getVideoUrl(vid, {
                      width: 700,
                      height: 900,
                      end: expanded ? -1 : undefined,
                    })}
                    // We handle play/pause via useEffect, but keep these for initial load
                    loop
                    muted={!expanded} // Keep muted in minimized to allow autoplay
                    playsInline
                    controls={expanded}
                    className={`w-full h-full rounded-[15px] bg-black ${
                      expanded ? "object-contain" : "object-cover"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Overlay elements (Minimized Only) */}
          {!expanded && (
            <>
              <OverlayText
                language={language}
                onClick={() => setExpanded(true)}
              />
              <VideoBorder onClick={() => setExpanded(true)} />

              {/* Pagination Dots */}
              {videos.length > 1 && (
                <div className="absolute bottom-2 flex gap-1 z-1000 pointer-events-none">
                  {videos.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        selectedIndex === i ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Controls (Expanded Only) */}
          {expanded && videos.length > 1 && (
            <>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-4 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white z-100 transition-all"
              >
                {isRtl ? "→" : "←"}
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-4 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white z-100 transition-all"
              >
                {isRtl ? "←" : "→"}
              </button>
            </>
          )}
          <CloseIcon
            isExpanded={expanded}
            clickHandler={() => {
              if (expanded) {
                setExpanded(false);
              } else {
                setShowVideo(false);
              }
            }}
          />
        </div>
      </div>
    </>
  );
}

// ... Keep VideoBorder, CloseIcon, and OverlayText components as they were
export default ProductVideo;
const VideoBorder = ({ onClick }) => {
  return (
    <svg
      onClick={() => {
        onClick();
      }}
      className="absolute top-0 left-0 z-9998"
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
const CloseIcon = ({ clickHandler, isExpanded }) => {
  return (
    <div
      onClick={() => {
        clickHandler();
      }}
      className={`${
        isExpanded ? "top-[15px] right-[15px]" : "top-[-12px] right-[-7px]"
      } absolute  cursor-pointer w-[30px] z-9999 h-[30px] flex justify-center items-center`}
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
              strokeLinecap="round"
              strokeWidth="1"
            />
            <line
              id="Line_889"
              data-name="Line 889"
              x2="14.122"
              transform="matrix(0.719, 0.695, -0.695, 0.719, 0, 0.174)"
              fill="none"
              stroke="#ff5f61"
              strokeLinecap="round"
              strokeWidth="1"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
const OverlayText = ({ language, onClick }) => {
  return (
    <div
      onClick={() => {
        onClick();
      }}
      className="z-999 absolute top-0 left-0 bold text-[13px] w-full h-full text-[#FFFFFF] text-center items-center justify-center flex "
      style={{
        textShadow: "0px 3px 6px rgba(0, 0, 0, 0.16)",
      }}
    >
      {translateFunction("Quick Video", language)}
    </div>
  );
};

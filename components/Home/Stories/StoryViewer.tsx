import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Spinner from "components/global/Spinner";
import profilePlaceholder from "public/images/profileNo.png";
import VideoPreloader from "./VideoPreloader";
import ImagePreloader from "./ImagePreloader";

import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

// Using a generic story media type to keep the component independent from
// the previous `react-insta-stories` definitions.
type StoryMedia = {
  url?: string;
  type?: "image" | "video";
  duration?: number; // duration in milliseconds (images) or seconds (videos)
  [key: string]: any;
};

const DEFAULT_DURATION = 5000; // 5s for images if duration not provided

type StoryViewTimeData = {
  storyIndex: number;
  viewingTimeMs: number;
  totalTimeMs: number;
  pausedTimeMs: number;
  storyUrl?: string;
  storyType?: "image" | "video";
};

const StoryViewer = ({
  activeId,
  id,
  isPaused,
  onStoryStart,
  loader,
  currentIndex = 0,
  onPrevious,
  onNext,
  stories,
  storyContainerStyles,
  storyStyles,
  width = "100vw",
  height = "100vh",
  onAllStoriesEnd,
  onStoryEnd,
  header = null,
  onStoryViewTime,
}: {
  activeId?: string;
  id?: string;
  isPaused?: boolean;
  onStoryStart?: (index: number) => void;
  loader?: React.ReactNode;
  currentIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  stories: StoryMedia[];
  storyContainerStyles?: React.CSSProperties;
  storyStyles?: React.CSSProperties;
  width?: string;
  height?: string;
  onAllStoriesEnd?: () => void;
  onStoryEnd?: () => void;
  header?: React.ReactNode | null;
  onStoryViewTime?: (data: StoryViewTimeData) => void;
}) => {
  /* ----------------------------- Local state ---------------------------- */
  const [index, setIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0); // percentage 0-1 for current story
  const [resourceLoaded, setResourceLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number>();
  const startTimestampRef = useRef<number>(0);
  const currentDurationRef = useRef<number>(DEFAULT_DURATION);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedProgressRef = useRef<number>(0);
  const storyViewStartTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number | null>(null);
  const previousStoryIndexRef = useRef<number>(-1);

  // Sync with parent's currentIndex when it changes
  useEffect(() => {
    if (currentIndex !== index) {
      setIndex(currentIndex);
      setProgress(0);
      setResourceLoaded(false);
    }
  }, [currentIndex, index]);

  const currentStory = stories[index] as StoryMedia | undefined;
  const currentHeader = (currentStory?.header || header) as
    | {
        heading?: string;
        subheading?: string;
        profileImage?: string;
      }
    | undefined;
  const isImage = currentStory?.type !== "video"; // default to image
  const link = currentStory?.link;
  const product_slug = currentStory?.product_slug;
  /* --------------------------- Helper functions -------------------------- */
  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
  const { setSelectedStory } = useAppStore();

  // Log viewing time for a story
  const logStoryViewTime = (storyIndex: number) => {
    if (
      storyViewStartTimeRef.current !== null &&
      storyIndex >= 0 &&
      storyIndex < stories.length
    ) {
      const now = Date.now();
      const totalElapsed = now - storyViewStartTimeRef.current;
      const activeViewingTime = totalElapsed - totalPausedTimeRef.current;

      // Only log if viewing time is meaningful (at least 100ms)
      if (activeViewingTime >= 100) {
        const storyData = stories[storyIndex] as StoryMedia;
        onStoryViewTime?.({
          storyIndex,
          viewingTimeMs: activeViewingTime,
          totalTimeMs: totalElapsed,
          pausedTimeMs: totalPausedTimeRef.current,
          storyUrl: storyData?.url,
          storyType: storyData?.type || "image",
        });

        // Also log to console for debugging
        console.log(`Story ${storyIndex} viewed for ${activeViewingTime}ms`, {
          totalTime: totalElapsed,
          // pausedTime: totalPausedTimeRef.current,
        });
      }
    }
  };

  const beginProgress = (duration: number, initialProgress = 0) => {
    clearTimers();
    startTimestampRef.current = Date.now() - duration * initialProgress;
    currentDurationRef.current = duration;
    const step = () => {
      if (isPaused) return;
      const elapsed = Date.now() - startTimestampRef.current;
      const newProgress = Math.min(1, elapsed / duration);
      setProgress(newProgress);
      if (newProgress < 1 && !isPaused) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    timeoutRef.current = setTimeout(() => {
      if (!isPaused) {
        handleNext();
      }
    }, duration);
  };

  const handleNext = () => {
    clearTimers();
    setProgress(0);
    setResourceLoaded(false);
    if (index < stories.length - 1) {
      setIndex((prev) => prev + 1);
      onNext?.();
    } else {
      onAllStoriesEnd?.();
    }
  };

  const handlePrevious = () => {
    clearTimers();
    setProgress(0);
    setResourceLoaded(false);
    if (index > 0) {
      setIndex((prev) => prev - 1);
      onPrevious?.();
    } else {
      onPrevious?.(); // propagate to parent to move to prev user story
    }
  };

  /* ----------------------------- Side effects --------------------------- */
  // When index changes, notify parent and start tracking viewing time
  useEffect(() => {
    if (index >= 0 && index < stories.length) {
      // Log previous story if it exists
      if (
        previousStoryIndexRef.current >= 0 &&
        previousStoryIndexRef.current !== index
      ) {
        // Account for any active pause before logging
        if (pauseStartTimeRef.current !== null) {
          const pauseDuration = Date.now() - pauseStartTimeRef.current;
          totalPausedTimeRef.current += pauseDuration;
          pauseStartTimeRef.current = null;
        }
        logStoryViewTime(previousStoryIndexRef.current);
      }

      // Reset tracking for new story
      storyViewStartTimeRef.current = null;
      totalPausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      previousStoryIndexRef.current = index;

      onStoryStart?.(index);
    }
    return () => {
      clearTimers();
      // Log current story on unmount
      if (previousStoryIndexRef.current >= 0) {
        // Account for any active pause before logging
        if (pauseStartTimeRef.current !== null) {
          const pauseDuration = Date.now() - pauseStartTimeRef.current;
          totalPausedTimeRef.current += pauseDuration;
          pauseStartTimeRef.current = null;
        }
        logStoryViewTime(previousStoryIndexRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Kick-off progress once the media has loaded and viewer is active
  useEffect(() => {
    if (!resourceLoaded || isPaused) {
      clearTimers();
      return;
    }

    // Start tracking viewing time when resource loads
    if (storyViewStartTimeRef.current === null) {
      storyViewStartTimeRef.current = Date.now();
    }

    const duration = isImage
      ? currentStory?.duration || DEFAULT_DURATION
      : (currentStory?.duration || videoRef.current?.duration || 0) * 1000;

    if (duration > 0) {
      beginProgress(duration, pausedProgressRef.current);
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceLoaded, isPaused]);

  // Pause / resume
  useEffect(() => {
    if (isPaused) {
      pausedProgressRef.current = progress;
      clearTimers();
      if (videoRef.current) videoRef.current.pause();

      // Track when pause starts
      if (pauseStartTimeRef.current === null) {
        pauseStartTimeRef.current = Date.now();
      }
    } else {
      // Resume only if resource is loaded
      if (resourceLoaded) {
        if (!isImage && videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }

      // Calculate and accumulate paused time when resuming
      if (pauseStartTimeRef.current !== null) {
        const pauseDuration = Date.now() - pauseStartTimeRef.current;
        totalPausedTimeRef.current += pauseDuration;
        pauseStartTimeRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  /* ------------------------------ Rendering ------------------------------ */
  const Loader = loader || <Spinner />;
  const { lang } = useParams();
  return (
    <div
      className="relative flex items-center justify-center bg-black"
      style={{
        width,
        height,
        ...((storyContainerStyles as any) || {}),
      }}
    >
      {/* Header (user avatar, name, timestamp) */}
      {currentHeader && (
        <div className="absolute top-[10px] justify-start p-2 left-2 z-50 flex items-center gap-2 text-white">
          <Image
            src={currentHeader.profileImage || profilePlaceholder.src}
            alt="avatar"
            width={30}
            height={30}
            className="rounded-full object-cover w-[30px] h-[30px]"
          />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold">
              {currentHeader.heading}
            </span>
            <span className="text-xs opacity-80">
              {currentHeader.subheading}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 pt-1 px-2 z-40 flex gap-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/30 h-[2px] rounded-sm overflow-hidden justify-start items-start"
          >
            <div
              className="bg-white h-full"
              style={{
                width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`,
                boxShadow: "0 0 4px 2px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Interactive zones */}
      <div
        className="absolute left-0 top-0 h-full w-1/2 cursor-pointer z-40"
        onClick={handlePrevious}
      />
      <div
        className="absolute right-0 top-0 h-full w-1/2 cursor-pointer z-40"
        onClick={handleNext}
      />

      {/* Content */}
      {!isPaused && (
        <div
          className="flex flex-col items-center justify-center mt-[50px] w-full h-full"
          style={{
            width: "100%",
            height: "100%",
            opacity: resourceLoaded && !isPaused ? 1 : 0,
            transition: "opacity 0.15s ease",
            ...((storyStyles as any) || {}),
          }}
        >
          {isImage ? (
            <Image
              width={600}
              height={1200}
              src={currentStory?.url}
              alt="story"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="max-h-full p-[65px] h-full w-auto"
              onLoad={() => {
                setResourceLoaded(true);
              }}
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory?.url}
              className=" max-w-full object-contain  max-h-full p-[65px]"
              playsInline
              muted={activeId !== id}
              autoPlay
              preload="metadata"
              crossOrigin="anonymous"
              onLoadedMetadata={() => {
                setResourceLoaded(true);
                if (!isPaused) videoRef.current?.play();
              }}
              onCanPlay={() => {
                if (!isPaused && !resourceLoaded) {
                  setResourceLoaded(true);
                  videoRef.current?.play();
                }
              }}
              onEnded={() => {
                onStoryEnd?.();
                handleNext();
              }}
            />
          )}
        </div>
      )}

      {/* Story Link absolutely positioned at the bottom */}
      {link && (
        <div className="absolute bottom-0 left-0 w-full flex justify-center z-50 pb-4 pointer-events-none">
          {link && (
            <a href={link}>
              <a
                className="pointer-events-auto gap-[5px] items-end flex-row  regular p-3 rounded-[8px] text-[#1d1d1d] bg-[#F8F8F8]  break-all text-center text-base   no-underline backdrop-blur-xs"
                tabIndex={0}
                aria-label="Story link"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  zIndex: 99999999999999,
                  boxShadow: "0px 3px 10px #0000001f",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span>
                  <img
                    src="/icons/copyIcon.svg"
                    className="w-[20px] h-[20px]"
                  />
                </span>
                {translateFunction("View More")}
              </a>
            </a>
          )}
          {product_slug && (
            <div
              className="flex"
              onClick={() => {
                setSelectedStory(null);
              }}
            >
              <NextLink
                className="py-2 px-4 text-center flex justify-center light text-[12px] text-[#1d1d1d] bg-slate-50 rounded-md"
                data={{
                  is_product: true,
                }}
                href={`/${lang}/products/${product_slug}`}
              >
                {translateFunction("View Product")}
              </NextLink>
            </div>
          )}
        </div>
      )}

      {/* Loader overlay when resource not ready */}
      {!resourceLoaded && !isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {Loader}
        </div>
      )}

      {/* Video preloader for smooth playback */}
      <VideoPreloader
        stories={stories}
        currentIndex={index}
        isPaused={isPaused}
      />

      {/* Image preloader for instant display */}
      <ImagePreloader
        stories={stories}
        currentIndex={index}
        isPaused={isPaused}
      />
    </div>
  );
};

export default StoryViewer;

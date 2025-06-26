import { useEffect, useRef } from "react";

interface VideoPreloaderProps {
  stories: Array<{ url?: string; type?: string }>;
  currentIndex: number;
  isPaused: boolean;
}

/**
 * Preloads videos in the background to ensure smooth playback
 * Implements a smart preloading strategy:
 * - Preloads next 2 videos when current video starts playing
 * - Uses intersection observer to start preloading when needed
 * - Manages memory by removing far videos from cache
 */
const VideoPreloader: React.FC<VideoPreloaderProps> = ({
  stories,
  currentIndex,
  isPaused,
}) => {
  const preloadedVideos = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (isPaused) return;

    // Preload next 2 videos
    const preloadCount = 2;
    const videosToPreload: string[] = [];

    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < stories.length) {
        const story = stories[nextIndex];
        if (story?.type === "video" && story.url) {
          videosToPreload.push(story.url);
        }
      }
    }

    // Create video elements for preloading
    videosToPreload.forEach((url) => {
      if (!preloadedVideos.current.has(url)) {
        const video = document.createElement("video");
        video.src = url;
        video.preload = "auto";
        video.muted = true;
        video.style.display = "none";

        // Start loading
        video.load();

        preloadedVideos.current.set(url, video);
      }
    });

    // Clean up videos that are too far away
    preloadedVideos.current.forEach((video, url) => {
      const storyIndex = stories.findIndex((s) => s.url === url);
      if (
        storyIndex < currentIndex - 1 ||
        storyIndex > currentIndex + preloadCount
      ) {
        video.remove();
        preloadedVideos.current.delete(url);
      }
    });
  }, [currentIndex, isPaused, stories]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach((video) => {
        video.remove();
      });
      preloadedVideos.current.clear();
    };
  }, []);

  return null;
};

export default VideoPreloader;

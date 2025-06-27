import { useEffect, useRef } from "react";

interface ImagePreloaderProps {
  stories: Array<{ url?: string; type?: string }>;
  currentIndex: number;
  isPaused: boolean;
}

/**
 * Preloads images to ensure instant display
 * Uses browser's built-in image preloading with priority hints
 */
const ImagePreloader: React.FC<ImagePreloaderProps> = ({
  stories,
  currentIndex,
  isPaused,
}) => {
  const preloadedImages = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (isPaused) return;

    // Preload next 3 images (images are lighter than videos)
    const preloadCount = 3;
    const imagesToPreload: string[] = [];

    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < stories.length) {
        const story = stories[nextIndex];
        if (story?.type === "image" && story.url) {
          imagesToPreload.push(story.url);
        }
      }
    }

    // Create image elements for preloading
    imagesToPreload.forEach((url) => {
      if (!preloadedImages.current.has(url)) {
        const img = new Image();
        img.src = url;
        img.loading = "eager";
        img.decoding = "async";

        preloadedImages.current.set(url, img);
      }
    });

    // Clean up images that are too far away
    preloadedImages.current.forEach((img, url) => {
      const storyIndex = stories.findIndex((s) => s.url === url);
      if (
        storyIndex < currentIndex - 1 ||
        storyIndex > currentIndex + preloadCount
      ) {
        preloadedImages.current.delete(url);
      }
    });
  }, [currentIndex, isPaused, stories]);

  // Also use link preloading for the immediate next image
  useEffect(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < stories.length) {
      const nextStory = stories[nextIndex];
      if (nextStory?.type === "image" && nextStory.url) {
        // Create link element for high-priority preloading
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = nextStory.url;
        link.setAttribute("fetchpriority", "high");

        document.head.appendChild(link);

        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [currentIndex, stories]);

  return null;
};

export default ImagePreloader;

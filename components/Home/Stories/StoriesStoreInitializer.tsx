"use client";
import { useAppStore } from "store";
import { useEffect, useState } from "react";

interface StoriesStoreInitializerProps {
  initialStories: any[];
}

function StoriesStoreInitializer({
  initialStories,
}: StoriesStoreInitializerProps) {
  const { setStoryData, storiesData, _hasHydrated } = useAppStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only initialize after hydration and if we haven't already initialized
    if (
      _hasHydrated &&
      !hasInitialized &&
      initialStories?.length > 0 &&
      (!storiesData || storiesData.length === 0)
    ) {
      setStoryData(initialStories);
      setHasInitialized(true);
    }
  }, [initialStories, storiesData, setStoryData, _hasHydrated, hasInitialized]);

  return null; // This component doesn't render anything
}

export default StoriesStoreInitializer;

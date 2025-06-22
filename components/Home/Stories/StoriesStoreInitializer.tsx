"use client";
import { useAppStore } from "store";
import { useEffect } from "react";

interface StoriesStoreInitializerProps {
  initialStories: any[];
}

function StoriesStoreInitializer({
  initialStories,
}: StoriesStoreInitializerProps) {
  const { setStoryData, storiesData } = useAppStore();

  useEffect(() => {
    // Only initialize if store is empty and we have initial data
    if (initialStories.length > 0 && storiesData.length === 0) {
      setStoryData(initialStories);
    }
  }, [initialStories, storiesData, setStoryData]);

  return null; // This component doesn't render anything
}

export default StoriesStoreInitializer;

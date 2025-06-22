"use client";
import Spinner from "components/global/Spinner";
import { InView } from "react-intersection-observer";
import React, { useState } from "react";
import StoryElement from "./StoryElement";
import { useAppStore } from "store";
import { fetchStories } from "Server Requests";

interface StoriesPaginationWrapperProps {
  next_page_url: string | number;
  language: string;
  country: string;
  initialStories: any[];
}

function StoriesPaginationWrapper({
  next_page_url,
  language,
  country,
  initialStories,
}: StoriesPaginationWrapperProps) {
  const { storiesData, setStoryData } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [next_page, setNextPage] = useState(next_page_url ? 2 : 1);
  const [additionalStories, setAdditionalStories] = useState<any[]>([]);

  // Initialize store with server data if not already set
  React.useEffect(() => {
    if (initialStories.length > 0 && storiesData.length === 0) {
      try {
      } catch (error) {
        console.error("Error fetching initial stories:", error);
      }

      setStoryData(initialStories);
    }
  }, [initialStories, storiesData, setStoryData]);

  if (!next_page_url) return <></>;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-[100px]">
        <Spinner />
      </div>
    );
  }

  const getNextStories = async () => {
    setLoading(true);

    try {
      // Get user token from localStorage if available
      let userToken: string | undefined;
      if (typeof window !== "undefined") {
        const userStoriesData = localStorage.getItem("USER-STORIES");
        if (userStoriesData) {
          try {
            const parsedUserData = JSON.parse(userStoriesData);
            userToken = parsedUserData?.access_token;
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/stories/users_stories?page=${next_page}`,
        {
          headers: {
            ...(userToken && { Authorization: `Bearer ${userToken}` }),
            language: language,
            country: country,
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Stories Error: ${response.status}`);
      }

      const result = await response.json();
      const newStories = result.data?.data || [];

      // Add new stories to the existing ones
      setAdditionalStories((prev) => [...prev, ...newStories]);
      setStoryData([...storiesData, ...newStories]);

      if (result.data?.next_page_url) {
        setNextPage(next_page + 1);
      } else {
        setNextPage(null);
      }
    } catch (error) {
      console.error("Error fetching next stories:", error);
      setNextPage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {additionalStories.map((story, index) => (
        <StoryElement
          key={story.id || `additional-${index}`}
          index={storiesData.length - additionalStories.length + index}
          story={story}
        />
      ))}
      {next_page && (
        <div className="flex justify-center items-center w-[100px]">
          <InView
            className="spinner-container min-w-[80px]"
            as="div"
            onChange={(inView) => {
              if (inView && !loading) {
                getNextStories();
              }
            }}
          />
        </div>
      )}
    </>
  );
}

export default StoriesPaginationWrapper;

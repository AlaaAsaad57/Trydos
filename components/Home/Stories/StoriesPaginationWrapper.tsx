"use client";
import Spinner from "components/global/Spinner";
import { InView } from "react-intersection-observer";
import React, { useState } from "react";
import StoryElement from "./StoryElement";
import { useAppStore } from "store";

import { fetchData } from "utils/fetchData";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";

interface StoriesPaginationWrapperProps {
  next_page_url: string | number;
  language: string;
  country: string;
  initialStories: any[];
  userData: UserData | null;
}

function StoriesPaginationWrapper({
  next_page_url,
  language,
  country,
  initialStories,
  userData,
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

  const getNextStories = async () => {
    setLoading(true);

    try {
      // Get user token from localStorage if available
      let userToken: string | undefined;
      if (typeof window !== "undefined") {
        const userStoriesData = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
        if (userStoriesData) {
          try {
            userToken = userStoriesData?.access_token;
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      }
      const response = await fetchData({
        url: `/api/v1/stories/users_stories?page=${next_page}`,
        method: "GET",
        server: "stories",
        reqTitle: "Get User Stories",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      const newStories = response.data?.data || [];
      // Add new stories to the existing ones
      setAdditionalStories((prev) => [...prev, ...newStories]);
      setStoryData([...storiesData, ...newStories]);

      if (response.data?.next_page_url) {
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
          userData={userData}
        />
      ))}
      {loading && (
        <div className="flex justify-center items-center h-full w-[100px]">
          <Spinner />
        </div>
      )}
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

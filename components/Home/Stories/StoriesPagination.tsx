"use client";
import Spinner from "components/global/Spinner";
import { InView } from "react-intersection-observer";
import React, { useState } from "react";
import StoryElement from "./StoryElement";
import story from "services/story";
import { useAppStore } from "store";

function StoriesPagination({ next_page_url }: { next_page_url: string }) {
  const { storiesData, setStoryData } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [next_page, setNextPage] = useState(next_page_url ? 2 : null);
  const [data, setData] = useState([]);
  if (!next_page_url) return <></>;
  if (loading)
    return (
      <div className="flex justify-center items-center h-full w-[100px]">
        <Spinner />
      </div>
    );
  const getNextFilters = async () => {
    setLoading(true);
    if (storiesData.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      return null;
    }
    const res = await story.getStories(next_page);
    setStoryData({ ...storiesData, ...res.data });
    if (res.next_page_url) {
      setNextPage(next_page + 1);
    } else {
      setNextPage(null);
    }
    setLoading(false);
  };

  return (
    <>
      {next_page && (
        <div className="flex justify-center items-center w-[100px]">
          <InView
            className="spinner-container min-w-[80px]"
            as="div"
            onChange={(inView) => {
              if (inView && !loading) {
                getNextFilters();
              }
            }}
          ></InView>
        </div>
      )}
    </>
  );
}

export default StoriesPagination;

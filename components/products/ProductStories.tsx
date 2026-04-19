"use client";
import React, { useState } from "react";
import { SelectStory } from "store/homepage/actions";

import StoryServiceClass from "services/story";
import StoriesContainer from "components/Home/Stories/NewStories";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { GetProductStories } from "serverRequests/product";
function ProductStories({ id, children, InitialStoriesData }) {
  const { selectedStory } = useAppStore();
  let { lang } = useParams();
  const [stories, setStories] = useState(children);
  const [storiesData, setStoriesData] = useState(InitialStoriesData);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);

  const [hasEnd, setHasEnd] = useState(InitialStoriesData.length < 10);
  // @ts-ignore
  let languageVariable = lang.split("-")[1];

  const setSelectStory = (e) => {
    SelectStory(e);
  };
  const GetData = async () => {
    if (stories.length < 10) {
      setHasEnd(true);
      return;
    }
    setLoading(true);
    const data = await GetProductStories({
      page: page,
      productId: id,
    });
    setPage(page + 1);
    setStoriesData({ ...storiesData, ...data?.data });
    setStories([...stories, ...data.items]);
    setLoading(false);
    if (data.data?.length < 10) {
      setHasEnd(true);
    }
  };

  if (stories.length === 0) return <></>;

  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. Find the link that was clicked (or the link containing the clicked element)
    const link = (e.target as HTMLElement).closest(
      ".product-story",
    ) as HTMLElement | null;

    // 2. Check if the link exists and is inside this specific wrapper
    if (link && e.currentTarget.contains(link)) {
      // 3. Extract data from the 'dataset' object
      const { id } = link.dataset;

      setSelectStory(
        StoryServiceClass.configureStory(
          storiesData.find((s) => String(s.id) === String(id)),
        ),
      );

      // If you want to prevent the page from actually changing:
      // e.preventDefault();
    }
  };
  return (
    <>
      {selectedStory && selectedStory?.id && (
        <StoriesContainer stories={storiesData} selectedStory={selectedStory} />
      )}
      <div className={`stories-row flex-row w-full`} onClick={() => {}}>
        <HortiznalScrollBar
          id="product-stories-scroll-bar"
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } w-full flex-row py-[10px]`}
          dataCy="product-stories-scroll-bar"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            handleWrapperClick(e);
          }}
        >
          {stories}
        </HortiznalScrollBar>
        {!hasEnd && (
          <InView
            className="spinner-container min-w-[80px] flex justify-center items-center h-[194px]"
            as="div"
            onChange={(inView) => {
              if (inView && !loading) {
                GetData();
              }
            }}
          >
            <Spinner />
          </InView>
        )}
      </div>
    </>
  );
}

export default ProductStories;

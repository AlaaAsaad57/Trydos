"use client";
import React, { useEffect, useState } from "react";
import { SelectStory } from "store/homepage/actions";

import StoryServiceClass from "services/story";
import dynamic from "next/dynamic";
import StoryViewerSkeleton from "components/skeleton/StoryViewerSkeleton";
import { useParams } from "next/navigation";

// Lazy for the same reason as NavbarClient: keeps the cube-carousel/gesture
// stack out of the product-page bundle until a story is opened.
const StoriesContainer = dynamic(
  () => import("components/Home/Stories/NewStories"),
  { ssr: false, loading: () => <StoryViewerSkeleton /> },
);
import { useAppStore } from "store";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { GetProductStoriesData } from "serverRequests/product";

// One story card, rendered from data (id, thumbnail, has_new) — replaces the
// server-built JSX the stories action used to return.
const renderStory = (story) => (
  <div
    key={story.id}
    data-id={story.id}
    className="product-story relative"
    data-pw="Story"
    style={{ boxShadow: "0 3px 3px rgba(0, 0, 0, 0.1)" }}
  >
    <svg
      className="absolute top-0 left-0 z-40"
      xmlns="http://www.w3.org/2000/svg"
      width="111"
      height="160"
      viewBox="0 0 111 160"
    >
      <g fill="none" stroke={story.has_new ? "#513aaf" : "#D3D3D3"} strokeWidth="0.5">
        <rect width="111" height="160" rx="15" stroke="none" />
        <rect x="0.25" y="0.25" width="110.5" height="159.5" rx="14.75" fill="none" />
      </g>
    </svg>
    <img width={111} height={160} src={story.thumb} />
    <div className="inset-story-shadow absolute" />
  </div>
);

function ProductStories({ id, initialStories, InitialStoriesData }) {
  const selectedStory = useAppStore((s) => s.selectedStory);
  const isProductPage = useAppStore((s) => s.isProductPage);
  const setStoryData = useAppStore((s) => s.setStoryData);
  let { lang } = useParams();
  const [stories, setStories] = useState(initialStories);
  const [storiesData, setStoriesData] = useState(InitialStoriesData);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);

  const [hasEnd, setHasEnd] = useState(InitialStoriesData.length < 10);
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  // The story viewer reads the shared list (SelectStory, next, previous,
  // watchStory all work on store.storiesData), so this row has to put its own
  // stories there. It is a BORROW, not a handover: a product opens as an
  // intercepted modal, so the home stories bar is still mounted underneath with
  // every page it had loaded. Give the list back on the way out, or the bar is
  // left showing this product's stories.
  useEffect(() => {
    const previousStories = useAppStore.getState().storiesData;
    setStoryData(InitialStoriesData);
    return () => {
      setStoryData(previousStories);
    };
  }, []);
  const setSelectStory = (e) => {
    SelectStory(e);
  };
  const GetData = async () => {
    if (stories.length < 10) {
      setHasEnd(true);
      return;
    }
    setLoading(true);
    const data = await GetProductStoriesData({
      page: page,
      productId: id,
    });
    setPage(page + 1);
    setStoriesData([...storiesData, ...(data?.data ?? [])]);
    setStories([...stories, ...(data?.stories ?? [])]);
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
      {selectedStory && selectedStory?.id && isProductPage && (
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
          {stories?.map((story) => renderStory(story))}
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

"use client";
import React, { useEffect, useState } from "react";
import StoreisIcon from "public/svg/product/StoreisIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { SelectStory } from "store/homepage/actions";
import { translateFunction } from "utils/functions";
import StoryServiceClass from "services/story";
import StoriesContainer from "components/Home/Stories/NewStories";
import InfoWindow from "./InfoWindow";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { InView } from "node_modules/react-intersection-observer/dist";
import Spinner from "components/global/Spinner";
import { ProductStoriesPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import ProductStoriesSkeleton from "../skeleton/loaders/ProductStoriesSkeleton";
function ProductStories({ id }: ProductStoriesPropsType) {
  const {
    selectedStory,
    InfoMessage: showInfoMessageObj,
    showInfoMessage,
  } = useAppStore();
  let { lang } = useParams();
  const [stories, setStories] = useState([]);
  const [next_page, set_next_page] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const setSelectStory = (e) => {
    SelectStory(e);
  };
  const GetData = async () => {
    setLoading(true);
    const data = await StoryServiceClass.getStoriesForProducts({
      id: id,
      page: page,
    });

    setPage(page + 1);
    // @ts-ignore
    set_next_page(data?.next_page_url);
    // @ts-ignore
    setStories([...stories, ...data?.data]);
    setLoading(false);
  };
  useEffect(() => {
    GetInitailData();
  }, []);
  const GetInitailData = async () => {
    try {
      setInitialLoading(true);
      const data = await StoryServiceClass.getStoriesForProducts({
        id: id,
        page: 1,
      });
      setPage(page + 1);
      // @ts-ignore
      set_next_page(data?.next_page_url);

      setStories([
        ...stories,
        // @ts-ignore
        ...data?.data,
      ]);
      setInitialLoading(false);
    } catch (e) {
      console.error(e);
      setInitialLoading(false);
    }
  };
  if (initialLoading)
    return (
      <div
        className={`product-colors product-stories justify-center items-center flex-col  align-start relative`}
      >
        <ProductStoriesSkeleton />
      </div>
    );

  if (stories.length === 0) return <></>;
  const getStoryBorder = (story) => {
    // has new story
    if (story.stories.filter((s) => s.is_seen === false)?.length > 0) {
      return (
        <svg
          className="absolute top-0 left-0 z-40"
          xmlns="http://www.w3.org/2000/svg"
          width="111"
          height="160"
          viewBox="0 0 111 160"
        >
          <g
            id="Rectangle_6484"
            data-name="Rectangle 6484"
            fill="none"
            stroke="#513aaf"
            stroke-width="0.5"
          >
            <rect width="111" height="160" rx="15" stroke="none" />
            <rect
              x="0.25"
              y="0.25"
              width="110.5"
              height="159.5"
              rx="14.75"
              fill="none"
            />
          </g>
        </svg>
      );
    } else {
      return (
        <svg
          className="absolute top-0 left-0 z-40"
          xmlns="http://www.w3.org/2000/svg"
          width="111"
          height="160"
          viewBox="0 0 111 160"
        >
          <g
            id="Rectangle_6484"
            data-name="Rectangle 6484"
            fill="none"
            stroke="#D3D3D3"
            stroke-width="0.5"
          >
            <rect width="111" height="160" rx="15" stroke="none" />
            <rect
              x="0.25"
              y="0.25"
              width="110.5"
              height="159.5"
              rx="14.75"
              fill="none"
            />
          </g>
        </svg>
      );
    }
  };
  return (
    <div
      className={`product-colors pr-0 product-stories flex-col  align-start relative mt-[12px] bg-transparent`}
    >
      {showInfoMessageObj.showInfoMessage && <InfoWindow />}
      {selectedStory && selectedStory?.id && (
        <StoriesContainer stories={stories} selectedStory={selectedStory} />
      )}
      <div className="colors-label flex-col text-[#1d1d1d] regular text-[11px] gap-[4px]">
        <StoreisIcon data-cy="StoriesIcon" />
        <div className="flex-row gap-[11px] items-baseline">
          <span>{translate("Product Story")}</span>
          <svg
            id="Group_14553"
            data-name="Group 14553"
            xmlns="http://www.w3.org/2000/svg"
            width="9.996"
            height="9.996"
            viewBox="0 0 9.996 9.996"
          >
            <path
              id="Subtraction_1"
              data-name="Subtraction 1"
              d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
              transform="translate(0 1.969)"
              fill="#c4c2c2"
            />
            <path
              id="Path_21380"
              data-name="Path 21380"
              d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
              transform="translate(-0.332 0.375)"
              fill="#c4c2c2"
            />
            <rect
              id="Rectangle_4714"
              data-name="Rectangle 4714"
              width="9.61"
              height="9.996"
              transform="translate(0.386)"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <div className={`stories-row flex-row w-100`} onClick={() => {}}>
        <HortiznalScrollBar
          id="product-stories-scroll-bar"
          className="w-full flex-row py-[10px]"
          dataCy="product-stories-scroll-bar"
        >
          {stories?.map((story, index) => (
            <div
              key={index}
              className="product-story relative"
              data-cy="Story"
              style={{
                boxShadow: "0 3px 3px rgba(0, 0, 0, 0.1)",
              }}
              onClick={() =>
                setSelectStory(StoryServiceClass.configureStory(story))
              }
            >
              {getStoryBorder(story)}
              <img
                width={111}
                height={160}
                src={StoryServiceClass.getThumb(
                  // @ts-ignore
                  story.stories[0]?.full_video_path ||
                    // @ts-ignore
                    story.stories[0]?.photo_path,
                  // @ts-ignore
                  Boolean(story.stories[0]?.full_video_path)
                )}
              />
              <div className="inset-story-shadow absolute" />
            </div>
          ))}
        </HortiznalScrollBar>
        {next_page && (
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
    </div>
  );
}

export default ProductStories;

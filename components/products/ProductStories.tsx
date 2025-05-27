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
function ProductStories({ id }) {
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
    set_next_page(data.next_page_url);
    setStories([...stories, ...data.data]);
    setLoading(false);
  };
  useEffect(() => {
    GetData();
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(".stories-row");
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);

  return (
    <div
      className={`product-colors product-stories flex-col  align-start relative`}
    >
      {showInfoMessageObj.showInfoMessage && <InfoWindow />}
      {selectedStory && selectedStory?.id && (
        <StoriesContainer stories={stories} selectedStory={selectedStory} />
      )}
      <div className="colors-label flex-row align-center">
        <StoreisIcon data-cy="StoriesIcon" />
        <span style={{ marginLeft: "5px" }}>{translate("Product Story")}</span>
        <ColorsInfo
          data-cy="QuestionMark"
          style={{ marginLeft: "9px" }}
          onClick={() => {
            showInfoMessage({
              showInfoMessage: true,
              title: `${translate("Product Story")}`,
              text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
              icon: "/svg/product/StoreisIcon.svg",
              value: [],
            });
          }}
        />
      </div>

      <div className={`stories-row flex-row w-100`} onClick={() => {}}>
        {stories?.map((story, index) => (
          <div
            key={index}
            className="product-story relative"
            data-cy="Story"
            onClick={() =>
              setSelectStory(StoryServiceClass.configureStory(story))
            }
          >
            <img
              width={135}
              height={194}
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

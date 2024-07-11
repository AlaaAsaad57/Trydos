"use client";
import React, { useEffect } from "react";
import StoreisIcon from "public/svg/product/StoreisIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { useDispatch, useSelector } from "react-redux";
import { SelectStory } from "store/homepage/actions";
import { configureStory, getThumb } from "utils/functions";
import StoryServiceClass from "services/story";
import StoriesContainer from "components/Home/Stories/NewStories";
import InfoWindow from "./InfoWindow";
function ProductStories() {
  const stories = useSelector((state: any) => state.homepage.storiesData);
  const dispatch = useDispatch();
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const setSelectStory = (e) => {
    dispatch(SelectStory(e));
  };
  useEffect(() => {
    StoryServiceClass.getStories();
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
  const showInfoMessage = useSelector(
    (state: any) => state.details.showInfoMessage
  );
  return (
    <div
      className={`product-colors product-stories flex-col  align-start relative`}
    >
      {<InfoWindow />}
      {selectedStory?.id && (
        <StoriesContainer
          activeId={selectedStory?.id}
          selectedStory={selectedStory}
        />
      )}
      <div className="colors-label flex-row align-center">
        <StoreisIcon />
        <span style={{ marginLeft: "5px" }}>Product Story</span>
        <ColorsInfo
          style={{ marginLeft: "9px" }}
          onClick={() => {
            dispatch({
              type: "SHOW-INFO-MESSAGE",
              payload: {
                showInfoMessage: true,
                title: `Product Story`,
                text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
                icon: "/svg/product/StoreisIcon.svg",
                value: [],
              },
            });
          }}
        />
      </div>

      <div className={`stories-row flex-row w-100`} onClick={() => {}}>
        {stories?.map((story, index) => (
          <div
            key={index}
            className="product-story relative"
            onClick={() => setSelectStory(configureStory(story))}
          >
            <img
              width={135}
              height={194}
              src={getThumb(
                story.stories[0].full_video_path || story.stories[0].photo_path,
                Boolean(story.stories[0].full_video_path)
              )}
            />
            <div className="inset-story-shadow absolute" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductStories;

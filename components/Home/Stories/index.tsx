"use client";

import dynamic from "next/dynamic";
const StoryElement = dynamic(() => import("./StoryElement"), { ssr: false });
const AddStory = dynamic(() => import("../AddStory"), { ssr: false });
import { useDispatch, useSelector } from "react-redux";
import { GetUnviewedStory, SelectStory } from "store/homepage/actions";
import { Story } from "models/story";
function Index() {
  const storiesData = useSelector((state: any) => state.homepage.storiesData);
  const loading = useSelector((state: any) => state.homepage.loading);
  const dispatch = useDispatch();
  const setSelectStory = (e: Story) => {
    dispatch(SelectStory(e));
  };
  const getBorderWidth = (): number => {
    let elem =
      typeof document !== "undefined" &&
      document.querySelector(".site-container");
    if (elem?.clientWidth < 1443) return elem?.clientWidth;
    else return 1433;
  };
  if (typeof document !== "undefined") {
    const slider: HTMLDivElement = document?.querySelector(".stories-bars");
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
  const user = useSelector((state: any) => state.auth.user);
  return (
    <div className="stories-bar-container">
      <div id="stories-bar" className="stories-bar">
        <div className="stories-bars">
          {user?.id && <AddStory />}

          {storiesData.map((story, index) => (
            <StoryElement
              key={index}
              index={index}
              story={story}
              select={(e) => {
                setSelectStory(e);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Index;

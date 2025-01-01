"use client";
import "styles/stories.css";
import dynamic from "next/dynamic";
import StoryElement from "./StoryElement";
const AddStory = dynamic(() => import("../AddStory"), { ssr: false });
import { useDispatch, useSelector } from "react-redux";
import { SelectStory } from "store/homepage/actions";
import { Story } from "models/story";
import Skeleton from "react-loading-skeleton";
import { useEffect, useState } from "react";
import { Sendevent } from "utils/functions";

function Index() {
  const storiesData = useSelector(
    (state: StateInterface) => state.homepage.storiesData
  );
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const setSelectStory = (e: Story) => {
    dispatch(SelectStory(e));
  };
  const getBorderWidth = (): number => {
    if (typeof window === "undefined") return null;
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
      Sendevent({
        event: "programming_event",
        value: "scroll_stories_in_home_event",
      });
    });
  }
  const user = useSelector((state: StateInterface) => state.auth.user);
  useEffect(() => {
    setShow(true);
  }, []);
  return (
    <>
      {!storiesData ? (
        <div className="stories-bar-container">
          <div id="stories-bar" className="stories-bar">
            <div className="stories-bars">
              {user?.id && <AddStory />}

              {[1, 1, 1, 1, 1, 1].map((story, index) => (
                <Skeleton
                  width={100}
                  key={index}
                  height={150}
                  borderRadius={20}
                  style={{ marginLeft: "5px" }}
                />
              ))}
            </div>
          </div>
          {/* {show && (
            <svg
              id="stories-border2"
              className="border"
              xmlns="http://www.w3.org/2000/svg"
              width={getBorderWidth()}
              height="0.5"
            >
              <line
                id="Line_1107"
                data-name="Line 1107"
                x2={getBorderWidth()}
                transform="translate(0 0.25)"
                fill="none"
                stroke="#3c3c3c"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
            </svg>
          )} */}
        </div>
      ) : (
        (storiesData.length > 0 || user?.id) && (
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
            <svg
              id="stories-border2"
              className="border"
              xmlns="http://www.w3.org/2000/svg"
              width={getBorderWidth()}
              height="0.5"
            >
              <line
                id="Line_1107"
                data-name="Line 1107"
                x2={getBorderWidth()}
                transform="translate(0 0.25)"
                fill="none"
                stroke="#3c3c3c"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
            </svg>
          </div>
        )
      )}
    </>
  );
}

export default Index;

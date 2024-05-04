import React from "react";
import ReactInstaStories from "react-insta-stories";
import {
  GetUnviewedStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from "components/Home/Stories/CloseIcon";
import { useSwipeable } from "react-swipeable";
import Loader from "../components/global/Loader";
function StoriesLists({
  currentStoryId,
  story,
  setCurrentStoryId,
  selectedIndex,
  setSelectStory,
  index,
}) {
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const storiesData = useSelector((state: any) => state.homepage.storiesData);
  const dispatch = useDispatch();
  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      dispatch(setNextStory(story.id));
    },
    onSwipedRight: (eventData) => {
      dispatch(setPreviousStory(story.id));
    },
    onSwipedUp: () => {
      dispatch(setPreviousStory(null));
    },
    trackMouse: true,
    trackTouch: true,
    touchEventOptions: {
      passive: false,
    },
  });
  return (
    <>
      <div
        {...handlers}
        className={`fixed-layout fixed-stories ${
          selectedStory?.id === story.id
            ? "active-story"
            : selectedIndex() > index
            ? "prev-story"
            : "next-story"
        }`}
        style={{
          position: "fixed",
          left: "0px",
          top: "0px",
          zIndex: "999999999999999",
        }}
      >
        <CloseIcon
          close={() => {
            setSelectStory(null);
            setCurrentStoryId(0);
          }}
        />
        {selectedStory?.id === story.id && (
          <ReactInstaStories
            key={story.id.id}
            preloadCount={3}
            loader={<Loader style={{}} />}
            currentIndex={GetUnviewedStory(selectedStory)}
            onPrevious={() =>
              currentStoryId > 0
                ? setCurrentStoryId(currentStoryId - 1)
                : dispatch(setPreviousStory(story.id))
            }
            onNext={() =>
              currentStoryId < story.stories.length - 1
                ? setCurrentStoryId(currentStoryId + 1)
                : dispatch(setNextStory(story.id))
            }
            stories={selectedStory.stories}
            storyContainerStyles={{
              width: "100%",
              height: "100%",
              display: "flex",
            }}
            storyStyles={{
              width: "100wv",
              height: "auto",
              minWidth: "90px",
              maxHeight: "96vh",
              maxWidth: "96vw",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            width={"100vw"}
            height={"100vh"}
            onAllStoriesEnd={() => {
              setTimeout(() => {
                setCurrentStoryId(0);
                dispatch(setNextStory(selectedStory.id));
              }, 10);
            }}
            onStoryEnd={() =>
              currentStoryId < story.stories.length - 1
                ? setCurrentStoryId(currentStoryId + 1)
                : dispatch(setNextStory(story.id))
            }
          />
        )}
      </div>
    </>
  );
}

export default StoriesLists;

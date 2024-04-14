import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import CloseIcon from "./CloseIcon";
import dynamic from "next/dynamic";
import StoryService from "services/story";
import { GetUnviewedStory } from "../../../store/homepage/actions";
import { Story } from "modelsstory";
const Stories = dynamic(() => import("react-insta-stories"), { ssr: false });
function StoriesComponent() {
  const [currentStoryId, setCurrentStoryId] = useState(0);
  const selectedStory = useSelector(
    (state: any) => state.homepage.selectedStory
  );
  const renderStories = useSelector(
    (state: any) => state.homepage.renderStories
  );
  const storiesData = useSelector((state: any) => state.homepage.storiesData);
  const dispatch = useDispatch();
  const setSelectStory = (e: Story) => {
    dispatch(SelectStory(e));
  };
  useEffect(() => {
    if (selectedStory)
      StoryService.WatchStory(
        selectedStory.stories[currentStoryId].id,
        selectedStory.id
      );
  }, [currentStoryId]);
  useEffect(() => {
    if (selectedStory?.id) {
      setCurrentStoryId(GetUnviewedStory(selectedStory));
      console.log(GetUnviewedStory(selectedStory), selectedStory);
    }
  }, [renderStories, selectedStory]);
  return (
    <>
      {storiesData.map(
        (story, key) =>
          selectedStory?.id === story.id && (
            <div
              className="fixed-layout"
              style={{
                position: "fixed",
                left: "0px",
                top: "0px",
                zIndex: "999999999999999",
              }}
              key={key}
            >
              <CloseIcon
                close={() => {
                  setSelectStory(null);
                  setCurrentStoryId(0);
                }}
              />
              <Stories
                key={story.id.id}
                preloadCount={3}
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
            </div>
          )
      )}
    </>
  );
}

export default StoriesComponent;

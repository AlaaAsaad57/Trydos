import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import dynamic from "next/dynamic";
import StoryService from "services/story";
import { GetUnviewedStory } from "../../../store/homepage/actions";
import { Story } from "models/story";
import StoriesLists from "utils/Carousel";
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
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      setCurrentStoryId(GetUnviewedStory(selectedStory));
    }
    return () => {
      document.documentElement.style.overflow = "initial";
      document.body.style.overflow = "initial";
    };
  }, [renderStories, selectedStory]);
  return (
    <>
      {storiesData.map(
        (story, key) =>
          selectedStory?.id === story.id && (
            <StoriesLists
              currentStoryId={currentStoryId}
              setCurrentStoryId={(e) => setCurrentStoryId(e)}
              story={story}
              key={key}
              setSelectStory={(e) => setSelectStory(e)}
            />
          )
      )}
    </>
  );
}

export default StoriesComponent;

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "components/global/Loader";
import { setNextStory, setPreviousStory } from "store/homepage/actions";
import { StoryType } from "models/story";
import ReactInstaStories from "utils/libs/react-insta-stories-master/src";
import { Sendevent } from "utils/functions";

interface Props {
  story: StoryType;
  active: boolean;
  isPaused: boolean;
}
function StoryHolder({ story, active, isPaused }: Props) {
  const dispatch = useDispatch();
  const selectedStory = useSelector(
    (state: StateInterface) => state.homepage.selectedStory
  );
  const [currentStoryId, setCurrentStoryId] = useState(0);

  useEffect(() => {
    if (selectedStory.id === story.id) {
      setCurrentStoryId(0);
    } else {
      setCurrentStoryId(0);
    }
  }, [selectedStory]);
  useEffect(() => {}, []);
  return (
    <>
      <div className="story-holder">
        {
          <ReactInstaStories
            activeId={selectedStory.id}
            id={story.id}
            key={story.id}
            isPaused={isPaused || !active}
            preloadCount={1}
            loader={<Loader style={{}} />}
            currentIndex={0}
            onPrevious={() => {
              Sendevent({
                event: "button_clicked",
                value: "change_story_in_stroyscreen_event",
              });
              if (active) {
                if (currentStoryId > 0) {
                  setCurrentStoryId(currentStoryId - 1);
                } else {
                  dispatch(setPreviousStory(story.id));
                }
              }
            }}
            onNext={() => {
              Sendevent({
                event: "button_clicked",
                value: "change_story_in_stroyscreen_event",
              });
              if (active) {
                if (currentStoryId < story.stories.length - 1) {
                  setCurrentStoryId(currentStoryId + 1);
                } else {
                  dispatch(setNextStory(story.id));
                }
              }
            }}
            stories={story.stories}
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
                if (active) {
                  setCurrentStoryId(0);

                  dispatch(setNextStory(story.id));
                }
              }, 10);
            }}
            onStoryEnd={() => {}}
          />
        }
      </div>
    </>
  );
}

export default StoryHolder;

import React from "react";
import { GetUnviewedStory } from "store/homepage/actions";
import StoryChatRow from "../components/StoryChatRow";

import { useAppStore } from "store";
function StoriesList() {
  const { storiesData, setSelectedStory } = useAppStore();

  const setSelectStory = (e) => {
    setSelectedStory(e);
  };
  return (
    <>
      <div className="chat-list-items">
        {storiesData.map((story, index) => (
          <StoryChatRow
            key={index}
            index={index}
            story={story}
            stories={story}
            viewedStory={story.stories[GetUnviewedStory(story)]}
            select={(e) => setSelectStory(e)}
          />
        ))}
      </div>
    </>
  );
}

export default StoriesList;

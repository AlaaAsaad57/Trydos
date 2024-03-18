import React from "react";
import { GetUnviewedStory, SelectStory } from "store/homepage/actions";
import StoryChatRow from "../components/StoryChatRow";
import { useDispatch, useSelector } from "react-redux";
function StoriesList() {
  const storiesData = useSelector((state) => state.homepage.storiesData);
  const loading = useSelector((state) => state.homepage.loading);
  const dispatch = useDispatch();
  const setSelectStory = (e) => {
    dispatch(SelectStory(e));
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

"use client";

import PlusIcon from "public/svg/chatplus.svg";
import { useAppStore } from "store";
import AddStoryWidget from "./Stories/AddStoryWidget";
import {
  COOKIE_NAMES,
  UserData,
  getCookie,
} from "utils/cookies/cookie-manager";

function AddStory() {
  const {
    userStories,
    setNameModal,
    addStoryEnable,
    setAddStory,
    setShouldAuthinticated,
    setLoginOpen,
    user,
  } = useAppStore();
  const handleClick = () => {
    if (userStories) {
      console.log(userStories, userStories.id);
      const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
      if (user?.name?.length > 0) {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.UPLOAD_STORY_BUTTON,
        // });
        setAddStory(true);
      } else {
        setNameModal(true);
      }
    } else {
      if (user && user?.phone !== "0") setShouldAuthinticated(true);
      else setLoginOpen(true);
    }
  };
  return (
    <>
      {addStoryEnable && (
        <AddStoryWidget
          onClose={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CLOSE_ADD_STORY_WIDGET_BUTTON,
            // });
            setAddStory(false);
          }}
        />
      )}
      <div
        data-cy="Add-Story-Button"
        className="story-element-container add-story-container flex align-center justify-center ml-[20px]"
        style={{
          borderRadius: "20px",
          animation: "none",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          handleClick();
        }}
      >
        <PlusIcon />
      </div>
    </>
  );
}

export default AddStory;

"use client";

import PlusIcon from "public/svg/chatplus.svg";
import { useAppStore } from "store";
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
      if (user && user?.phone !== "0") setShouldAuthinticated("open Story");
      else setLoginOpen(true);
    }
  };
  return (
    <>
      <div
        data-cy="Add-Story-Button"
        className="w-[100px] min-w-[100px] add-story-container flex align-center justify-center h-[150px] ml-[20px]"
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

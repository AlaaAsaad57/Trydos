"use client";

import { useAppStore } from "store";

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
    if (userStories || !userStories?.need_auth) {
      const user = useAppStore.getState().userProfile;
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
        <img src="/icons/chatplus.svg" />
      </div>
    </>
  );
}

export default AddStory;

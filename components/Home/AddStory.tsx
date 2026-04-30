"use client";

import Spinner from "components/global/Spinner";
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
    storiesRefreshing,
  } = useAppStore();

  const handleClick = () => {
    console.log(storiesRefreshing);
    if (storiesRefreshing) return;
    if (userStories && !userStories?.need_auth) {
      const user = useAppStore.getState().userProfile;
      if (user?.name?.length > 0 && user?.phone !== "0") {
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
    <div
      data-cy="Add-Story-Button"
      className="relative w-[100px] min-w-[100px] add-story-container flex items-center justify-center h-[150px] ml-[20px] rounded-[20px] bg-[#f0f0f0] overflow-hidden"
      onClick={handleClick}
    >
      {storiesRefreshing ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] animate-fade-in">
          <Spinner />
        </div>
      ) : (
        <img src="/icons/chatplus.svg" />
      )}
    </div>
  );
}

export default AddStory;

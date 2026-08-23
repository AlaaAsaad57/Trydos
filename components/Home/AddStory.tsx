"use client";

import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { isGuestName } from "utils/tinyUtils";

function AddStory() {
  const {
    userStories,
    setNameModal,
    addStoryEnable,
    setAddStory,
    setShouldAuthinticated,
    setLoginOpen,
    user,
    userProfile: userData,
    storiesRefreshing,
  } = useAppStore();

  const handleClick = () => {
    if (storiesRefreshing) return;

    const userProfile = useAppStore.getState().userProfile;
    const currentUser = userProfile || user;

    const hasValidPhone = currentUser &&
      currentUser.phone !== "0" &&
      currentUser.phone !== 0 &&
      currentUser.phone !== null &&
      currentUser.phone !== undefined &&
      String(currentUser.phone).trim() !== "" &&
      String(currentUser.phone).length >= 3;
    if (!hasValidPhone) {
      setLoginOpen(true);
      return;
    }

    if (userStories && !userStories?.need_auth) {
      if (currentUser?.name?.length > 0 && !isGuestName(currentUser?.name)) {
        setAddStory(true);
      } else {
        setNameModal(true);
      }
    } else {
      setShouldAuthinticated("open Story");
    }
  };
  const isAllowedToUploadStories = () => {
    const isAllowedToUploadStories = userData?.is_allowed_to_upload_story;
    if (isAllowedToUploadStories === null || isAllowedToUploadStories === undefined) return false
    if (isAllowedToUploadStories === 0) return false
    if (isAllowedToUploadStories && isAllowedToUploadStories === 1 || parseInt(isAllowedToUploadStories) === 1||isAllowedToUploadStories===true) return true;
  }


  if (isAllowedToUploadStories()) {
    return (
      <div
        data-pw="Add-Story-Button"
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
  } else return <></>
}

export default AddStory;

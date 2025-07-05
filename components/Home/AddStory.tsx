"use client";

import PlusIcon from "public/svg/chatplus.svg";
import { AddStoryAction } from "store/homepage/actions";
import { revalidateStories } from "utils/serverActions";
import dynamic from "next/dynamic";

import { useAppStore } from "store";
import AddStoryWidget from "./Stories/AddStoryWidget";
import {
  COOKIE_NAMES,
  UserData,
  getCookie,
} from "utils/cookies/cookie-manager";

function AddStory() {
  const { userStories, setNameModal, addStoryEnable, setAddStory } =
    useAppStore();

  if (userStories)
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
            const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
            if (user?.name?.length > 1) {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.UPLOAD_STORY_BUTTON,
              // });
              setAddStory(true);
            } else {
              setNameModal(true);
            }
          }}
        >
          <PlusIcon />
        </div>
      </>
    );
  else return <></>;
}

export default AddStory;

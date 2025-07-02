"use client";
import StoryService from "services/story";
import { useState } from "react";
const CircularProgressbarComponent = dynamic(() => import("./Progress"), {
  ssr: false,
});
import PlusIcon from "public/svg/chatplus.svg";
import { AddStoryAction } from "store/homepage/actions";
import { revalidateStories } from "utils/serverActions";
import dynamic from "next/dynamic";

import { useAppStore } from "store";
import AddStoryWidget from "./Stories/AddStoryWidget";
import { fetchStories } from "Server Requests";
import { useParams } from "next/navigation";
import { UnAuthintacetedAction } from "utils/tinyUtils";
import { showErrorNotification } from "@/store/notifications/reducer";
import { translateFunction } from "utils/functions";

function AddStory() {
  const { user, setNameModal, addStoryEnable, setAddStory } = useAppStore();

  if (user)
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
            if (JSON.parse(localStorage.getItem("USER"))?.name?.length > 1) {
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

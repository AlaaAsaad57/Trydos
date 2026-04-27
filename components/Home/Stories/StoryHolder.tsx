import { useState } from "react";

import TransParentLoader from "components/global/TransParentLoader";
import {
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import StoryViewer from "./StoryViewer";
import { useAppStore } from "store";
import StoryServiceClass from "services/story";
import {
  showSuccessNotification,
  showErrorNotification,
} from "store/notifications/reducer";
import { getUserStories, LogError, translateFunction } from "utils/functions";
import { fetchStoriesForUser } from "serverRequests";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
import { ConfirmModal } from "components/global/ConfirmModal";
function StoryHolder({ story, active, isPaused }) {
  const { language, country, setStoryData, shouldAuthinticated } =
    useAppStore();
  const userStories = useAppStore.getState().userStories;
  const [currentStoryId, setCurrentStoryId] = useState(
    userStories?.id !== story.id ? 0 : story?.stories?.length - 1,
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getUserStories();
  // check if the user is the owner of the story
  const isOwner = user?.id === story?.id;
  console.log(getUserStories(), "story holder user");
  const handleDeleteStory = async () => {
    setLoading(true);
    try {
      const storyId = story.stories[currentStoryId]?.id;
      const deletedIndex = currentStoryId;

      const response = await StoryServiceClass.deleteStory(storyId);

      const userToken = user?.access_token;
      const storiesResult = await fetchStoriesForUser(
        language,
        country,
        1,
        userToken,
      );
      let lastStoryData = story.stories;
      setStoryData(storiesResult.data);
      setShowDeleteModal(false);
      setLoading(false);
      if (lastStoryData.length === 1) {
        setCurrentStoryId(0);
        setNextStory(story.id);
      } else {
        const nextStoriesLength = lastStoryData.length - 1;
        const nextIndex = Math.min(deletedIndex, nextStoriesLength - 1);
        setCurrentStoryId(Math.max(0, nextIndex));
      }
      // here we should navigate to next user story if there is one, if not navigate to next user story, if there is no previous user story close the story viewer

      showSuccessNotification(
        translateFunction(`${response?.message}`) ||
          translateFunction("Story deleted successfully."),
      );
    } catch (err: any) {
      LogError({
        error: err,
        scenario: "Error in Delete User Story",
      });
      setShowDeleteModal(false);
      setLoading(false);
      showErrorNotification(
        err?.message || translateFunction("Failed to delete story."),
      );
    }
  };
  const handleReportStory = async () => {
    setLoading(true);
    try {
      // Placeholder for future API call
      // const storyId = story.stories[currentStoryId]?.id;
      // await StoryServiceClass.reportStory(storyId);
      showSuccessNotification(
        translateFunction("Story reported successfully."),
      );
      setShowReportModal(false);
    } catch (err) {
      showErrorNotification(translateFunction("Failed to report story."));
      setShowReportModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="story-holder relative w-full h-full flex items-center justify-center"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {active && (
        <div className="z-99 top-[30px] right-[20px] absolute flex flex-row items-center gap-x-2">
          {isOwner && (
            <span
              className="cursor-pointer pr-5"
              tabIndex={0}
              aria-label="Delete story"
              onClick={() => setShowDeleteModal(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setShowDeleteModal(true);
              }}
            >
              <img
                data-cy={"delete-story-icon"}
                src="/icons/DeleteIcon.svg"
                className="w-[22px] h-[22px] fill-white"
              />
            </span>
          )}
          {!isOwner && (
            <span
              className="cursor-pointer pr-5"
              style={{
                paddingBottom: "7px",
              }}
              tabIndex={0}
              aria-label="Report story"
              onClick={() => setShowReportModal(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setShowReportModal(true);
              }}
            >
              <img
                data-cy="report-story-icon"
                src="/icons/ReportOrderItemIcon.svg"
                className="w-[22px] h-[22px] fill-white"
              />
            </span>
          )}
          <span
            className="cursor-pointer p-2"
            onClick={() => {
              SelectStory(null);
            }}
            tabIndex={0}
            aria-label="Close story viewer"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") SelectStory(null);
            }}
          >
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fill-rule="evenodd"
              clip-rule="evenodd"
            >
              <path
                d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z"
                fill="#fafafa"
              />
            </svg>
          </span>
        </div>
      )}
      {showDeleteModal && (
        <ConfirmModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteStory}
          loading={loading}
          type="Delete"
          showModal={showDeleteModal}
          confirmMessage={"Are you sure you want to delete this story?"}
          confirmTilte={"Delete Story"}
          dataCy={"delete-story-confirm-modal-button"}
        />
      )}
      {showReportModal && (
        <ConfirmModal
          onCancel={() => setShowReportModal(false)}
          onConfirm={handleReportStory}
          loading={loading}
          type="Report"
          showModal={showReportModal}
          confirmMessage={"Are you sure you want to report this story?"}
          confirmTilte={"Report Story"}
        />
      )}
      <StoryViewer
        activeId={String(story.id)}
        id={String(story.id)}
        key={`${story.id}-${currentStoryId}`}
        isPaused={
          showDeleteModal || !active || showReportModal || shouldAuthinticated
        }
        onStoryStart={(e) => {
          if (active && story?.stories?.[e]) {
            const s: any = story.stories[e];
            if (s?.id) {
              StoryServiceClass.WatchStory(s.id, story.id as any);
              let url = window.location.pathname;
              GAevent({
                action: GA_EVENT_NAMES.VIEW_STORY,
                params: {
                  user_id_custom: auth.UserID(),
                  story_id: s.id,
                  item_id: s.product_id,
                  item_name: s.product_id,
                  story_type: s.full_video_path ? "video" : "image",
                  link: s?.link,
                  product_link: Boolean(s.product_id),
                  screen_name: url?.includes("/products")
                    ? GA_GLOBAL_SCREEN.PRODUCT_SCREEN
                    : GA_GLOBAL_SCREEN.HOME_SCREEN,
                  screen_path: url,
                },
              });
            }
          }
        }}
        loader={<TransParentLoader />}
        currentIndex={currentStoryId}
        onPrevious={() => {
          if (active) {
            if (currentStoryId > 0) {
              setCurrentStoryId(currentStoryId - 1);
            } else {
              setPreviousStory(story.id);
            }
          }
        }}
        onNext={() => {
          if (active) {
            if (currentStoryId < story.stories.length - 1) {
              setCurrentStoryId(currentStoryId + 1);
            } else {
              setNextStory(story.id);
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
          width: "100vw",
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
          if (active) {
            setCurrentStoryId(0);
            setNextStory(story.id);
          }
        }}
        onStoryEnd={() => {}}
      />
    </div>
  );
}

export default StoryHolder;

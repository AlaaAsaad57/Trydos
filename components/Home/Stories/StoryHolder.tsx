import { useState } from "react";

import TransParentLoader from "components/global/TransParentLoader";
import {
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import StoryViewer from "./StoryViewer";
import ReportStoryModal from "./ReportStoryModal";
import { useAppStore } from "store";
import StoryServiceClass from "services/story";
import {
  showSuccessNotification,
  showErrorNotification,
} from "store/notifications/reducer";
import { getUserStories, LogError, translateFunction } from "utils/functions";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
import { ConfirmModal } from "components/global/ConfirmModal";
function StoryHolder({ story, active, isPaused }) {
  const { shouldAuthinticated, removeStory, userStories } = useAppStore();
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
      const totalStories = story.stories.length;

      // Throws if the delete fails, so a failed request is no longer mistaken
      // for a success (which previously left the story visible after a
      // "deleted successfully" message).
      await StoryServiceClass.deleteStory(storyId);

      // Decide navigation BEFORE mutating the store. When this was the user's
      // only story, move to the next user (still present in the store here);
      // otherwise clamp to a valid index within the remaining stories.
      if (totalStories <= 1) {
        setCurrentStoryId(0);
        setNextStory(story.id);
      } else {
        const nextIndex = Math.min(deletedIndex, totalStories - 2);
        setCurrentStoryId(Math.max(0, nextIndex));
      }

      // Optimistically remove the deleted story from the store so the viewer
      // and the stories bar update immediately and reliably — without
      // depending on a potentially stale server refetch.
      removeStory(story.id, storyId);

      setShowDeleteModal(false);
      setLoading(false);

      showSuccessNotification(
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
          {!isOwner && userStories && (
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
              {/* Flag = universally understood "report" affordance; white
                  stroke keeps it legible on the dark story container. */}
              <svg
                data-cy="report-story-icon"
                className="w-[22px] h-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 21V4" />
                <path d="M4 4h11l-1.5 3.5L15 11H4" fill="#ffffff" />
              </svg>
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
        <ReportStoryModal
          storyId={
            story.stories[currentStoryId]?.id || story.stories[0]?.id
          }
          onClose={() => setShowReportModal(false)}
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

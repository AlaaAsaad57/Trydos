import { useEffect, useState } from "react";
import ReportOrderItemIcon from "public/svg/ReportOrderItemIcon.svg";
import TransParentLoader from "components/global/TransParentLoader";
import {
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";
import StoryViewer from "./StoryViewer";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import StoryServiceClass from "services/story";
import { StoryHolderPropsType } from "models/componentType/StoryHolderPropsType";
import Xicon from "public/svg/Xicon.svg";
import DeleteIcon from "public/svg/DeleteIcon.svg";
import {
  showSuccessNotification,
  showErrorNotification,
} from "store/notifications/reducer";
import { getUserStories, translateFunction } from "utils/functions";
import { revalidateStories } from "utils/serverActions";
import { fetchStories } from "Server Requests";
import { DeleteModalPropsType } from "models/componentType/DeleteModalPropsType";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
function StoryHolder({ story, active, isPaused }: StoryHolderPropsType) {
  const { language, country, setStoryData } = useAppStore();
  const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
  const [currentStoryId, setCurrentStoryId] = useState(
    userStories?.id !== story.id ? 0 : story?.stories?.length - 1
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getUserStories();
  // check if the user is the owner of the story
  const isOwner = user?.id === story?.id;
  // Modal component
  const ConfirmModal = ({
    onCancel,
    onConfirm,
    loading,
    type,
  }: DeleteModalPropsType) => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30"
      style={{
        zIndex: 999999999,
      }}
    >
      <div
        className={
          `fixed top-1/2 left-1/2 -translate-y-1/2 transition-transform duration-500 ease-in-out ` +
          (showReportModal || showDeleteModal
            ? "-translate-x-1/2"
            : "-translate-x-full") +
          " bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center w-[90vw] max-w-[500px]"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <h2
          id="delete-modal-title"
          className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 regular "
        >
          {type === "Delete"
            ? translateFunction("Delete Story")
            : translateFunction("Report Story")}
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300 regular ">
          {type === "Delete"
            ? translateFunction("Are you sure you want to delete this story?")
            : translateFunction("Are you sure you want to report this story?")}
        </p>
        <div className="flex gap-4 w-full justify-center min-h-[40px]">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 regular "
                onClick={onCancel}
                tabIndex={0}
                aria-label={
                  type === "Delete" ? "Cancel delete" : "Cancel report"
                }
              >
                {translateFunction("Cancel")}
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 regular "
                onClick={onConfirm}
                tabIndex={0}
                aria-label={
                  type === "Delete" ? "Confirm delete" : "Confirm report"
                }
              >
                {translateFunction("Confirm")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const handleDeleteStory = async () => {
    setLoading(true);
    try {
      const storyId = story.stories[currentStoryId]?.id;
      const response = await StoryServiceClass.deleteStory(storyId);
      await revalidateStories();
      const userToken = user?.access_token;
      const storiesResult = await fetchStories(language, country, 1, userToken);
      setStoryData(storiesResult.data);
      setShowDeleteModal(false);
      setLoading(false);
      setCurrentStoryId(0);
      setNextStory(story.id);
      showSuccessNotification(
        translateFunction(`${response?.message}`) ||
          translateFunction("Story deleted successfully.")
      );
    } catch (err: any) {
      setShowDeleteModal(false);
      setLoading(false);
      showErrorNotification(
        err?.message || translateFunction("Failed to delete story.")
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
        translateFunction("Story reported successfully.")
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
      className="story-holder"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {active && (
        <div className="z-[99] top-[30px] right-[20px] absolute flex flex-row items-center gap-x-2">
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
              <DeleteIcon className="w-[22px] h-[22px] fill-white" />
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
              <ReportOrderItemIcon className="w-[22px] h-[22px] fill-white" />
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
            <Xicon className="[&>path]:fill-[#fafafa]" />
          </span>
        </div>
      )}
      {showDeleteModal && (
        <ConfirmModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteStory}
          loading={loading}
          type="Delete"
        />
      )}
      {showReportModal && (
        <ConfirmModal
          onCancel={() => setShowReportModal(false)}
          onConfirm={handleReportStory}
          loading={loading}
          type="Report"
        />
      )}
      <StoryViewer
        activeId={story.id}
        id={story.id}
        key={`${story.id}-${currentStoryId}`}
        isPaused={showDeleteModal || !active || showReportModal}
        preloadCount={0}
        onStoryStart={(e) => {
          if (active && story?.stories?.[e]) {
            const s: any = story.stories[e];
            if (s?.id) {
              StoryServiceClass.WatchStory(s.id, story.id as any);
              let url = window.location.pathname;
              GAevent({
                action: GA_EVENT_NAMES.VIEW_STORY,
                params: {
                  user_ID: auth.UserID(),
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

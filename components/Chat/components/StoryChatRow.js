import { errorPNG } from "utils/AxiosApi";
import Image from "next/image";
import StoryServiceClass from "services/story";
function StoryChatRow({ story, index, viewedStory, stories, select }) {
  return (
    <div
      className="call-conversation-item"
      style={{ cursor: "pointer" }}
      onClick={() => select(StoryServiceClass.configureStory(story))}
    >
      <Image
        className="thumb-img"
        alt="story"
        width={30}
        height={30}
        priority={false}
        fetchpriority="auto"
        style={{
          borderRadius: "50%",
          border:
            story.stories.filter((s) => s.is_seen === false).length > 0
              ? "3px solid #42f742"
              : "3px solid #bfbfbf",
        }}
        onLoad={(e) => {}}
        onError={(e) => {
          e.currentTarget.src = errorPNG;
          e.currentTarget.onerror = null;
        }}
        src={StoryServiceClass.getThumb(
          viewedStory.full_video_path || viewedStory.photo_path,
          viewedStory.full_video_path
        )}
      />
      <div className="story-name" style={{ marginLeft: "5px" }}>
        {story.name ?? story.mobile_phone ?? "Unknown"}
      </div>
    </div>
  );
}

export default StoryChatRow;

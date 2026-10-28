import pngErr from "public/images/error.png";
import Image from "next/image";
import StoryServiceClass from "services/story";
import { useAppStore } from "store";
function StoryChatRow({ story, index, viewedStory, stories, select }) {
  // Arabic and Kurdish read right to left. The row mirrors the same way as a
  // chat row (ChatItem): story circle on the right, name on its left.
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`call-conversation-item ${isRtl ? "flex-row-reverse" : ""}`}
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
          e.currentTarget.src = pngErr.src;
          e.currentTarget.onerror = null;
        }}
        src={StoryServiceClass.getThumb(
          viewedStory.full_video_path || viewedStory.photo_path,
          viewedStory.full_video_path
        )}
      />
      <div
        className={`story-name text-[#1d1d1d] ${isRtl ? "dir-rtl" : ""}`}
        style={isRtl ? { marginRight: "5px" } : { marginLeft: "5px" }}
      >
        {StoryServiceClass.authorName(story)}
      </div>
    </div>
  );
}

export default StoryChatRow;

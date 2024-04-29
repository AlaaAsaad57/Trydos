import React from "react";
import { ProgressBar } from "utils/Carousel";

function StoryMedia({
  story,
  selectedIndex,
  index,
  theta,
  radius,
  nextImage,
  currentStory,
  isActive,
}) {
  return (
    <div
      key={story.id}
      className="image-full absolute"
      style={{
        transform: `rotateY(${index * theta}deg) translateZ(${radius}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        fontSize: 60,
      }}
    >
      {isActive && (
        <ProgressBar
          nextImage={() => {
            nextImage();
          }}
          story={story}
          selectedIndex={selectedIndex}
          currentStory={currentStory}
          isActive={isActive}
          index={index}
        />
      )}
      <>
        {story.stories[selectedIndex].is_video === 1 ? (
          <video
            src={story.stories[selectedIndex].full_video_path}
            autoPlay
          ></video>
        ) : (
          <img
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            src={story.stories[selectedIndex].photo_path}
            onLoadStart={(e: any) => {
              e.target.style.opacity = "0";
            }}
            onLoad={(e: any) => (e.target.style.opacity = "1")}
            onError={(e: any) => (e.target.style.opacity = "1")}
          />
        )}
      </>
    </div>
  );
}

export default StoryMedia;

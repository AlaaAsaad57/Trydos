import React, { useState } from "react";
import { AdvancedImage } from "@cloudinary/react";
import { getThumb } from "utils/functions";
function Story({ onClick, media, Name, index }) {
  const [load, onLoad] = useState(null);
  return (
    <div className="story-element-item" onClick={() => onClick()}>
      <div className="linear-g-image" />
      <div className="story-text">{Name}</div>
      {/* {!load && (
        <Skeleton
          duration={0.5}
          count={1}
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            borderRadius: "10px",
            width: "100%",
            height: "100%",
          }}
        />
      )} */}
      <AdvancedImage
        className="thumb-img"
        alt="story"
        onLoad={() => {
          onLoad("loaded");
        }}
        width={145}
        height={255}
        loading={window.innerWidth < 500 && index >= 4 ? "lazy" : "eager"}
        onError={() => {
          onLoad("error");
        }}
        cldImg={getThumb(
          media.full_video_path || media.photo_path,
          media.full_video_path
        )}
      />
    </div>
  );
}

export default Story;

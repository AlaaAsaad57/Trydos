import { useState } from "react";
import { AdvancedImage } from "@cloudinary/react";
import { getThumb } from "utils/functions";
import { errorPNG } from "utils/constants";
import Loader from "components/global/Loader";
function Story({
  onClick,
  media,
  Name,
  index,
}: {
  onClick: Function;
  media: { photo_path: string; full_video_path: string; id: number };
  Name: string;
  index: number;
}) {
  const [load, onLoad] = useState(null);
  return (
    <div className="story-element-item" onClick={() => onClick()}>
      <div className="linear-g-image" />
      <div className="story-text">{Name}</div>
      {<Loader style={{ display: load ? "none" : "flex" }} />}
      <div className="" style={{ display: !load ? "none" : "flex" }}>
        <AdvancedImage
          className="thumb-img"
          alt="story"
          onLoad={(e) => {
            onLoad("loaded");
            console.log(e);
          }}
          width={145}
          height={255}
          loading={window.innerWidth < 500 && index >= 4 ? "lazy" : "eager"}
          onError={(e) => {
            e.currentTarget.src = errorPNG;
            e.currentTarget.onerror = null;
          }}
          cldImg={getThumb(
            media.full_video_path || media.photo_path,
            media.full_video_path
          )}
        />
      </div>
    </div>
  );
}

export default Story;

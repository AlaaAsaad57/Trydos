import { useState } from "react";

import { getThumb } from "utils/functions";
import { errorPNG } from "utils/AxiosApi";
import Loader from "components/global/Loader";
import Image from "next/image";
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
    <div
      className="story-element-item"
      onClick={() => onClick()}
      data-cy="story-element"
    >
      <div className="linear-g-image" />
      <div className="story-text overflow-hidden">{Name}</div>
      {<Loader style={{ display: load ? "none" : "flex" }} />}
      <div className="" style={{ display: !load ? "none" : "flex" }}>
        <Image
          className="thumb-img"
          alt="story"
          onLoad={(e) => {
            onLoad("loaded");
          }}
          width={100}
          height={160}
          loading={window.innerWidth < 500 && index >= 4 ? "lazy" : "eager"}
          onError={(e) => {
            e.currentTarget.src = errorPNG;
            e.currentTarget.onerror = null;
          }}
          unoptimized
          src={getThumb(
            media.full_video_path || media.photo_path,
            media.full_video_path
          )}
        />
      </div>
    </div>
  );
}

export default Story;

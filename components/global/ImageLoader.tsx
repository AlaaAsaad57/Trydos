"use client";
import { useState } from "react";
import Loader from "./Loader";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
function ImageLoader(props) {
  const [loading, setLoading] = useState(true);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: props?.style?.borderRadius,
        overflow: "hidden",
      }}
    >
      {!props.noLoader && loading && (
        <Loader
          style={{
            display: loading ? "flex" : "none",
            width: props.style.width,
            height: props.style.height,
          }}
        />
      )}
      <div
        style={
          !props.noLoader
            ? { display: loading ? "none" : "flex" }
            : { display: "flex" }
        }
      >
        <img
          {...props}
          quality={100}
          priority={props.priority}
          loading={"eager"}
          draggable={"false"}
          alt={props.alt}
          onLoad={() => {
            setLoading(false);
          }}
          src={GetImageUrl(props.src)}
        />
      </div>
    </div>
  );
}

export default ImageLoader;

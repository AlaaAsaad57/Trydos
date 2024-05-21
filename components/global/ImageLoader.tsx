import React, { useState } from "react";
import Loader from "./Loader";
import Image from "next/image";
function ImageLoader(props) {
  const getImageCld = () => {
    if (props.src.includes("cloudinary")) {
      if (props.setSrc) {
        props.setSrc(
          props.src.replace(
            "/upload",
            `/upload/w_${props.width},h_${props.height}/f_webp/q_auto`
          )
        );
      }
      return props.src.replace(
        "/upload",
        `/upload/w_${props.width},h_${props.height}/f_webp/q_auto`
      );
    } else return props.src;
  };
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
      <div style={{ display: loading ? "none" : "flex" }}>
        <Image
          {...props}
          quality={100}
          unoptimized
          onLoad={() => setLoading(false)}
          src={getImageCld()}
        />
      </div>
    </div>
  );
}

export default ImageLoader;

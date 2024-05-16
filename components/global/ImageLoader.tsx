import React, { useState } from "react";
import Loader from "./Loader";
import Image from "next/image";
import { myCldHome } from "utils/constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";

function ImageLoader(props) {
  const getImageCld = () => {
    if (props.src.includes("cloudinary")) {
      console.log(props.src.replace("/upload", "/upload/f_webp/q_auto"));
      return props.src.replace("/upload", "/upload/f_webp/q_auto");
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
      <Loader style={{ display: loading ? "flex" : "none" }} />
      <div style={{ display: loading ? "none" : "block" }}>
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

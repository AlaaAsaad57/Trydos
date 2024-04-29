import React, { useState } from "react";
import Loader from "./Loader";

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
      <Loader style={{ display: loading ? "flex" : "none" }} />
      <div style={{ display: loading ? "none" : "block" }}>
        <img {...props} onLoad={() => setLoading(false)} />
      </div>
    </div>
  );
}

export default ImageLoader;

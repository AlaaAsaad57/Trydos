import React, { useEffect } from "react";

function UploadVideo({ vidUrl }) {
  useEffect(() => {
    console.log(vidUrl);
  }, []);
  return <video controls src={vidUrl}></video>;
}

export default UploadVideo;

import { useEffect } from "react";

function UploadVideo({ vidUrl }) {
  useEffect(() => {}, []);
  return <video controls src={vidUrl}></video>;
}

export default UploadVideo;

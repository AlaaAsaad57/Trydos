import { useEffect } from "react";

function UploadVideo({ vidUrl }: { vidUrl: string }) {
  useEffect(() => {}, []);
  return <video controls src={vidUrl}></video>;
}

export default UploadVideo;

import { useEffect } from "react";

function UploadVideo({ vidUrl }: { vidUrl: string }) {
  useEffect(() => {
    console.log(vidUrl);
  }, []);
  return <video controls src={vidUrl}></video>;
}

export default UploadVideo;

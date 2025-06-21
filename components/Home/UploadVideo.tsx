import { UploadVideoPropsType } from "models/componentType/UploadVideoPropsType";
import { useEffect } from "react";

function UploadVideo({ vidUrl }: UploadVideoPropsType) {
  useEffect(() => {}, []);
  return <video controls src={vidUrl}></video>;
}

export default UploadVideo;

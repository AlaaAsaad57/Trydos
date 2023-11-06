import React from "react";
import Webcam from "react-webcam";
const videoConstraints = {
    width: 430,
    height: 400,
    facingMode: { exact: "user" }
  };
  
  const WebcamCapture = ({save}) => {
    const webcamRef = React.useRef(null);
    const capture = React.useCallback(
      () => {
        const imageSrc = webcamRef.current.getScreenshot();
        console.log(imageSrc)
      },
      [webcamRef]
    );
    return (
      <>
        <Webcam
          audio={false}
          height={800}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={430}
          videoConstraints={videoConstraints}
        />
        <button onClick={capture}>Capture photo</button>
      </>
    );
  };
  export default WebcamCapture
import React, { useEffect, useRef, useState } from "react";
import CameraIcon from "../../Chat/svg/image.svg";

import SendIcon from "../../Chat/svg/sharechat.svg";
import Webcam from "react-webcam";
import Image from "next/image";
import UploadVideo from "../UploadVideo";
import { blobToDataURL } from "components/Chat/chatsFunctions";
import { useStopwatch } from "react-timer-hook";
function NewStoryModal({ close, send }) {
  const [imageFile, setImageFile] = useState(null);
  const [vidUrl, setVideo] = useState(null);
  const [SwitchCamera, setSwitch] = useState(null);
  const [render, setRender] = useState(false);

  const capture = () => {
    setImageFile(webcamRef.current?.getScreenshot());
  };
  const hasTwoCameras = async () => {
    const devices = await navigator?.mediaDevices?.enumerateDevices();
    setSwitch(devices?.filter((dev) => dev?.kind === "videoinput").length <= 1);
    return null;
  };
  const [webcamTypeRef, setRef] = React.useState({
    width: 430,
    height: 400,
    facingMode: { exact: "user" },
  });
  const webcamRef = React.useRef(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    hasTwoCameras();
  }, []);
  const WebcamStreamCapture = () => {
    const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
      useStopwatch({ autoStart: false });
    const webcamRef = React.useRef(null);
    const mediaRecorderRef = React.useRef(null);
    const [capturing, setCapturing] = React.useState(false);
    const [recordedChunks, setRecordedChunks] = React.useState([]);

    const handleStartCaptureClick = React.useCallback(() => {
      start();
      setCapturing(true);
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start();
    }, [webcamRef, setCapturing, mediaRecorderRef, start]);

    const handleDataAvailable = React.useCallback(
      ({ data }) => {
        if (data.size > 0) {
          setRecordedChunks((prev) => prev.concat(data));
          const blob = new Blob([data], {
            type: "video/webm",
          });
          const url = URL.createObjectURL(blob);
          blobToDataURL(blob, function (e) {
            setVideo(e);
          });
        }
      },
      [setRecordedChunks]
    );

    const handleStopCaptureClick = React.useCallback(() => {
      mediaRecorderRef.current.stop();
      stop();
      setCapturing(false);
    }, [
      mediaRecorderRef,
      webcamRef,
      setCapturing,
      recordedChunks,
      setVideo,
      stop,
    ]);

    const handleDownload = React.useCallback(() => {
      if (recordedChunks.length) {
        const blob = new Blob(recordedChunks, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        setVideo(url);
        a.download = "react-webcam-stream-capture.webm";
        blobToDataURL(blob, function (e) {
          send(e);
          close();
        });
        window.URL.revokeObjectURL(url);
        setRecordedChunks([]);
      }
    }, [recordedChunks, setVideo]);
    useEffect(() => {
      if (seconds > 30 && capturing) {
        handleStopCaptureClick();
      }
    }, [seconds]);
    return (
      <>
        {vidUrl ? (
          <UploadVideo vidUrl={vidUrl}></UploadVideo>
        ) : (
          <Webcam
            className="cameraInput"
            audio={true}
            muted
            ref={webcamRef}
            videoConstraints={webcamTypeRef}
          />
        )}
        <div className="button-bases" style={{ position: "static" }}>
          {!capturing && !vidUrl && !vidUrl && (
            <button
              disabled={SwitchCamera}
              onClick={() => {
                setRef({
                  width: 430,
                  height: 400,
                  facingMode: {
                    exact:
                      webcamTypeRef.facingMode.exact === "user"
                        ? "environment"
                        : "user",
                  },
                });
              }}
            >
              <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                width="122.879px"
                height="93.242px"
                viewBox="0 0 122.879 93.242"
                enableBackground="new 0 0 122.879 93.242"
                xmlSpace="preserve"
              >
                <g>
                  <path
                    fillRule="evenodd"
                    fill="#555"
                    clipRule="evenodd"
                    d="M51.933,0.036h31.521l7.185,12.79h14.794c0.786,0,1.428,0.662,1.428,1.429v35.003 c5.257,1.931,9.185,4.161,11.755,6.539c2.808,2.599,4.234,5.514,4.264,8.602c0.03,3.092-1.35,6.024-4.156,8.649 c-4.786,4.479-14.429,8.444-28.976,10.897c-1.671,0.277-3.223-1.036-3.467-2.935s0.911-3.662,2.582-3.94 c13.403-2.26,22.011-5.655,25.986-9.375c1.301-1.216,1.942-2.312,1.934-3.242c-0.009-0.936-0.684-2.043-2.017-3.276 c-1.765-1.633-4.401-3.2-7.905-4.633v7.618c0,0.766-0.66,1.428-1.428,1.428H19.506c-0.767,0-1.429-0.643-1.429-1.428v-8.5 c-5.576,1.91-9.059,4.052-10.86,6.261c-1.003,1.23-1.261,2.413-0.937,3.497c0.472,1.573,1.877,3.242,3.958,4.875 c7.076,5.552,20.555,9.51,33.239,8.611l-2.744-2.146c-1.311-1.023-1.544-2.917-0.52-4.228c1.024-1.312,2.917-1.544,4.229-0.521 l8.878,6.942c1.311,1.024,1.544,2.917,0.52,4.229c-0.132,0.17-0.279,0.32-0.438,0.454l-9.882,8.837 c-1.239,1.109-3.143,1.003-4.252-0.236c-1.108-1.238-1.003-3.143,0.236-4.251l2.28-2.039C28.4,86.376,14.414,81.996,6.771,76 c-3.146-2.468-5.364-5.305-6.277-8.353c-1.06-3.537-0.466-7.092,2.251-10.425c2.599-3.188,7.505-6.194,15.332-8.696V14.255 c0-0.786,0.642-1.429,1.429-1.429h6.652v-4.59h8.22v4.59h8.928c1.858-3.667,3.715-7.335,5.574-11 C50.01-0.411,49.389,0.036,51.933,0.036L51.933,0.036z M97.607,19.144c2.353,0,4.261,1.909,4.261,4.262s-1.908,4.262-4.261,4.262 s-4.262-1.909-4.262-4.262S95.255,19.144,97.607,19.144L97.607,19.144L97.607,19.144z M66.229,24.113 c7.134,0,12.919,5.785,12.919,12.918s-5.785,12.917-12.919,12.917c-7.135,0-12.92-5.785-12.92-12.917 C53.31,29.898,59.094,24.113,66.229,24.113L66.229,24.113z M66.229,15.696c11.782,0,21.336,9.555,21.336,21.335 s-9.554,21.336-21.336,21.336c-11.781,0-21.335-9.556-21.335-21.336S54.448,15.696,66.229,15.696L66.229,15.696z"
                  />
                </g>
              </svg>
            </button>
          )}
          {!vidUrl &&
            !vidUrl &&
            (capturing ? (
              <button
                onClick={handleStopCaptureClick}
                style={{ position: "relative" }}
              >
                <span
                  style={{ position: "absolute", color: "red", top: "-25px" }}
                >{`00:${seconds > 9 ? seconds : "0" + seconds}`}</span>
                <span className="stop-icon" />
              </button>
            ) : (
              <button onClick={handleStartCaptureClick}>
                <span className="capturing-icon" />
              </button>
            ))}
          {vidUrl && (
            <button onClick={handleDownload}>
              <SendIcon />
            </button>
          )}
          <button
            onClick={() => (!vidUrl && !vidUrl ? close() : setVideo(null))}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17.828"
              height="17.829"
              viewBox="0 0 17.828 17.829"
            >
              <g
                id="Group_10676"
                data-name="Group 10676"
                transform="translate(-67.032 -2460.283)"
              >
                <line
                  id="Line_879"
                  data-name="Line 879"
                  y2="21.213"
                  transform="translate(83.447 2461.697) rotate(45)"
                  fill="none"
                  stroke="#555"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <line
                  id="Line_880"
                  data-name="Line 880"
                  y2="21.213"
                  transform="translate(83.447 2476.697) rotate(135)"
                  fill="none"
                  stroke="#555"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </g>
            </svg>
          </button>
        </div>
      </>
    );
  };
  return (
    <div
      className="fixed-img-prev"
      style={{
        top: "-113px",
        justifyContent: "flex-end",
        paddingBottom: "60px",
      }}
    >
      <div className="options-camera">
        <div
          className={`option ${active && "active-option"}`}
          onClick={() => setActive(true)}
        >
          Photo
        </div>
        <div
          className={`option ${!active && "active-option"}`}
          onClick={() => setActive(false)}
        >
          Video
        </div>
      </div>
      <div className="bac-drop"></div>
      {active ? (
        imageFile && imageFile !== "null" ? (
          <>
            <div className="button-bases" style={{ position: "static" }}>
              <button style={{ opacity: "0" }}>
                <svg
                  version="1.1"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  width="122.879px"
                  height="93.242px"
                  viewBox="0 0 122.879 93.242"
                  enableBackground="new 0 0 122.879 93.242"
                  xmlSpace="preserve"
                >
                  <g>
                    <path
                      fillRule="evenodd"
                      fill="#555"
                      clipRule="evenodd"
                      d="M51.933,0.036h31.521l7.185,12.79h14.794c0.786,0,1.428,0.662,1.428,1.429v35.003 c5.257,1.931,9.185,4.161,11.755,6.539c2.808,2.599,4.234,5.514,4.264,8.602c0.03,3.092-1.35,6.024-4.156,8.649 c-4.786,4.479-14.429,8.444-28.976,10.897c-1.671,0.277-3.223-1.036-3.467-2.935s0.911-3.662,2.582-3.94 c13.403-2.26,22.011-5.655,25.986-9.375c1.301-1.216,1.942-2.312,1.934-3.242c-0.009-0.936-0.684-2.043-2.017-3.276 c-1.765-1.633-4.401-3.2-7.905-4.633v7.618c0,0.766-0.66,1.428-1.428,1.428H19.506c-0.767,0-1.429-0.643-1.429-1.428v-8.5 c-5.576,1.91-9.059,4.052-10.86,6.261c-1.003,1.23-1.261,2.413-0.937,3.497c0.472,1.573,1.877,3.242,3.958,4.875 c7.076,5.552,20.555,9.51,33.239,8.611l-2.744-2.146c-1.311-1.023-1.544-2.917-0.52-4.228c1.024-1.312,2.917-1.544,4.229-0.521 l8.878,6.942c1.311,1.024,1.544,2.917,0.52,4.229c-0.132,0.17-0.279,0.32-0.438,0.454l-9.882,8.837 c-1.239,1.109-3.143,1.003-4.252-0.236c-1.108-1.238-1.003-3.143,0.236-4.251l2.28-2.039C28.4,86.376,14.414,81.996,6.771,76 c-3.146-2.468-5.364-5.305-6.277-8.353c-1.06-3.537-0.466-7.092,2.251-10.425c2.599-3.188,7.505-6.194,15.332-8.696V14.255 c0-0.786,0.642-1.429,1.429-1.429h6.652v-4.59h8.22v4.59h8.928c1.858-3.667,3.715-7.335,5.574-11 C50.01-0.411,49.389,0.036,51.933,0.036L51.933,0.036z M97.607,19.144c2.353,0,4.261,1.909,4.261,4.262s-1.908,4.262-4.261,4.262 s-4.262-1.909-4.262-4.262S95.255,19.144,97.607,19.144L97.607,19.144L97.607,19.144z M66.229,24.113 c7.134,0,12.919,5.785,12.919,12.918s-5.785,12.917-12.919,12.917c-7.135,0-12.92-5.785-12.92-12.917 C53.31,29.898,59.094,24.113,66.229,24.113L66.229,24.113z M66.229,15.696c11.782,0,21.336,9.555,21.336,21.335 s-9.554,21.336-21.336,21.336c-11.781,0-21.335-9.556-21.335-21.336S54.448,15.696,66.229,15.696L66.229,15.696z"
                    />
                  </g>
                </svg>
              </button>

              <button
                onClick={() => {
                  send(imageFile);
                  setImageFile(null);
                  close();
                }}
              >
                <SendIcon />
              </button>
              <button onClick={() => setImageFile(null)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17.828"
                  height="17.829"
                  viewBox="0 0 17.828 17.829"
                >
                  <g
                    id="Group_10676"
                    data-name="Group 10676"
                    transform="translate(-67.032 -2460.283)"
                  >
                    <line
                      id="Line_879"
                      data-name="Line 879"
                      y2="21.213"
                      transform="translate(83.447 2461.697) rotate(45)"
                      fill="none"
                      stroke="#555"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                    <line
                      id="Line_880"
                      data-name="Line 880"
                      y2="21.213"
                      transform="translate(83.447 2476.697) rotate(135)"
                      fill="none"
                      stroke="#555"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </g>
                </svg>
              </button>
            </div>
            <Image
              className="image-story-camera"
              loading="eager"
              fill
              sizes="100vw"
              alt="imgs"
              src={imageFile}
            />
          </>
        ) : (
          <>
            <Webcam
              className="cameraInput"
              audio={false}
              height={800}
              ref={webcamRef}
              screenshotFormat="image/webp"
              width={430}
              videoConstraints={webcamTypeRef}
            />
            {!imageFile && (
              <div className="button-bases" style={{ position: "static" }}>
                <button
                  disabled={SwitchCamera}
                  onClick={() => {
                    setRef({
                      width: 430,
                      height: 400,
                      facingMode: {
                        exact:
                          webcamTypeRef.facingMode.exact === "user"
                            ? "environment"
                            : "user",
                      },
                    });
                  }}
                >
                  <svg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    width="122.879px"
                    height="93.242px"
                    viewBox="0 0 122.879 93.242"
                    enableBackground="new 0 0 122.879 93.242"
                    xmlSpace="preserve"
                  >
                    <g>
                      <path
                        fillRule="evenodd"
                        fill="#555"
                        clipRule="evenodd"
                        d="M51.933,0.036h31.521l7.185,12.79h14.794c0.786,0,1.428,0.662,1.428,1.429v35.003 c5.257,1.931,9.185,4.161,11.755,6.539c2.808,2.599,4.234,5.514,4.264,8.602c0.03,3.092-1.35,6.024-4.156,8.649 c-4.786,4.479-14.429,8.444-28.976,10.897c-1.671,0.277-3.223-1.036-3.467-2.935s0.911-3.662,2.582-3.94 c13.403-2.26,22.011-5.655,25.986-9.375c1.301-1.216,1.942-2.312,1.934-3.242c-0.009-0.936-0.684-2.043-2.017-3.276 c-1.765-1.633-4.401-3.2-7.905-4.633v7.618c0,0.766-0.66,1.428-1.428,1.428H19.506c-0.767,0-1.429-0.643-1.429-1.428v-8.5 c-5.576,1.91-9.059,4.052-10.86,6.261c-1.003,1.23-1.261,2.413-0.937,3.497c0.472,1.573,1.877,3.242,3.958,4.875 c7.076,5.552,20.555,9.51,33.239,8.611l-2.744-2.146c-1.311-1.023-1.544-2.917-0.52-4.228c1.024-1.312,2.917-1.544,4.229-0.521 l8.878,6.942c1.311,1.024,1.544,2.917,0.52,4.229c-0.132,0.17-0.279,0.32-0.438,0.454l-9.882,8.837 c-1.239,1.109-3.143,1.003-4.252-0.236c-1.108-1.238-1.003-3.143,0.236-4.251l2.28-2.039C28.4,86.376,14.414,81.996,6.771,76 c-3.146-2.468-5.364-5.305-6.277-8.353c-1.06-3.537-0.466-7.092,2.251-10.425c2.599-3.188,7.505-6.194,15.332-8.696V14.255 c0-0.786,0.642-1.429,1.429-1.429h6.652v-4.59h8.22v4.59h8.928c1.858-3.667,3.715-7.335,5.574-11 C50.01-0.411,49.389,0.036,51.933,0.036L51.933,0.036z M97.607,19.144c2.353,0,4.261,1.909,4.261,4.262s-1.908,4.262-4.261,4.262 s-4.262-1.909-4.262-4.262S95.255,19.144,97.607,19.144L97.607,19.144L97.607,19.144z M66.229,24.113 c7.134,0,12.919,5.785,12.919,12.918s-5.785,12.917-12.919,12.917c-7.135,0-12.92-5.785-12.92-12.917 C53.31,29.898,59.094,24.113,66.229,24.113L66.229,24.113z M66.229,15.696c11.782,0,21.336,9.555,21.336,21.335 s-9.554,21.336-21.336,21.336c-11.781,0-21.335-9.556-21.335-21.336S54.448,15.696,66.229,15.696L66.229,15.696z"
                      />
                    </g>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    capture();
                  }}
                >
                  <CameraIcon style={{ transform: "scale(1.5)" }} />
                </button>
                <button
                  onClick={() => {
                    setImageFile(null);
                    close();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17.828"
                    height="17.829"
                    viewBox="0 0 17.828 17.829"
                  >
                    <g
                      id="Group_10676"
                      data-name="Group 10676"
                      transform="translate(-67.032 -2460.283)"
                    >
                      <line
                        id="Line_879"
                        data-name="Line 879"
                        y2="21.213"
                        transform="translate(83.447 2461.697) rotate(45)"
                        fill="none"
                        stroke="#555"
                        strokeLinecap="round"
                        strokeWidth="2"
                      />
                      <line
                        id="Line_880"
                        data-name="Line 880"
                        y2="21.213"
                        transform="translate(83.447 2476.697) rotate(135)"
                        fill="none"
                        stroke="#555"
                        strokeLinecap="round"
                        strokeWidth="2"
                      />
                    </g>
                  </svg>
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <WebcamStreamCapture
          SwitchCamera={SwitchCamera}
          send={send}
          close={close}
        />
      )}
    </div>
  );
}

export default NewStoryModal;

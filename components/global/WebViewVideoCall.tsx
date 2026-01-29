// webview video call component
import { useState, useEffect, useRef } from "react";

import AgoraRTC, {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
import { getTwoLetters } from "components/Chat/chatsFunctions";
import { GetImageUrl } from "utils/tinyUtils";
const config: any = {
  mode: "rtc",
  codec: "h264",
};

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc4";
function WebViewVideoCall(props) {
  const [IsSpeaker, setIsSpeaker] = useState(true);
  AgoraRTC.setLogLevel(4);
  const [loading, setLoading] = useState(false);

  // const switchCamera = async () => {
  //   await tracks[1].stop()
  //   await tracks[1].close()
  //   if (tracks[1]) {
  //     if (tracks[1].getMediaStreamTrack().label === cameras[0].label) {
  //       let newTrack =await AgoraRTC.createCameraVideoTrack({facingMode:'environment'})
  //       await tracks[1].replaceTrack(newTrack, true);
  //       await client.publish(tracks[1])
  //     } else {
  //       setCamera("user");
  //       alert("user");
  //       let newTrack = await navigator.mediaDevices
  //         .getUserMedia({ audio: false, video: { facingMode: "user" } })
  //         .then((stream) => {
  //           return stream.getVideoTracks()[0];
  //         });
  //       setCamera("user");
  //       alert("user");
  //       await tracks[1].replaceTrack(newTrack, true);
  //     }
  //   }
  //   await tracks[1].setEnabled(true);
  // };

  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
    useStopwatch({ autoStart: false });
  const durationRef = useRef(0);

  // Update the ref whenever the timer changes
  useEffect(() => {
    durationRef.current = minutes * 60 + seconds;
  }, [minutes, seconds]);

  const [callStatus, setCallStatus] = useState(null);

  const [isPublished, setIsPublished] = useState(false);
  const [users, setUsers] = useState([]);
  const [displayMethod, setDisplayMethod] = useState(false);
  const client = useClient();
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      client.on("user-joined", async (user) => {
        if (!isRunningRef.current) start();
        setUsers((prevUsers) => {
          // Prevent duplicates
          if (prevUsers.find((u) => u.uid === user.uid)) return prevUsers;
          return [...prevUsers, user];
        });
        if ((window as any)?.flutter_inappwebview)
          (window as any)?.flutter_inappwebview?.callHandler?.(
            "flutterMessageHandler",
            "stop-ring", // <-- this becomes args[0] in Flutter
          );
      });
      client.on("user-published", async (user, mediaType) => {
        if (!isRunningRef.current) start();
        await client.subscribe(user, mediaType);

        // Ensure React state updates so the UI re-renders with the new tracks
        setUsers((prev) => {
          const others = prev.filter((u) => u.uid !== user.uid);
          return [...others, user];
        });

        if (mediaType === "audio") {
          const devices = await AgoraRTC.getPlaybackDevices();

          const earpiece = devices.find((d) =>
            /earpiece|receiver|handset/i.test(d.label),
          );

          if (earpiece && user.audioTrack.setPlaybackDevice) {
            await user.audioTrack.setPlaybackDevice(earpiece.deviceId);
          } else {
            // If we are on mobile, we often can't switch, so we just play.
          }

          try {
            user?.audioTrack?.play();
          } catch (e) {}
        }
      });

      client.on("user-unpublished", (user, type) => {
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        setUsers((prev) => {
          return prev.map((u) => {
            if (u.uid === user.uid) {
              // Return the 'user' object directly from the event.
              // It is the Class Instance [aj] with the tracks updated internally.
              return user;
            }
            return u;
          });
        });
      });

      client.on("user-left", (user) => {
        userEndCall();
        setCallStatus("");
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });

      await client.join(
        appId,
        name.toString(),
        props.data.token,
        parseInt(props.data.sender_user_id),
      );

      if (tracks) {
        const currentVideoState = trackStateRef.current.video;
        const currentAudioState = trackStateRef.current.audio;
        // تطبيق الحالة (Mute/Unmute) على التراكات المحلية
        await tracks[0].setEnabled(currentAudioState);
        await tracks[1].setEnabled(currentVideoState);

        // النشر فقط إذا كانت الحالة مفعلة
        await client.publish([tracks[0], tracks[1]]);
        setIsPublished(true);
      }
    };

    if (ready && tracks) {
      init(props.data.channel_id);
    }
  }, [client, ready, tracks, error]);
  const userEndCall = async () => {
    await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    if (tracks) {
      tracks[0]?.close();
      tracks[1].close();
    }
    //   RefuseCall(activeChat.id,MessageActiveCall)

    pause();
    let duration = durationRef.current;
    if ((window as any)?.flutter_inappwebview)
      (window as any)?.flutter_inappwebview?.callHandler?.(
        "flutterMessageHandler",
        durationRef.current, // <-- this becomes args[0] in Flutter
      );
    await props.onDecline(duration);
    window.location.href = "/endCall";
  };
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const trackStateRef = useRef(trackState);

  // 2. تحديث المرجع كلما تغيرت الـ State
  useEffect(() => {
    trackStateRef.current = trackState;
  }, [trackState]);
  const mute = async (type) => {
    if (type === "audio") {
      const newState = !trackState.audio;
      if (tracks && tracks[0]) {
        await tracks[0].setEnabled(newState);
        setTrackState((ps) => ({ ...ps, audio: newState }));
      }
    } else if (type === "video") {
      const newState = !trackState.video;
      if (tracks && tracks[1]) {
        await tracks[1].setEnabled(newState);
        setTrackState((ps) => ({ ...ps, video: newState }));
      }
    }
  };

  useEffect(() => {
    if (seconds === 60 && users.length === 0) {
      props.onDecline(-1);
      userEndCall();
    }
    if (minutes === 30) {
      userEndCall();
    }
  }, [minutes, seconds]);
  return (
    <>
      {
        <div className="video-call webview">
          {minutes >= 25 && (
            <div className="call-warn">Call End in {30 - minutes}</div>
          )}
          {
            <>
              {props.data?.is_private ? (
                <div
                  className="hgg"
                  style={{
                    backgroundImage: `url(${"/images/profileNo.png"})`,
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                  }}
                ></div>
              ) : props.active ? (
                <div
                  className="hgg"
                  style={{
                    backgroundImage: `url(${GetImageUrl(props.active)})`,
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                  }}
                ></div>
              ) : props.name ? (
                <div
                  className="hgg text-avatar"
                  style={{ left: 0, right: 0, margin: "0 auto" }}
                >
                  {getTwoLetters("User")}
                </div>
              ) : (
                <div
                  className="hgg"
                  style={{
                    backgroundImage: `url(${"/images/profileNo.png"})`,
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                  }}
                ></div>
              )}
            </>
          }
          {/* {cameras.length > 0 && tracks && ready && tracks[1] && (
            <div
              className="switch-camera"
              onClick={() => {
                switchCamera();
              }}
            >
              <SwitchCameraIcon />
            </div>
          )} */}
          <span className="caller-name">
            {props.data?.is_private
              ? props.data?.is_private === "customer"
                ? "Customer"
                : "Deleivery Worker"
              : props.userData.name || props.userData.phone}
          </span>

          {users.length > 0 &&
            users.map((user) => {
              if (user.videoTrack && user.hasVideo) {
                return (
                  <AgoraVideoPlayer
                    onClick={() => {
                      if (displayMethod) setDisplayMethod(!displayMethod);
                    }}
                    className={displayMethod ? "add-caller-icon" : "my-screen"}
                    id="remote-stream"
                    style={
                      !displayMethod
                        ? {
                            height: "100%",
                            width: "100%",
                            position: "fixed",
                            objectFit: "contain",
                          }
                        : { position: "fixed", objectFit: "contain" }
                    }
                    videoTrack={user.videoTrack}
                    key={user.uid}
                  />
                );
              } else return <></>;
            })}

          <div
            className={"cancel-call-icon " + `${loading && "disabled-label"}`}
            onClick={() => {
              if (!loading) {
                setLoading(true);
                userEndCall();
              }
            }}
          >
            <img src="/icons/chat/leftArrow.svg" />
          </div>
          <div
            style={{ cursor: "pointer", position: "fixed" }}
            onClick={() => {
              if (!displayMethod) setDisplayMethod(!displayMethod);
            }}
            className={!displayMethod ? "add-caller-icon" : "my-screen"}
          >
            {tracks &&
              tracks.length > 1 &&
              tracks[1] &&
              tracks?.[1].enabled && (
                <AgoraVideoPlayer
                  className="local-video-stream"
                  videoTrack={tracks[1]}
                />
              )}
          </div>
          <div className="fixed bottom-[3dvh] left-0 right-0 mx-auto flex justify-center items-center gap-[25px] z-[9999999999]">
            {isPublished ? (
              <div
                className={
                  "toggle-mic static " + (trackState.audio && "active-mic-svg")
                }
                onClick={() => mute("audio")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="25"
                  height="25"
                  viewBox="0 0 25 25"
                >
                  <g
                    id="Group_10695"
                    data-name="Group 10695"
                    transform="translate(-80 -825)"
                  >
                    <g
                      id="_25x25_Back"
                      data-name="25x25 Back"
                      transform="translate(80 825)"
                    >
                      <g id="Mask_Group_295" data-name="Mask Group 295">
                        <g id="microphone-black-shape">
                          <g id="Group_10694" data-name="Group 10694">
                            <path
                              id="Path_21396"
                              data-name="Path 21396"
                              d="M12.5,17.307A4.821,4.821,0,0,0,17.307,12.5V4.808a4.629,4.629,0,0,0-1.412-3.4A4.63,4.63,0,0,0,12.5,0,4.63,4.63,0,0,0,9.1,1.412a4.629,4.629,0,0,0-1.412,3.4V12.5A4.821,4.821,0,0,0,12.5,17.307Z"
                              fill="#d3d3d3"
                            />
                            <path
                              id="Path_21397"
                              data-name="Path 21397"
                              d="M20.868,9.9a.961.961,0,0,0-1.637.676V12.5a6.482,6.482,0,0,1-1.976,4.755A6.481,6.481,0,0,1,12.5,19.231a6.482,6.482,0,0,1-4.755-1.976A6.481,6.481,0,0,1,5.769,12.5V10.577A.956.956,0,0,0,4.132,9.9a.924.924,0,0,0-.286.676V12.5a8.345,8.345,0,0,0,2.216,5.777,8.39,8.39,0,0,0,5.476,2.817v1.983H7.692a.962.962,0,0,0,0,1.923h9.615a.962.962,0,0,0,0-1.923H13.462V21.093a8.391,8.391,0,0,0,5.476-2.817A8.344,8.344,0,0,0,21.154,12.5V10.577A.924.924,0,0,0,20.868,9.9Z"
                              fill="#d3d3d3"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                    <line
                      id="Line_903"
                      data-name="Line 903"
                      x2="20"
                      y2="20"
                      transform="translate(82.5 827.5)"
                      fill="none"
                      stroke="#ff5f61"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </g>
                </svg>
              </div>
            ) : (
              <span />
            )}
            {
              <div
                onClick={() => {
                  if ((window as any)?.flutter_inappwebview) {
                    if (IsSpeaker) {
                      if ((window as any)?.flutter_inappwebview)
                        (window as any)?.flutter_inappwebview?.callHandler?.(
                          "flutterMessageHandler",
                          "IsEarpiece", // <-- this becomes args[0] in Flutter
                        );
                    } else {
                      if ((window as any)?.flutter_inappwebview)
                        (window as any)?.flutter_inappwebview?.callHandler?.(
                          "flutterMessageHandler",
                          "IsSpeaker", // <-- this becomes args[0] in Flutter
                        );
                    }
                  }
                  setIsSpeaker(!IsSpeaker);
                }}
                className={` ${
                  IsSpeaker ? "opacity-100" : "opacity-65"
                } flex rounded-full p-[10px] bg-white items-center justify-center `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M20 6C20 6 21.5 7.8 21.5 12C21.5 16.2 20 18 20 18"
                    stroke="#1C274C"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M18 9C18 9 18.5 9.9 18.5 12C18.5 14.1 18 15 18 15"
                    stroke="#1C274C"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M1.95863 8.57679C2.24482 8.04563 2.79239 7.53042 3.33997 7.27707C3.9393 6.99979 4.62626 6.99979 6.00018 6.99979C6.51225 6.99979 6.76828 6.99979 7.01629 6.95791C7.26147 6.9165 7.50056 6.84478 7.72804 6.74438C7.95815 6.64283 8.1719 6.50189 8.59941 6.22002L8.81835 6.07566C11.3613 4.39898 12.6328 3.56063 13.7001 3.92487C13.9048 3.9947 14.1029 4.09551 14.2798 4.21984C15.2025 4.86829 15.2726 6.37699 15.4128 9.3944C15.4647 10.5117 15.5001 11.4679 15.5001 11.9998C15.5001 12.5317 15.4647 13.4879 15.4128 14.6052C15.2726 17.6226 15.2025 19.1313 14.2798 19.7797C14.1029 19.9041 13.9048 20.0049 13.7001 20.0747C12.6328 20.4389 11.3613 19.6006 8.81834 17.9239L8.59941 17.7796C8.1719 17.4977 7.95815 17.3567 7.72804 17.2552C7.50056 17.1548 7.26147 17.0831 7.01629 17.0417C6.76828 16.9998 6.51225 16.9998 6.00018 16.9998C4.62626 16.9998 3.9393 16.9998 3.33997 16.7225C2.79239 16.4692 2.24482 15.9539 1.95863 15.4228C1.6454 14.8414 1.60856 14.237 1.53488 13.0282C1.52396 12.849 1.51525 12.6722 1.50928 12.4998"
                    stroke="#1C274C"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
            }
            <div
              style={tracks && tracks[1] && { zIndex: 3 }}
              className={
                "end-icon static flex items-center justify-center m-0 " +
                `${props.data.loading && "disabled-label"}`
              }
              onClick={() => {
                userEndCall();
              }}
            >
              <img src="/icons/chat/endCall.svg" />
              <span>End Call</span>
            </div>
            {isPublished ? (
              <div
                className={
                  "toggle-vid static " + (trackState.video && "active-mic-svg")
                }
                onClick={() => mute("video")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="34.871"
                  height="26.743"
                  viewBox="0 0 34.871 26.743"
                >
                  <g
                    id="Group_10701"
                    data-name="Group 10701"
                    transform="translate(-354.129 -824.129)"
                  >
                    <path
                      id="Path_21351"
                      data-name="Path 21351"
                      d="M32.451,13.663a2.843,2.843,0,0,0-.9.117c-.27.072-.594.181-.971.306l-.028.009-.112.037a7.134,7.134,0,0,0-1.6.665,4,4,0,0,0-1.715,2.379A7.13,7.13,0,0,0,27,18.907v2.187a7.13,7.13,0,0,0,.124,1.731A4,4,0,0,0,28.838,25.2a7.134,7.134,0,0,0,1.6.664l.112.037.028.009c.377.126.7.234.971.306a2.843,2.843,0,0,0,.9.117,2.7,2.7,0,0,0,2.359-1.7,2.845,2.845,0,0,0,.173-.889c.017-.279.017-.621.017-1.018V17.27c0-.4,0-.739-.017-1.018a2.844,2.844,0,0,0-.173-.889,2.7,2.7,0,0,0-2.359-1.7Z"
                      transform="translate(354 817.5)"
                      fill="#388cff"
                    />
                    <g id="Group_10700" data-name="Group 10700">
                      <g id="Group_10699" data-name="Group 10699">
                        <path
                          id="Path_21352"
                          data-name="Path 21352"
                          d="M22.939,12.574C21.85,12.5,21.75,12.5,20.046,12.5H18.7c-1.709,0-3.054,0-4.142.074a9.059,9.059,0,0,0-2.91.591A8.75,8.75,0,0,0,6.916,17.9a9.056,9.056,0,0,0-.591,2.91c-.075,1.09-.075,2.44-.075,4.144v.093c0,1.709,0,3.054.074,4.142a9.056,9.056,0,0,0,.591,2.91,8.75,8.75,0,0,0,4.735,4.735,9.059,9.059,0,0,0,2.91.591c1.09.075,2.44.075,4.144.075h1.343c1.709,0,1.8,0,2.892-.074a9.059,9.059,0,0,0,2.91-.591A8.75,8.75,0,0,0,30.584,32.1a9.059,9.059,0,0,0,.591-2.91c.075-1.09.075-2.44.075-4.144v-.093c0-1.709,0-3.054-.074-4.142a9.059,9.059,0,0,0-.591-2.91,8.75,8.75,0,0,0-4.735-4.735,9.059,9.059,0,0,0-2.91-.591Z"
                          transform="translate(348.75 812.5)"
                          fill="none"
                          stroke="#388cff"
                          strokeWidth="1"
                        />
                      </g>
                      <path
                        className="line-path"
                        data-name="Path 21399"
                        d="M0,0,22.5,22.5"
                        transform="translate(356.25 826.25)"
                        fill="none"
                        stroke="#ff5f61"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            ) : (
              <span />
            )}
          </div>

          {ready && !users?.[0]?.hasVideo && (
            <div className="call-status">
              {users.length > 0 && !users[0].hasVideo ? (
                <>
                  <img src="/icons/chat/CallInProg.svg" />
                  <span>
                    {minutes > 9 ? minutes : "0" + minutes}:
                    {seconds > 9 ? seconds : "0" + seconds}
                  </span>
                </>
              ) : callStatus ? (
                <span>{callStatus}</span>
              ) : (
                <span>Calling ...</span>
              )}
            </div>
          )}
        </div>
      }
      {error && (
        <div
          className="error"
          style={{
            display: "flex",
            justifyContent: "flex-start",
            padding: "10px",
            flexDirection: "column",
          }}
        >
          <span> Errors:{error?.message || "None"}</span>
        </div>
      )}
    </>
  );
}

export default WebViewVideoCall;

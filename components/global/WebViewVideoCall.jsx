// webview video call component
import { useState, useEffect, useRef } from "react";
import EndCallIcon from "../Chat/svg/endCall";
import MicIcon from "../Chat/svg/micIcon";
import VideoIcon from "../Chat/svg/vidIcon";
import CallingIcon from "../Chat/svg/calling";
import LeftArrowIcon from "../Chat/svg/leftArrow";
import AgoraRTC, {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
const config = {
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
  const client = useClient(config);
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();

  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      console.log("Initializing AgoraRTC client with video call");
      client.on("user-joined", async (user) => {
        if (!isRunning) start();
        setUsers((prevUsers) => {
          // Prevent duplicates
          if (prevUsers.find((u) => u.uid === user.uid)) return prevUsers;
          return [...prevUsers, user];
        });
        if (window?.flutter_inappwebview)
          window?.flutter_inappwebview?.callHandler?.(
            "flutterMessageHandler",
            "stop-ring" // <-- this becomes args[0] in Flutter
          );
      });
      client.on("user-published", async (user, mediaType) => {
        if (!isRunning) start();
        await client.subscribe(user, mediaType);

        // Ensure React state updates so the UI re-renders with the new tracks
        setUsers((prev) => {
          const others = prev.filter((u) => u.uid !== user.uid);
          return [...others, user];
        });

        if (mediaType === "audio") {
          const devices = await AgoraRTC.getPlaybackDevices();

          // Log devices to your console so you can see exactly what the browser sees
          console.log("Available output devices:", devices);

          const earpiece = devices.find((d) =>
            /earpiece|receiver|handset/i.test(d.label)
          );

          if (earpiece && user.audioTrack.setPlaybackDevice) {
            await user.audioTrack.setPlaybackDevice(earpiece.deviceId);
          } else {
            // If we are on mobile, we often can't switch, so we just play.
            console.log(
              "No earpiece detected via Web API. Playing on default device."
            );
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
        parseInt(props.data.sender_user_id)
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
    console.log("tracks in video call", tracks);
    if (ready && tracks) {
      init(props.data.channel_id);
    }
  }, [client, ready, tracks, error]);
  const userEndCall = async (bool) => {
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
    if (window?.flutter_inappwebview)
      window?.flutter_inappwebview?.callHandler?.(
        "flutterMessageHandler",
        durationRef.current // <-- this becomes args[0] in Flutter
      );
    if (!bool) {
      props.onDecline(duration);
    } else {
      window.location.href = "/endCall";
    }
    //   dispatch({type:"END-CALL"})
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
      userEndCall(true);
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
              {props.active ? (
                <div
                  className="hgg"
                  style={{
                    backgroundImage: `url(${props.active})`,
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
            {props.userData.name || props.userData.phone}
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
            <LeftArrowIcon></LeftArrowIcon>
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
                <MicIcon></MicIcon>
              </div>
            ) : (
              <span />
            )}
            {
              <div
                onClick={() => {
                  if (window?.flutter_inappwebview) {
                    if (IsSpeaker) {
                      if (window?.flutter_inappwebview)
                        window?.flutter_inappwebview?.callHandler?.(
                          "flutterMessageHandler",
                          "IsEarpiece" // <-- this becomes args[0] in Flutter
                        );
                    } else {
                      if (window?.flutter_inappwebview)
                        window?.flutter_inappwebview?.callHandler?.(
                          "flutterMessageHandler",
                          "IsSpeaker" // <-- this becomes args[0] in Flutter
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
              <EndCallIcon></EndCallIcon>
              <span>End Call</span>
            </div>
            {isPublished ? (
              <div
                className={
                  "toggle-vid static " + (trackState.video && "active-mic-svg")
                }
                onClick={() => mute("video")}
              >
                <VideoIcon></VideoIcon>
              </div>
            ) : (
              <span />
            )}
          </div>

          {ready && !users?.[0]?.hasVideo && (
            <div className="call-status">
              {users.length > 0 && !users[0].hasVideo ? (
                <>
                  <CallingIcon></CallingIcon>
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

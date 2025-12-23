// webview video call component
import { useState, useEffect } from "react";
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
AgoraRTC.setLogLevel(4);

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc4";
function WebViewVideoCall(props) {
  const [loading, setLoading] = useState(false);
  const [cameraSelected, setCamera] = useState("user");
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
  const [callStatus, setCallStatus] = useState(null);
  useEffect(() => {}, []);
  const [users, setUsers] = useState([]);
  const [displayMethod, setDisplayMethod] = useState(false);
  const client = useClient(config);
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();
  useEffect(() => {
    start();
  }, []);
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      client.on("user-joined", async (user) => {
        reset();
        start();
        setUsers((prevUsers) => {
          return [...prevUsers, user];
        });
        if (window?.flutter_inappwebview)
          window?.flutter_inappwebview?.callHandler?.(
            "flutterMessageHandler",
            "stop-ring" // <-- this becomes args[0] in Flutter
          );
      });
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        // Ensure React state updates so the UI re-renders with the new tracks
        setUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          if (exists) return prev.map((u) => (u.uid === user.uid ? user : u));
          return [...prev, user];
        });

        if (mediaType === "audio") {
          try {
            user.audioTrack?.play();
          } catch (e) {}
        }
      });

      client.on("user-unpublished", (user, type) => {
        if (type === "audio") {
          user.audioTrack?.stop();
          setUsers((prev) =>
            prev.map((u) =>
              u.uid === user.uid ? { ...u, audioTrack: null } : u
            )
          );
        }
        if (type === "video") {
          setUsers((prev) =>
            prev.map((u) =>
              u.uid === user.uid ? { ...u, videoTrack: null } : u
            )
          );
        }
      });

      client.on("user-unpublished", (user, type) => {
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        if (type === "video") {
        }
      });

      client.on("user-left", (user) => {
        userEndCall();
        setCallStatus("");
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });

      let token = props.data.token;
      await client.join(
        appId,
        name.toString(),
        token,
        parseInt(props.data.sender_user_id)
      );
      if (tracks) await client.publish([tracks[0], tracks[1]]);
    };

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
    let duration = minutes * 60 + seconds;
    if (!bool) {
      props.onDecline(duration > 3 && users.length > 0 && duration);
    } else {
      window.location.href = "/endCall";
    }
    //   dispatch({type:"END-CALL"})
  };
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const mute = async (type) => {
    if (type === "audio") {
      const newState = !trackState.audio;
      await tracks[0]?.setEnabled(newState);
      setTrackState((ps) => ({ ...ps, audio: newState }));
      // If we re-enable, ensure the track is published so joining users can subscribe
      if (newState && client && tracks[0]) {
        try {
          await client.publish(tracks[0]);
        } catch (e) {
          // ignore if already published
        }
      }
    } else if (type === "video") {
      const newState = !trackState.video;
      await tracks[1]?.setEnabled(newState);
      setTrackState((ps) => ({ ...ps, video: newState }));
      if (newState && client && tracks[1]) {
        try {
          await client.publish(tracks[1]);
        } catch (e) {}
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
              if (user.videoTrack) {
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
            style={tracks && tracks[1] && { zIndex: 3 }}
            className={
              "end-icon " + `${props.data.loading && "disabled-label"}`
            }
            onClick={() => {
              userEndCall();
            }}
          >
            <EndCallIcon></EndCallIcon>
            <span>End Call</span>
          </div>
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
            {tracks && tracks.length > 1 && tracks[1] && (
              <AgoraVideoPlayer
                className="local-video-stream"
                videoTrack={tracks[1]}
              />
            )}
          </div>
          <div
            className={"toggle-mic " + (trackState.audio && "active-mic-svg")}
            onClick={() => mute("audio")}
          >
            <MicIcon></MicIcon>
          </div>
          <div
            className={"toggle-vid " + (trackState.video && "active-mic-svg")}
            onClick={() => mute("video")}
          >
            <VideoIcon></VideoIcon>
          </div>
          {ready && (
            <div className="call-status">
              {users.length > 0 ? (
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

import React, { useState, useEffect } from "react";
import EndCallIcon from "../Chat/svg/endCall.svg";
import MicIcon from "../Chat/svg/micIcon.svg";
import VideoIcon from "../Chat/svg/vidIcon.svg";
import CallingIcon from "../Chat/svg/calling.svg";
import LeftArrowIcon from "../Chat/svg/leftArrow.svg";
import SwitchCameraIcon from "../Chat/svg/SwitchCameraIcon.svg";
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
let cameras = await AgoraRTC.getCameras();

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
      });
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("subscribe success");
        try {
          user?.audioTrack?.play();
        } catch (e) {
          // alert(e.message)
        }

        if (mediaType === "video") {
          // StartTalking(props.data.authToken, props.data.msgId);
          start();
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("unpublished", user, type);
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        if (type === "video") {
        }
      });

      client.on("user-left", (user) => {
        userEndCall();
        setCallStatus("");
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("leaving", user);
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });

      let token = props.data.token;
      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
        console.log(
          appId,
          name.toString(),
          token,
          tracks[1].getMediaStreamTrack(),
          cameras
        );
      await client.join(
        appId,
        name.toString(),
        token,
        parseInt(props.data.sender_user_id)
      );
      if (tracks) await client.publish([tracks[0], tracks[1]]);
    };

    if (ready && tracks) {
      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
        console.log("init ready");
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
      await tracks[0]?.setMuted(false);
      await tracks[0]?.setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    } else if (type === "video") {
      await tracks[0]?.setMuted(false);
      await tracks[1].setEnabled(!trackState.video);
      setTrackState((ps) => {
        return { ...ps, video: !ps.video };
      });
    }
  };

  useEffect(() => {
    if (seconds === 30 && users.length === 0) {
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
          <span className="caller-name">{props.data.receiver_user_id}</span>

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
                      !displayMethod ? { height: "100%", width: "100%" } : {}
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
            style={{ cursor: "pointer" }}
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

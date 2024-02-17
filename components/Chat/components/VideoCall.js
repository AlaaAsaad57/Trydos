import React, { useEffect, useRef, useState } from "react";
import EndCallIcon from "../svg/endCall.svg";
import MicIcon from "../svg/micIcon.svg";
import VideoIcon from "../svg/vidIcon.svg";
import CallingIcon from "../svg/calling.svg";
import LeftArrowIcon from "../svg/leftArrow.svg";
import "./index.css";
import AgoraRTC, {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useDispatch, useSelector } from "react-redux";
import { useStopwatch } from "react-timer-hook";
import { RefuseCall } from "store/chat/actions";
import { getTwoLetters } from "../chatsFunctions";
import axios from "axios";
import { CHAT_URL } from "utils/endpointConfig";
import { getUserChat, translate } from "utils/functions";
const config = {
  mode: "rtc",
  codec: "h264",
};
AgoraRTC.setLogLevel(3);
const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();
const appId = "0af959943ff542df8f2cb1b925ec0cc1";
function VideoCall(props) {
  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
    useStopwatch({ autoStart: false });
  const dispatch = useDispatch();
  const [callStatus, setCallStatus] = useState(null);
  const activeChat = useSelector((state) => state.chat.activeChat);
  // React.useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setRender(!render)
  //   }, 2000)
  //   return () => clearTimeout(timeout)
  // }, [render])
  const language = useSelector((state) => state.homepage.language);
  useEffect(() => {
    // setTimeout(()=>{
    //   if(users.length===0&&!isRunning){
    //     setCallStatus(translate('No Answer',language))
    //     setTimeout(() => {
    //       userEndCall()
    //     }, 2000);
    //   }
    // },30000)
  }, []);
  const [users, setUsers] = useState([]);
  const [displayMethod, setDisplayMethod] = useState(false);
  const client = useClient(config);
  dispatch({ type: "STORE-CLIENT", payload: client });
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();
  const getToken = async (channelName) => {
    let token;
    let data = await axios
      .post(
        CHAT_URL + "/api/v1/agora/token",
        {
          channel_name: channelName,
        },
        {
          headers: {
            Authorization:
              "Bearer " +
              JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
          },
        }
      )
      .then((datas) => {
        token = datas.data.data;
      });

    return token;
  };
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      client.on("user-joined", (user) => {
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") reset();
        axios
          .get(
            CHAT_URL + `/api/v1/messages/start_talking/${MessageActiveCall}`,
            {
              headers: {
                Authorization: "Bearer " + getUserChat().access_token,
              },
            }
          )
          .then((data) => {});
        start();
        setUsers((prevUsers) => {
          return [...prevUsers, user];
        });
      });
      client.on("user-published", async (user, mediaType) => {
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("user-published");
        await client.subscribe(user, mediaType);
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("subscribe success");
        if (mediaType === "video") {
          user.audioTrack?.play();
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
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("leaving", user);
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });
      let token = props.token;

      await client
        .join(appId, name.toString(), token, getUserChat()?.id)
        .then(() => {
          setJoined(true);
        })
        .catch((e) => console.log(e));
      if (tracks) await client.publish([tracks[0], tracks[1]]);
    };

    if (ready && tracks) {
      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
        console.log("init ready");
      init(activeChat.id);
    }
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      console.log(error, ready, tracks);
  }, [client, ready, tracks, error]);
  useEffect(() => {
    start();
  }, []);
  const MessageActiveCall = useSelector(
    (state) => state.chat.MessageActiveCall
  );
  const [joined, setJoined] = useState(false);
  const userEndCall = async (durationVal) => {
    if (ready) {
      await client.unpublish(tracks);
      if (joined && ready) await client.leave();
      client.removeAllListeners();
      if (tracks) {
        tracks[0]?.getMediaStreamTrack().stop();
        tracks[1]?.getMediaStreamTrack().stop();
        tracks[0]?.close();
        tracks[1].close();
      }
    }
    pause();
    let duration = durationVal !== null ? durationVal : minutes * 60 + seconds;
    if (duration > 3 && users.length > 0)
      await RefuseCall(activeChat.id, MessageActiveCall, duration).then(() => {
        dispatch({ type: "END-CALL", payload: MessageActiveCall });
      });
    else
      await RefuseCall(activeChat.id, MessageActiveCall).then(() => {
        dispatch({ type: "END-CALL", payload: MessageActiveCall });
      });
  };
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const mute = async (type) => {
    if (type === "audio") {
      await tracks[0]?.setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    } else if (type === "video") {
      await tracks[1].setEnabled(!trackState.video);
      setTrackState((ps) => {
        return { ...ps, video: !ps.video };
      });
    }
  };
  const call = useSelector((state) => state.chat.call);
  useEffect(() => {
    if (seconds === 30 && users.length === 0 && call === "vid-outgoing") {
      userEndCall(-1);
    }
    if (minutes === 30) {
      userEndCall(minutes * 60);
    }
  }, [minutes, seconds]);
  const EndCall = async () => {};
  const ref = useRef();
  useEffect(() => {
    return () => {
      ref.current?.pause();
    };
  }, [ref]);
  return (
    <div className="video-call">
      {minutes >= 25 && (
        <div className="call-warn">Call End in {30 - minutes}</div>
      )}
      {props.audio && !users.length > 0 && !callStatus && (
        <audio
          ref={ref}
          onLoad={(e) => {
            e.target.volume = 0.2;
          }}
          onPlay={(e) => {
            e.target.volume = 0.2;
          }}
          onLoadStart={(e) => {
            e.target.volume = 0.2;
          }}
          loop
          autoPlay
          src={"/default.mp3"}
        >
          <source src={"/default.mp3"}></source>
        </audio>
      )}

      {
        <>
          {props.active ? (
            <div
              className="hgg"
              style={{
                backgroundImage: `url(${props.active})`,
              }}
            ></div>
          ) : props.name ? (
            <div className="hgg text-avatar">{getTwoLetters(props.name)}</div>
          ) : (
            <div
              className="hgg"
              style={{
                backgroundImage: `url(${"/images/profileNo.png"})`,
              }}
            ></div>
          )}
        </>
      }
      <span className="caller-name">{props.name}</span>

      {users.length > 0 &&
        users.map((user, index) => {
          if (user.videoTrack) {
            return (
              <AgoraVideoPlayer
                key={index}
                onClick={() => {
                  if (displayMethod) setDisplayMethod(!displayMethod);
                }}
                className={displayMethod ? "add-caller-icon" : "my-screen"}
                id="remote-stream"
                style={!displayMethod ? { height: "100%", width: "100%" } : {}}
                videoTrack={user.videoTrack}
              />
            );
          }
        })}
      <div
        style={tracks && tracks[1] && { zIndex: 3 }}
        className="end-icon"
        onClick={() => {
          userEndCall();
        }}
      >
        <EndCallIcon></EndCallIcon>
        <span>{translate("End Call", language)}</span>
      </div>
      <div
        className="cancel-call-icon"
        onClick={() => {
          userEndCall();
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
        {tracks && tracks.length > 1 && (
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
            <span>{translate("Calling ...", language)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoCall;

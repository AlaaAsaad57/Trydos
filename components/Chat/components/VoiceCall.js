import React, { useEffect, useRef, useState } from "react";
import EndCallIcon from "../svg/endCall.svg";
import MicIcon from "../svg/micIcon.svg";
import CallingIcon from "../svg/calling.svg";
import AddUserIcon from "../svg/addUser.svg";
import LeftArrowIcon from "../svg/leftArrow.svg";
import "./index.css";
import AgoraRTC, {
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
  const activeChat = useSelector((state) => state.chat.activeChat);
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [startIndicator, setStart] = useState(false);
  const client = useClient(config);
  dispatch({ type: "STORE-CLIENT", payload: client });
  const [callStatus, setCallStatus] = useState(null);
  useEffect(() => {
    start();
  }, []);
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();
  const language = useSelector((state) => state.homepage.language);
  const call = useSelector((state) => state.chat.call);
  useEffect(() => {
    if (seconds === 60 && users.length === 0 && call === "aud-outgoing") {
      userEndCall(true);
      RefuseCall(activeChat.id, MessageActiveCall, -1);
    }
    if (minutes === 30) {
      userEndCall();
      RefuseCall(activeChat.id, MessageActiveCall, minutes * 60 + seconds);
    }
  }, [minutes, seconds]);
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      client.on("user-joined", (user) => {
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("user-joined", user);
        reset();
        start();

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
      });
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("subscribe success");
        if (mediaType === "audio") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
          console.log("unpublished", user, type);
        if (type === "audio") {
          user.audioTrack?.stop();
        }
      });

      client.on("user-left", (user) => {
        userEndCall();
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });
      let token = props.token;
      await client
        .join(appId, name.toString(), token, getUserChat()?.id)
        .then(() => {
          console.log("join");
          setJoined(true);
        });
      if (tracks) await client.publish([tracks[0]]);
      setStart(true);
    };

    if (ready && tracks) {
      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
        console.log("init ready");
      init(activeChat.id);
    }
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      console.log(error, ready, tracks);
  }, [client, ready, tracks, error]);
  const MessageActiveCall = useSelector(
    (state) => state.chat.MessageActiveCall
  );
  const [joined, setJoined] = useState(false);
  const userEndCall = async (durationVal) => {
    try {
      if (ready) {
        if (joined) {
          console.log("unpublish");
          await client.unpublish(tracks);
          console.log("leave");
          await client.leave();
        }
        if (tracks && tracks[0]) {
          console.log("close tracks");
          client.removeAllListeners();
          tracks[0].close();
          tracks[1].close();
        }

        // we close the tracks to perform cleanup
      }
      setStart(false);
      let duration =
        durationVal !== null ? durationVal : minutes * 60 + seconds;
      if (duration > 3 && users.length > 0)
        await RefuseCall(activeChat.id, MessageActiveCall, duration).then(
          () => {
            dispatch({ type: "END-CALL", payload: MessageActiveCall });
          }
        );
      else
        await RefuseCall(activeChat.id, MessageActiveCall).then(() => {
          dispatch({ type: "END-CALL", payload: MessageActiveCall });
        });
      pause();
    } catch (e) {
      console.log(error);
    }
  };

  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const mute = async (type) => {
    if (type === "audio") {
      await tracks[0]?.setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    }
  };

  useEffect(() => {
    if (minutes === 30) {
      userEndCall();
    }
  }, [minutes]);
  const ref = useRef();
  useEffect(() => {
    return () => {
      ref.current?.pause();
    };
  }, [ref]);
  return (
    <>
      {
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
                <div className="hgg text-avatar">
                  {getTwoLetters(props.name)}
                </div>
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
          <div
            style={tracks && tracks[0] && { zIndex: 3 }}
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
          <div className="add-caller-icon">
            <AddUserIcon></AddUserIcon>
          </div>
          <div
            className={"toggle-mic " + (trackState.audio && "active-mic-svg")}
            onClick={() => mute("audio")}
          >
            <MicIcon></MicIcon>
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
      }
    </>
  );
}

export default VideoCall;

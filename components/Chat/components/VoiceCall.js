import { useEffect, useRef, useState } from "react";
import EndCallIcon from "../svg/endCall.svg";
import MicIcon from "../svg/micIcon.svg";
import CallingIcon from "../svg/calling.svg";
import AddUserIcon from "../svg/addUser.svg";
import LeftArrowIcon from "../svg/leftArrow.svg";
import "styles/chat.css";
import AgoraRTC, {
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
import { RefuseCall } from "store/chat/callActions";
import { getTwoLetters } from "../chatsFunctions";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";

const config = {
  mode: "rtc",
  codec: "h264",
};
AgoraRTC.setLogLevel(3);
const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc1";
function VideoCall(props) {
  const {
    storeClient,
    language,
    activeChat,
    MessageActiveCall,
    call,
    endCall,
  } = useAppStore();

  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
    useStopwatch({ autoStart: false });
  const [users, setUsers] = useState([]);
  const [startIndicator, setStart] = useState(false);
  const client = useClient(config);

  const [callStatus, setCallStatus] = useState(null);
  useEffect(() => {
    if (client) {
      storeClient(client);
      console.log(client);
    }

    start();
  }, []);
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();
  useEffect(() => {
    if (seconds === 60 && users.length === 0 && call === "aud-outgoing") {
      userEndCall(-1);
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
      client.on("user-joined", async (user) => {
        // stop ringtone when call is answered
        ref.current?.pause();
        reset();
        start();

        await fetchData({
          url: `/api/v1/messages/start_talking/${MessageActiveCall}`,
          server: "chat",
          method: "GET",
          reqTitle: "Start Talking",
        });
      });
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        // if (type === "audio") {
        //   user.audioTrack?.stop();
        // }
      });

      client.on("user-left", (user) => {
        // stop ringtone when remote user leaves
        ref.current?.pause();
        userEndCall();
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });
      let token = props.token;
      await client
        .join(appId, name.toString(), token, getUserChat()?.id)
        .then(() => {
          setJoined(true);
        });
      if (tracks) await client.publish([tracks[0]]);
      setStart(true);
    };

    if (ready && tracks) {
      init(activeChat.id);
    }
  }, [client, ready, tracks, error]);
  const [joined, setJoined] = useState(false);
  const userEndCall = async (durationVal) => {
    try {
      await fetchData({
        url: `/api/v1/end_call`,
        reqTitle: "End Call",
        method: "POST",
        server: "chat",
        body: JSON.stringify({ user_id: getUserChat()?.id }),
      });

      if (ready) {
        if (joined) {
          await client.unpublish(tracks);
          await client.leave();
        }
        if (tracks && tracks[0]) {
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
            endCall(MessageActiveCall);
          }
        );
      else
        await RefuseCall(activeChat.id, MessageActiveCall).then(() => {
          endCall(MessageActiveCall);
        });
      pause();
    } catch (e) {
      console.error("Error ending call:", e);
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
            <span>{translateFunction("End Call", language)}</span>
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
                <span>{translateFunction("Calling ...", language)}</span>
              )}
            </div>
          )}
        </div>
      }
    </>
  );
}

export default VideoCall;

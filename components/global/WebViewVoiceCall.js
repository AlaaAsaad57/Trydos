import { useState, useEffect } from "react";
import EndCallIcon from "../Chat/svg/endCall.svg";
import MicIcon from "../Chat/svg/micIcon.svg";
import CallingIcon from "../Chat/svg/calling.svg";
import { createClient, createMicrophoneAndCameraTracks } from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
const config = {
  mode: "rtc",
  codec: "h264",
};

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc1";
function WebViewVoiceCall(props) {
  const [loading, setLoading] = useState(false);
  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
    useStopwatch({ autoStart: false });
  const [callStatus, setCallStatus] = useState(null);
  useEffect(() => {
    start();
  }, []);
  const [users, setUsers] = useState([]);
  const [startIndicator, setStart] = useState(false);
  const client = useClient(config);
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      client.on("user-joined", (user) => {
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
        if (mediaType === "video") {
          start();
        }
        if (mediaType === "audio") {
          // StartTalking(props.data.authToken, props.data.msgId);
          start();
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
        // alert('user left');
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
          parseInt(props.data.sender_user_id)
        );
      await client.join(
        appId,
        name.toString(),
        token,
        parseInt(props.data.sender_user_id)
      );
      if (tracks) await client.publish([tracks[0]]);
      setStart(true);
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
    }
    setStart(false);
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
      await tracks[0]?.setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    }
  };

  // useEffect(()=>{
  //   if(callInProgress===2){
  //     setCallStatus(translate('User declined',language))
  //     setTimeout(() => {
  //       userEndCall()
  //     }, 2000);

  //   }
  // },[callInProgress])
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
        <div className="video-call">
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
          <span className="caller-name">
            {props.userData.name || props.userData.phone}
          </span>
          <div
            style={{ zIndex: 3 }}
            className={"end-icon " + `${loading && "disabled-label"}`}
            onClick={() => {
              if (!loading) {
                setLoading(true);

                userEndCall();
              }
            }}
          >
            <EndCallIcon></EndCallIcon>
            <span>End Call</span>
          </div>
          <div className="add-caller-icon"></div>
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

export default WebViewVoiceCall;

// webview voice call component
import { useState, useEffect } from "react";
import EndCallIcon from "../Chat/svg/endCall";
import MicIcon from "../Chat/svg/micIcon";
import CallingIcon from "../Chat/svg/calling";
import { createClient, createMicrophoneAudioTrack } from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";

const config = {
  mode: "rtc",
  codec: "h264",
};

const useClient = createClient(config);
// Only request microphone, not camera
const useMicrophoneTrack = createMicrophoneAudioTrack();

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

  // Only audio track now
  const { ready, track, error } = useMicrophoneTrack();

  useEffect(() => {
    let init = async (name) => {
      client.on("user-joined", (user) => {
        reset();
        start();
        setUsers((prev) => [...prev, user]);
        if (window?.flutter_inappwebview)
          window?.flutter_inappwebview?.callHandler?.(
            "flutterMessageHandler",
            "stop-ring" // <-- this becomes args[0] in Flutter
          );
      });

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        setUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          if (exists) return prev.map((u) => (u.uid === user.uid ? user : u));
          return [...prev, user];
        });

        if (mediaType === "audio") {
          try {
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
      });

      client.on("user-left", (user) => {
        userEndCall();
        setCallStatus("");
        setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      let token = props.data.token;
      await client.join(
        appId,
        name.toString(),
        token,
        parseInt(props.data.sender_user_id)
      );

      if (track && trackState.audio) await client.publish(track);
      setStart(true);
    };

    if (ready && track) init(props.data.channel_id);
  }, [client, ready, track, error]);

  const userEndCall = async (bool) => {
    await client.leave();
    client.removeAllListeners();

    if (track) track.close();

    setStart(false);
    pause();

    let duration = minutes * 60 + seconds;
    if (!bool) {
      props.onDecline(duration > 3 && users.length > 0 && duration);
    } else {
      window.location.href = "/endCall";
    }
  };

  const [trackState, setTrackState] = useState({ audio: true });

  const mute = async () => {
    const newState = !trackState.audio;
    await track?.setEnabled(newState);
    setTrackState((s) => ({ ...s, audio: newState }));
    if (newState && client && track) {
      try {
        await client.publish(track);
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (seconds === 60 && users.length === 0) {
      props.onDecline(-1);
      userEndCall(true);
    }
    if (minutes === 30) userEndCall();
  }, [minutes, seconds]);

  return (
    <>
      <div className="video-call">
        {minutes >= 25 && (
          <div className="call-warn">Call End in {30 - minutes}</div>
        )}

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
          <EndCallIcon />
          <span>End Call</span>
        </div>

        <div
          className={"toggle-mic " + (trackState.audio && "active-mic-svg")}
          onClick={mute}
        >
          <MicIcon />
        </div>

        {ready && (
          <div className="call-status">
            {users.length > 0 ? (
              <>
                <CallingIcon />
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
          <span>Errors: {error?.message || "None"}</span>
        </div>
      )}
    </>
  );
}

export default WebViewVoiceCall;

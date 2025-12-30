// webview voice call component
import { useState, useEffect, useRef } from "react";
import EndCallIcon from "../Chat/svg/endCall";
import MicIcon from "../Chat/svg/micIcon";
import CallingIcon from "../Chat/svg/calling";
import AgoraRTC, {
  createClient,
  createMicrophoneAudioTrack,
} from "agora-rtc-react";
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
  const [IsSpeaker, setIsSpeaker] = useState(false);
  const [loading, setLoading] = useState(false);
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
  const [startIndicator, setStart] = useState(false);
  const client = useClient(config);

  // Only audio track now
  const { ready, track, error } = useMicrophoneTrack();

  useEffect(() => {
    let init = async (name) => {
      client.on("user-joined", (user) => {
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
            user.audioTrack?.play();
          } catch (e) {}
        }
      });

      client.on("user-unpublished", (user, type) => {
        if (type === "audio") {
          user.audioTrack?.stop();
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
      if (track) {
        await track.setEnabled(trackStateRef.current.audio);
        await client.publish(track);
        setIsPublished(true);
      }
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

    let duration = durationRef.current;
    if (!bool) {
      props.onDecline(duration);
    } else {
      window.location.href = "/endCall";
    }
  };

  const [trackState, setTrackState] = useState({ audio: true });
  const trackStateRef = useRef(trackState);

  // 2. تحديث المرجع كلما تغيرت الـ State
  useEffect(() => {
    trackStateRef.current = trackState;
  }, [trackState]);
  const mute = async () => {
    const newState = !trackState.audio;
    await track?.setEnabled(newState);
    setTrackState((s) => ({ ...s, audio: newState }));
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

        <div className="fixed bottom-[3dvh] left-0 right-0 mx-auto flex justify-center items-center gap-[25px] z-[9999999999]">
          {isPublished ? (
            <div
              className={
                "toggle-mic static " + (trackState.audio && "active-mic-svg")
              }
              onClick={mute}
            >
              <MicIcon />
            </div>
          ) : (
            <span />
          )}
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
          <div
            style={{ zIndex: 3 }}
            className={
              "end-icon static m-0 flex items-center justify-center " +
              `${loading && "disabled-label"}`
            }
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

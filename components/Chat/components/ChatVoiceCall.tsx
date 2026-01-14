// webview video call component
import { useState, useEffect, useRef, useMemo } from "react";
import MicIcon from "public/icons/chat/micIcon.svg";
import AgoraRTC, {
  createClient,
  createMicrophoneAudioTrack,
} from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
import { useAppStore } from "store";
import { getUserChat } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { getTwoLetters } from "../chatsFunctions";
import { fetchData } from "utils/fetchData";
import UPDATED_API_DATA from "migration.staging";
import { REQUESTS_DATA } from "utils/Requests";
import { RefuseCall } from "store/chat/callActions";

const useClient = createClient({
  mode: "rtc",
  codec: "h264",
});
const useMicrophoneTrack = createMicrophoneAudioTrack();

const appId = "0af959943ff542df8f2cb1b925ec0cc4";
function ChatVoiceCall({ token }) {
  const [loading, setLoading] = useState(false);
  const endCall = async (duration) => {
    setLoading(true);
    try {
      // Stop timer
      pause();

      // Clean up Agora resources if available
      if (client) {
        try {
          client.removeAllListeners();
          // Check if client is connected before trying to leave
          if (
            client.connectionState === "CONNECTED" ||
            client.connectionState === "CONNECTING"
          ) {
            if (track) {
              await client.unpublish(track);
            }
            await client.leave();
          }
        } catch (agoraError) {
          console.warn("Agora cleanup error:", agoraError);
        }
      }

      // Close tracks if available
      if (track) {
        track?.close(); // video
      }

      // End call API - always call this
      try {
        fetchData({
          url: UPDATED_API_DATA.MOD_END_CALL,
          reqTitle: REQUESTS_DATA.END_CALL,
          method: "POST",
          server: "chat",
          body: JSON.stringify({ user_id: getUserChat()?.id }),
        });
      } catch (apiError) {
        console.error("End call API error:", apiError);
      }

      // Handle RefuseCall if we have the necessary data
      if (activeChat?.id && MessageActiveCall) {
        RefuseCall(activeChat.id, MessageActiveCall, durationRef.current);
      }

      // Always unmount component
      storeDuration(MessageActiveCall, duration);
      endCallInStore(MessageActiveCall);
    } catch (error) {
      console.error("Error ending call:", error);
      // Still try to unmount
      storeDuration(MessageActiveCall, duration);
      endCallInStore(MessageActiveCall);
    }
  };
  const {
    activeChat,
    MessageActiveCall,
    endCall: endCallInStore,
    storeDuration,
    storeClient,
    storeTrack,
  } = useAppStore();
  let userData = getUserChat();

  AgoraRTC.setLogLevel(4);

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
  const { ready, track, error } = useMicrophoneTrack();
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      storeClient(client);
      storeTrack([track]);
      client.on("user-joined", async (user) => {
        if (!isRunningRef.current) start();
        setUsers((prevUsers) => {
          // Prevent duplicates
          if (prevUsers.find((u) => u.uid === user.uid)) return prevUsers;
          return [...prevUsers, user];
        });
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

      await client.join(appId, name.toString(), token, parseInt(userData.id));

      if (track) {
        const currentAudioState = trackStateRef.current.audio;
        // تطبيق الحالة (Mute/Unmute) على التراكات المحلية
        await track.setEnabled(currentAudioState);

        // النشر فقط إذا كانت الحالة مفعلة
        await client.publish(track);
        setIsPublished(true);
      }
    };

    if (ready && track) {
      init(activeChat?.id);
    }
  }, [client, ready, track, error]);
  const userEndCall = async (bool?) => {
    await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    if (track) {
      track?.close();

      track?.stop();
    }
    //   RefuseCall(activeChat.id,MessageActiveCall)
    pause();
    let duration = durationRef.current;
    endCall(duration);
    //   dispatch({type:"END-CALL"})
  };
  const [trackState, setTrackState] = useState({ audio: true });
  const trackStateRef = useRef(trackState);

  // 2. تحديث المرجع كلما تغيرت الـ State
  useEffect(() => {
    trackStateRef.current = trackState;
  }, [trackState]);
  const mute = async (type) => {
    if (type === "audio") {
      const newState = !trackState.audio;
      if (track) {
        await track?.setEnabled(newState);
        setTrackState((ps) => ({ ...ps, audio: newState }));
      }
    }
  };

  useEffect(() => {
    if (seconds === 60 && users.length === 0) {
      userEndCall(true);
    }
    if (minutes === 30) {
      userEndCall();
    }
  }, [minutes, seconds]);

  const otherUser = useMemo(() => {
    return (
      activeChat?.channel_members?.find(
        (member) => String(member.user_id) !== String(userData?.id)
      )?.user || null
    );
  }, [activeChat?.channel_members, userData?.id]);
  console.log(activeChat);
  return (
    <>
      {
        <div className="video-call">
          {minutes >= 25 && (
            <div className="call-warn">Call End in {30 - minutes}</div>
          )}
          {
            <>
              {otherUser?.photo_path ? (
                <div
                  className="hgg"
                  style={{
                    backgroundImage: `url(${GetImageUrl(
                      otherUser?.photo_path
                    )})`,
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                  }}
                ></div>
              ) : otherUser?.name ? (
                <div
                  className="hgg text-avatar"
                  style={{ left: 0, right: 0, margin: "0 auto" }}
                >
                  {getTwoLetters(otherUser?.name || "User")}
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
            {otherUser?.name || otherUser?.phone}
          </span>

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
            style={{
              bottom: "60px",
            }}
            className="fixed  left-0 right-0 mx-auto flex justify-center items-center gap-[25px] z-[9999999999]"
          >
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
            <div
              style={track && { zIndex: 3 }}
              className={
                "end-icon  static flex items-center justify-center m-0 " +
                `${loading && "disabled-label"}`
              }
              onClick={() => {
                userEndCall();
              }}
            >
              <img src="/icons/chat/endCall.svg" />
              <span>End Call</span>
            </div>
            <span />
          </div>
          {ready && (
            <div className="call-status">
              {users.length > 0 ? (
                <>
                  <img src="/icons/chat/calling.svg" />
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

export default ChatVoiceCall;

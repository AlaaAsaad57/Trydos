// webview video call component
import { useState, useEffect, useRef, useMemo } from "react";
import AgoraRTC, {
  createClient,
  createMicrophoneAudioTrack,
} from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
import { useAppStore } from "store";
import { getUserChat, LogError } from "utils/functions";
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
          // console.warn("Agora cleanup error:", agoraError);
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
        LogError({
          error: apiError,
          scenario: "end call api in web voice call - chat widget",
          userId: getUserChat()?.id,
        });
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
      LogError({
        error: error,
        scenario: "error in end call function  web voice call - chat widget",
        userId: getUserChat()?.id,
      });
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
          } catch (e) {
            LogError({
              error: e,
              scenario:
                "failed to play call audio  web voice call - chat widget",
              userId: getUserChat()?.id,
            });
          }
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
        (member) => String(member.user_id) !== String(userData?.id),
      )?.user || null
    );
  }, [activeChat?.channel_members, userData?.id]);

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
                      otherUser?.photo_path,
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
            {otherUser?.name || otherUser?.mobile_phone}
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
            className="fixed  left-0 right-0 mx-auto flex justify-center items-center gap-[25px] z-9999999999"
          >
            {isPublished ? (
              <div
                className={
                  "toggle-mic static " + (trackState.audio && "active-mic-svg")
                }
                onClick={() => mute("audio")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="25"
                  height="25"
                  viewBox="0 0 25 25"
                >
                  <g
                    id="Group_10695"
                    data-name="Group 10695"
                    transform="translate(-80 -825)"
                  >
                    <g
                      id="_25x25_Back"
                      data-name="25x25 Back"
                      transform="translate(80 825)"
                    >
                      <g id="Mask_Group_295" data-name="Mask Group 295">
                        <g id="microphone-black-shape">
                          <g id="Group_10694" data-name="Group 10694">
                            <path
                              id="Path_21396"
                              data-name="Path 21396"
                              d="M12.5,17.307A4.821,4.821,0,0,0,17.307,12.5V4.808a4.629,4.629,0,0,0-1.412-3.4A4.63,4.63,0,0,0,12.5,0,4.63,4.63,0,0,0,9.1,1.412a4.629,4.629,0,0,0-1.412,3.4V12.5A4.821,4.821,0,0,0,12.5,17.307Z"
                              fill="#d3d3d3"
                            />
                            <path
                              id="Path_21397"
                              data-name="Path 21397"
                              d="M20.868,9.9a.961.961,0,0,0-1.637.676V12.5a6.482,6.482,0,0,1-1.976,4.755A6.481,6.481,0,0,1,12.5,19.231a6.482,6.482,0,0,1-4.755-1.976A6.481,6.481,0,0,1,5.769,12.5V10.577A.956.956,0,0,0,4.132,9.9a.924.924,0,0,0-.286.676V12.5a8.345,8.345,0,0,0,2.216,5.777,8.39,8.39,0,0,0,5.476,2.817v1.983H7.692a.962.962,0,0,0,0,1.923h9.615a.962.962,0,0,0,0-1.923H13.462V21.093a8.391,8.391,0,0,0,5.476-2.817A8.344,8.344,0,0,0,21.154,12.5V10.577A.924.924,0,0,0,20.868,9.9Z"
                              fill="#d3d3d3"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                    <line
                      id="Line_903"
                      data-name="Line 903"
                      x2="20"
                      y2="20"
                      transform="translate(82.5 827.5)"
                      fill="none"
                      stroke="#ff5f61"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </g>
                </svg>
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

// webview video call component
import { useState, useEffect, useRef, useMemo } from "react";
import EndCallIcon from "../svg/endCall";
import MicIcon from "../svg/micIcon";
import VideoIcon from "../svg/vidIcon";
import CallingIcon from "../svg/calling";
import LeftArrowIcon from "../svg/leftArrow";
import AgoraRTC, {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
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
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc4";
function ChatVideoCall({ token }) {
  const clientRef = useRef(null);
  const tracksRef = useRef(null);
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const trackStateRef = useRef(trackState);
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
            if (tracks?.length) {
              await client.unpublish(tracks);
            }
            await client.leave();
          }
        } catch (agoraError) {
          console.warn("Agora cleanup error:", agoraError);
        }
      }

      // Close tracks if available
      if (tracks) {
        tracks[0]?.close(); // audio
        tracks[1]?.close(); // video
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
        RefuseCall(activeChat.id, MessageActiveCall, duration);
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
    storeDuration,
    endCall: endCallInStore,
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
  const { ready, tracks, error } = useMicrophoneAndCameraTracks();

  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      try {
        storeClient(client);
        storeTrack(tracks);
        clientRef.current = client;
        tracksRef.current = tracks;

        client.on("user-joined", async (user) => {
          setUsers((prevUsers) => {
            // Prevent duplicates
            if (prevUsers.find((u) => u.uid === user.uid)) return prevUsers;
            return [...prevUsers, user];
          });
          if (!isRunning) start();
        });
        client.on("user-published", async (user, mediaType) => {
          if (!isRunning) start();
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

        if (tracks) {
          const currentVideoState = trackStateRef.current.video;
          const currentAudioState = trackStateRef.current.audio;
          // تطبيق الحالة (Mute/Unmute) على التراكات المحلية
          await tracks[0].setEnabled(currentAudioState);
          await tracks[1].setEnabled(currentVideoState);

          // النشر فقط إذا كانت الحالة مفعلة
          await client.publish([tracks[0], tracks[1]]);
          setIsPublished(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (ready && tracks) {
      init(activeChat?.id);
    }
  }, [client, ready, tracks, error]);
  const userEndCall = async (bool?) => {
    await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    if (tracks) {
      tracks[0]?.close();
      tracks[1].close();
      tracks?.[0]?.stop();
      tracks?.[1]?.stop();
    }
    //   RefuseCall(activeChat.id,MessageActiveCall)
    pause();

    endCall(durationRef.current);
    //   dispatch({type:"END-CALL"})
  };

  // 2. تحديث المرجع كلما تغيرت الـ State
  useEffect(() => {
    trackStateRef.current = trackState;
  }, [trackState]);
  const mute = async (type) => {
    if (type === "audio") {
      const newState = !trackState.audio;
      if (tracks && tracks[0]) {
        await tracks[0].setEnabled(newState);
        setTrackState((ps) => ({ ...ps, audio: newState }));
      }
    } else if (type === "video") {
      const newState = !trackState.video;
      if (tracks && tracks[1]) {
        await tracks[1].setEnabled(newState);
        setTrackState((ps) => ({ ...ps, video: newState }));
      }
    }
  };
  const cleanUp = async () => {
    try {
      await clientRef?.current?.unpublish(tracks);
      await clientRef?.current?.leave();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
    clientRef.current?.removeAllListeners();
    if (tracksRef.current) {
      tracksRef?.current?.[0]?.stop(); // audio
      tracksRef?.current?.[1]?.stop(); // video
      tracksRef.current?.[0]?.close(); // audio
      tracksRef.current?.[1]?.close(); // video
    }
    clientRef.current = null;
    tracksRef.current = null;
  };
  useEffect(() => {
    if (seconds === 60 && users.length === 0) {
      userEndCall(true);
    }
    if (minutes === 30) {
      userEndCall();
    }
  }, [minutes, seconds]);
  useEffect(() => {
    return () => {
      cleanUp();
    };
  }, []);
  const otherUser = useMemo(() => {
    return (
      activeChat?.channel_members?.find(
        (member) => String(member.user_id) !== String(userData?.id)
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
            {otherUser?.name || otherUser?.phone}
          </span>

          {users.length > 0 &&
            users.map((user) => {
              if (user.videoTrack && user.hasVideo) {
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
            {tracks &&
              tracks.length > 1 &&
              tracks[1] &&
              tracks?.[1].enabled && (
                <AgoraVideoPlayer
                  className="local-video-stream"
                  videoTrack={tracks[1]}
                />
              )}
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
              style={tracks && tracks[1] && { zIndex: 3 }}
              className={
                "end-icon  static flex items-center justify-center m-0 " +
                `${loading && "disabled-label"}`
              }
              onClick={() => {
                userEndCall();
              }}
            >
              <EndCallIcon></EndCallIcon>
              <span>End Call</span>
            </div>

            {isPublished ? (
              <div
                className={
                  "toggle-vid static " + (trackState.video && "active-mic-svg")
                }
                onClick={() => mute("video")}
              >
                <VideoIcon></VideoIcon>
              </div>
            ) : (
              <span />
            )}
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

export default ChatVideoCall;

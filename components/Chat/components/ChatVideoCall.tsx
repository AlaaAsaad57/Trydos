// webview video call component
import { useState, useEffect, useRef, useMemo } from "react";

import MicIcon from "public/icons/chat/micIcon.svg";
import VideoIcon from "public/icons/chat/vidIcon.svg";

import AgoraRTC, {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useStopwatch } from "react-timer-hook";
import { useAppStore } from "store";
import { getUserChat, LogError, translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { getTwoLetters } from "../chatsFunctions";
import { fetchData } from "utils/fetchData";
import UPDATED_API_DATA from "migration.staging";
import { REQUESTS_DATA } from "utils/Requests";
import { RefuseCall } from "store/chat/callActions";
import {
  CALL_END_DURATION_MINUTES,
  CALL_WARNING_MESSAGE_MINUTES,
} from "components/callDurationConstants";

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
          // console.warn("Agora cleanup error:", agoraError);
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
        LogError({
          error: apiError,
          scenario: "end call api in web video call - chat widget",
          userId: getUserChat()?.id,
        });
      }

      // Handle RefuseCall if we have the necessary data
      if (activeChat?.id && MessageActiveCall) {
        RefuseCall(activeChat.id, MessageActiveCall, duration);
      }

      // Always unmount component
      storeDuration(MessageActiveCall, duration);
      endCallInStore(MessageActiveCall);
    } catch (error) {
      LogError({
        error: error,
        scenario: "end call function in web video call - chat widget",
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
            } catch (e) {
              LogError({
                error: e,
                scenario:
                  "failed to play call audio  web video call - chat widget",
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
        LogError({
          error: error,
          scenario: "error in init function web video call - chat widget",
          userId: getUserChat()?.id,
        });
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
    } catch (error) {}
    try {
      await clientRef?.current?.leave();
    } catch (error) {}
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
    if (minutes === CALL_END_DURATION_MINUTES) {
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
        (member) => String(member.user_id) !== String(userData?.id),
      )?.user || null
    );
  }, [activeChat?.channel_members, userData?.id]);

  return (
    <>
      {
        <div className="video-call">
          {minutes >= CALL_WARNING_MESSAGE_MINUTES && (
            <div className="call-warn">
              {translateFunction("Call End in")}{" "}
              {CALL_END_DURATION_MINUTES - minutes}{" "}
              {translateFunction("minute")}
            </div>
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
            {otherUser?.name || otherUser?.mobile_phone}
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
            <img src="/icons/chat/leftArrow.svg" />
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
              style={tracks && tracks[1] && { zIndex: 3 }}
              className={
                "end-icon  static flex items-center justify-center m-0 " +
                `${loading && "disabled-label"}`
              }
              onClick={() => {
                userEndCall();
              }}
            >
              <img src="/icons/chat/endCall.svg" />
              <span>{translateFunction("End Call")}</span>
            </div>

            {isPublished ? (
              <div
                className={
                  "toggle-vid static " + (trackState.video && "active-mic-svg")
                }
                onClick={() => mute("video")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="34.871"
                  height="26.743"
                  viewBox="0 0 34.871 26.743"
                >
                  <g
                    id="Group_10701"
                    data-name="Group 10701"
                    transform="translate(-354.129 -824.129)"
                  >
                    <path
                      id="Path_21351"
                      data-name="Path 21351"
                      d="M32.451,13.663a2.843,2.843,0,0,0-.9.117c-.27.072-.594.181-.971.306l-.028.009-.112.037a7.134,7.134,0,0,0-1.6.665,4,4,0,0,0-1.715,2.379A7.13,7.13,0,0,0,27,18.907v2.187a7.13,7.13,0,0,0,.124,1.731A4,4,0,0,0,28.838,25.2a7.134,7.134,0,0,0,1.6.664l.112.037.028.009c.377.126.7.234.971.306a2.843,2.843,0,0,0,.9.117,2.7,2.7,0,0,0,2.359-1.7,2.845,2.845,0,0,0,.173-.889c.017-.279.017-.621.017-1.018V17.27c0-.4,0-.739-.017-1.018a2.844,2.844,0,0,0-.173-.889,2.7,2.7,0,0,0-2.359-1.7Z"
                      transform="translate(354 817.5)"
                      fill="#388cff"
                    />
                    <g id="Group_10700" data-name="Group 10700">
                      <g id="Group_10699" data-name="Group 10699">
                        <path
                          id="Path_21352"
                          data-name="Path 21352"
                          d="M22.939,12.574C21.85,12.5,21.75,12.5,20.046,12.5H18.7c-1.709,0-3.054,0-4.142.074a9.059,9.059,0,0,0-2.91.591A8.75,8.75,0,0,0,6.916,17.9a9.056,9.056,0,0,0-.591,2.91c-.075,1.09-.075,2.44-.075,4.144v.093c0,1.709,0,3.054.074,4.142a9.056,9.056,0,0,0,.591,2.91,8.75,8.75,0,0,0,4.735,4.735,9.059,9.059,0,0,0,2.91.591c1.09.075,2.44.075,4.144.075h1.343c1.709,0,1.8,0,2.892-.074a9.059,9.059,0,0,0,2.91-.591A8.75,8.75,0,0,0,30.584,32.1a9.059,9.059,0,0,0,.591-2.91c.075-1.09.075-2.44.075-4.144v-.093c0-1.709,0-3.054-.074-4.142a9.059,9.059,0,0,0-.591-2.91,8.75,8.75,0,0,0-4.735-4.735,9.059,9.059,0,0,0-2.91-.591Z"
                          transform="translate(348.75 812.5)"
                          fill="none"
                          stroke="#388cff"
                          strokeWidth="1"
                        />
                      </g>
                      <path
                        className="line-path"
                        data-name="Path 21399"
                        d="M0,0,22.5,22.5"
                        transform="translate(356.25 826.25)"
                        fill="none"
                        stroke="#ff5f61"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            ) : (
              <span />
            )}
          </div>

          {ready && !(users?.[0]?.videoTrack || users?.[0]?.hasVideo) && (
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
                <span>{translateFunction("Calling ...")}</span>
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
          <span> Errors:{error?.message || translateFunction("None")}</span>
        </div>
      )}
    </>
  );
}

export default ChatVideoCall;

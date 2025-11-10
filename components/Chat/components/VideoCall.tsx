import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useStopwatch } from "react-timer-hook";
import AgoraRTC, {
  createClient,
  createMicrophoneAndCameraTracks,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-react";

// Components
import ChatPhoto from "./ChatPhoto";

// Utils and actions
import { RefuseCall } from "store/chat/callActions";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";

// SVG Icons
import EndCallIcon from "../svg/endCall";
import MicIcon from "../svg/micIcon";
import VideoIcon from "../svg/vidIcon";
import CallingIcon from "../svg/calling";
import AddUserIcon from "../svg/addUser";
import LeftArrowIcon from "../svg/leftArrow";

// Styles
import "styles/chat.css";
import { REQUESTS_DATA } from "utils/Requests";

// Types
interface User {
  id: string | number;
  name?: string;
  photo_path?: string;
  [key: string]: any;
}

interface ChannelMember {
  user_id: string | number;
  user: User;
}

interface ActiveChat {
  id: string | number;
  channel_members: ChannelMember[];
  [key: string]: any;
}

interface VideoCallProps {
  token: string;
  audio?: boolean;
  name?: string;
  user_id?: string | number;
  active?: ActiveChat;
}

// Constants
const AGORA_CONFIG = {
  mode: "rtc" as const,
  codec: "vp8" as const,
  region: "me-east-1",
};

const APP_ID = "0af959943ff542df8f2cb1b925ec0cc1";
const CALL_TIMEOUT_MS = 60000; // 60 seconds
const MAX_CALL_DURATION_MS = 1800000; // 30 minutes
const CALL_WARNING_MINUTES = 25;
const AUDIO_VOLUME = 0.2;

// Set Agora log level
AgoraRTC.setLogLevel(3);

// Create Agora hooks
const useClient = createClient(AGORA_CONFIG);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks(
  {
    // Microphone config (optional)
    AEC: true, // Acoustic Echo Cancellation
    ANS: true, // Noise Suppression
    encoderConfig: {
      bitrate: 16, // Minimum usable bitrate in kbps (keep audio light)
    },
  },
  {
    encoderConfig: {
      width: 320,
      height: 180,
      frameRate: 10, // Lower frame rate = lower bandwidth
      bitrateMin: 80, // Low-end minimum
      bitrateMax: 250, // Cap to reduce network pressure
    },
    optimizationMode: "motion",
    // Prioritize smooth movement
  }
);

// Ringtone Component

// Timer Display Component
interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isActive: boolean;
  language: string;
}

const TimerDisplay = ({ minutes, seconds, isActive, language }) => {
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  return (
    <div className="call-status top-[initial] bottom-[190px] absolute">
      {isActive ? (
        <>
          <CallingIcon />
          <span>{formattedTime}</span>
        </>
      ) : (
        <span>{translateFunction("Calling ...", language)}</span>
      )}
    </div>
  );
};

// Video Player Component for Remote Users
interface VideoPlayerProps {
  user: IAgoraRTCRemoteUser;
  isLocal?: boolean;
}

const VideoPlayer = ({ user, isLocal = false }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && ref.current) {
      user.videoTrack.play(ref.current);
    }

    return () => {
      if (user.videoTrack) {
        user.videoTrack.stop();
      }
    };
  }, [user.videoTrack]);

  return (
    <div
      ref={ref}
      className={`${
        isLocal
          ? "w-[100px] h-[100px] absolute top-4 right-4 border-2 border-white rounded-lg overflow-hidden z-10"
          : "w-full h-full bg-gray-900 rounded-lg overflow-hidden"
      }`}
      style={{ objectFit: "cover" }}
    />
  );
};

// Local Video Component
interface LocalVideoProps {
  track: ICameraVideoTrack | null;
}

const LocalVideo = ({ track }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && ref.current) {
      track.play(ref.current);
    }

    return () => {
      if (track) {
        track.stop();
      }
    };
  }, [track]);

  return (
    <div
      ref={ref}
      className="w-[100px] h-[100px] absolute top-4 right-4 border-2 border-white rounded-lg overflow-hidden z-10 bg-gray-800"
      style={{ objectFit: "cover" }}
    />
  );
};

// Main VideoCall Component
const VideoCall = ({ token, audio = false, name = "", user_id, active }) => {
  // Store hooks
  const {
    language,
    activeChat,
    MessageActiveCall,
    call,
    endCall: endCallInStore,
    storeClient,
  } = useAppStore();

  // Agora hooks
  const client = useClient();

  const enableDualMode = async () => {
    await client.enableDualStream();

    client.setLowStreamParameter({
      width: 160,
      height: 120,
      framerate: 5,
      bitrate: 100,
    });
  };
  const { ready, tracks, error: tracksError } = useMicrophoneAndCameraTracks();

  // Timer hook
  const { seconds, minutes, start, pause, reset } = useStopwatch({
    autoStart: true,
  });

  // State
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);

  // Refs for stable values
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Get other user
  const otherUser = useMemo(() => {
    return (
      active?.channel_members?.find((member) => member.user_id === user_id)
        ?.user || null
    );
  }, [active?.channel_members, user_id]);

  // Calculate call duration in seconds
  const callDuration = minutes * 60 + seconds;

  // Get remote user with video
  const remoteVideoUser = remoteUsers.find((user) => user.videoTrack);

  // End call function - works even if not initialized
  const endCall = async (duration: number = callDuration) => {
    setIsEndingCall(true);
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
        let res = await fetchData({
          url: `/api/v1/end_call`,
          reqTitle: REQUESTS_DATA.END_CALL,
          method: "POST",
          server: "chat",
          body: JSON.stringify({ user_id: getUserChat()?.id }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
      } catch (apiError) {
        console.error("End call API error:", apiError);
      }

      // Handle RefuseCall if we have the necessary data
      if (activeChat?.id && MessageActiveCall) {
        try {
          if (duration > 3 && remoteUsers.length > 0) {
            await RefuseCall(activeChat.id, MessageActiveCall, duration);
          } else {
            await RefuseCall(activeChat.id, MessageActiveCall, duration);
          }
        } catch (refuseError) {
          console.error("RefuseCall error:", refuseError);
        }
      }

      // Always unmount component
      endCallInStore(MessageActiveCall);
    } catch (error) {
      console.error("Error ending call:", error);
      // Still try to unmount
      endCallInStore(MessageActiveCall);
    }
  };

  const handleWeakNetwork = (
    uplinkNetworkQuality: number,
    downlinkNetworkQuality: number
  ) => {
    const weak = uplinkNetworkQuality >= 5 || downlinkNetworkQuality >= 5;
    if (weak) {
      // tracks[1]?.setEnabled(false); // Stop video to save bandwidth
    } else {
      // tracks[1]?.setEnabled(true); // Restore video if network improves
    }
  };

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!tracks?.[0]) return;

    try {
      await tracks[0].setEnabled(isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  }, [tracks, isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!tracks?.[1]) return;

    try {
      await tracks[1].setEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  }, [tracks, isCameraOff]);

  // Initialize Agora
  useEffect(() => {
    if (!ready || !tracks || !activeChat?.id || !token || !client) return;

    // Prevent re-initialization
    if (isInitialized.current) {
      console.log("Already initialized, skipping");
      return;
    }

    let mounted = true;

    const initCall = async () => {
      try {
        // Check if client is already connecting or connected
        if (
          client.connectionState === "CONNECTED" ||
          client.connectionState === "CONNECTING"
        ) {
          console.log(
            "Client already connected/connecting, skipping initialization"
          );
          return;
        }

        // Mark as initialized
        isInitialized.current = true;
        enableDualMode();
        // Store client
        storeClient(client);

        // Event handlers
        const handleUserJoined = async () => {
          if (!mounted) return;

          setIsCallActive(true);
          reset();
          start();

          try {
            let res = await fetchData({
              url: `/api/v1/messages/start_talking/${MessageActiveCall}`,
              server: "chat",
              method: "GET",
              reqTitle: REQUESTS_DATA.START_TALKING,
            });
            if (!res.success) {
              throw new Error(res.message);
            }
          } catch (error) {
            console.error("Failed to start talking:", error);
          }
        };

        const handleUserPublished = async (
          user: IAgoraRTCRemoteUser,
          mediaType: "audio" | "video"
        ) => {
          if (!mounted) return;

          try {
            await client.subscribe(user, mediaType);

            setRemoteUsers((prev) => {
              const existingIndex = prev.findIndex((u) => u.uid === user.uid);
              if (existingIndex >= 0) {
                // Update existing user
                const updated = [...prev];
                updated[existingIndex] = user;
                return updated;
              } else {
                // Add new user
                return [...prev, user];
              }
            });

            if (mediaType === "audio") {
              user.audioTrack?.play();
            } else if (mediaType === "video") {
              // Video will be rendered in VideoPlayer component
              console.log("Remote video track received");
            }
          } catch (error) {
            console.error("Error subscribing to user:", error);
          }
        };

        const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
          if (!mounted) return;

          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));

          // End call after 1 second if remote user left
          setTimeout(() => {
            if (mounted) {
              // Call endCall from store directly to avoid dependency
              endCallInStore(MessageActiveCall);
            }
          }, 1000);
        };

        // Remove existing listeners before adding new ones
        client.removeAllListeners();

        // Set up listeners
        client.on("user-joined", handleUserJoined);
        client.on("user-published", handleUserPublished);
        client.on("user-left", handleUserLeft);
        client.on(
          "network-quality",
          ({ uplinkNetworkQuality, downlinkNetworkQuality }) =>
            handleWeakNetwork(uplinkNetworkQuality, downlinkNetworkQuality)
        );

        // Join channel
        const userId = getUserChat()?.id;
        if (!userId) throw new Error("User ID not available");

        await client.join(APP_ID, activeChat.id.toString(), token, userId);

        if (mounted) {
          setIsJoined(true);
          // Publish both audio and video tracks
          await client.publish(tracks);
        }
      } catch (error) {
        console.error("Error initializing call:", error);
        if (mounted) {
          setCallError("Failed to connect");
        }
      }
    };

    initCall();

    return () => {
      mounted = false;
    };
  }, [
    ready,
    tracks,
    activeChat?.id,
    token,
    client,
    storeClient,
    MessageActiveCall,
    reset,
    start,
    endCallInStore,
  ]);

  // Handle tracks error
  useEffect(() => {
    if (tracksError) {
      console.error("Tracks error:", tracksError);
      setCallError("Camera/Microphone access denied");
    }
  }, [tracksError]);

  // Set up call timeout (60 seconds)
  useEffect(() => {
    if (call === "vid-outgoing" && remoteUsers.length === 0) {
      callTimeoutRef.current = setTimeout(() => {
        endCall(-1);
      }, CALL_TIMEOUT_MS);
    } else if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [call, remoteUsers.length, endCall]);

  // Set up max duration timeout (30 minutes)
  useEffect(() => {
    maxDurationTimeoutRef.current = setTimeout(() => {
      endCall();
    }, MAX_CALL_DURATION_MS);

    return () => {
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
    };
  }, [endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isInitialized.current = false;

      if (client) {
        try {
          client.removeAllListeners();

          // Leave channel if connected
          if (client.connectionState === "CONNECTED") {
            client.leave().catch(console.warn);
          }
        } catch (error) {
          console.warn("Cleanup error:", error);
        }
      }

      if (tracks) {
        tracks[0]?.close();
        tracks[1]?.close();
      }
    };
  }, [client, tracks]);

  // Determine if ringtone should play

  return (
    <div className="video-call flex flex-col items-center justify-center gap-[20px]">
      {/* Call duration warning */}
      {minutes >= CALL_WARNING_MINUTES && (
        <div className="call-warn">Call End in {30 - minutes}</div>
      )}

      {/* Error display */}
      {callError && (
        <div className="call-error text-red-500 text-sm">{callError}</div>
      )}

      {/* Ringtone */}

      {/* User photo */}

      {/* Caller name */}

      {/* Timer */}

      {/* Main video area */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {remoteVideoUser ? (
          // Show remote user's video
          <VideoPlayer user={remoteVideoUser} />
        ) : (
          // Show user photo if no video
          <>
            {otherUser && (
              <ChatPhoto user={otherUser} height={200} width={200} />
            )}
            <span className="caller-name text-white text-xl mt-4">{name}</span>
            {isEndingCall && (
              <span className="text-white text-sm mt-2">
                {translateFunction("Ending call...", language)}
              </span>
            )}
          </>
        )}
        {ready && !isEndingCall && (
          <TimerDisplay
            minutes={minutes}
            seconds={seconds}
            isActive={remoteUsers.length > 0 && isCallActive}
            language={language}
          />
        )}
        {/* Local video preview (100px x 100px on top right) */}
        {tracks?.[1] && !isCameraOff && <LocalVideo track={tracks[1]} />}
      </div>

      {/* Control buttons */}
      {!isEndingCall && (
        <>
          <>
            <button
              type="button"
              className="cancel-call-icon"
              onClick={() => endCall()}
              aria-label="Cancel call"
            >
              <LeftArrowIcon />
            </button>

            {/* Add caller button */}
            <div className="add-caller-icon" role="button" tabIndex={0}>
              <AddUserIcon />
            </div>
          </>
          <div className="flex-row justify-between px-[30px] w-full absolute bottom-[100px] z-50">
            <>
              <button
                type="button"
                className={`static toggle-mic ${
                  !isMuted ? "active-mic-svg" : ""
                }`}
                onClick={toggleMute}
                disabled={!ready || !tracks}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                <MicIcon />
              </button>
              <button
                type="button"
                className="static end-icon m-0"
                onClick={() => endCall()}
                style={{ zIndex: 3 }}
                aria-label={translateFunction("End Call", language)}
              >
                <EndCallIcon />
                <span>{translateFunction("End Call", language)}</span>
              </button>

              {/* Microphone toggle */}

              <button
                className={
                  "static toggle-vid " + (!isCameraOff && "active-mic-svg")
                }
                onClick={toggleCamera}
                disabled={!ready || !tracks}
                aria-label={isCameraOff ? "Unmute Camera" : "Mute Camera"}
              >
                <VideoIcon />
              </button>
            </>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(VideoCall);

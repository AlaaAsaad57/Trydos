// VideoCall.tsx
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
  createMicrophoneAudioTrack,
} from "agora-rtc-react";
import ChatPhoto from "./ChatPhoto";
import { RefuseCall } from "store/chat/callActions";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import EndCallIcon from "../svg/endCall";
import MicIcon from "../svg/micIcon";
import CallingIcon from "../svg/calling";

import LeftArrowIcon from "../svg/leftArrow";
import "styles/chat.css";
import { REQUESTS_DATA } from "utils/Requests";
import UPDATED_API_DATA from "migration.staging";

const AGORA_CONFIG = {
  mode: "rtc" as const,
  codec: "vp8" as const,
  region: "me-east-1",
};

const APP_ID = "0af959943ff542df8f2cb1b925ec0cc1";
const CALL_TIMEOUT_MS = 60000;
const MAX_CALL_DURATION_MS = 1800000;
const CALL_WARNING_MINUTES = 25;

AgoraRTC.setLogLevel(3);

const useClient = createClient(AGORA_CONFIG);
const useMicrophoneTrack = createMicrophoneAudioTrack({
  AEC: true,
  ANS: true,
  encoderConfig: { bitrate: 16 },
});

const TimerDisplay = ({ minutes, seconds, isActive, language }) => {
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
  return (
    <div className="call-status">
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

const VoiceCall = ({ token, audio = false, name = "", user_id, active }) => {
  const {
    language,
    activeChat,
    MessageActiveCall,
    call,
    endCall: endCallInStore,
    storeClient,
  } = useAppStore();

  const client = useClient();
  const { ready, track, error: tracksError } = useMicrophoneTrack();

  const { seconds, minutes, start, pause, reset } = useStopwatch({
    autoStart: true,
  });

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [callError, setCallError] = useState(null);

  const callTimeoutRef = useRef(null);
  const maxDurationTimeoutRef = useRef(null);
  const isInitialized = useRef(false);

  const otherUser = useMemo(() => {
    return (
      active?.channel_members?.find(
        (member) => String(member.user_id) === String(user_id)
      )?.user || null
    );
  }, [active?.channel_members, user_id]);

  const callDuration = minutes * 60 + seconds;

  const endCall = async (duration = callDuration) => {
    setIsEndingCall(true);
    pause();

    try {
      client?.removeAllListeners();

      if (
        client &&
        (client.connectionState === "CONNECTED" ||
          client.connectionState === "CONNECTING")
      ) {
        if (track) await client.unpublish(track);
        await client.leave();
      }
    } catch {}

    track?.close?.();

    try {
      await fetchData({
        url: UPDATED_API_DATA.MOD_END_CALL,
        reqTitle: REQUESTS_DATA.END_CALL,
        method: "POST",
        server: "chat",
        body: JSON.stringify({ user_id: getUserChat()?.id }),
      });
    } catch {}

    try {
      await RefuseCall(activeChat?.id, MessageActiveCall, duration);
    } catch {}

    endCallInStore(MessageActiveCall);
  };

  const toggleMute = useCallback(async () => {
    if (!track || !client) return;
    try {
      const newState = !isMuted;
      await track.setEnabled(newState);
      setIsMuted(newState);
      if (newState) {
        try {
          await client.publish(track);
        } catch (e) {}
      }
    } catch (e) {
      console.error("Error toggling mute:", e);
    }
  }, [track, isMuted, client]);

  useEffect(() => {
    if (!ready || !track || !activeChat?.id || !token) return;
    if (isInitialized.current) return;

    isInitialized.current = true;
    storeClient(client);

    const handleUserJoined = () => {
      setIsCallActive(true);
      reset();
      start();
    };

    const handleUserPublished = async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack?.play();
        setRemoteUsers((prev) => [...prev, user]);
      }
    };

    const handleUserLeft = () => {
      setRemoteUsers([]);
      setTimeout(() => endCallInStore(MessageActiveCall), 800);
    };

    client.removeAllListeners();
    client.on("user-joined", handleUserJoined);
    client.on("user-published", handleUserPublished);
    client.on("user-left", handleUserLeft);

    const userId = getUserChat()?.id;
    client
      .join(APP_ID, activeChat.id.toString(), token, userId)
      .then(() => client.publish(track))
      .catch(() => setCallError("Failed to connect"));
  }, [ready, track, activeChat?.id, token]);

  useEffect(() => {
    if (tracksError) setCallError("Microphone access denied");
  }, [tracksError]);

  useEffect(() => {
    if (call === "aud-outgoing" && remoteUsers.length === 0) {
      callTimeoutRef.current = setTimeout(() => endCall(-1), CALL_TIMEOUT_MS);
    } else clearTimeout(callTimeoutRef.current);

    return () => clearTimeout(callTimeoutRef.current);
  }, [call, remoteUsers.length]);

  useEffect(() => {
    maxDurationTimeoutRef.current = setTimeout(
      () => endCall(),
      MAX_CALL_DURATION_MS
    );
    return () => clearTimeout(maxDurationTimeoutRef.current);
  }, []);

  useEffect(() => {
    return () => {
      isInitialized.current = false;
      client?.removeAllListeners();
      if (client?.connectionState === "CONNECTED")
        client.leave().catch(() => {});
      track?.close?.();
    };
  }, []);

  return (
    <div className="video-call flex flex-col items-center justify-center gap-[20px]">
      {minutes >= CALL_WARNING_MINUTES && (
        <div className="call-warn">Call End in {30 - minutes}</div>
      )}

      {callError && (
        <div className="call-error text-red-500 text-sm">{callError}</div>
      )}

      {otherUser && <ChatPhoto user={otherUser} height={200} width={200} />}

      <span className="caller-name">{name}</span>

      {isEndingCall && (
        <span className="text-white text-sm">
          {translateFunction("Ending call...", language)}
        </span>
      )}

      {ready && !isEndingCall && (
        <TimerDisplay
          minutes={minutes}
          seconds={seconds}
          isActive={remoteUsers.length > 0 && isCallActive}
          language={language}
        />
      )}

      {!isEndingCall && (
        <>
          <button
            type="button"
            className="cancel-call-icon"
            onClick={() => endCall()}
          >
            <LeftArrowIcon />
          </button>

          <div className="flex-row justify-between px-[30px] w-full absolute bottom-[100px] z-50">
            <button
              type="button"
              className={`static toggle-mic ${
                !isMuted ? "active-mic-svg" : ""
              }`}
              onClick={toggleMute}
              disabled={!ready || !track}
            >
              <MicIcon />
            </button>

            <button
              type="button"
              className="static end-icon m-0"
              onClick={() => endCall()}
            >
              <EndCallIcon />
              <span>{translateFunction("End Call", language)}</span>
            </button>
            <span></span>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(VoiceCall);

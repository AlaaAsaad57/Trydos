"use client";

import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
} from "agora-rtc-react";
import UPDATED_API_DATA from "migration.staging";
import { useAppStore } from "store";
import { RefuseCall } from "store/chat/callActions";
import { AGORA_APP_ID } from "utils/agoraConfig";
import { fetchData } from "utils/fetchData";
import { getUserChat, LogError } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import { CALL_END_DURATION_MINUTES } from "components/callDurationConstants";
import type { CallPhase } from "./CallFace";

/** A call nobody answers ends after this long (the old call pages' rule). */
const NO_ANSWER_MS = 60_000;

const fail = (scenario: string, error: unknown) =>
  LogError({ scenario: `useLiveCall: ${scenario}`, error: error instanceof Error ? error.message : String(error) });

/**
 * The running call, on Agora. Stage 6, step 5.
 *
 * The same steps as the old call pages (components/Chat/components/
 * ChatVoiceCall.tsx and ChatVideoCall.tsx): join the chat's Agora channel
 * with the store's token, publish the microphone (and the camera for a video
 * call), play the other side, and end the call when they leave. The clock
 * starts when the other side joins. A call nobody answers ends after 60
 * seconds; a call ends after CALL_END_DURATION_MINUTES.
 *
 * Ending tells the chat backend (`end_call`, then `refuse_call` with the
 * length, as before) and clears the call from the store. Leaving the call
 * page ends the call too, as the old back arrow did.
 */
export function useLiveCall({ token, video, channel }: { token: string; video: boolean; channel: string }) {
  const [phase, setPhase] = useState<CallPhase>("calling");
  const [seconds, setSeconds] = useState(0);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(video);
  const [remoteVideo, setRemoteVideo] = useState<IRemoteVideoTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ICameraVideoTrack | null>(null);
  const live = useRef({
    client: null as IAgoraRTCClient | null,
    mic: null as IMicrophoneAudioTrack | null,
    cam: null as ICameraVideoTrack | null,
    ended: false,
    seconds: 0,
  });

  /** Ends the call: Agora first, then the chat backend and the store. */
  const end = async () => {
    const r = live.current;
    if (r.ended) return;
    r.ended = true;
    try {
      r.client?.removeAllListeners();
      r.mic?.close();
      r.cam?.close();
      if (r.client && r.client.connectionState !== "DISCONNECTED") await r.client.leave();
    } catch (error) {
      fail("leaving the Agora channel failed", error);
    }
    const { call, activeChat, MessageActiveCall, storeDuration, endCall } = useAppStore.getState();
    // The call already ended elsewhere (the other side refused it).
    if (!call) return;
    void fetchData({
      url: UPDATED_API_DATA.MOD_END_CALL,
      reqTitle: REQUESTS_DATA.END_CALL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ user_id: getUserChat()?.id }),
    }).catch((error: unknown) => fail("end_call failed", error));
    if (activeChat?.id && MessageActiveCall) void RefuseCall(activeChat.id, MessageActiveCall, r.seconds);
    storeDuration(MessageActiveCall, r.seconds);
    endCall(MessageActiveCall ?? -1);
  };
  const endRef = useRef(end);
  useEffect(() => {
    endRef.current = end;
  });

  // Join once, when the page opens; leave when it closes.
  useEffect(() => {
    const r = live.current;
    let gone = false;
    AgoraRTC.setLogLevel(4);
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
    r.client = client;
    client.on("user-joined", () => setPhase("live"));
    client.on("user-published", async (user, kind) => {
      setPhase("live");
      try {
        await client.subscribe(user, kind);
        if (kind === "audio") user.audioTrack?.play();
        else setRemoteVideo(user.videoTrack ?? null);
      } catch (error) {
        fail("playing the other side failed", error);
      }
    });
    client.on("user-unpublished", (user, kind) => {
      if (kind === "audio") user.audioTrack?.stop();
      else setRemoteVideo(null);
    });
    client.on("user-left", () => void endRef.current());

    void (async () => {
      try {
        const tracks = video
          ? await AgoraRTC.createMicrophoneAndCameraTracks()
          : [await AgoraRTC.createMicrophoneAudioTrack()];
        r.mic = tracks[0];
        r.cam = (tracks[1] as ICameraVideoTrack | undefined) ?? null;
        if (gone) {
          r.mic.close();
          r.cam?.close();
          return;
        }
        // The other old call parts (the push handler) close them through the store.
        const store = useAppStore.getState();
        store.storeClient(client);
        store.storeTrack(tracks);
        setLocalVideo(r.cam);
        await client.join(AGORA_APP_ID, channel, token, parseInt(String(getUserChat()?.id)));
        if (gone) return;
        await client.publish(tracks);
        setPhase((p) => (p === "calling" ? "ringing" : p));
      } catch (error) {
        fail("joining the call failed", error);
        void endRef.current();
      }
    })();

    return () => {
      gone = true;
      void endRef.current();
    };
  }, []);

  // The clock runs while the other side is on the call.
  useEffect(() => {
    if (phase !== "live") {
      const timer = setTimeout(() => void endRef.current(), NO_ANSWER_MS);
      return () => clearTimeout(timer);
    }
    const tick = setInterval(() => {
      live.current.seconds += 1;
      setSeconds(live.current.seconds);
      if (live.current.seconds >= CALL_END_DURATION_MINUTES * 60) void endRef.current();
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  const toggleMic = () => {
    const track = live.current.mic;
    if (!track) return;
    void track.setEnabled(!mic).then(() => setMic(!mic), (error: unknown) => fail("the microphone switch failed", error));
  };

  const toggleCamera = () => {
    const track = live.current.cam;
    if (!track) return;
    void track
      .setEnabled(!camera)
      .then(() => setCamera(!camera), (error: unknown) => fail("the camera switch failed", error));
  };

  return { phase, seconds, mic, camera, remoteVideo, localVideo: camera ? localVideo : null, end, toggleMic, toggleCamera };
}

"use client";

import React from "react";
import { AgoraVideoPlayer } from "agora-rtc-react";
import { CALL_END_DURATION_MINUTES, CALL_WARNING_MESSAGE_MINUTES } from "components/callDurationConstants";
import { translateFunction } from "utils/functions";
import { SAFE_BOTTOM } from "../demo1Layout";
import { useDemoNav } from "../screenNav";
import CallFace, { type CallPerson } from "./CallFace";
import Toast, { useToast } from "./Toast";
import { useLiveCall } from "./useLiveCall";

const FILL = { width: "100%", height: "100%" } as const;

/**
 * The real call on the call page (Stage 6, step 5): the Agora call of
 * useLiveCall drawn by CallFace. Its own chunk, loaded in the browser only,
 * because the Agora library needs the browser.
 *
 * With no chat backend yet, adding a person (D-39, CH-6) and turning a voice
 * call into a video call say "Soon available" (A-8).
 */
export default function LiveCall({
  token,
  video,
  channel,
  person,
}: {
  token: string;
  video: boolean;
  /** The chat's id: the Agora channel's name. */
  channel: string;
  person: CallPerson;
}) {
  const { t } = useDemoNav();
  const [toast, showToast] = useToast();
  const call = useLiveCall({ token, video, channel });
  const soon = () => showToast(translateFunction("Soon available"));
  const minutes = Math.floor(call.seconds / 60);
  // The old call pages warned from minute 5 that the call ends at minute 10.
  const warning =
    minutes >= CALL_WARNING_MESSAGE_MINUTES
      ? `${translateFunction("Call End in")} ${CALL_END_DURATION_MINUTES - minutes} ${translateFunction("minutes")}`
      : null;

  return (
    <>
      <CallFace
        people={[person]}
        phase={call.phase}
        seconds={call.seconds}
        mic={call.mic}
        camera={video && call.camera}
        added={false}
        warning={warning}
        remoteVideo={call.remoteVideo && <AgoraVideoPlayer videoTrack={call.remoteVideo} style={FILL} />}
        localVideo={call.localVideo && <AgoraVideoPlayer videoTrack={call.localVideo} style={FILL} />}
        onBack={() => void call.end()}
        onEnd={() => void call.end()}
        onMic={call.toggleMic}
        onCamera={video ? call.toggleCamera : soon}
        onAddPerson={soon}
        t={t}
      />
      <Toast text={toast} bottom={`calc(120px + ${SAFE_BOTTOM})`} fixed />
    </>
  );
}
